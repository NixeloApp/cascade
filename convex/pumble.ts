/**
 * Pumble Integration
 *
 * Webhook-based integration with Pumble team messaging.
 * Sends issue notifications and custom messages to channels.
 * Supports event filtering and webhook management per user.
 */

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound, validation } from "./lib/errors";
import { logger } from "./lib/logger";
import { listProjectNotificationUserIds } from "./lib/projectNotificationDestinations";
import { getPlainTextFromDescription } from "./lib/richText";
import { safeFetch } from "./lib/safeFetch";
import { notDeleted } from "./lib/softDeleteHelpers";
import { RUNTIME_COLORS } from "./shared/colors";

/**
 * Pumble Integration
 *
 * Send messages and notifications to Pumble channels via incoming webhooks.
 * Pumble is a team communication platform similar to Slack.
 */

function isValidPumbleWebhookUrl(webhookUrl: string): boolean {
  try {
    const url = new URL(webhookUrl);
    // Require HTTPS and valid Pumble host without credentials
    const isPumbleHost = url.hostname === "pumble.com" || url.hostname.endsWith(".pumble.com");
    return url.protocol === "https:" && isPumbleHost && !url.username && !url.password;
  } catch {
    return false;
  }
}

const pumbleWebhookResponse = v.object({
  _id: v.id("pumbleWebhooks"),
  _creationTime: v.number(),
  userId: v.id("users"),
  projectId: v.optional(v.id("projects")),
  name: v.string(),
  webhookUrl: v.string(),
  events: v.array(v.string()),
  isActive: v.boolean(),
  sendMentions: v.boolean(),
  sendAssignments: v.boolean(),
  sendStatusChanges: v.boolean(),
  messagesSent: v.number(),
  lastMessageAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
  updatedAt: v.number(),
});

/**
 * Add a new Pumble webhook
 */
export const addWebhook = authenticatedMutation({
  args: {
    name: v.string(),
    webhookUrl: v.string(),
    projectId: v.optional(v.id("projects")),
    events: v.array(v.string()),
    sendMentions: v.optional(v.boolean()),
    sendAssignments: v.optional(v.boolean()),
    sendStatusChanges: v.optional(v.boolean()),
  },
  returns: v.object({ webhookId: v.id("pumbleWebhooks") }),
  handler: async (ctx, args) => {
    // Validate webhook URL
    if (!isValidPumbleWebhookUrl(args.webhookUrl)) {
      throw validation("webhookUrl", "Invalid Pumble webhook URL. Must be a valid pumble.com URL.");
    }

    // If project is specified, verify access
    if (args.projectId) {
      const projectId = args.projectId;
      const project = await ctx.db.get(projectId);
      if (!project) throw notFound("project", projectId);

      // Check if user has access to project
      const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", ctx.userId))
        .filter(notDeleted)
        .first();

      if (!membership && project.createdBy !== ctx.userId) {
        throw forbidden("project member");
      }
    }

    const webhookId = await ctx.db.insert("pumbleWebhooks", {
      userId: ctx.userId,
      projectId: args.projectId,
      name: args.name,
      webhookUrl: args.webhookUrl,
      events: args.events,
      isActive: true,
      sendMentions: args.sendMentions ?? true,
      sendAssignments: args.sendAssignments ?? true,
      sendStatusChanges: args.sendStatusChanges ?? true,
      messagesSent: 0,
      updatedAt: Date.now(),
    });

    return { webhookId };
  },
});

/**
 * List user's Pumble webhooks
 */
export const listWebhooks = authenticatedQuery({
  args: {},
  returns: v.array(pumbleWebhookResponse),
  handler: async (ctx) => {
    return await ctx.db
      .query("pumbleWebhooks")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);
  },
});

/**
 * Get a single webhook
 */
export const getWebhook = authenticatedQuery({
  args: { webhookId: v.id("pumbleWebhooks") },
  returns: v.union(v.null(), pumbleWebhookResponse),
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return null;
    if (webhook.userId !== ctx.userId) throw forbidden();

    return webhook;
  },
});

/**
 * Update webhook settings
 */
export const updateWebhook = authenticatedMutation({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    name: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    sendMentions: v.optional(v.boolean()),
    sendAssignments: v.optional(v.boolean()),
    sendStatusChanges: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw notFound("webhook", args.webhookId);
    if (webhook.userId !== ctx.userId) throw forbidden();

    const updates: {
      updatedAt: number;
      name?: string;
      webhookUrl?: string;
      events?: string[];
      isActive?: boolean;
      sendMentions?: boolean;
      sendAssignments?: boolean;
      sendStatusChanges?: boolean;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.webhookUrl !== undefined) {
      if (!isValidPumbleWebhookUrl(args.webhookUrl)) {
        throw validation(
          "webhookUrl",
          "Invalid Pumble webhook URL. Must be a valid pumble.com URL.",
        );
      }
      updates.webhookUrl = args.webhookUrl;
    }
    if (args.events !== undefined) updates.events = args.events;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.sendMentions !== undefined) updates.sendMentions = args.sendMentions;
    if (args.sendAssignments !== undefined) updates.sendAssignments = args.sendAssignments;
    if (args.sendStatusChanges !== undefined) updates.sendStatusChanges = args.sendStatusChanges;

    await ctx.db.patch(args.webhookId, updates);

    return { success: true } as const;
  },
});

/**
 * Delete a webhook
 */
export const deleteWebhook = authenticatedMutation({
  args: { webhookId: v.id("pumbleWebhooks") },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw notFound("webhook", args.webhookId);
    if (webhook.userId !== ctx.userId) throw forbidden();

    await ctx.db.delete(args.webhookId);

    return { success: true, deleted: true } as const;
  },
});

/**
 * Send a message to Pumble (Action - can call external APIs)
 */
export const sendMessage = action({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    text: v.string(),
    title: v.optional(v.string()),
    color: v.optional(v.string()), // hex color for message sidebar
    fields: v.optional(
      v.array(
        v.object({
          title: v.string(),
          value: v.string(),
          short: v.optional(v.boolean()),
        }),
      ),
    ),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(api.pumble.getWebhook, {
      webhookId: args.webhookId,
    });

    if (!webhook) {
      throw notFound("webhook", args.webhookId);
    }

    if (!webhook.isActive) {
      throw validation("webhook", "Webhook is not active");
    }

    await ctx.runAction(internal.pumble.deliverMessageInternal, {
      webhookId: args.webhookId,
      text: args.text,
      title: args.title,
      color: args.color,
      fields: args.fields,
    });

    return { success: true } as const;
  },
});

export const getWebhookForDelivery = internalQuery({
  args: { webhookId: v.id("pumbleWebhooks") },
  returns: v.union(
    v.object({
      webhookId: v.id("pumbleWebhooks"),
      webhookUrl: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || !webhook.isActive) {
      return null;
    }

    return {
      webhookId: webhook._id,
      webhookUrl: webhook.webhookUrl,
    };
  },
});

export const deliverMessageInternal = internalAction({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    text: v.string(),
    title: v.optional(v.string()),
    color: v.optional(v.string()),
    fields: v.optional(
      v.array(
        v.object({
          title: v.string(),
          value: v.string(),
          short: v.optional(v.boolean()),
        }),
      ),
    ),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    await deliverPumbleWebhookMessage(ctx, {
      webhookId: args.webhookId,
      text: args.text,
      title: args.title,
      color: args.color,
      fields: args.fields,
    });

    return { success: true } as const;
  },
});

/**
 * Update webhook statistics (internal mutation)
 */
export const updateWebhookStats = internalMutation({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return { success: true } as const;

    await ctx.db.patch(args.webhookId, {
      messagesSent: webhook.messagesSent + (args.success ? 1 : 0),
      lastMessageAt: args.success ? Date.now() : webhook.lastMessageAt,
      lastError: args.error,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

/**
 * Test a webhook by sending a test message
 */
export const testWebhook = action({
  args: { webhookId: v.id("pumbleWebhooks") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    await ctx.runAction(api.pumble.sendMessage, {
      webhookId: args.webhookId,
      text: "🎉 Nixelo integration is working!",
      title: "Test Message",
      color: RUNTIME_COLORS.INFO,
      fields: [
        {
          title: "Status",
          value: "Connected ✅",
          short: true,
        },
        {
          title: "Time",
          value: new Date().toLocaleString(),
          short: true,
        },
      ],
    });
    return { success: true } as const;
  },
});

/** Sends issue notifications to Pumble webhooks when issue events occur. */
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
    userId: v.optional(v.id("users")), // User who triggered the event
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const issue = await ctx.runQuery(internal.slack.getIssueContext, {
      issueId: args.issueId,
    });
    if (!issue) {
      return { success: true } as const;
    }

    const activeWebhooks = await ctx.runQuery(internal.pumble.listProjectDestinationsForEvent, {
      projectId: issue.projectId,
      event: args.event,
    });

    // Send notification to each webhook
    for (const webhook of activeWebhooks) {
      try {
        const color = getColorForEvent(args.event);
        const title = getTitleForEvent(args.event);

        await ctx.runAction(internal.pumble.deliverMessageInternal, {
          webhookId: webhook._id,
          text: getPlainTextFromDescription(issue.description) || "No description",
          title,
          color,
          fields: [
            {
              title: "Issue",
              value: `${issue.key}: ${issue.title}`,
              short: false,
            },
            {
              title: "Type",
              value: issue.type,
              short: true,
            },
            {
              title: "Priority",
              value: issue.priority,
              short: true,
            },
            {
              title: "Status",
              value: issue.status,
              short: true,
            },
            {
              title: "Assignee",
              value: issue.assigneeName || "Unassigned",
              short: true,
            },
          ],
        });
      } catch (error) {
        // Log the error but don't fail the whole action
        logger.error("Failed to send Pumble notification", {
          webhookId: webhook._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { success: true } as const;
  },
});

/** List deliverable Pumble webhooks owned by project participants for one issue event. */
export const listProjectDestinationsForEvent = internalQuery({
  args: {
    projectId: v.id("projects"),
    event: v.union(
      v.literal("issue.created"),
      v.literal("issue.updated"),
      v.literal("issue.assigned"),
      v.literal("issue.completed"),
      v.literal("issue.deleted"),
      v.literal("comment.created"),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("pumbleWebhooks"),
      webhookUrl: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userIds = await listProjectNotificationUserIds(ctx, args.projectId);
    if (userIds.length === 0) {
      return [];
    }

    const webhookLists = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query("pumbleWebhooks")
          .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
          .take(BOUNDED_LIST_LIMIT),
      ),
    );

    const destinations: Array<{
      _id: Id<"pumbleWebhooks">;
      webhookUrl: string;
      name: string;
    }> = [];

    for (const userWebhooks of webhookLists) {
      for (const webhook of userWebhooks) {
        const matchesProject =
          webhook.projectId === undefined || webhook.projectId === args.projectId;
        if (!matchesProject || !webhook.events.includes(args.event)) {
          continue;
        }

        destinations.push({
          _id: webhook._id,
          webhookUrl: webhook.webhookUrl,
          name: webhook.name,
        });
      }
    }

    return destinations;
  },
});

// Helper functions
/** Choose the accent color for a Pumble issue event notification. */
export function getColorForEvent(event: string): string {
  switch (event) {
    case "issue.created":
      return RUNTIME_COLORS.SUCCESS;
    case "issue.updated":
      return RUNTIME_COLORS.INFO;
    case "issue.assigned":
      return RUNTIME_COLORS.WARNING;
    case "issue.completed":
      return RUNTIME_COLORS.ACCENT;
    case "issue.deleted":
      return RUNTIME_COLORS.DANGER;
    default:
      return RUNTIME_COLORS.FALLBACK_LABEL;
  }
}

/** Choose the title line for a Pumble issue event notification. */
export function getTitleForEvent(event: string): string {
  switch (event) {
    case "issue.created":
      return `🆕 New Issue Created`;
    case "issue.updated":
      return `✏️ Issue Updated`;
    case "issue.assigned":
      return `👤 Issue Assigned`;
    case "issue.completed":
      return `✅ Issue Completed`;
    case "issue.deleted":
      return `🗑️ Issue Deleted`;
    default:
      return `📋 Issue Event`;
  }
}

async function updateStats(
  ctx: {
    runMutation: ActionCtx["runMutation"];
  },
  webhookId: Id<"pumbleWebhooks">,
  success: boolean,
  error?: string,
) {
  try {
    await ctx.runMutation(internal.pumble.updateWebhookStats, {
      webhookId,
      success,
      error,
    });
  } catch (statsError) {
    logger.error(`Failed to update Pumble webhook stats on ${success ? "success" : "failure"}`, {
      webhookId,
      originalError: error,
      statsError: statsError instanceof Error ? statsError.message : String(statsError),
    });
  }
}

/** Build the webhook payload body expected by Pumble incoming webhooks. */
export function buildPumblePayload(
  text: string,
  title?: string,
  color?: string,
  fields?: Array<{ title: string; value: string; short?: boolean }>,
) {
  const payload: {
    text: string;
    attachments?: Array<{
      title?: string;
      text: string;
      color?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
    }>;
  } = {
    text: text,
  };

  if (title || fields || color) {
    payload.attachments = [
      {
        ...(title && { title }),
        text,
        ...(color && { color }),
        ...(fields && { fields }),
      },
    ];
    payload.text = title || `${text.substring(0, 50)}...`;
  }
  return payload;
}

/** Deliver a message to one active Pumble webhook and persist delivery stats. */
export async function deliverPumbleWebhookMessage(
  ctx: {
    runMutation: ActionCtx["runMutation"];
    runQuery: ActionCtx["runQuery"];
  },
  args: {
    webhookId: Id<"pumbleWebhooks">;
    text: string;
    title?: string;
    color?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  },
): Promise<void> {
  const webhook = await ctx.runQuery(internal.pumble.getWebhookForDelivery, {
    webhookId: args.webhookId,
  });
  if (!webhook) {
    return;
  }

  const payload = buildPumblePayload(args.text, args.title, args.color, args.fields);

  try {
    const response = await safeFetch(webhook.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw validation("pumble", `Pumble API error: ${response.status} ${error}`);
    }

    await updateStats(ctx, args.webhookId, true);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateStats(ctx, args.webhookId, false, errorMessage);
    throw error;
  }
}
