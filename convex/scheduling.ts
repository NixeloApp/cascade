/**
 * Round-Robin Scheduling Logic
 *
 * Implements fair distribution of bookings across team members.
 * Supports weighted round-robin and interval-based resets.
 *
 * Inspired by Cal.com's round-robin scheduling.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { roundRobinIntervals, schedulingTypes } from "./validators";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a period key based on the interval type.
 * Used to track assignments within a reset period.
 */
function getPeriodKey(
  interval: "daily" | "weekly" | "monthly" | undefined,
  timestamp: number,
): string {
  const date = new Date(timestamp);

  switch (interval) {
    case "daily": {
      // Format: "2026-02-21"
      return date.toISOString().slice(0, 10);
    }
    case "weekly": {
      // Format: "2026-W08"
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly": {
      // Format: "2026-02"
      return date.toISOString().slice(0, 7);
    }
    default: {
      // No interval - use a constant key so all assignments are in same "period"
      return "all-time";
    }
  }
}

/**
 * Get ISO week number for a date.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// =============================================================================
// Internal Queries
// =============================================================================

/**
 * Get assignment counts for all team members in a period.
 */
export const getAssignmentCounts = internalQuery({
  args: {
    bookingPageId: v.id("bookingPages"),
    periodKey: v.string(),
    teamMemberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};

    // Initialize all team members with 0
    for (const userId of args.teamMemberIds) {
      counts[userId] = 0;
    }

    // Get all assignments in this period for this booking page
    const assignments = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page_period", (q) =>
        q.eq("bookingPageId", args.bookingPageId).eq("periodKey", args.periodKey),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Count assignments per user
    for (const assignment of assignments) {
      if (assignment.userId in counts) {
        counts[assignment.userId] = assignment.assignmentCountInPeriod;
      }
    }

    return counts;
  },
});

/**
 * Get the most recent assignment for a booking page.
 */
export const getLastAssignment = internalQuery({
  args: {
    bookingPageId: v.id("bookingPages"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page", (q) => q.eq("bookingPageId", args.bookingPageId))
      .order("desc")
      .first();

    return assignments;
  },
});

/**
 * Get booking page with scheduling configuration.
 */
export const getBookingPageConfig = internalQuery({
  args: {
    bookingPageId: v.id("bookingPages"),
  },
  handler: async (ctx, args) => {
    const bookingPage = await ctx.db.get(args.bookingPageId);
    if (!bookingPage) return null;

    return {
      schedulingType: bookingPage.schedulingType,
      teamMembers: bookingPage.teamMembers,
      roundRobinInterval: bookingPage.roundRobinInterval,
      hostWeights: bookingPage.hostWeights,
      userId: bookingPage.userId, // Fallback owner
    };
  },
});

// =============================================================================
// Internal Mutations
// =============================================================================

/**
 * Record a round-robin assignment.
 */
export const recordAssignment = internalMutation({
  args: {
    bookingPageId: v.id("bookingPages"),
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    periodKey: v.string(),
    weight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current count for this user in this period
    const existing = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page_user_period", (q) =>
        q
          .eq("bookingPageId", args.bookingPageId)
          .eq("userId", args.userId)
          .eq("periodKey", args.periodKey),
      )
      .first();

    const count = existing ? existing.assignmentCountInPeriod + 1 : 1;

    return await ctx.db.insert("roundRobinAssignments", {
      bookingPageId: args.bookingPageId,
      userId: args.userId,
      bookingId: args.bookingId,
      assignedAt: Date.now(),
      periodKey: args.periodKey,
      assignmentCountInPeriod: count,
      weightAtAssignment: args.weight,
    });
  },
});

// =============================================================================
// Public API
// =============================================================================

/**
 * Build assignment count map from assignments.
 */
function buildAssignmentCounts(
  availableMembers: Id<"users">[],
  assignments: Array<{ userId: Id<"users">; assignmentCountInPeriod: number }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const userId of availableMembers) {
    counts[userId] = 0;
  }
  for (const assignment of assignments) {
    if (assignment.userId in counts) {
      counts[assignment.userId] = assignment.assignmentCountInPeriod;
    }
  }
  return counts;
}

/**
 * Build weight map from booking page config.
 */
function buildWeightMap(
  availableMembers: Id<"users">[],
  hostWeights: Array<{ userId: Id<"users">; weight: number }> | undefined,
): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const userId of availableMembers) {
    weights[userId] = 1; // Default weight
  }
  if (hostWeights) {
    for (const hw of hostWeights) {
      if (hw.userId in weights) {
        weights[hw.userId] = hw.weight;
      }
    }
  }
  return weights;
}

/**
 * Select the best user based on weighted scores.
 */
function selectBestUser(
  availableMembers: Id<"users">[],
  assignmentCounts: Record<string, number>,
  weights: Record<string, number>,
): Id<"users"> {
  let bestUserId: Id<"users"> | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const userId of availableMembers) {
    const count = assignmentCounts[userId];
    const weight = weights[userId];
    const score = count / weight;

    if (score < bestScore) {
      bestScore = score;
      bestUserId = userId;
    } else if (score === bestScore && bestUserId) {
      // Tie-breaker: random selection
      if (Math.random() < 0.5) {
        bestUserId = userId;
      }
    }
  }

  return bestUserId ?? availableMembers[0];
}

/**
 * Get the next host for a round-robin booking.
 * Returns the user ID of the next host to assign.
 */
export const getNextRoundRobinHost = internalQuery({
  args: {
    bookingPageId: v.id("bookingPages"),
    excludeUserIds: v.optional(v.array(v.id("users"))), // Users unavailable at this time
  },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    const bookingPage = await ctx.db.get(args.bookingPageId);
    if (!bookingPage) return null;

    // If not round-robin, return the owner
    if (bookingPage.schedulingType !== "round_robin") {
      return bookingPage.userId;
    }

    // Get team members
    const teamMembers = bookingPage.teamMembers ?? [bookingPage.userId];
    if (teamMembers.length === 0) {
      return bookingPage.userId;
    }

    // Filter out excluded users (unavailable)
    const excludeSet = new Set(args.excludeUserIds ?? []);
    const availableMembers = teamMembers.filter((id) => !excludeSet.has(id));

    if (availableMembers.length === 0) {
      return bookingPage.userId;
    }

    if (availableMembers.length === 1) {
      return availableMembers[0];
    }

    // Get current period key
    const periodKey = getPeriodKey(bookingPage.roundRobinInterval, Date.now());

    // Get assignment counts for this period
    const assignments = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page_period", (q) =>
        q.eq("bookingPageId", args.bookingPageId).eq("periodKey", periodKey),
      )
      .take(BOUNDED_LIST_LIMIT);

    const assignmentCounts = buildAssignmentCounts(availableMembers, assignments);
    const weights = buildWeightMap(availableMembers, bookingPage.hostWeights);

    return selectBestUser(availableMembers, assignmentCounts, weights);
  },
});

/**
 * Get round-robin statistics for a booking page.
 */
export const getStats = authenticatedQuery({
  args: {
    bookingPageId: v.id("bookingPages"),
  },
  handler: async (ctx, args) => {
    const bookingPage = await ctx.db.get(args.bookingPageId);
    if (!bookingPage || bookingPage.userId !== ctx.userId) {
      return null;
    }

    if (bookingPage.schedulingType !== "round_robin") {
      return { type: "individual" as const };
    }

    const teamMembers = bookingPage.teamMembers ?? [];
    const periodKey = getPeriodKey(bookingPage.roundRobinInterval, Date.now());

    // Get current period assignments
    const assignments = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page_period", (q) =>
        q.eq("bookingPageId", args.bookingPageId).eq("periodKey", periodKey),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Build member stats
    const memberStats: Array<{
      userId: Id<"users">;
      assignmentsInPeriod: number;
      weight: number;
    }> = [];

    const weights: Record<string, number> = {};
    if (bookingPage.hostWeights) {
      for (const hw of bookingPage.hostWeights) {
        weights[hw.userId] = hw.weight;
      }
    }

    for (const userId of teamMembers) {
      const count = assignments.find((a) => a.userId === userId)?.assignmentCountInPeriod ?? 0;
      memberStats.push({
        userId,
        assignmentsInPeriod: count,
        weight: weights[userId] ?? 1,
      });
    }

    // Get all-time total
    const allAssignments = await ctx.db
      .query("roundRobinAssignments")
      .withIndex("by_booking_page", (q) => q.eq("bookingPageId", args.bookingPageId))
      .take(BOUNDED_LIST_LIMIT);

    return {
      type: "round_robin" as const,
      interval: bookingPage.roundRobinInterval ?? null,
      currentPeriod: periodKey,
      memberStats,
      totalAssignments: allAssignments.length,
      teamSize: teamMembers.length,
    };
  },
});

/**
 * Update round-robin configuration for a booking page.
 */
export const updateConfig = authenticatedMutation({
  args: {
    bookingPageId: v.id("bookingPages"),
    schedulingType: v.optional(schedulingTypes),
    teamMembers: v.optional(v.array(v.id("users"))),
    roundRobinInterval: v.optional(v.union(roundRobinIntervals, v.null())),
    hostWeights: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          weight: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const bookingPage = await ctx.db.get(args.bookingPageId);
    if (!bookingPage || bookingPage.userId !== ctx.userId) {
      throw new Error("Booking page not found or access denied");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.schedulingType !== undefined) {
      updates.schedulingType = args.schedulingType;
    }
    if (args.teamMembers !== undefined) {
      updates.teamMembers = args.teamMembers;
    }
    if (args.roundRobinInterval !== undefined) {
      updates.roundRobinInterval = args.roundRobinInterval ?? undefined;
    }
    if (args.hostWeights !== undefined) {
      updates.hostWeights = args.hostWeights;
    }

    await ctx.db.patch(args.bookingPageId, updates);

    return { success: true };
  },
});

/**
 * Reset round-robin counts for a booking page.
 * Useful when changing team members or weights.
 */
export const resetCounts = authenticatedMutation({
  args: {
    bookingPageId: v.id("bookingPages"),
    periodOnly: v.optional(v.boolean()), // Only reset current period
  },
  handler: async (ctx, args) => {
    const bookingPage = await ctx.db.get(args.bookingPageId);
    if (!bookingPage || bookingPage.userId !== ctx.userId) {
      throw new Error("Booking page not found or access denied");
    }

    const assignments = args.periodOnly
      ? await ctx.db
          .query("roundRobinAssignments")
          .withIndex("by_booking_page_period", (q) =>
            q
              .eq("bookingPageId", args.bookingPageId)
              .eq("periodKey", getPeriodKey(bookingPage.roundRobinInterval, Date.now())),
          )
          .take(BOUNDED_LIST_LIMIT)
      : await ctx.db
          .query("roundRobinAssignments")
          .withIndex("by_booking_page", (q) => q.eq("bookingPageId", args.bookingPageId))
          .take(BOUNDED_LIST_LIMIT);

    // Delete all assignments
    await Promise.all(assignments.map((a) => ctx.db.delete(a._id)));

    return { deleted: assignments.length };
  },
});
