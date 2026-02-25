import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchIssues } from "./lib/batchHelpers";
import { conflict, notFound, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { assertCanEditProject } from "./projectAccess";
import { linkTypes } from "./validators";

/**
 * Create a link between two issues
 * Requires editor role on the source issue's project
 */
export const createIssueLink = authenticatedMutation({
  args: {
    fromIssueId: v.id("issues"),
    toIssueId: v.id("issues"),
    linkType: linkTypes,
  },
  returns: v.object({ linkId: v.id("issueLinks") }),
  handler: async (ctx, args) => {
    const fromIssue = await ctx.db.get(args.fromIssueId);
    if (!fromIssue) {
      throw notFound("issue", args.fromIssueId);
    }

    if (!fromIssue.projectId) {
      throw validation("projectId", "Issue has no project");
    }

    await assertCanEditProject(ctx, fromIssue.projectId, ctx.userId);

    // Check if link already exists
    const existing = await ctx.db
      .query("issueLinks")
      .withIndex("by_from_issue", (q) => q.eq("fromIssueId", args.fromIssueId))
      .filter((q) =>
        q.and(q.eq(q.field("toIssueId"), args.toIssueId), q.eq(q.field("linkType"), args.linkType)),
      )
      .first();

    if (existing) {
      throw conflict("Link already exists");
    }

    const _now = Date.now();
    const linkId = await ctx.db.insert("issueLinks", {
      fromIssueId: args.fromIssueId,
      toIssueId: args.toIssueId,
      linkType: args.linkType,
      createdBy: ctx.userId,
    });

    // Log activity
    const toIssue = await ctx.db.get(args.toIssueId);
    await ctx.db.insert("issueActivity", {
      issueId: args.fromIssueId,
      userId: ctx.userId,
      action: "linked",
      field: args.linkType,
      newValue: toIssue?.key || args.toIssueId,
    });

    return { linkId };
  },
});

/**
 * Remove a link between issues
 * Requires editor role on the source issue's project
 */
export const deleteIssueLink = authenticatedMutation({
  args: {
    linkId: v.id("issueLinks"),
  },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw notFound("issueLink", args.linkId);
    }

    const issue = await ctx.db.get(link.fromIssueId);
    if (!issue) {
      throw notFound("issue", link.fromIssueId);
    }

    if (!issue.projectId) {
      throw validation("projectId", "Issue has no project");
    }

    await assertCanEditProject(ctx, issue.projectId, ctx.userId);

    await ctx.db.delete(args.linkId);

    // Log activity
    const toIssue = await ctx.db.get(link.toIssueId);
    await ctx.db.insert("issueActivity", {
      issueId: link.fromIssueId,
      userId: ctx.userId,
      action: "unlinked",
      field: link.linkType,
      oldValue: toIssue?.key || link.toIssueId,
    });

    return { success: true, deleted: true } as const;
  },
});

/**
 * Get all links for an issue (both outgoing and incoming)
 */
export const getIssueLinks = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    // Get outgoing links (this issue links to others)
    const outgoingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_from_issue", (q) => q.eq("fromIssueId", args.issueId))
      .take(MAX_PAGE_SIZE);

    // Get incoming links (other issues link to this)
    const incomingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_to_issue", (q) => q.eq("toIssueId", args.issueId))
      .take(MAX_PAGE_SIZE);

    // Batch fetch all linked issues to avoid N+1 queries
    const allIssueIds = [
      ...outgoingLinks.map((l) => l.toIssueId),
      ...incomingLinks.map((l) => l.fromIssueId),
    ];
    const issueMap = await batchFetchIssues(ctx, allIssueIds);

    // Helper to format issue
    const formatIssue = (issue: NonNullable<ReturnType<typeof issueMap.get>>) => ({
      _id: issue._id,
      key: issue.key,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
    });

    // Enrich with pre-fetched data (no N+1)
    const outgoing = outgoingLinks.map((link) => {
      const issue = issueMap.get(link.toIssueId);
      return {
        _id: link._id,
        linkType: link.linkType,
        issue: issue ? formatIssue(issue) : null,
      };
    });

    const incoming = incomingLinks.map((link) => {
      const issue = issueMap.get(link.fromIssueId);
      return {
        _id: link._id,
        linkType: link.linkType,
        issue: issue ? formatIssue(issue) : null,
      };
    });

    return { outgoing, incoming };
  },
});
