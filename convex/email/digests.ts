/**
 * Digest Email Cron Actions
 *
 * Sends daily and weekly digest emails to users who have opted in
 */

import type { PaginationResult } from "convex/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";

interface DigestResult {
  success: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

/**
 * Send daily digest emails to all users who have opted in
 */
export const sendDailyDigests = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number; skipped: number; failed: number }> => {
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    let isDone = false;
    let cursor: string | null = null;

    while (!isDone) {
      // Get batch of users who have daily digest enabled
      const result = (await ctx.runQuery(internal.users.listWithDigestPreference, {
        frequency: "daily",
        paginationOpts: {
          cursor,
          numItems: 100, // Process 100 users at a time
        },
      })) as PaginationResult<{ _id: Id<"users"> }>;

      const users = result.page;
      isDone = result.isDone;
      cursor = result.continueCursor;

      // Send digest to each user in this batch
      const batchResults = await Promise.allSettled(
        users.map((user: { _id: Id<"users"> }) =>
          ctx.runAction(internal.email.notifications.sendDigestEmail, {
            userId: user._id,
            frequency: "daily",
          }),
        ),
      );

      // Count results for this batch
      for (const res of batchResults) {
        if (res.status === "rejected") {
          failed++;
        } else {
          const value = res.value as DigestResult;
          if (value.skipped) {
            skipped++;
          } else {
            sent++;
          }
        }
      }
    }

    return { sent, skipped, failed };
  },
});

/**
 * Send weekly digest emails to all users who have opted in
 */
export const sendWeeklyDigests = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number; skipped: number; failed: number }> => {
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    let isDone = false;
    let cursor: string | null = null;

    while (!isDone) {
      // Get batch of users who have weekly digest enabled
      const result = (await ctx.runQuery(internal.users.listWithDigestPreference, {
        frequency: "weekly",
        paginationOpts: {
          cursor,
          numItems: 100, // Process 100 users at a time
        },
      })) as PaginationResult<{ _id: Id<"users"> }>;

      const users = result.page;
      isDone = result.isDone;
      cursor = result.continueCursor;

      // Send digest to each user in this batch
      const batchResults = await Promise.allSettled(
        users.map((user: { _id: Id<"users"> }) =>
          ctx.runAction(internal.email.notifications.sendDigestEmail, {
            userId: user._id,
            frequency: "weekly",
          }),
        ),
      );

      // Count results for this batch
      for (const res of batchResults) {
        if (res.status === "rejected") {
          failed++;
        } else {
          const value = res.value as DigestResult;
          if (value.skipped) {
            skipped++;
          } else {
            sent++;
          }
        }
      }
    }

    return { sent, skipped, failed };
  },
});
