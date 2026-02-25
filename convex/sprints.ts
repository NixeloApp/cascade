import { v } from "convex/values";
import { projectEditorMutation, projectQuery, sprintMutation } from "./customFunctions";
import { efficientCount } from "./lib/boundedQueries";
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
  returns: v.object({ sprintId: v.id("sprints") }),
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

    // Fetch issues per sprint using index (more efficient than loading all issues)
    // OPTIMIZATION: Reduced from N+1 queries per sprint (1 total + N per done status)
    // to just 2 queries per sprint (1 total + 1 completed with filter)
    const sprintIds = sprints.map((s) => s._id);
    const issueStatsPromises = sprintIds.map(async (sprintId) => {
      const totalPromise = efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .filter(notDeleted),
        MAX_SPRINT_ISSUES,
      );

      // Count completed issues using a single query with filter for all done statuses
      // This is more efficient than separate queries per status
      const completedPromise =
        doneStatusIds.length > 0
          ? efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
                .filter((q) =>
                  q.and(
                    notDeleted(q),
                    q.or(...doneStatusIds.map((status) => q.eq(q.field("status"), status))),
                  ),
                ),
              MAX_SPRINT_ISSUES,
            )
          : Promise.resolve(0);

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
  returns: v.object({ success: v.literal(true) }),
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
    return { success: true } as const;
  },
});

/**
 * Complete a sprint
 * Requires editor role on project
 */
export const completeSprint = sprintMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.sprint._id, {
      status: "completed",
      updatedAt: Date.now(),
    });
    return { success: true } as const;
  },
});
