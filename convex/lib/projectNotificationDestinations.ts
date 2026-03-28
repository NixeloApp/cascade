import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internalQuery } from "../_generated/server";
import { BOUNDED_LIST_LIMIT, safeCollect } from "./boundedQueries";
import { notDeleted } from "./softDeleteHelpers";

type ProjectNotificationEvent =
  | "issue.created"
  | "issue.updated"
  | "issue.assigned"
  | "issue.completed"
  | "issue.deleted"
  | "comment.created";

/**
 * Resolve the user IDs that should be considered for project-scoped external routing.
 *
 * This includes the project creator plus any explicit project members that have not been deleted.
 * Consumers can then resolve channel-specific destinations (Slack connections, Pumble webhooks, etc.)
 * without reimplementing project membership traversal.
 */
export async function listProjectNotificationUserIds(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
): Promise<Id<"users">[]> {
  const project = await ctx.db.get(projectId);
  if (!project || project.isDeleted) {
    return [];
  }

  const members = await safeCollect(
    ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter(notDeleted),
    BOUNDED_LIST_LIMIT,
    "listProjectNotificationUserIds",
  );

  const userIds = new Set<Id<"users">>([project.createdBy]);
  for (const member of members) {
    userIds.add(member.userId);
  }

  return [...userIds];
}

async function hasSlackDestination(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<boolean> {
  const connection = await ctx.db
    .query("slackConnections")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return Boolean(connection?.isActive && connection.incomingWebhookUrl);
}

async function hasPumbleDestinationForEvent(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  projectId: Id<"projects">,
  event: ProjectNotificationEvent,
): Promise<boolean> {
  const webhooks = await ctx.db
    .query("pumbleWebhooks")
    .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
    .take(BOUNDED_LIST_LIMIT);

  return webhooks.some(
    (webhook) =>
      (webhook.projectId === undefined || webhook.projectId === projectId) &&
      webhook.events.includes(event),
  );
}

async function hasGenericWebhookForEvent(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  event: ProjectNotificationEvent,
): Promise<boolean> {
  const webhooks = await ctx.db
    .query("webhooks")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .filter(notDeleted)
    .filter((q) => q.eq(q.field("isActive"), true))
    .take(BOUNDED_LIST_LIMIT);

  return webhooks.some((webhook) => webhook.events.includes(event));
}

/**
 * Check whether any external delivery channel is configured for one project event.
 *
 * This lets mutations avoid scheduling background delivery work when no destination can possibly
 * receive it, which keeps both production traffic and Convex test execution clean.
 */
export async function hasProjectExternalNotificationDestinations(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  event: ProjectNotificationEvent,
): Promise<boolean> {
  if (await hasGenericWebhookForEvent(ctx, projectId, event)) {
    return true;
  }

  const userIds = await listProjectNotificationUserIds(ctx, projectId);
  for (const userId of userIds) {
    if (await hasSlackDestination(ctx, userId)) {
      return true;
    }
    if (await hasPumbleDestinationForEvent(ctx, userId, projectId, event)) {
      return true;
    }
  }

  return false;
}

export const hasProjectExternalDestinationsForEvent = internalQuery({
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await hasProjectExternalNotificationDestinations(ctx, args.projectId, args.event);
  },
});
