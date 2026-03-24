/**
 * Sprint Management
 *
 * Agile sprint planning and tracking for project issues.
 * Handles sprint creation, issue assignment, status transitions,
 * and velocity/burndown metrics for sprint retrospectives.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  projectEditorMutation,
  projectQuery,
  sprintMutation,
  sprintQuery,
} from "./customFunctions";
import { MAX_PAGE_SIZE, MAX_SPRINT_ISSUES } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { DAY } from "./lib/timeUtils";

function getNextSprintName(currentName: string): string {
  const match = currentName.match(/(\d+)(?!.*\d)/);
  if (!match) {
    return `${currentName} 2`;
  }
  const currentNumber = Number.parseInt(match[1], 10);
  const nextNumber = Number.isNaN(currentNumber) ? 2 : currentNumber + 1;
  const index = match.index ?? currentName.lastIndexOf(match[1]);
  return `${currentName.slice(0, index)}${nextNumber}${currentName.slice(index + match[1].length)}`.trim();
}

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

    // Fetch issues per sprint to compute counts and story point totals.
    // Loading issues once per sprint is efficient (bounded by MAX_SPRINT_ISSUES)
    // and lets us derive both issue counts and point sums in a single pass.
    const doneStatusSet = new Set(doneStatusIds);
    const sprintIds = sprints.map((s) => s._id);
    const issueStats = await Promise.all(
      sprintIds.map(async (sprintId) => {
        const issues = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .filter(notDeleted)
          .take(MAX_SPRINT_ISSUES);
        return issues.reduce(
          (acc, issue) => {
            const pts = issue.storyPoints ?? 0;
            const done = doneStatusSet.has(issue.status);
            return {
              sprintId,
              count: acc.count + 1,
              completedCount: acc.completedCount + (done ? 1 : 0),
              totalPoints: acc.totalPoints + pts,
              completedPoints: acc.completedPoints + (done ? pts : 0),
            };
          },
          { sprintId, count: 0, completedCount: 0, totalPoints: 0, completedPoints: 0 },
        );
      }),
    );

    // Build stats map from results
    const issueStatsBySprint = new Map(
      issueStats.map((stats) => [stats.sprintId.toString(), stats]),
    );

    const defaultStats = { count: 0, completedCount: 0, totalPoints: 0, completedPoints: 0 };

    return sprints.map((sprint) => {
      const stats = issueStatsBySprint.get(sprint._id.toString()) ?? defaultStats;
      return {
        _id: sprint._id,
        _creationTime: sprint._creationTime,
        name: sprint.name,
        status: sprint.status,
        goal: sprint.goal,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        projectId: sprint.projectId,
        issueCount: stats.count,
        completedCount: stats.completedCount,
        totalPoints: stats.totalPoints,
        completedPoints: stats.completedPoints,
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
  args: {
    autoCreateNext: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.literal(true),
    nextSprintId: v.optional(v.id("sprints")),
  }),
  handler: async (ctx, args) => {
    let nextSprintId: Id<"sprints"> | undefined;
    const now = Date.now();

    await ctx.db.patch(ctx.sprint._id, {
      status: "completed",
      updatedAt: now,
    });

    if (args.autoCreateNext && ctx.sprint.startDate && ctx.sprint.endDate) {
      const sprintDuration = Math.max(ctx.sprint.endDate - ctx.sprint.startDate, DAY);
      const nextStartDate = ctx.sprint.endDate + DAY;
      const nextEndDate = nextStartDate + sprintDuration;
      const createdSprintId = await ctx.db.insert("sprints", {
        projectId: ctx.projectId,
        name: getNextSprintName(ctx.sprint.name),
        goal: undefined,
        startDate: nextStartDate,
        endDate: nextEndDate,
        status: "future",
        createdBy: ctx.userId,
        updatedAt: now,
      });
      nextSprintId = createdSprintId;
    }

    return {
      success: true,
      nextSprintId,
    } as const;
  },
});

/**
 * Get incomplete issue IDs for a sprint
 * Returns issue IDs that are not in "done" category workflow states
 * Requires viewer access to project
 */
export const getIncompleteIssueIds = sprintQuery({
  args: {},
  returns: v.array(v.id("issues")),
  handler: async (ctx) => {
    // Get done status IDs from project workflow
    const doneStatusIds =
      ctx.project.workflowStates.filter((s) => s.category === "done").map((s) => s.id) || [];

    // Fetch all issues in the sprint
    const sprintIssues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", ctx.sprint._id))
      .filter(notDeleted)
      .take(MAX_SPRINT_ISSUES);

    // Return IDs of issues that are not in done states
    return sprintIssues
      .filter((issue) => !doneStatusIds.includes(issue.status))
      .map((issue) => issue._id);
  },
});
