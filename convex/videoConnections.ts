/**
 * Video Connections - Query and manage video provider connections
 */

import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { videoProviders } from "./validators";

/**
 * List all video connections for the current user
 */
export const list = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connections = await ctx.db
      .query("videoConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(BOUNDED_LIST_LIMIT);

    return connections.map((c) => ({
      _id: c._id,
      provider: c.provider,
      email: c.providerEmail,
      lastUsedAt: c.lastUsedAt,
      updatedAt: c.updatedAt,
    }));
  },
});

/**
 * Check if a specific provider is connected
 */
export const isProviderConnected = authenticatedQuery({
  args: {
    provider: videoProviders,
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", ctx.userId).eq("provider", args.provider),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      connected: !!connection,
      email: connection?.providerEmail,
    };
  },
});

/**
 * Disconnect a video provider
 */
export const disconnect = authenticatedMutation({
  args: {
    provider: videoProviders,
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", ctx.userId).eq("provider", args.provider),
      )
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
