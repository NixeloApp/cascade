/**
 * Email Notification Helpers
 *
 * Helper functions to trigger email notifications from mutations
 */

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { canAccessProject } from "../projectAccess";

/**
 * Send email notification after creating in-app notification
 *
 * This checks user preferences and sends email if enabled.
 * Call this after creating an in-app notification.
 *
 * Note: Skipped in test environment to avoid convex-test scheduler issues.
 */
export async function sendEmailNotification(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    type: "mention" | "assigned" | "comment" | "status_change";
    issueId: Id<"issues">;
    actorId?: Id<"users">;
    commentText?: string;
  },
) {
  // Skip in test environment to avoid convex-test scheduler race conditions
  if (process.env.IS_TEST_ENV) {
    return;
  }

  const { userId, type, issueId, actorId, commentText } = params;

  // Check if user wants email for this notification type
  const shouldSend = await ctx.runQuery(internal.notificationPreferences.shouldSendEmail, {
    userId,
    type,
  });

  if (!shouldSend) {
    return; // User has disabled this notification type
  }

  // Get user email
  const user = await ctx.db.get(userId);
  if (!(user && "email" in user && user.email)) {
    return; // User has no email address
  }

  // Get actor name
  let actorName = "Someone";
  if (actorId) {
    const actor = await ctx.db.get(actorId);
    if (actor && "name" in actor) {
      actorName = actor.name || actorName;
    }
  }

  // Get issue details
  const issue = await ctx.db.get(issueId);
  if (!issue) {
    return; // Issue not found
  }

  // Get project details
  if (!issue.projectId) {
    return; // Issue not found in a project
  }

  // Check if user has access to the project
  const hasAccess = await canAccessProject(ctx, issue.projectId, userId);
  if (!hasAccess) {
    return;
  }

  const project = await ctx.db.get(issue.projectId);
  if (!project) {
    return; // Project not found
  }

  // Schedule email to be sent (using action)
  if (type === "mention" || type === "assigned" || type === "comment") {
    await ctx.scheduler.runAfter(0, internal.email.notifications.sendNotificationEmail, {
      to: user.email as string,
      userId: user._id,
      type,
      actorName,
      issueId: issue._id,
      issueKey: issue.key,
      issueTitle: issue.title,
      issueType: issue.type,
      issuePriority: issue.priority,
      projectName: project.name,
      dueDate: issue.dueDate,
      commentText,
    });
  }
}
