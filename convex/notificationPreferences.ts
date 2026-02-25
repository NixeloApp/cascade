/**
 * Notification Preferences
 *
 * Manages user email notification preferences
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { emailDigests } from "./validators";

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  emailMentions: true,
  emailAssignments: true,
  emailComments: true,
  emailStatusChanges: false, // Off by default (can be noisy)
  emailDigest: "none" as const,
  digestDay: undefined,
  digestTime: undefined,
};

/**
 * Get notification preferences for current user
 */
export const get = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    // Return defaults if no preferences exist
    if (!prefs) {
      return {
        ...DEFAULT_PREFERENCES,
        userId: ctx.userId,
        _id: undefined,
        updatedAt: Date.now(),
      };
    }

    return prefs;
  },
});

/**
 * Get preferences for a specific user (internal only)
 */
export const getForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!prefs) {
      return DEFAULT_PREFERENCES;
    }

    return prefs;
  },
});

/**
 * Update notification preferences
 */
export const update = authenticatedMutation({
  args: {
    emailEnabled: v.optional(v.boolean()),
    emailMentions: v.optional(v.boolean()),
    emailAssignments: v.optional(v.boolean()),
    emailComments: v.optional(v.boolean()),
    emailStatusChanges: v.optional(v.boolean()),
    emailDigest: v.optional(emailDigests),
    digestDay: v.optional(v.string()),
    digestTime: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.id("notificationPreferences"),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    const updates = {
      ...args,
      updatedAt: Date.now(),
    };

    let preferenceId: Id<"notificationPreferences">;

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, updates);
      preferenceId = existing._id;
    } else {
      // Create new preferences
      preferenceId = await ctx.db.insert("notificationPreferences", {
        userId: ctx.userId,
        emailEnabled: args.emailEnabled ?? DEFAULT_PREFERENCES.emailEnabled,
        emailMentions: args.emailMentions ?? DEFAULT_PREFERENCES.emailMentions,
        emailAssignments: args.emailAssignments ?? DEFAULT_PREFERENCES.emailAssignments,
        emailComments: args.emailComments ?? DEFAULT_PREFERENCES.emailComments,
        emailStatusChanges: args.emailStatusChanges ?? DEFAULT_PREFERENCES.emailStatusChanges,
        emailDigest: args.emailDigest ?? DEFAULT_PREFERENCES.emailDigest,
        digestDay: args.digestDay,
        digestTime: args.digestTime,
        updatedAt: Date.now(),
      });
    }

    return { success: true, preferenceId };
  },
});

/**
 * Create default preferences for a new user (called during signup)
 */
export const createDefault = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create default preferences
    return await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      ...DEFAULT_PREFERENCES,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Check if user should receive email for a specific notification type
 */
export const shouldSendEmail = internalQuery({
  args: {
    userId: v.id("users"),
    type: v.string(), // "mention", "assigned", "comment", "status_change"
  },
  handler: async (ctx, args): Promise<boolean> => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // If no preferences, use defaults
    const preferences = prefs || DEFAULT_PREFERENCES;

    // Check master toggle
    if (!preferences.emailEnabled) {
      return false;
    }

    // Check specific notification type
    switch (args.type) {
      case "mention":
        return preferences.emailMentions;
      case "assigned":
        return preferences.emailAssignments;
      case "comment":
        return preferences.emailComments;
      case "status_change":
        return preferences.emailStatusChanges;
      default:
        return false;
    }
  },
});
