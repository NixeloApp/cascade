import { v } from "convex/values";
import { authenticatedMutation } from "./customFunctions";
import { forbidden, notFound } from "./lib/errors";
import { canAccessProject } from "./projectAccess";

export const toggleReaction = authenticatedMutation({
  args: {
    commentId: v.id("issueComments"),
    emoji: v.string(),
  },
  returns: v.object({
    action: v.union(v.literal("added"), v.literal("removed")),
  }),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw notFound("comment");

    const issue = await ctx.db.get(comment.issueId);
    if (!issue) throw notFound("issue");

    // Check project access
    const hasAccess = await canAccessProject(ctx, issue.projectId, ctx.userId);
    if (!hasAccess) throw forbidden();

    // Check if reaction already exists
    const existing = await ctx.db
      .query("issueCommentReactions")
      .withIndex("by_comment_user_emoji", (q) =>
        q.eq("commentId", args.commentId).eq("userId", ctx.userId).eq("emoji", args.emoji),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: "removed" } as const;
    } else {
      await ctx.db.insert("issueCommentReactions", {
        commentId: args.commentId,
        userId: ctx.userId,
        emoji: args.emoji,
        createdAt: Date.now(),
      });
      return { action: "added" } as const;
    }
  },
});
