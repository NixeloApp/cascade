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
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { logger } from "../lib/logger";
import { isSuppressed } from "./contacts";
import { advanceEnrollment } from "./enrollments";

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
        to: checkResult.contactEmail,
        subject: checkResult.renderedSubject,
        body: checkResult.renderedBody,
        fromEmail: checkResult.fromEmail,
        fromName: checkResult.fromName,
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
      await ctx.db.patch(args.enrollmentId, {
        status: "unsubscribed",
        completedAt: Date.now(),
        nextSendAt: undefined,
      });
      return fail;
    }

    // Check mailbox
    const mailbox = await ctx.db.get(sequence.mailboxId);
    if (!mailbox?.isActive) return fail;

    // Check daily send limit
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = new Date(mailbox.todayResetAt).toISOString().slice(0, 10);
    const todaySendCount = today === resetDate ? mailbox.todaySendCount : 0;

    if (todaySendCount >= mailbox.dailySendLimit) return fail;

    // Validate step exists
    const step = sequence.steps[enrollment.currentStep];
    if (!step) return fail;

    // Render template
    const renderedSubject = renderTemplate(step.subject, contact);
    const renderedBody = renderTemplate(step.body, contact);

    // Add compliance footer
    const footer = buildComplianceFooter(
      sequence.physicalAddress,
      enrollment._id,
      sequence.trackingDomain,
    );
    const fullBody = renderedBody + footer;

    return {
      canSend: true as const,
      mailboxId: sequence.mailboxId,
      contactEmail: contact.email,
      renderedSubject,
      renderedBody: fullBody,
      fromEmail: mailbox.email,
      fromName: mailbox.displayName,
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
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    void ctx; // Will use for SMTP auth lookup
    // TODO: Implement actual SMTP sending via user's OAuth credentials
    //
    // This will use:
    // - Gmail API (googleapis) for Google mailboxes
    // - Microsoft Graph API for Outlook mailboxes
    //
    // For now, log and return success for development.
    // Replace with actual implementation when OAuth flow is built.

    logger.info(
      `[OUTREACH] Would send email: from=${args.fromEmail} to=${args.to} subject="${args.subject}" step=${args.step}`,
    );

    // Fail closed — do not send until real implementation is built
    return { success: false, error: "Email sending not implemented" };
  },
});

// =============================================================================
// Step 4: Record result (internal mutation — updates DB state)
// =============================================================================

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
  },
  handler: async (ctx, args) => {
    if (args.success) {
      // Log sent event
      await ctx.db.insert("outreachEvents", {
        enrollmentId: args.enrollmentId,
        sequenceId: args.sequenceId,
        contactId: args.contactId,
        organizationId: args.organizationId,
        type: "sent",
        step: args.step,
        createdAt: Date.now(),
      });

      // Update enrollment timestamp
      await ctx.db.patch(args.enrollmentId, { lastSentAt: Date.now() });

      // Increment mailbox daily send count
      const mailbox = await ctx.db.get(args.mailboxId);
      if (mailbox) {
        const today = new Date().toISOString().slice(0, 10);
        const resetDate = new Date(mailbox.todayResetAt).toISOString().slice(0, 10);
        const currentCount = today === resetDate ? mailbox.todaySendCount : 0;

        await ctx.db.patch(args.mailboxId, {
          todaySendCount: currentCount + 1,
          todayResetAt: today === resetDate ? mailbox.todayResetAt : Date.now(),
        });
      }

      // Advance to next step (or mark completed)
      const sequence = await ctx.db.get(args.sequenceId);
      if (sequence) {
        const nextStepIndex = args.step + 1;
        const nextStep = sequence.steps[nextStepIndex];

        await advanceEnrollment(ctx, args.enrollmentId, sequence.steps.length, nextStep?.delayDays);

        // Update sequence stats
        const currentStats = sequence.stats ?? {
          enrolled: 0,
          sent: 0,
          opened: 0,
          replied: 0,
          bounced: 0,
          unsubscribed: 0,
        };
        await ctx.db.patch(args.sequenceId, {
          stats: { ...currentStats, sent: currentStats.sent + 1 },
        });
      }
    } else {
      // Send failed — log bounce event
      await ctx.db.insert("outreachEvents", {
        enrollmentId: args.enrollmentId,
        sequenceId: args.sequenceId,
        contactId: args.contactId,
        organizationId: args.organizationId,
        type: "bounced",
        step: args.step,
        metadata: { bounceType: "hard" },
        createdAt: Date.now(),
      });

      // Stop enrollment on hard failure
      await ctx.db.patch(args.enrollmentId, {
        status: "bounced",
        completedAt: Date.now(),
        nextSendAt: undefined,
      });
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
      .withIndex("by_active")
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
  },
});

// =============================================================================
// Template Rendering
// =============================================================================

/** Replace {{variable}} placeholders with contact data */
function renderTemplate(
  template: string,
  contact: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    customFields?: Record<string, string>;
  },
): string {
  let result = template;

  // Standard variables
  result = result.replace(/\{\{email\}\}/gi, contact.email);
  result = result.replace(/\{\{firstName\}\}/gi, contact.firstName ?? "");
  result = result.replace(/\{\{lastName\}\}/gi, contact.lastName ?? "");
  result = result.replace(/\{\{company\}\}/gi, contact.company ?? "");

  // Custom fields
  if (contact.customFields) {
    for (const [key, value] of Object.entries(contact.customFields)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
      result = result.replace(pattern, value);
    }
  }

  // Clean up any remaining unresolved variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result;
}

/** Build the compliance footer (unsubscribe link + physical address) */
function buildComplianceFooter(
  physicalAddress: string,
  enrollmentId: Id<"outreachEnrollments">,
  trackingDomain?: string,
): string {
  const domain = trackingDomain ?? "track.nixelo.com";
  const unsubUrl = `https://${domain}/t/u/${enrollmentId}`;

  return `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#888;line-height:1.4;">
  <p>${physicalAddress}</p>
  <p><a href="${unsubUrl}" style="color:#888;">Unsubscribe</a></p>
</div>`;
}
