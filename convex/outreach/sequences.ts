/**
 * Outreach Sequences — CRUD for multi-step email campaign templates
 *
 * A sequence defines the steps (emails) with their content and delays.
 * Contacts are enrolled into sequences via the enrollment engine.
 */

import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { conflict, notFound, validation } from "../lib/errors";
import { outreachSequenceStep } from "../validators";

// =============================================================================
// Queries
// =============================================================================

/** List all sequences for the user's organization */
export const list = authenticatedQuery({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) return [];

    const query = ctx.db
      .query("outreachSequences")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.defaultOrganizationId!));

    const sequences = await query.take(BOUNDED_LIST_LIMIT);

    if (args.status) {
      return sequences.filter((s) => s.status === args.status);
    }
    return sequences;
  },
});

/** Get a single sequence with full details */
export const get = authenticatedQuery({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);
    return sequence;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/** Create a new sequence (starts as draft) */
export const create = authenticatedMutation({
  args: {
    name: v.string(),
    mailboxId: v.id("outreachMailboxes"),
    steps: v.array(outreachSequenceStep),
    physicalAddress: v.string(),
    trackingDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) throw validation("organization", "No default organization");

    // Verify mailbox belongs to user
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox || mailbox.userId !== ctx.userId) throw notFound("mailbox", args.mailboxId);

    // Validate steps
    if (args.steps.length === 0) throw validation("steps", "Sequence must have at least one step");
    if (args.steps.length > 5) throw validation("steps", "Maximum 5 steps per sequence");
    if (args.steps[0].delayDays !== 0) throw validation("steps", "First step must have 0 delay");

    // Validate physical address (CAN-SPAM)
    if (args.physicalAddress.trim().length < 10) {
      throw validation("physicalAddress", "Physical address is required for CAN-SPAM compliance");
    }

    return await ctx.db.insert("outreachSequences", {
      organizationId: user.defaultOrganizationId,
      createdBy: ctx.userId,
      name: args.name,
      status: "draft",
      mailboxId: args.mailboxId,
      steps: args.steps,
      physicalAddress: args.physicalAddress.trim(),
      trackingDomain: args.trackingDomain,
      stats: { enrolled: 0, sent: 0, opened: 0, replied: 0, bounced: 0, unsubscribed: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** Update sequence (only allowed in draft or paused state) */
export const update = authenticatedMutation({
  args: {
    sequenceId: v.id("outreachSequences"),
    name: v.optional(v.string()),
    steps: v.optional(v.array(outreachSequenceStep)),
    physicalAddress: v.optional(v.string()),
    trackingDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    if (sequence.status === "active") {
      throw conflict("Cannot edit an active sequence. Pause it first.");
    }
    if (sequence.status === "completed") {
      throw conflict("Cannot edit a completed sequence.");
    }

    if (args.steps) {
      if (args.steps.length === 0)
        throw validation("steps", "Sequence must have at least one step");
      if (args.steps.length > 5) throw validation("steps", "Maximum 5 steps per sequence");
      if (args.steps[0].delayDays !== 0) throw validation("steps", "First step must have 0 delay");
    }

    const { sequenceId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(args.sequenceId, patch);
  },
});

/** Activate a draft/paused sequence (starts sending) */
export const updateSequenceStatus = authenticatedMutation({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    if (sequence.status === "active") return; // Already active
    if (sequence.status === "completed") throw conflict("Cannot reactivate a completed sequence");

    // Verify mailbox is still active
    const mailbox = await ctx.db.get(sequence.mailboxId);
    if (!mailbox?.isActive) throw conflict("Connected mailbox is inactive. Reconnect first.");

    const now = Date.now();
    await ctx.db.patch(args.sequenceId, {
      status: "active",
      updatedAt: now,
    });

    // Resume any paused enrollments so the send engine picks them up
    const pausedEnrollments = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_sequence_status", (q) =>
        q
          .eq("sequenceId", args.sequenceId)
          .eq(
            "status",
            "paused" as "active" | "completed" | "paused" | "replied" | "bounced" | "unsubscribed",
          ),
      )
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(
      pausedEnrollments.map((enrollment) =>
        ctx.db.patch(enrollment._id, {
          status: "active",
        }),
      ),
    );
  },
});

/** Pause an active sequence (stops sending, can resume) */
export const pause = authenticatedMutation({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    if (sequence.status !== "active") throw conflict("Can only pause an active sequence");

    // Pause all active enrollments
    const enrollments = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_sequence_status", (q) =>
        q.eq("sequenceId", args.sequenceId).eq("status", "active"),
      )
      .take(BOUNDED_LIST_LIMIT);

    for (const enrollment of enrollments) {
      await ctx.db.patch(enrollment._id, { status: "paused" });
    }

    await ctx.db.patch(args.sequenceId, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

/** Delete a sequence (only draft or paused with no active enrollments) */
export const remove = authenticatedMutation({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    if (sequence.status === "active") {
      throw conflict("Cannot delete an active sequence. Pause it first.");
    }

    // Check for any non-terminal enrollments
    const activeEnrollments = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_sequence_status", (q) =>
        q.eq("sequenceId", args.sequenceId).eq("status", "active"),
      )
      .first();

    if (activeEnrollments) {
      throw conflict("Cannot delete sequence with active enrollments");
    }

    await ctx.db.delete(args.sequenceId);
  },
});
