/**
 * Slack Integration
 *
 * OAuth connection storage for Slack workspace integration.
 * Persists encrypted tokens and workspace metadata for outbound notifications.
 */

import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { encrypt } from "./lib/encryption";

/** Save or update Slack OAuth connection for current user. */
export const connectSlack = authenticatedMutation({
  args: {
    teamId: v.string(),
    teamName: v.string(),
    accessToken: v.string(),
    botUserId: v.optional(v.string()),
    scope: v.optional(v.string()),
    incomingWebhookUrl: v.optional(v.string()),
    incomingWebhookChannel: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true), connectionId: v.id("slackConnections") }),
  handler: async (ctx, args) => {
    const encryptedAccessToken = await encrypt(args.accessToken);
    const now = Date.now();

    const existing = await ctx.db
      .query("slackConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        teamId: args.teamId,
        teamName: args.teamName,
        accessToken: encryptedAccessToken,
        botUserId: args.botUserId,
        scope: args.scope,
        incomingWebhookUrl: args.incomingWebhookUrl,
        incomingWebhookChannel: args.incomingWebhookChannel,
        isActive: true,
        updatedAt: now,
      });
      return { success: true, connectionId: existing._id } as const;
    }

    const connectionId = await ctx.db.insert("slackConnections", {
      userId: ctx.userId,
      teamId: args.teamId,
      teamName: args.teamName,
      accessToken: encryptedAccessToken,
      botUserId: args.botUserId,
      scope: args.scope,
      incomingWebhookUrl: args.incomingWebhookUrl,
      incomingWebhookChannel: args.incomingWebhookChannel,
      isActive: true,
      updatedAt: now,
    });

    return { success: true, connectionId } as const;
  },
});

/** Get current user's Slack connection metadata (without exposing tokens). */
export const getConnection = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("slackConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (!connection) return null;

    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      userId: connection.userId,
      teamId: connection.teamId,
      teamName: connection.teamName,
      botUserId: connection.botUserId,
      scope: connection.scope,
      incomingWebhookChannel: connection.incomingWebhookChannel,
      isActive: connection.isActive,
      updatedAt: connection.updatedAt,
      hasIncomingWebhook: !!connection.incomingWebhookUrl,
      hasAccessToken: !!connection.accessToken,
    };
  },
});

/** Disconnect current user's Slack workspace integration. */
export const disconnectSlack = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("slackConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    return { success: true } as const;
  },
});
