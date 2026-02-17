/**
 * Push Notifications Module
 *
 * Web Push API implementation for real-time browser notifications.
 * Cal.com parity - enables desktop/mobile push notifications for PWA.
 *
 * Flow:
 * 1. User subscribes via browser PushManager
 * 2. Browser sends subscription (endpoint + keys) to server
 * 3. Server stores subscription in pushSubscriptions table
 * 4. When notification needed, server sends via Web Push API
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { validation } from "./lib/errors";

// ============================================================================
// Types
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Check if user has any push subscriptions
 */
export const hasSubscription = authenticatedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();
    return !!subscription;
  },
});

/**
 * List user's push subscriptions (for settings UI)
 */
export const listSubscriptions = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("pushSubscriptions"),
      endpoint: v.string(),
      userAgent: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    return subscriptions.map((sub) => ({
      _id: sub._id,
      endpoint: sub.endpoint,
      userAgent: sub.userAgent,
      createdAt: sub.createdAt,
    }));
  },
});

/**
 * Get push notification preferences
 */
export const getPreferences = authenticatedQuery({
  args: {},
  returns: v.object({
    pushEnabled: v.boolean(),
    pushMentions: v.boolean(),
    pushAssignments: v.boolean(),
    pushComments: v.boolean(),
    pushStatusChanges: v.boolean(),
  }),
  handler: async (ctx) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    // Return defaults if no preferences exist
    return {
      pushEnabled: prefs?.pushEnabled ?? true,
      pushMentions: prefs?.pushMentions ?? true,
      pushAssignments: prefs?.pushAssignments ?? true,
      pushComments: prefs?.pushComments ?? true,
      pushStatusChanges: prefs?.pushStatusChanges ?? true,
    };
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Subscribe to push notifications
 * Called when user grants notification permission in browser
 */
export const subscribe = authenticatedMutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    expirationTime: v.optional(v.number()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    id: v.id("pushSubscriptions"),
  }),
  handler: async (ctx, args) => {
    // Validate endpoint is a valid URL
    try {
      new URL(args.endpoint);
    } catch {
      throw validation("endpoint", "Invalid push endpoint URL");
    }

    // Check for existing subscription with same endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription (endpoint reused, keys may differ)
      await ctx.db.patch(existing._id, {
        p256dh: args.p256dh,
        auth: args.auth,
        expirationTime: args.expirationTime,
        userAgent: args.userAgent,
      });
      return { success: true, id: existing._id };
    }

    // Create new subscription
    const id = await ctx.db.insert("pushSubscriptions", {
      userId: ctx.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      expirationTime: args.expirationTime,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });

    // Enable push in preferences if not already
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (prefs && !prefs.pushEnabled) {
      await ctx.db.patch(prefs._id, {
        pushEnabled: true,
        updatedAt: Date.now(),
      });
    }

    return { success: true, id };
  },
});

/**
 * Unsubscribe from push notifications
 * Called when user revokes notification permission or removes subscription
 */
export const unsubscribe = authenticatedMutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Find and delete subscription by endpoint
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription && subscription.userId === ctx.userId) {
      await ctx.db.delete(subscription._id);
    }

    return { success: true };
  },
});

/**
 * Unsubscribe all push subscriptions for user
 */
export const unsubscribeAll = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    for (const sub of subscriptions) {
      await ctx.db.delete(sub._id);
    }

    // Disable push in preferences
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (prefs) {
      await ctx.db.patch(prefs._id, {
        pushEnabled: false,
        updatedAt: Date.now(),
      });
    }

    return { success: true, count: subscriptions.length };
  },
});

// Push preference fields type
type PushPreferenceFields = {
  pushEnabled: boolean;
  pushMentions: boolean;
  pushAssignments: boolean;
  pushComments: boolean;
  pushStatusChanges: boolean;
};

// Build push preference updates from optional args
function buildPushUpdates(args: {
  pushEnabled?: boolean;
  pushMentions?: boolean;
  pushAssignments?: boolean;
  pushComments?: boolean;
  pushStatusChanges?: boolean;
}): Partial<PushPreferenceFields> {
  const updates: Partial<PushPreferenceFields> = {};
  if (args.pushEnabled !== undefined) updates.pushEnabled = args.pushEnabled;
  if (args.pushMentions !== undefined) updates.pushMentions = args.pushMentions;
  if (args.pushAssignments !== undefined) updates.pushAssignments = args.pushAssignments;
  if (args.pushComments !== undefined) updates.pushComments = args.pushComments;
  if (args.pushStatusChanges !== undefined) updates.pushStatusChanges = args.pushStatusChanges;
  return updates;
}

/**
 * Update push notification preferences
 */
export const updatePreferences = authenticatedMutation({
  args: {
    pushEnabled: v.optional(v.boolean()),
    pushMentions: v.optional(v.boolean()),
    pushAssignments: v.optional(v.boolean()),
    pushComments: v.optional(v.boolean()),
    pushStatusChanges: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    const now = Date.now();

    if (!prefs) {
      await ctx.db.insert("notificationPreferences", {
        userId: ctx.userId,
        emailEnabled: true,
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        emailDigest: "daily",
        pushEnabled: args.pushEnabled ?? true,
        pushMentions: args.pushMentions ?? true,
        pushAssignments: args.pushAssignments ?? true,
        pushComments: args.pushComments ?? true,
        pushStatusChanges: args.pushStatusChanges ?? true,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(prefs._id, { ...buildPushUpdates(args), updatedAt: now });
    }

    return { success: true };
  },
});

// ============================================================================
// Internal Helpers (for use by notification system)
// ============================================================================

/**
 * Get all push subscriptions for a user (internal use)
 * Used by notification sender to get endpoints
 */
export async function getUserPushSubscriptions(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<
  Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>
> {
  const subscriptions = await ctx.db
    .query("pushSubscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(BOUNDED_LIST_LIMIT);

  return subscriptions.map((sub) => ({
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
  }));
}

/**
 * Check if user has push notifications enabled for a notification type
 */
export async function shouldSendPush(
  ctx: QueryCtx,
  userId: Id<"users">,
  notificationType: "mention" | "assigned" | "comment" | "status_change",
): Promise<boolean> {
  // Check if user has any subscriptions
  const hasSubscriptions = await ctx.db
    .query("pushSubscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!hasSubscriptions) return false;

  // Check preferences
  const prefs = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  // Default to enabled if no preferences
  if (!prefs) return true;
  if (!prefs.pushEnabled) return false;

  // Check specific type
  switch (notificationType) {
    case "mention":
      return prefs.pushMentions ?? true;
    case "assigned":
      return prefs.pushAssignments ?? true;
    case "comment":
      return prefs.pushComments ?? true;
    case "status_change":
      return prefs.pushStatusChanges ?? true;
    default:
      return true;
  }
}

/**
 * Remove expired subscriptions
 * Called periodically to clean up stale subscriptions
 */
export async function removeExpiredSubscriptions(ctx: MutationCtx): Promise<number> {
  const now = Date.now();
  let removed = 0;

  // Query subscriptions with expiration time
  const subscriptions = await ctx.db.query("pushSubscriptions").take(BOUNDED_LIST_LIMIT);

  for (const sub of subscriptions) {
    if (sub.expirationTime && sub.expirationTime < now) {
      await ctx.db.delete(sub._id);
      removed++;
    }
  }

  return removed;
}
