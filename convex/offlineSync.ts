import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { DAY, MINUTE, WEEK } from "./lib/timeUtils";

// Add mutation to offline queue
export const queueMutation = authenticatedMutation({
  args: {
    mutationType: v.string(), // e.g., "issues.update"
    mutationArgs: v.string(), // JSON string of arguments
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("offlineSyncQueue", {
      userId: ctx.userId,
      mutationType: args.mutationType,
      mutationArgs: args.mutationArgs,
      status: "pending",
      attempts: 0,
      updatedAt: now,
    });
  },
});

// Get pending mutations for user
export const getPendingMutations = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Bounded to prevent memory issues with large backlogs
    return await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "pending"))
      .order("asc") // Process in order
      .take(BOUNDED_LIST_LIMIT);
  },
});

// Mark mutation as syncing
export const markSyncing = authenticatedMutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.queueId);
    if (!item) throw notFound("offlineSyncQueue", args.queueId);

    if (item.userId !== ctx.userId) {
      throw forbidden(undefined, "Unauthorized");
    }

    await ctx.db.patch(args.queueId, {
      status: "syncing",
      lastAttempt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mark mutation as completed
export const markCompleted = authenticatedMutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.queueId);
    if (!item) throw notFound("offlineSyncQueue", args.queueId);

    if (item.userId !== ctx.userId) {
      throw forbidden(undefined, "Unauthorized");
    }

    await ctx.db.patch(args.queueId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Mark mutation as failed
export const markFailed = authenticatedMutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.queueId);
    if (!item) throw notFound("offlineSyncQueue", args.queueId);

    if (item.userId !== ctx.userId) {
      throw forbidden(undefined, "Unauthorized");
    }

    const attempts = item.attempts + 1;
    const maxAttempts = 3;

    // If max attempts reached, mark as permanently failed
    const status = attempts >= maxAttempts ? "failed" : "pending";

    await ctx.db.patch(args.queueId, {
      status,
      attempts,
      error: args.error,
      lastAttempt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get sync queue status for user
export const getSyncStatus = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Bounded queries for status counts
    const pending = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "pending"))
      .take(BOUNDED_LIST_LIMIT);

    const syncing = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "syncing"))
      .take(BOUNDED_LIST_LIMIT);

    const failed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "failed"))
      .take(BOUNDED_LIST_LIMIT);

    return {
      pending: pending.length,
      syncing: syncing.length,
      failed: failed.length,
      hasItems: pending.length > 0 || syncing.length > 0 || failed.length > 0,
    };
  },
});

// Clear completed items (cleanup)
export const clearCompleted = authenticatedMutation({
  args: {
    olderThan: v.optional(v.number()), // Clear items older than timestamp
  },
  handler: async (ctx, args) => {
    const cutoff = args.olderThan ?? Date.now() - DAY;

    // Bounded cleanup batch
    const completed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "completed"))
      .filter((q) => q.lt(q.field("updatedAt"), cutoff))
      .take(BOUNDED_LIST_LIMIT);

    for (const item of completed) {
      await ctx.db.delete(item._id);
    }

    return { deleted: completed.length };
  },
});

// Retry failed items
export const retryFailed = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    // Bounded retry batch
    const failed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", ctx.userId).eq("status", "failed"))
      .take(BOUNDED_LIST_LIMIT);

    const now = Date.now();
    await Promise.all(
      failed.map((item) =>
        ctx.db.patch(item._id, {
          status: "pending",
          attempts: 0,
          error: undefined,
          updatedAt: now,
        }),
      ),
    );

    return { retried: failed.length };
  },
});

/** Automatically retries failed sync items using exponential backoff, archiving items after max attempts. */
export const autoRetryFailed = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const MAX_ATTEMPTS = 5;

    // Get failed items (bounded batch for cron processing)
    const failed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .take(BOUNDED_LIST_LIMIT);

    let retriedCount = 0;
    let archivedCount = 0;

    for (const item of failed) {
      // Give up after MAX_ATTEMPTS
      if (item.attempts >= MAX_ATTEMPTS) {
        // Archive by deleting (or could mark as "archived")
        await ctx.db.delete(item._id);
        archivedCount++;
        continue;
      }

      // Exponential backoff: 5min, 15min, 45min, 2h, 6h
      const backoffMinutes = [5, 15, 45, 120, 360];
      const waitTime = backoffMinutes[Math.min(item.attempts, backoffMinutes.length - 1)] * MINUTE;

      // Check if enough time has passed since last attempt
      if (item.lastAttempt && now - item.lastAttempt < waitTime) {
        continue; // Not ready to retry yet
      }

      // Reset to pending for retry
      await ctx.db.patch(item._id, {
        status: "pending",
        updatedAt: now,
      });
      retriedCount++;
    }

    return { retriedCount, archivedCount, totalFailed: failed.length };
  },
});

/** Cleans up completed sync items older than 7 days to prevent table bloat. */
export const cleanupOldItems = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - WEEK;

    // Bounded batch for cron cleanup
    const completed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .take(BOUNDED_LIST_LIMIT);

    const toDelete = completed.filter((item) => item.updatedAt < cutoff);
    await Promise.all(toDelete.map((item) => ctx.db.delete(item._id)));

    return { deletedCount: toDelete.length };
  },
});

// Get all queue items for debugging
export const listQueue = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .take(50); // Limit to recent 50 items
  },
});
