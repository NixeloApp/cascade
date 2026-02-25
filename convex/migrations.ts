
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Backfill `isDeleted` field for notifications that are missing it.
 * This is required for the `by_user_active` index to work correctly.
 *
 * Run this mutation repeatedly until it returns count: 0.
 */
export const backfillNotificationIsDeleted = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;

    // Scan notifications that are missing isDeleted
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isDeleted"), undefined))
      .take(limit);

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { isDeleted: false });
    }

    return { count: notifications.length };
  },
});
