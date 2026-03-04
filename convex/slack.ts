/**
 * Slack Integration
 *
 * OAuth connection storage + outbound notification delivery for Slack.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  type QueryCtx,
} from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { encrypt } from "./lib/encryption";
import { forbidden, validation } from "./lib/errors";
import { logger } from "./lib/logger";
import { safeFetch } from "./lib/safeFetch";
import { notDeleted } from "./lib/softDeleteHelpers";

type SlackEvent =
  | "issue.created"
  | "issue.updated"
  | "issue.assigned"
  | "issue.completed"
  | "issue.deleted"
  | "comment.created";

function isSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "hooks.slack.com" || parsed.hostname.endsWith(".slack.com"))
    );
  } catch {
    return false;
  }
}

/** Save or update Slack OAuth connection for current user. */
export const connectSlack = authenticatedMutation({
  args: {
    slackUserId: v.optional(v.string()),
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
    if (args.incomingWebhookUrl && !isSlackWebhookUrl(args.incomingWebhookUrl)) {
      throw validation("incomingWebhookUrl", "Invalid Slack incoming webhook URL");
    }

    const encryptedAccessToken = await encrypt(args.accessToken);
    const now = Date.now();

    const existing = await ctx.db
      .query("slackConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        slackUserId: args.slackUserId,
        teamId: args.teamId,
        teamName: args.teamName,
        accessToken: encryptedAccessToken,
        botUserId: args.botUserId,
        scope: args.scope,
        incomingWebhookUrl: args.incomingWebhookUrl,
        incomingWebhookChannel: args.incomingWebhookChannel,
        isActive: true,
        messagesSent: existing.messagesSent ?? 0,
        lastMessageAt: existing.lastMessageAt,
        lastError: undefined,
        updatedAt: now,
      });
      return { success: true, connectionId: existing._id } as const;
    }

    const connectionId = await ctx.db.insert("slackConnections", {
      userId: ctx.userId,
      slackUserId: args.slackUserId,
      teamId: args.teamId,
      teamName: args.teamName,
      accessToken: encryptedAccessToken,
      botUserId: args.botUserId,
      scope: args.scope,
      incomingWebhookUrl: args.incomingWebhookUrl,
      incomingWebhookChannel: args.incomingWebhookChannel,
      isActive: true,
      messagesSent: 0,
      updatedAt: now,
    });

    return { success: true, connectionId } as const;
  },
});

export const sendMessage = action({
  args: {
    connectionId: v.id("slackConnections"),
    text: v.string(),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw forbidden();
    }

    const connection = await ctx.runQuery(internal.slack.getConnectionForDelivery, {
      connectionId: args.connectionId,
    });
    if (!connection) {
      return { success: true } as const;
    }
    if (connection.userId !== userId) {
      throw forbidden();
    }

    await ctx.runAction(internal.slack.deliverMessageInternal, {
      connectionId: args.connectionId,
      text: args.text,
    });

    return { success: true } as const;
  },
});

/**
 * Deliver a message to Slack for a specific connection.
 *
 * Behavior contract:
 * - Missing/inactive destinations are treated as no-op success.
 * - Delivery stats are updated for both success and failure paths.
 * - Failures are rethrown after stats update so callers can choose retry/log policy.
 */
export const deliverMessageInternal = internalAction({
  args: {
    connectionId: v.id("slackConnections"),
    text: v.string(),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(internal.slack.getConnectionForDelivery, {
      connectionId: args.connectionId,
    });
    if (!connection) {
      return { success: true } as const;
    }

    try {
      const response = await safeFetch(connection.incomingWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: args.text }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw validation("slack", `Slack webhook failed: ${response.status} ${errorBody}`);
      }

      await ctx.runMutation(internal.slack.updateDeliveryStats, {
        connectionId: args.connectionId,
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.slack.updateDeliveryStats, {
        connectionId: args.connectionId,
        success: false,
        error: errorMessage,
      });
      throw error;
    }

    return { success: true } as const;
  },
});

export const sendIssueNotification = internalAction({
  args: {
    issueId: v.id("issues"),
    event: v.union(
      v.literal("issue.created"),
      v.literal("issue.updated"),
      v.literal("issue.assigned"),
      v.literal("issue.completed"),
      v.literal("issue.deleted"),
      v.literal("comment.created"),
    ),
    userId: v.optional(v.id("users")),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const issueContext = await ctx.runQuery(internal.slack.getIssueContext, {
      issueId: args.issueId,
    });
    if (!issueContext) {
      return { success: true } as const;
    }

    const destinations = await ctx.runQuery(internal.slack.listProjectDestinations, {
      projectId: issueContext.projectId,
    });
    if (destinations.length === 0) {
      return { success: true } as const;
    }

    const text = buildIssueNotificationText(args.event, issueContext);
    for (const destination of destinations) {
      try {
        await ctx.runAction(internal.slack.deliverMessageInternal, {
          connectionId: destination.connectionId,
          text,
        });
      } catch (error) {
        logger.error("Failed to deliver Slack issue notification", {
          issueId: args.issueId,
          event: args.event,
          connectionId: destination.connectionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { success: true } as const;
  },
});

/**
 * Resolve a Slack connection into a delivery-safe destination.
 *
 * Returns `null` when the connection is missing, inactive, or has no incoming webhook URL.
 * Callers use this to treat non-deliverable connections as no-op instead of hard failures.
 */
export const getConnectionForDelivery = internalQuery({
  args: { connectionId: v.id("slackConnections") },
  returns: v.union(
    v.object({
      connectionId: v.id("slackConnections"),
      userId: v.id("users"),
      incomingWebhookUrl: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection || !connection.isActive || !connection.incomingWebhookUrl) {
      return null;
    }

    return {
      connectionId: connection._id,
      userId: connection.userId,
      incomingWebhookUrl: connection.incomingWebhookUrl,
    };
  },
});

/**
 * Update per-connection Slack delivery telemetry.
 *
 * Contract:
 * - Always returns success (missing connections are treated as no-op).
 * - Increments `messagesSent` only for successful deliveries.
 * - Preserves `lastMessageAt` on failures while recording `lastError`.
 */
export const updateDeliveryStats = internalMutation({
  args: {
    connectionId: v.id("slackConnections"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: true } as const;
    }

    await ctx.db.patch(args.connectionId, {
      messagesSent: (connection.messagesSent ?? 0) + (args.success ? 1 : 0),
      lastMessageAt: args.success ? Date.now() : connection.lastMessageAt,
      lastError: args.error,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

export const getIssueContext = internalQuery({
  args: { issueId: v.id("issues") },
  returns: v.union(
    v.object({
      issueId: v.id("issues"),
      projectId: v.id("projects"),
      key: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      type: v.string(),
      priority: v.string(),
      status: v.string(),
      assigneeName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.isDeleted) {
      return null;
    }

    const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
    return {
      issueId: issue._id,
      projectId: issue.projectId,
      key: issue.key,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      priority: issue.priority,
      status: issue.status,
      assigneeName: assignee?.name,
    };
  },
});

export const listProjectDestinations = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(
    v.object({
      connectionId: v.id("slackConnections"),
      teamName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.isDeleted) {
      return [];
    }

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    const userIds = new Set<Id<"users">>([project.createdBy]);
    for (const member of members) {
      userIds.add(member.userId);
    }

    const destinations: Array<{ connectionId: Id<"slackConnections">; teamName: string }> = [];
    for (const userId of userIds) {
      const connection = await findUserSlackConnection(ctx, userId);
      if (connection) {
        destinations.push({
          connectionId: connection._id,
          teamName: connection.teamName,
        });
      }
    }

    return destinations;
  },
});

async function findUserSlackConnection(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"slackConnections"> | null> {
  const connection = await ctx.db
    .query("slackConnections")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!connection || !connection.isActive || !connection.incomingWebhookUrl) {
    return null;
  }

  return connection;
}

function buildIssueNotificationText(
  event: SlackEvent,
  issue: {
    key: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    assigneeName?: string;
  },
): string {
  const title = getEventTitle(event);
  const assignee = issue.assigneeName || "Unassigned";
  return [
    `${title} *${issue.key}: ${issue.title}*`,
    `Type: ${issue.type}`,
    `Priority: ${issue.priority}`,
    `Status: ${issue.status}`,
    `Assignee: ${assignee}`,
  ].join("\n");
}

function getEventTitle(event: SlackEvent): string {
  switch (event) {
    case "issue.created":
      return "New issue created";
    case "issue.updated":
      return "Issue updated";
    case "issue.assigned":
      return "Issue assigned";
    case "issue.completed":
      return "Issue completed";
    case "issue.deleted":
      return "Issue deleted";
    case "comment.created":
      return "New comment added";
    default:
      return "Issue activity";
  }
}

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
      slackUserId: connection.slackUserId,
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
