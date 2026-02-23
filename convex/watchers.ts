import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchIssues, batchFetchProjects, batchFetchUsers } from "./lib/batchHelpers";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";

/**
 * Add current user as a watcher to an issue
 */
export const watch = authenticatedMutation({
  args: {
    issueId: v.id("issues"),
  },
  returns: v.object({ watcherId: v.id("issueWatchers") }),
  handler: async (ctx, args) => {
    // Check if already watching
    const existing = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", ctx.userId))
      .first();

    if (existing) {
      return { watcherId: existing._id };
    }

    // Add watcher
    const watcherId = await ctx.db.insert("issueWatchers", {
      issueId: args.issueId,
      userId: ctx.userId,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId: ctx.userId,
      action: "started_watching",
    });

    return { watcherId };
  },
});

/**
 * Remove current user as a watcher from an issue
 */
export const unwatch = authenticatedMutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    // Find watcher record
    const watcher = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", ctx.userId))
      .first();

    if (!watcher) {
      return;
    }

    // Remove watcher
    await ctx.db.delete(watcher._id);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId: ctx.userId,
      action: "stopped_watching",
    });
  },
});

/** Retrieves all watchers for an issue with user details using batch fetching. */
export const getWatchers = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const watchers = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .take(MAX_PAGE_SIZE);

    // Batch fetch all users (avoid N+1)
    const userIds = watchers.map((w) => w.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched user data
    return watchers.map((watcher) => {
      const user = userMap.get(watcher.userId);
      return {
        _id: watcher._id,
        userId: watcher.userId,
        userName: user?.name || "Unknown User",
        userEmail: user?.email,
        createdAt: watcher._creationTime,
      };
    });
  },
});

/**
 * Check if current user is watching an issue
 */
export const isWatching = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const watcher = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", ctx.userId))
      .first();

    return !!watcher;
  },
});

/**
 * Get all issues the current user is watching
 */
export const getWatchedIssues = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const watchers = await ctx.db
      .query("issueWatchers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(MAX_PAGE_SIZE);

    if (watchers.length === 0) return [];

    // Batch fetch all issues (avoid N+1)
    const issueIds = watchers.map((w) => w.issueId);
    const issueMap = await batchFetchIssues(ctx, issueIds);

    // Collect project and assignee IDs for batch fetch
    const projectIds: Id<"projects">[] = [];
    const assigneeIds: Id<"users">[] = [];
    for (const issue of issueMap.values()) {
      if (issue.projectId) projectIds.push(issue.projectId);
      if (issue.assigneeId) assigneeIds.push(issue.assigneeId);
    }

    // Batch fetch projects and assignees
    const [projectMap, assigneeMap] = await Promise.all([
      batchFetchProjects(ctx, projectIds),
      batchFetchUsers(ctx, assigneeIds),
    ]);

    // Build result with pre-fetched data (no N+1)
    const issues = pruneNull(
      watchers.map((watcher) => {
        const issue = issueMap.get(watcher.issueId);
        if (!issue?.projectId) return null;

        const project = projectMap.get(issue.projectId);
        const assignee = issue.assigneeId ? assigneeMap.get(issue.assigneeId) : null;

        return {
          _id: issue._id,
          key: issue.key,
          title: issue.title,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          projectName: project?.name || "Unknown Project",
          assignee: assignee ? { name: assignee.name } : null,
          watchedAt: watcher._creationTime,
        };
      }),
    );

    return issues;
  },
});
