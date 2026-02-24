import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { canAccessProject } from "../projectAccess";

/**
 * Notify participants about a new comment on an issue.
 *
 * This function handles:
 * - Mention notifications (in-app and email)
 * - Reporter notifications (if reporter is not the commenter)
 * - Filtering notifications based on project access
 */
export async function notifyCommentParticipants(
  ctx: MutationCtx,
  params: {
    issueId: Id<"issues">;
    projectId: Id<"projects">;
    issueKey: string;
    reporterId: Id<"users">;
    authorId: Id<"users">;
    content: string;
    mentions: Id<"users">[];
  },
) {
  const { issueId, projectId, issueKey, reporterId, authorId, content, mentions } = params;

  const author = await ctx.db.get(authorId);
  const authorName = author?.name || "Someone";

  // Dynamic import to avoid cycles
  const { sendEmailNotification } = await import("../email/helpers");

  // Notify mentioned users in parallel
  const mentionedOthers = mentions.filter((id) => id !== authorId);

  // Filter mentions by project access to prevent leaks
  const validMentions = (
    await Promise.all(
      mentionedOthers.map(async (userId) => {
        const hasAccess = await canAccessProject(ctx, projectId, userId);
        return hasAccess ? userId : null;
      }),
    )
  ).filter((id): id is Id<"users"> => id !== null);

  await Promise.all(
    validMentions.flatMap((mentionedUserId) => [
      ctx.db.insert("notifications", {
        userId: mentionedUserId,
        type: "issue_mentioned",
        title: "You were mentioned",
        message: `${authorName} mentioned you in ${issueKey}`,
        issueId: issueId,
        projectId: projectId,
        isRead: false,
      }),
      sendEmailNotification(ctx, {
        userId: mentionedUserId,
        type: "mention",
        issueId: issueId,
        actorId: authorId,
        commentText: content,
      }),
    ]),
  );

  if (reporterId !== authorId) {
    const reporterHasAccess = await canAccessProject(ctx, projectId, reporterId);

    if (reporterHasAccess) {
      await ctx.db.insert("notifications", {
        userId: reporterId,
        type: "issue_comment",
        title: "New comment",
        message: `${authorName} commented on ${issueKey}`,
        issueId: issueId,
        projectId: projectId,
        isRead: false,
      });

      await sendEmailNotification(ctx, {
        userId: reporterId,
        type: "comment",
        issueId: issueId,
        actorId: authorId,
        commentText: content,
      });
    }
  }
}
