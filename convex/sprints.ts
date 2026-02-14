import { v } from "convex/values";
import { projectEditorMutation, projectQuery, sprintMutation } from "./customFunctions";
import { MAX_PAGE_SIZE, MAX_SPRINT_ISSUES } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";

/**
 * Create a new sprint
 * Requires editor role on project
 */
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sprints", {
      projectId: ctx.projectId,
      name: args.name,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "future",
      createdBy: ctx.userId,
      updatedAt: now,
    });
  },
});

/**
 * List sprints for a project with issue counts
 * Requires viewer access to project
 */
export const listByProject = projectQuery({
  args: {
    // Optional filter: only return sprints with both start and end dates
    hasDates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Sprints per project are typically few (10-50), add reasonable limit
    const MAX_SPRINTS = 100;
    let sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .order("desc")
      .filter(notDeleted)
      .take(MAX_SPRINTS);

    // Filter to sprints with dates if requested
    if (args.hasDates) {
      sprints = sprints.filter((s) => s.startDate !== undefined && s.endDate !== undefined);
    }

    if (sprints.length === 0) {
      return [];
    }

    // Fetch issues per sprint using index (more efficient than loading all issues)
    const sprintIds = sprints.map((s) => s._id);
    const issueStatsPromises = sprintIds.map(async (sprintId) => {
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
        .filter(notDeleted)
        .take(MAX_SPRINT_ISSUES);
      const completedCount = issues.filter((i) => i.status === "done").length;
      return { sprintId, count: issues.length, completedCount };
    });
    const issueStats = await Promise.all(issueStatsPromises);

    // Build stats map from results
    const issueStatsBySprint = new Map(
      issueStats.map(({ sprintId, count, completedCount }) => [
        sprintId.toString(),
        { count, completedCount },
      ]),
    );

    return sprints.map((sprint) => {
      const stats = issueStatsBySprint.get(sprint._id.toString()) ?? {
        count: 0,
        completedCount: 0,
      };
      return {
        ...sprint,
        issueCount: stats.count,
        completedCount: stats.completedCount,
      };
    });
  },
});

/**
 * Start a sprint
 * Requires editor role on project
 */
export const startSprint = sprintMutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // End any currently active sprint (normally only 1, but limit for safety)
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    const now = Date.now();
    await Promise.all(
      activeSprints.map((activeSprint) =>
        ctx.db.patch(activeSprint._id, {
          status: "completed",
          updatedAt: now,
        }),
      ),
    );

    await ctx.db.patch(ctx.sprint._id, {
      status: "active",
      startDate: args.startDate,
      endDate: args.endDate,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Complete a sprint
 * Requires editor role on project
 */
export const completeSprint = sprintMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.db.patch(ctx.sprint._id, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});
