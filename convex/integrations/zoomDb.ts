/**
 * Zoom Database Operations
 *
 * Mutations and queries for Zoom video connections.
 * Separated from zoom.ts because that file uses "use node" for crypto APIs.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";

/**
 * Store Zoom connection after OAuth callback
 */
export const storeConnection = internalMutation({
  args: {
    userId: v.id("users"),
    providerAccountId: v.string(),
    providerEmail: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing connection
    const existing = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "zoom"))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: args.providerAccountId,
        providerEmail: args.providerEmail,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("videoConnections", {
      userId: args.userId,
      provider: "zoom",
      providerAccountId: args.providerAccountId,
      providerEmail: args.providerEmail,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scope: args.scope,
      isActive: true,
      updatedAt: now,
    });
  },
});

/**
 * Get user's Zoom connection (internal query)
 */
export const getConnection = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "zoom"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

/**
 * Update stored tokens after refresh
 */
export const updateTokens = internalMutation({
  args: {
    connectionId: v.id("videoConnections"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update last used timestamp
 */
export const updateLastUsed = internalMutation({
  args: {
    connectionId: v.id("videoConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastUsedAt: Date.now(),
    });
  },
});

/**
 * Disconnect Zoom (deactivate connection)
 */
export const disconnect = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "zoom"))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Check if user has connected Zoom
 */
export const isConnected = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "zoom"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      connected: !!connection,
      email: connection?.providerEmail,
    };
  },
});
