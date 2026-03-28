/**
 * Outreach Send Engine — The scheduler that processes due enrollments
 *
 * Runs on a cron interval (every 1-2 minutes). Picks up enrollments where
 * status=active and nextSendAt<=now, renders the template, sends via the
 * user's connected mailbox, and advances the enrollment to the next step.
 *
 * This module contains:
 * - processDueEnrollments: cron entry point (internal mutation → action)
 * - sendSequenceEmail: action that sends via user's mailbox SMTP
 * - recordSend: mutation that logs the event and advances the enrollment
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { buildTerminalEnrollmentPatch } from "../lib/lifecyclePatches";
import { logger } from "../lib/logger";
import { MINUTE } from "../lib/timeUtils";
import { outreachMailboxProviders } from "../validators";
import { isSuppressed, suppress } from "./contacts";
import { advanceEnrollment, stopEnrollment } from "./enrollments";
import {
  buildComplianceFooter,
  extractTrackableUrls,
  injectOpenTrackingPixel,
  renderTemplate,
  rewriteUrlsWithTrackingIds,
} from "./helpers";
import {
  buildMailboxSendReservationPatch,
  buildMailboxSuccessfulSendPatch,
  getMailboxRateLimitSnapshot,
} from "./mailboxRateLimits";

// =============================================================================
// Constants
// =============================================================================

const MAX_SENDS_PER_BATCH = 20; // Process at most 20 enrollments per cron tick

// =============================================================================
// Step 1: Find due enrollments (internal query)
// =============================================================================

/** Find enrollments that are due for sending */
export const findDueEnrollments = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get active enrollments where nextSendAt has passed
    const due = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_next_send", (q) => q.eq("status", "active"))
      .take(BOUNDED_LIST_LIMIT);

    // Filter to only those actually due (nextSendAt <= now)
    return due
      .filter((e) => e.nextSendAt !== undefined && e.nextSendAt <= now)
      .slice(0, MAX_SENDS_PER_BATCH);
  },
});

// =============================================================================
// Step 2: Process batch (internal action — orchestrates sends)
// =============================================================================

/** Cron entry point: find due enrollments and send emails */
export const processDueEnrollments = internalAction({
  args: {},
  handler: async (ctx) => {
    const due = await ctx.runQuery(internal.outreach.sendEngine.findDueEnrollments, {});

    if (due.length === 0) return { processed: 0 };

    let processed = 0;
    let skipped = 0;

    for (const enrollment of due) {
      // Pre-send checks (run as mutation for DB access)
      const checkResult = await ctx.runMutation(internal.outreach.sendEngine.checkPreSend, {
        enrollmentId: enrollment._id,
      });

      if (!checkResult.canSend) {
        // Defer the enrollment so it's retried in the next cron cycle
        // instead of being stuck at the same nextSendAt forever.
        await ctx.runMutation(internal.outreach.sendEngine.updateEnrollmentNextSend, {
          enrollmentId: enrollment._id,
        });
        skipped++;
        continue;
      }

      // Send the email (action — can make HTTP calls)
      const sendResult = await ctx.runAction(internal.outreach.sendEngine.sendSequenceEmail, {
        enrollmentId: enrollment._id,
        sequenceId: enrollment.sequenceId,
        contactId: enrollment.contactId,
        step: enrollment.currentStep,
        mailboxId: checkResult.mailboxId,
        mailboxProvider: checkResult.mailboxProvider,
        to: checkResult.contactEmail,
        subject: checkResult.renderedSubject,
        body: checkResult.renderedBody,
        fromEmail: checkResult.fromEmail,
        fromName: checkResult.fromName,
        trackingDomain: checkResult.trackingDomain,
      });

      // Record result (mutation — updates DB)
      await ctx.runMutation(internal.outreach.sendEngine.recordSendResult, {
        enrollmentId: enrollment._id,
        sequenceId: enrollment.sequenceId,
        contactId: enrollment.contactId,
        organizationId: enrollment.organizationId,
        step: enrollment.currentStep,
        mailboxId: checkResult.mailboxId,
        success: sendResult.success,
        error: sendResult.error,
        gmailThreadId: sendResult.gmailThreadId,
      });

      if (sendResult.success) {
        processed++;
      } else {
        skipped++;
      }
    }

    if (processed > 0 || skipped > 0) {
      logger.info(`Outreach: processed ${processed}, skipped ${skipped}`);
    }

    return { processed, skipped };
  },
});

// =============================================================================
// Step 2a: Pre-send validation (internal mutation — has DB access)
// =============================================================================

/** Validate enrollment is still sendable, render template, check limits */
export const checkPreSend = internalMutation({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const fail = { canSend: false as const };

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.status !== "active") return fail;

    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (!sequence || sequence.status !== "active") return fail;

    const contact = await ctx.db.get(enrollment.contactId);
    if (!contact) return fail;

    // Check suppression
    if (await isSuppressed(ctx, enrollment.organizationId, contact.email)) {
      // Auto-stop this enrollment
      await ctx.db.patch(
        args.enrollmentId,
        buildTerminalEnrollmentPatch("unsubscribed", Date.now()),
      );
      return fail;
    }

    // Check mailbox
    const mailbox = await ctx.db.get(sequence.mailboxId);
    if (!mailbox?.isActive) return fail;

    const rateLimits = getMailboxRateLimitSnapshot(mailbox);

    if (rateLimits.todaySendCount >= mailbox.dailySendLimit) return fail;
    if (rateLimits.minuteSendCount >= rateLimits.minuteSendLimit) return fail;

    // Validate step exists
    const step = sequence.steps[enrollment.currentStep];
    if (!step) return fail;

    await ctx.db.patch(sequence.mailboxId, buildMailboxSendReservationPatch(mailbox));

    // Render template
    const renderedSubject = renderTemplate(step.subject, contact);
    let renderedBody = renderTemplate(step.body, contact);

    const trackingDomain = sequence.trackingDomain ?? "track.nixelo.com";

    // Click tracking: extract URLs, persist tracking links, rewrite HTML
    const trackableUrls = extractTrackableUrls(renderedBody);
    const urlToTrackingId = new Map<string, string>();
    for (const url of trackableUrls) {
      const linkId = await ctx.db.insert("outreachTrackingLinks", {
        enrollmentId: enrollment._id,
        step: enrollment.currentStep,
        originalUrl: url,
        createdAt: Date.now(),
      });
      urlToTrackingId.set(url, linkId);
    }
    renderedBody = rewriteUrlsWithTrackingIds(renderedBody, urlToTrackingId, trackingDomain);

    // Add compliance footer (before open pixel — pixel should be last)
    const footer = buildComplianceFooter(sequence.physicalAddress, enrollment._id, trackingDomain);
    renderedBody = renderedBody + footer;

    // Inject open tracking pixel (always last in the body)
    renderedBody = injectOpenTrackingPixel(renderedBody, enrollment._id, trackingDomain);

    return {
      canSend: true as const,
      mailboxId: sequence.mailboxId,
      mailboxProvider: mailbox.provider,
      contactEmail: contact.email,
      renderedSubject,
      renderedBody,
      fromEmail: mailbox.email,
      fromName: mailbox.displayName,
      trackingDomain,
    };
  },
});

// =============================================================================
// Step 3: Send email (internal action — makes SMTP/API calls)
// =============================================================================

/** Send an email via the user's connected mailbox */
export const sendSequenceEmail = internalAction({
  args: {
    enrollmentId: v.id("outreachEnrollments"),
    sequenceId: v.id("outreachSequences"),
    contactId: v.id("outreachContacts"),
    step: v.number(),
    mailboxId: v.id("outreachMailboxes"),
    mailboxProvider: outreachMailboxProviders,
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    trackingDomain: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; error?: string; gmailThreadId?: string }> => {
    if (args.mailboxProvider === "google") {
      const result = await ctx.runAction(internal.outreach.gmail.sendViaGmailAction, {
        mailboxId: args.mailboxId,
        enrollmentId: args.enrollmentId,
        to: args.to,
        subject: args.subject,
        body: args.body,
        fromEmail: args.fromEmail,
        fromName: args.fromName,
        trackingDomain: args.trackingDomain,
      });

      return { success: result.success, error: result.error, gmailThreadId: result.threadId };
    }

    const result = await ctx.runAction(internal.outreach.microsoft.sendViaMicrosoftAction, {
      mailboxId: args.mailboxId,
      enrollmentId: args.enrollmentId,
      to: args.to,
      subject: args.subject,
      body: args.body,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      trackingDomain: args.trackingDomain,
    });

    return { success: result.success, error: result.error };
  },
});

/** Defer an enrollment by pushing nextSendAt forward (retry next cron cycle) */
export const updateEnrollmentNextSend = internalMutation({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.status !== "active") return;
    await ctx.db.patch(args.enrollmentId, {
      nextSendAt: Date.now() + 15 * MINUTE,
    });
  },
});

// =============================================================================
// Step 4: Record result (internal mutation — updates DB state)
// =============================================================================

type SendResultArgs = {
  enrollmentId: Id<"outreachEnrollments">;
  sequenceId: Id<"outreachSequences">;
  contactId: Id<"outreachContacts">;
  organizationId: Id<"organizations">;
  step: number;
  mailboxId: Id<"outreachMailboxes">;
};

async function recordSuccessfulSend(ctx: MutationCtx, args: SendResultArgs) {
  await ctx.db.insert("outreachEvents", {
    enrollmentId: args.enrollmentId,
    sequenceId: args.sequenceId,
    contactId: args.contactId,
    organizationId: args.organizationId,
    type: "sent",
    step: args.step,
    createdAt: Date.now(),
  });

  await ctx.db.patch(args.enrollmentId, { lastSentAt: Date.now() });

  const mailbox = await ctx.db.get(args.mailboxId);
  if (mailbox) {
    await ctx.db.patch(args.mailboxId, buildMailboxSuccessfulSendPatch(mailbox));
  }

  const sequence = await ctx.db.get(args.sequenceId);
  if (sequence) {
    await advanceEnrollment(
      ctx,
      args.enrollmentId,
      sequence.steps.length,
      sequence.steps[args.step + 1]?.delayDays,
    );
    const stats = sequence.stats ?? {
      enrolled: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };
    await ctx.db.patch(args.sequenceId, { stats: { ...stats, sent: stats.sent + 1 } });
  }
}

/** Patterns indicating a permanent delivery failure (not a transient error). */
const HARD_BOUNCE_PATTERNS = [
  /invalid.*address/i,
  /user.*not.*found/i,
  /mailbox.*not.*found/i,
  /does not exist/i,
  /550\b/,
  /553\b/,
  /disabled.*account/i,
];

function isHardBounce(error: string | undefined): boolean {
  if (!error) return false;
  return HARD_BOUNCE_PATTERNS.some((p) => p.test(error));
}

async function recordFailedSend(ctx: MutationCtx, args: SendResultArgs & { error?: string }) {
  if (isHardBounce(args.error)) {
    const contact = await ctx.db.get(args.contactId);

    // Permanent failure — mark as bounced and stop the enrollment
    await ctx.db.insert("outreachEvents", {
      enrollmentId: args.enrollmentId,
      sequenceId: args.sequenceId,
      contactId: args.contactId,
      organizationId: args.organizationId,
      type: "bounced",
      step: args.step,
      metadata: {
        bounceType: "hard",
        failedRecipient: contact?.email,
        replyContent: args.error,
      },
      createdAt: Date.now(),
    });

    await stopEnrollment(ctx, args.enrollmentId, "bounced");

    if (contact) {
      await suppress(ctx, args.organizationId, contact.email, "hard_bounce", args.enrollmentId);
    }

    const sequence = await ctx.db.get(args.sequenceId);
    const stats = sequence?.stats ?? {
      enrolled: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };
    if (sequence) {
      await ctx.db.patch(args.sequenceId, {
        stats: { ...stats, bounced: stats.bounced + 1 },
      });
    }
  } else {
    // Transient failure (OAuth, rate limit, timeout) — defer and retry later
    await ctx.db.patch(args.enrollmentId, {
      nextSendAt: Date.now() + 15 * MINUTE,
    });
  }
}

/** Record a send result and advance enrollment */
export const recordSendResult = internalMutation({
  args: {
    enrollmentId: v.id("outreachEnrollments"),
    sequenceId: v.id("outreachSequences"),
    contactId: v.id("outreachContacts"),
    organizationId: v.id("organizations"),
    step: v.number(),
    mailboxId: v.id("outreachMailboxes"),
    success: v.boolean(),
    error: v.optional(v.string()),
    gmailThreadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.error === "EMAIL_NOT_IMPLEMENTED") {
      await ctx.db.patch(args.enrollmentId, { nextSendAt: Date.now() + 60 * MINUTE });
      return;
    }

    if (args.success) {
      await recordSuccessfulSend(ctx, args);
      // Append Gmail thread ID for reply correlation (each step may start a new thread)
      if (args.gmailThreadId) {
        const enrollment = await ctx.db.get(args.enrollmentId);
        const existing = enrollment?.gmailThreadIds ?? [];
        if (!existing.includes(args.gmailThreadId)) {
          await ctx.db.patch(args.enrollmentId, {
            gmailThreadIds: [...existing, args.gmailThreadId],
          });
        }
      }
    } else {
      await recordFailedSend(ctx, { ...args, error: args.error });
    }
  },
});

// =============================================================================
// Cron: Reset daily send counts
// =============================================================================

/** Reset todaySendCount on all mailboxes (runs daily at midnight UTC) */
export const resetDailySendCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const mailboxes = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(BOUNDED_LIST_LIMIT);

    const toReset = mailboxes.filter((m) => m.todaySendCount > 0);
    await Promise.all(
      toReset.map((mailbox) =>
        ctx.db.patch(mailbox._id, {
          todaySendCount: 0,
          todayResetAt: Date.now(),
        }),
      ),
    );
    // Note: bounded to BOUNDED_LIST_LIMIT mailboxes per reset cycle.
    // Sufficient for current scale (< 100 active mailboxes).
  },
});
