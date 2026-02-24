/**
 * Digest Email Cron Actions
 *
 * Sends daily and weekly digest emails to users who have opted in
 */

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { logger } from "../lib/logger";

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
    const users = await ctx.runQuery(internal.users.listWithDigestPreference, {
      frequency: "daily",
    });

    // Send digest to each user
    const results = await Promise.allSettled(
      users.map((user: { _id: Id<"users"> }) =>
        ctx.runAction(internal.email.notifications.sendDigestEmail, {
          userId: user._id,
          frequency: "daily",
        }),
      ),
    );

    // Count results: sent (actually dispatched), skipped (no notifications), failed
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const user = users[i];

      if (result.status === "rejected") {
        logger.error(`Failed to send daily digest to user ${user._id}`, { error: result.reason });
        failed++;
      } else {
        const value = result.value as DigestResult;
        if (value.skipped) {
          skipped++;
        } else if (value.success) {
          sent++;
        } else {
          logger.error(`Failed to send daily digest to user ${user._id}`, { error: value.error });
          failed++;
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
    // Get all users who have weekly digest enabled
    const users = await ctx.runQuery(internal.users.listWithDigestPreference, {
      frequency: "weekly",
    });

    // Send digest to each user
    const results = await Promise.allSettled(
      users.map((user: { _id: Id<"users"> }) =>
        ctx.runAction(internal.email.notifications.sendDigestEmail, {
          userId: user._id,
          frequency: "weekly",
        }),
      ),
    );

    // Count results: sent (actually dispatched), skipped (no notifications), failed
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const user = users[i];

      if (result.status === "rejected") {
        logger.error(`Failed to send weekly digest to user ${user._id}`, { error: result.reason });
        failed++;
      } else {
        const value = result.value as DigestResult;
        if (value.skipped) {
          skipped++;
        } else if (value.success) {
          sent++;
        } else {
          logger.error(`Failed to send weekly digest to user ${user._id}`, { error: value.error });
          failed++;
        }
      }
    }

    return { sent, skipped, failed };
  },
});
