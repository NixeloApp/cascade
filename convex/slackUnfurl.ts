/**
 * Slack Unfurl Helpers
 *
 * Internal issue-unfurl resolver for Slack link unfurl events.
 */

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { canAccessProject } from "./projectAccess";

export const getIssueUnfurl = internalQuery({
  args: {
    teamId: v.string(),
    callerSlackUserId: v.string(),
    issueKey: v.string(),
    url: v.string(),
  },
  returns: v.union(
    v.object({
      title: v.string(),
      text: v.string(),
      url: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const activeConnection = await ctx.db
      .query("slackConnections")
      .withIndex("by_team_slack_user_active_updated", (q) =>
        q.eq("teamId", args.teamId).eq("slackUserId", args.callerSlackUserId).eq("isActive", true),
      )
      .order("desc")
      .first();
    if (!activeConnection) {
      return null;
    }

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_key", (q) => q.eq("key", args.issueKey))
      .first();
    if (!issue || issue.isDeleted) {
      return null;
    }

    const hasAccess = await canAccessProject(ctx, issue.projectId, activeConnection.userId);
    if (!hasAccess) {
      return null;
    }

    const [assignee, project] = await Promise.all([
      issue.assigneeId ? ctx.db.get(issue.assigneeId) : null,
      ctx.db.get(issue.projectId),
    ]);

    if (!project) {
      return null;
    }

    return {
      title: `${issue.key}: ${issue.title}`,
      text: [
        `Project: ${project.name}`,
        `Status: ${issue.status}`,
        `Priority: ${issue.priority}`,
        `Assignee: ${assignee?.name || "Unassigned"}`,
      ].join("\n"),
      url: args.url,
    };
  },
});
