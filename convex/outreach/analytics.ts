/**
 * Outreach Analytics — Dashboard queries for sequence performance
 */

import { v } from "convex/values";
import { authenticatedQuery } from "../customFunctions";
import { notFound } from "../lib/errors";

// =============================================================================
// Sequence-Level Analytics
// =============================================================================

/** Get stats for a single sequence (uses cached stats) */
export const sequenceStats = authenticatedQuery({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    return {
      name: sequence.name,
      status: sequence.status,
      stats: sequence.stats ?? {
        enrolled: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      },
      rates: calculateRates(sequence.stats),
    };
  },
});

/** Get per-step funnel for a sequence (how many contacts reach each step) */
export const sequenceFunnel = authenticatedQuery({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    // Get all events for this sequence grouped by step
    const events = await ctx.db
      .query("outreachEvents")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();

    const funnel = sequence.steps.map((step, index) => {
      const stepEvents = events.filter((e) => e.step === index);
      return {
        step: index,
        subject: step.subject,
        delayDays: step.delayDays,
        sent: stepEvents.filter((e) => e.type === "sent").length,
        opened: stepEvents.filter((e) => e.type === "opened").length,
        clicked: stepEvents.filter((e) => e.type === "clicked").length,
        replied: stepEvents.filter((e) => e.type === "replied").length,
        bounced: stepEvents.filter((e) => e.type === "bounced").length,
        unsubscribed: stepEvents.filter((e) => e.type === "unsubscribed").length,
      };
    });

    return funnel;
  },
});

/** Get enrollment timeline for a specific contact (all events in order) */
export const contactTimeline = authenticatedQuery({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw notFound("enrollment", args.enrollmentId);

    const events = await ctx.db
      .query("outreachEvents")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .collect();

    // Sort chronologically
    events.sort((a, b) => a.createdAt - b.createdAt);

    return {
      enrollment,
      events,
    };
  },
});

// =============================================================================
// Organization-Level Analytics
// =============================================================================

/** Get overview stats across all sequences in the organization */
export const organizationOverview = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) return null;

    const sequences = await ctx.db
      .query("outreachSequences")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.defaultOrganizationId!))
      .collect();

    const totals = {
      sequences: sequences.length,
      active: sequences.filter((s) => s.status === "active").length,
      enrolled: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    for (const seq of sequences) {
      if (seq.stats) {
        totals.enrolled += seq.stats.enrolled;
        totals.sent += seq.stats.sent;
        totals.opened += seq.stats.opened;
        totals.replied += seq.stats.replied;
        totals.bounced += seq.stats.bounced;
        totals.unsubscribed += seq.stats.unsubscribed;
      }
    }

    return {
      ...totals,
      rates: calculateRates({
        enrolled: totals.enrolled,
        sent: totals.sent,
        opened: totals.opened,
        replied: totals.replied,
        bounced: totals.bounced,
        unsubscribed: totals.unsubscribed,
      }),
    };
  },
});

/** Get mailbox health (send counts, remaining capacity today) */
export const mailboxHealth = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const mailboxes = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    return mailboxes.map((m) => {
      const today = new Date().toISOString().slice(0, 10);
      const resetDate = new Date(m.todayResetAt).toISOString().slice(0, 10);
      const todaySent = today === resetDate ? m.todaySendCount : 0;

      return {
        id: m._id,
        email: m.email,
        provider: m.provider,
        isActive: m.isActive,
        dailyLimit: m.dailySendLimit,
        todaySent,
        remaining: Math.max(0, m.dailySendLimit - todaySent),
      };
    });
  },
});

// =============================================================================
// Helpers
// =============================================================================

function calculateRates(
  stats:
    | {
        enrolled: number;
        sent: number;
        opened: number;
        replied: number;
        bounced: number;
        unsubscribed: number;
      }
    | null
    | undefined,
): { openRate: number; replyRate: number; bounceRate: number; unsubscribeRate: number } {
  if (!stats || stats.sent === 0) {
    return { openRate: 0, replyRate: 0, bounceRate: 0, unsubscribeRate: 0 };
  }

  return {
    openRate: Math.round((stats.opened / stats.sent) * 1000) / 10,
    replyRate: Math.round((stats.replied / stats.sent) * 1000) / 10,
    bounceRate: Math.round((stats.bounced / stats.sent) * 1000) / 10,
    unsubscribeRate: Math.round((stats.unsubscribed / stats.sent) * 1000) / 10,
  };
}
