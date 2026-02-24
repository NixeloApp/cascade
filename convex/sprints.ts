import { v } from "convex/values";
import { projectEditorMutation, projectQuery, sprintMutation } from "./customFunctions";
import { efficientCount, safeCollect } from "./lib/boundedQueries";
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
    const sprintId = await ctx.db.insert("sprints", {
      projectId: ctx.projectId,
      name: args.name,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "future",
      createdBy: ctx.userId,
      updatedAt: now,
    });
    return { sprintId };
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
    // OPTIMIZATION: Reduced from 100 to 50 to improve performance and reduce DB load
    const MAX_SPRINTS = 50;
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

    // Get project workflow states to correctly identify "done" statuses
    // This fixes a bug where only issues with status ID "done" were counted as completed
    // and optimizes by fetching project once
    const project = await ctx.db.get(ctx.projectId);
    const doneStatusIds =
      project?.workflowStates.filter((s) => s.category === "done").map((s) => s.id) || [];

    // OPTIMIZATION: Fetch all issues for the project if the count is manageable.
    // This avoids N+1 queries (one per sprint, plus one per status per sprint).
    const BATCH_ISSUE_FETCH_LIMIT = 2000;
    const totalIssues = await efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_project_deleted", (q) =>
          q.eq("projectId", ctx.projectId).lt("isDeleted", true),
        ),
      BATCH_ISSUE_FETCH_LIMIT,
    );

    if (totalIssues <= BATCH_ISSUE_FETCH_LIMIT) {
      // Small/medium project: fetch all active issues and aggregate in memory
      const issues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_project_deleted", (q) =>
            q.eq("projectId", ctx.projectId).lt("isDeleted", true),
          ),
        BATCH_ISSUE_FETCH_LIMIT,
        "listByProject batch issues",
      );

      const issueStatsBySprint = new Map<string, { count: number; completedCount: number }>();

      const doneStatusSet = new Set(doneStatusIds);

      for (const issue of issues) {
        if (!issue.sprintId) continue;
        const sprintId = issue.sprintId;
        const stats = issueStatsBySprint.get(sprintId) ?? {
          count: 0,
          completedCount: 0,
        };

        stats.count++;
        if (doneStatusSet.has(issue.status)) {
          stats.completedCount++;
        }
        issueStatsBySprint.set(sprintId, stats);
      }

      return sprints.map((sprint) => {
        const stats = issueStatsBySprint.get(sprint._id) ?? {
          count: 0,
          completedCount: 0,
        };
        return {
          ...sprint,
          // Cap at MAX_SPRINT_ISSUES for consistency with fallback path (though exact is better)
          issueCount: Math.min(stats.count, MAX_SPRINT_ISSUES),
          completedCount: Math.min(stats.completedCount, MAX_SPRINT_ISSUES),
        };
      });
    }

    // Fallback for large projects: existing N+1 strategy (but uses efficientCount which is fast)
    // Fetch issues per sprint using index (more efficient than loading all issues)
    const sprintIds = sprints.map((s) => s._id);
    const issueStatsPromises = sprintIds.map(async (sprintId) => {
      const totalPromise = efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId).lt("isDeleted", true)),
        MAX_SPRINT_ISSUES,
      );

      // Count completed issues by summing counts for all "done" category statuses
      // We use Promise.all to query counts in parallel for each status
      const completedPromise = Promise.all(
        doneStatusIds.map((status) =>
          efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_project_sprint_status", (q) =>
                q
                  .eq("projectId", ctx.projectId)
                  .eq("sprintId", sprintId)
                  .eq("status", status)
                  .lt("isDeleted", true),
              ),
            MAX_SPRINT_ISSUES,
          ),
        ),
      ).then((counts) => counts.reduce((a, b) => a + b, 0));

      const [count, completedCount] = await Promise.all([totalPromise, completedPromise]);
      return { sprintId, count, completedCount };
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
    return { success: true };
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
    return { success: true };
  },
});
