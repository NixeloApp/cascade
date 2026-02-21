/**
 * Unsubscribe Token System
 *
 * Generates secure tokens for unsubscribe links
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { unauthenticated, validation } from "./lib/errors";
import { MONTH } from "./lib/timeUtils";

/**
 * Generate a unique unsubscribe token for a user
 */
export const generateToken = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw unauthenticated();

    // Generate a random token
    const token = generateRandomToken();

    // Store token in database
    await ctx.db.insert("unsubscribeTokens", {
      userId,
      token,
      usedAt: undefined,
    });

    return token;
  },
});

/**
 * Get user ID from unsubscribe token
 */
export const getUserFromToken = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    const tokenRecord = await ctx.db
      .query("unsubscribeTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) return null;

    // Check if token is expired (30 days)
    const thirtyDaysAgo = Date.now() - MONTH;
    if (tokenRecord._creationTime < thirtyDaysAgo) {
      return null;
    }

    return tokenRecord.userId;
  },
});

/**
 * Unsubscribe a user using their token
 */
export const unsubscribe = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Find token
    const tokenRecord = await ctx.db
      .query("unsubscribeTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) {
      throw validation("token", "Invalid unsubscribe token");
    }

    // Check if token is expired (30 days)
    const thirtyDaysAgo = Date.now() - MONTH;
    if (tokenRecord._creationTime < thirtyDaysAgo) {
      throw validation("token", "Unsubscribe link has expired");
    }

    // Mark token as used
    await ctx.db.patch(tokenRecord._id, {
      usedAt: Date.now(),
    });

    // Disable all email notifications for this user
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", tokenRecord.userId))
      .first();

    if (prefs) {
      await ctx.db.patch(prefs._id, {
        emailEnabled: false,
        updatedAt: Date.now(),
      });
    } else {
      // Create preferences with email disabled
      await ctx.db.insert("notificationPreferences", {
        userId: tokenRecord.userId,
        emailEnabled: false,
        emailMentions: false,
        emailAssignments: false,
        emailComments: false,
        emailStatusChanges: false,
        emailDigest: "none",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Generate a cryptographically secure random token
 */
function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generates an unsubscribe token for a user, used by digest email actions. */
export const generateTokenInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string> => {
    const token = generateRandomToken();

    await ctx.db.insert("unsubscribeTokens", {
      userId: args.userId,
      token,
      usedAt: undefined,
    });

    return token;
  },
});
