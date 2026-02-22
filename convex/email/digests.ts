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
    // Get all users who have daily digest enabled
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result = (await ctx.runQuery(internal.users.listWithDigestPreference, {
        frequency: "daily",
        paginationOpts: { cursor, numItems: 100 },
      })) as PaginationResult<{ _id: Id<"users"> }>;

      const users = result.page;

      // Send digest to each user in this batch
      const batchResults = await Promise.allSettled(
        users.map((user: { _id: Id<"users"> }) =>
          ctx.runAction(internal.email.notifications.sendDigestEmail, {
            userId: user._id,
            frequency: "daily",
          }),
        ),
      );

      for (const batchResult of batchResults) {
        if (batchResult.status === "rejected") {
          failed++;
        } else {
          const value = batchResult.value as DigestResult;
          if (value.skipped) {
            skipped++;
          } else {
            sent++;
          }
        }
      }

      isDone = result.isDone;
      cursor = result.continueCursor;
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
    // Get all users who have weekly digest enabled
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result = (await ctx.runQuery(internal.users.listWithDigestPreference, {
        frequency: "weekly",
        paginationOpts: { cursor, numItems: 100 },
      })) as PaginationResult<{ _id: Id<"users"> }>;

      const users = result.page;

      // Send digest to each user in this batch
      const batchResults = await Promise.allSettled(
        users.map((user: { _id: Id<"users"> }) =>
          ctx.runAction(internal.email.notifications.sendDigestEmail, {
            userId: user._id,
            frequency: "weekly",
          }),
        ),
      );

      for (const batchResult of batchResults) {
        if (batchResult.status === "rejected") {
          failed++;
        } else {
          const value = batchResult.value as DigestResult;
          if (value.skipped) {
            skipped++;
          } else {
            sent++;
          }
        }
      }

      isDone = result.isDone;
      cursor = result.continueCursor;
    }

    return { sent, skipped, failed };
  },
});
