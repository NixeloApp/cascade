/**
 * Slack Unfurl Helpers
 *
 * Internal issue-unfurl resolver for Slack link unfurl events.
 */

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";
import { canAccessProject } from "./projectAccess";

function extractIssueKeyFromUrl(url: string): string | null {
  const match = url.match(/([A-Z][A-Z0-9]+-\d+)/);
  return match ? match[1] : null;
}

export const getIssueUnfurl = internalQuery({
  args: {
    teamId: v.string(),
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
    const connections = await ctx.db
      .query("slackConnections")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .take(20);

    const activeConnection = connections
      .filter((connection) => connection.isActive)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!activeConnection) {
      return null;
    }

    const issueKey = extractIssueKeyFromUrl(args.url);
    if (!issueKey) {
      return null;
    }

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_key", (q) => q.eq("key", issueKey))
      .filter(notDeleted)
      .first();
    if (!issue) {
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
