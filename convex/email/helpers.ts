/**
 * Email Notification Helpers
 *
 * Helper functions to trigger email notifications from mutations
 */

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

// Helper to resolve actor name
async function getActorName(
  ctx: MutationCtx,
  actorId: Id<"users"> | undefined,
  providedName?: string,
) {
  if (providedName) return providedName;
  if (!actorId) return "Someone";
  const actor = await ctx.db.get(actorId);
  if (actor && "name" in actor) {
    return actor.name || "Someone";
  }
  return "Someone";
}

// Helper to resolve issue and project
async function getIssueAndProject(
  ctx: MutationCtx,
  issueId: Id<"issues">,
  providedIssue?: Doc<"issues">,
  providedProject?: Doc<"projects">,
) {
  let issue = providedIssue;
  if (!issue) {
    const fetchedIssue = await ctx.db.get(issueId);
    if (!fetchedIssue) return null;
    issue = fetchedIssue;
  }

  let project = providedProject;
  if (!project) {
    if (!issue.projectId) return null;
    const fetchedProject = await ctx.db.get(issue.projectId);
    if (!fetchedProject) return null;
    project = fetchedProject;
  }

  return { issue, project };
}

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
    // Optimization: Optional pre-fetched data to avoid DB lookups
    issue?: Doc<"issues">;
    project?: Doc<"projects">;
    actorName?: string;
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

  const data = await getIssueAndProject(ctx, issueId, params.issue, params.project);
  if (!data) return;
  const { issue, project } = data;

  const actorName = await getActorName(ctx, actorId, params.actorName);

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
