import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { internalAction, internalQuery } from "../_generated/server";
import { getPlainTextFromDescription } from "../lib/richText";
import { deliverPumbleWebhookMessage, getColorForEvent, getTitleForEvent } from "../pumble";
import { buildIssueNotificationText, deliverSlackConnectionMessage } from "../slack";
import { triggerSingleWebhook } from "../webhooks";

export const issueEventValidator = v.union(
  v.literal("issue.created"),
  v.literal("issue.updated"),
  v.literal("issue.assigned"),
  v.literal("issue.completed"),
  v.literal("issue.deleted"),
  v.literal("comment.created"),
);

function getActorEmail(actor: Doc<"users"> | null): string | null {
  if (!actor || !("email" in actor) || typeof actor.email !== "string") {
    return null;
  }
  return actor.email;
}

export const getIssueEventWebhookPayload = internalQuery({
  args: {
    issueId: v.id("issues"),
    event: issueEventValidator,
    actorId: v.optional(v.id("users")),
    commentText: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      source: v.literal("nixelo"),
      event: issueEventValidator,
      occurredAt: v.number(),
      actor: v.union(
        v.object({
          id: v.id("users"),
          name: v.union(v.string(), v.null()),
          email: v.union(v.string(), v.null()),
        }),
        v.null(),
      ),
      issue: v.object({
        id: v.id("issues"),
        key: v.string(),
        title: v.string(),
        description: v.union(v.string(), v.null()),
        type: v.string(),
        priority: v.string(),
        status: v.string(),
        assigneeId: v.union(v.id("users"), v.null()),
        reporterId: v.union(v.id("users"), v.null()),
        projectId: v.id("projects"),
      }),
      project: v.object({
        id: v.id("projects"),
        name: v.string(),
        key: v.string(),
        organizationId: v.id("organizations"),
        workspaceId: v.union(v.id("workspaces"), v.null()),
        teamId: v.union(v.id("teams"), v.null()),
      }),
      comment: v.union(
        v.object({
          text: v.string(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.isDeleted) {
      return null;
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project || project.isDeleted) {
      return null;
    }

    const actor = args.actorId ? await ctx.db.get(args.actorId) : null;

    return {
      source: "nixelo" as const,
      event: args.event,
      occurredAt: Date.now(),
      actor: actor
        ? {
            id: actor._id,
            name: actor.name ?? null,
            email: getActorEmail(actor),
          }
        : null,
      issue: {
        id: issue._id,
        key: issue.key,
        title: issue.title,
        description: getPlainTextFromDescription(issue.description) || null,
        type: issue.type,
        priority: issue.priority,
        status: issue.status,
        assigneeId: issue.assigneeId ?? null,
        reporterId: issue.reporterId ?? null,
        projectId: issue.projectId,
      },
      project: {
        id: project._id,
        name: project.name,
        key: project.key,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId ?? null,
        teamId: project.teamId ?? null,
      },
      comment: args.commentText
        ? {
            text: args.commentText,
          }
        : null,
    };
  },
});

/** Deliver one issue event across all configured external routing channels. */
export const processIssueEvent = internalAction({
  args: {
    issueId: v.id("issues"),
    event: issueEventValidator,
    actorId: v.optional(v.id("users")),
    commentText: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(
      internal.issues.externalNotifications.getIssueEventWebhookPayload,
      {
        issueId: args.issueId,
        event: args.event,
        actorId: args.actorId,
        commentText: args.commentText,
      },
    );
    if (!payload) {
      return { success: true } as const;
    }

    const slackIssueContext = await ctx.runQuery(internal.slack.getIssueContext, {
      issueId: args.issueId,
    });
    if (slackIssueContext) {
      const slackText = buildIssueNotificationText(args.event, slackIssueContext);
      const slackDestinations = await ctx.runQuery(internal.slack.listProjectDestinations, {
        projectId: payload.project.id,
      });
      for (const destination of slackDestinations) {
        await deliverSlackConnectionMessage(ctx, {
          connectionId: destination.connectionId,
          text: slackText,
        });
      }
    }

    const pumbleDestinations = await ctx.runQuery(internal.pumble.listProjectDestinationsForEvent, {
      projectId: payload.project.id,
      event: args.event,
    });
    const pumbleText = payload.issue.description || "No description";
    const pumbleTitle = getTitleForEvent(args.event);
    const pumbleColor = getColorForEvent(args.event);
    for (const destination of pumbleDestinations) {
      await deliverPumbleWebhookMessage(ctx, {
        webhookId: destination._id,
        text: pumbleText,
        title: pumbleTitle,
        color: pumbleColor,
        fields: [
          {
            title: "Issue",
            value: `${payload.issue.key}: ${payload.issue.title}`,
            short: false,
          },
          {
            title: "Type",
            value: payload.issue.type,
            short: true,
          },
          {
            title: "Priority",
            value: payload.issue.priority,
            short: true,
          },
          {
            title: "Status",
            value: payload.issue.status,
            short: true,
          },
        ],
      });
    }

    const webhookDestinations = await ctx.runQuery(internal.webhooks.getActiveWebhooksForEvent, {
      projectId: payload.project.id,
      event: args.event,
    });
    for (const webhook of webhookDestinations) {
      await triggerSingleWebhook(ctx, webhook, args.event, payload);
    }

    return { success: true } as const;
  },
});
