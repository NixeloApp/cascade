/**
 * Outreach Enrollments — The core state machine
 *
 * An enrollment tracks a single contact's journey through a sequence.
 * Status transitions:
 *   active → replied | bounced | unsubscribed | completed | paused
 *   paused → active (when sequence is resumed)
 *
 * The scheduler picks up enrollments where status=active and nextSendAt<=now.
 */

import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { conflict, notFound, validation } from "../lib/errors";
import { HOUR, MINUTE } from "../lib/timeUtils";
import { isSuppressed } from "./contacts";

// =============================================================================
// Queries
// =============================================================================

/** List enrollments for a sequence */
export const listBySequence = authenticatedQuery({
  args: {
    sequenceId: v.id("outreachSequences"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    const user = await ctx.db.get(ctx.userId);
    if (sequence.organizationId !== user?.defaultOrganizationId)
      throw notFound("sequence", args.sequenceId);

    if (args.status) {
      return await ctx.db
        .query("outreachEnrollments")
        .withIndex("by_sequence_status", (q) =>
          q
            .eq("sequenceId", args.sequenceId)
            .eq(
              "status",
              args.status as
                | "active"
                | "completed"
                | "paused"
                | "replied"
                | "bounced"
                | "unsubscribed",
            ),
        )
        .take(BOUNDED_LIST_LIMIT);
    }

    return await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .take(BOUNDED_LIST_LIMIT);
  },
});

/** Get enrollment details for a specific contact in a sequence */
export const getByContact = authenticatedQuery({
  args: {
    sequenceId: v.id("outreachSequences"),
    contactId: v.id("outreachContacts"),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    const user = await ctx.db.get(ctx.userId);
    if (sequence.organizationId !== user?.defaultOrganizationId)
      throw notFound("sequence", args.sequenceId);

    // Use by_contact index and filter by sequence — avoids truncation
    // when a sequence has more than BOUNDED_LIST_LIMIT enrollments.
    return await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("sequenceId"), args.sequenceId))
      .first();
  },
});

/** Get events for an enrollment (timeline view) */
export const getEvents = authenticatedQuery({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw notFound("enrollment", args.enrollmentId);

    const user = await ctx.db.get(ctx.userId);
    if (enrollment.organizationId !== user?.defaultOrganizationId)
      throw notFound("enrollment", args.enrollmentId);

    return await ctx.db
      .query("outreachEvents")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .take(BOUNDED_LIST_LIMIT);
  },
});

// =============================================================================
// Mutations
// =============================================================================

/** Check if a contact is eligible for enrollment (not already enrolled, not suppressed). */
async function isContactEligible(
  ctx: MutationCtx,
  contactId: Id<"outreachContacts">,
  email: string,
  sequenceId: Id<"outreachSequences">,
  organizationId: Id<"organizations">,
): Promise<boolean> {
  const existingEnrollment = await ctx.db
    .query("outreachEnrollments")
    .withIndex("by_contact", (q) => q.eq("contactId", contactId))
    .filter((q) =>
      q.and(
        q.eq(q.field("sequenceId"), sequenceId),
        q.or(q.eq(q.field("status"), "active"), q.eq(q.field("status"), "paused")),
      ),
    )
    .first();

  if (existingEnrollment) return false;
  if (await isSuppressed(ctx, organizationId, email)) return false;
  return true;
}

/** Enroll contacts into a sequence (batch) */
export const createEnrollments = authenticatedMutation({
  args: {
    sequenceId: v.id("outreachSequences"),
    contactIds: v.array(v.id("outreachContacts")),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    const user = await ctx.db.get(ctx.userId);
    if (sequence.organizationId !== user?.defaultOrganizationId)
      throw notFound("sequence", args.sequenceId);

    if (sequence.status !== "active" && sequence.status !== "draft") {
      throw conflict("Can only enroll contacts in active or draft sequences");
    }

    if (sequence.steps.length === 0) {
      throw validation("steps", "Sequence has no steps");
    }

    let enrolled = 0;
    let skipped = 0;
    const isActive = sequence.status === "active";
    const contacts = await Promise.all(args.contactIds.map((id) => ctx.db.get(id)));

    for (let i = 0; i < args.contactIds.length; i++) {
      const contactId = args.contactIds[i];
      const contact = contacts[i];

      if (!contact) {
        skipped++;
        continue;
      }

      const eligible = await isContactEligible(
        ctx,
        contactId,
        contact.email,
        args.sequenceId,
        sequence.organizationId,
      );
      if (!eligible) {
        skipped++;
        continue;
      }

      await ctx.db.insert("outreachEnrollments", {
        sequenceId: args.sequenceId,
        contactId,
        organizationId: sequence.organizationId,
        currentStep: 0,
        status: isActive ? "active" : "paused",
        nextSendAt: isActive ? calculateNextSendTime(0) : undefined,
        enrolledAt: Date.now(),
      });

      enrolled++;
    }

    // Update sequence stats
    if (enrolled > 0) {
      const currentStats = sequence.stats ?? {
        enrolled: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      };

      await ctx.db.patch(args.sequenceId, {
        stats: { ...currentStats, enrolled: currentStats.enrolled + enrolled },
        updatedAt: Date.now(),
      });
    }

    return { enrolled, skipped };
  },
});

/** Manually stop an enrollment (remove contact from sequence) */
export const cancelEnrollment = authenticatedMutation({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw notFound("enrollment", args.enrollmentId);

    const user = await ctx.db.get(ctx.userId);
    if (enrollment.organizationId !== user?.defaultOrganizationId)
      throw notFound("enrollment", args.enrollmentId);

    if (enrollment.status !== "active" && enrollment.status !== "paused") {
      throw conflict("Enrollment is already in a terminal state");
    }

    await ctx.db.patch(args.enrollmentId, {
      status: "completed",
      completedAt: Date.now(),
      nextSendAt: undefined,
    });
  },
});

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Calculate the next send time for a given step delay.
 * Adds business days (skips weekends) and a small random jitter.
 */
export function calculateNextSendTime(delayDays: number): number {
  const now = Date.now();
  if (delayDays === 0) {
    // Send within the next few minutes with small jitter
    const jitterMs = Math.floor(Math.random() * 5 * MINUTE); // 0-5 min
    return now + jitterMs;
  }

  // Add business days
  const date = new Date(now);
  let added = 0;
  while (added < delayDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  // Set to a reasonable business hour (9-17 UTC, randomized)
  const hour = 9 + Math.floor(Math.random() * 8); // 9-16
  const minute = Math.floor(Math.random() * 60);
  date.setUTCHours(hour, minute, 0, 0);

  // Add jitter (±30 minutes)
  const jitterMs = Math.floor(Math.random() * HOUR) - 30 * MINUTE;
  return date.getTime() + jitterMs;
}

/**
 * Advance an enrollment to the next step or mark as completed.
 * Called by the send engine after successfully sending an email.
 */
export async function advanceEnrollment(
  ctx: MutationCtx,
  enrollmentId: Id<"outreachEnrollments">,
  sequenceStepCount: number,
  nextStepDelayDays: number | undefined,
): Promise<void> {
  const enrollment = await ctx.db.get(enrollmentId);
  if (!enrollment || enrollment.status !== "active") return;

  const nextStep = enrollment.currentStep + 1;

  if (nextStep >= sequenceStepCount || nextStepDelayDays === undefined) {
    // Sequence complete
    await ctx.db.patch(enrollmentId, {
      currentStep: nextStep,
      status: "completed",
      completedAt: Date.now(),
      nextSendAt: undefined,
    });
  } else {
    // Schedule next step
    await ctx.db.patch(enrollmentId, {
      currentStep: nextStep,
      nextSendAt: calculateNextSendTime(nextStepDelayDays),
    });
  }
}

/**
 * Stop an enrollment due to a terminal event (reply, bounce, unsubscribe).
 */
export async function stopEnrollment(
  ctx: MutationCtx,
  enrollmentId: Id<"outreachEnrollments">,
  reason: "replied" | "bounced" | "unsubscribed",
): Promise<void> {
  const enrollment = await ctx.db.get(enrollmentId);
  if (!enrollment) return;

  // Only stop active/paused enrollments
  if (enrollment.status !== "active" && enrollment.status !== "paused") return;

  const timestampField = reason === "replied" ? "lastRepliedAt" : undefined;

  const patch: Record<string, unknown> = {
    status: reason,
    completedAt: Date.now(),
    nextSendAt: undefined,
  };

  if (timestampField) {
    patch[timestampField] = Date.now();
  }

  await ctx.db.patch(enrollmentId, patch);
}
