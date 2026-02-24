/**
 * Analytics queries for project insights
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { projectQuery, sprintQuery } from "./customFunctions";
import { batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { MAX_SPRINT_ISSUES, MAX_VELOCITY_SPRINTS } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { DAY } from "./lib/timeUtils";

// Helper: Build issues by status from workflow states and counts
function buildIssuesByStatus(
  workflowStates: { id: string }[],
  statusCounts: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const state of workflowStates) {
    result[state.id] = statusCounts[state.id] || 0;
  }
  return result;
}

// Helper: Build issues by type with defaults
function buildIssuesByType(typeCounts: Record<string, number>) {
  return {
    task: typeCounts.task || 0,
    bug: typeCounts.bug || 0,
    story: typeCounts.story || 0,
    epic: typeCounts.epic || 0,
    subtask: typeCounts.subtask || 0,
  };
}

// Helper: Build issues by priority with defaults
function buildIssuesByPriority(priorityCounts: Record<string, number>) {
  return {
    lowest: priorityCounts.lowest || 0,
    low: priorityCounts.low || 0,
    medium: priorityCounts.medium || 0,
    high: priorityCounts.high || 0,
    highest: priorityCounts.highest || 0,
  };
}

/**
 * Get project analytics overview
 * Requires viewer access to project
 */
export const getProjectAnalytics = projectQuery({
  args: {},
  handler: async (ctx) => {
    // Fetch all project issues (bounded query)
    // Optimization: Use by_project_deleted to skip deleted issues efficiently in the index scan
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter(notDeleted)
      .take(MAX_SPRINT_ISSUES);

    // Count by status
    const statusCounts: Record<string, number> = {};
    for (const issue of issues) {
      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
    }

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const issue of issues) {
      typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
    }

    // Count by priority
    const priorityCounts: Record<string, number> = {};
    for (const issue of issues) {
      if (issue.priority) {
        priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;
      }
    }

    // Count by assignee
    const assigneeCounts: Record<string, number> = {};
    let unassignedCount = 0;
    for (const issue of issues) {
      if (issue.assigneeId) {
        assigneeCounts[issue.assigneeId] = (assigneeCounts[issue.assigneeId] || 0) + 1;
      } else {
        unassignedCount++;
      }
    }

    // Build structured data using helpers
    const issuesByStatus = buildIssuesByStatus(ctx.project.workflowStates, statusCounts);
    const issuesByType = buildIssuesByType(typeCounts);
    const issuesByPriority = buildIssuesByPriority(priorityCounts);

    // Batch fetch assignee users and build assignee map
    const assigneeIds = Object.keys(assigneeCounts).map((id) => id as Id<"users">);
    const userMap = await batchFetchUsers(ctx, assigneeIds);

    const issuesByAssignee: Record<string, { count: number; name: string }> = {};
    for (const [assigneeId, count] of Object.entries(assigneeCounts)) {
      issuesByAssignee[assigneeId] = {
        count,
        name: getUserName(userMap.get(assigneeId as Id<"users">)),
      };
    }

    return {
      totalIssues: issues.length,
      issuesByStatus,
      issuesByType,
      issuesByPriority,
      issuesByAssignee,
      unassignedCount,
    };
  },
});

/**
 * Get sprint burndown data
 * Requires viewer access to project
 */
export const getSprintBurndown = sprintQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Get all issues in the sprint
    // Optimization: Use index range to skip deleted issues
    const sprintIssues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", ctx.sprint._id))
      .filter(notDeleted)
      .take(MAX_SPRINT_ISSUES);

    // Calculate total points (using storyPoints, fallback to estimatedHours)
    const totalPoints = sprintIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0),
      0,
    );

    // Get done states
    const doneStates = ctx.project.workflowStates
      .filter((s) => s.category === "done")
      .map((s) => s.id);

    const completedPoints = sprintIssues
      .filter((issue) => doneStates.includes(issue.status))
      .reduce((sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0), 0);

    const remainingPoints = totalPoints - completedPoints;

    // Calculate progress percentage
    const progressPercentage =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Calculate ideal burndown if sprint has dates
    const idealBurndown: Array<{ day: number; points: number }> = [];
    if (ctx.sprint.startDate && ctx.sprint.endDate) {
      const totalDays = Math.ceil((ctx.sprint.endDate - ctx.sprint.startDate) / DAY);
      const daysElapsed = Math.ceil((now - ctx.sprint.startDate) / DAY);

      for (let day = 0; day <= totalDays; day++) {
        const remainingIdeal = totalPoints * (1 - day / totalDays);
        idealBurndown.push({ day, points: Math.max(0, remainingIdeal) });
      }

      return {
        totalPoints,
        completedPoints,
        remainingPoints,
        progressPercentage,
        totalIssues: sprintIssues.length,
        completedIssues: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
        idealBurndown,
        daysElapsed,
        totalDays,
      };
    }

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      progressPercentage,
      totalIssues: sprintIssues.length,
      completedIssues: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
      idealBurndown: [],
      daysElapsed: 0,
      totalDays: 0,
    };
  },
});

/**
 * Get team velocity (completed points per sprint)
 * Requires viewer access to project
 */
export const getTeamVelocity = projectQuery({
  args: {},
  handler: async (ctx) => {
    // Get completed sprints
    const completedSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(MAX_VELOCITY_SPRINTS);

    // Get done states
    const doneStates = ctx.project.workflowStates
      .filter((s) => s.category === "done")
      .map((s) => s.id);

    // Batch fetch issues for all sprints in parallel (not sequential)
    const sprintIds = completedSprints.map((s) => s._id);
    const sprintIssuesArrays = await Promise.all(
      sprintIds.map((sprintId) =>
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .filter(notDeleted)
          .take(MAX_SPRINT_ISSUES),
      ),
    );

    // Build sprint issues map
    const sprintIssuesMap = new Map(
      sprintIds.map((id, i) => [id.toString(), sprintIssuesArrays[i]]),
    );

    // Calculate velocity data using pre-fetched issues (no N+1)
    const velocityData = completedSprints.map((sprint) => {
      const sprintIssues = sprintIssuesMap.get(sprint._id.toString()) || [];

      const completedPoints = sprintIssues
        .filter((issue) => doneStates.includes(issue.status))
        .reduce((sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0), 0);

      return {
        sprintName: sprint.name,
        sprintId: sprint._id,
        points: completedPoints,
        issuesCompleted: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
      };
    });

    // Calculate average velocity
    const avgVelocity =
      velocityData.length > 0
        ? Math.round(velocityData.reduce((sum, v) => sum + v.points, 0) / velocityData.length)
        : 0;

    return {
      velocityData: velocityData.reverse(), // Oldest first for chart
      averageVelocity: avgVelocity,
    };
  },
});

/**
 * Get recent activity for project
 * Requires viewer access to project
 */
export const getRecentActivity = projectQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Optimization: Fetch top recently updated issues for the project
    // This avoids scanning the global issueActivity table and filtering in memory
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project_updated", (q) => q.eq("projectId", ctx.projectId))
      .order("desc")
      .take(limit + 5); // Fetch a few more to be safe

    // Fetch activities for these issues in parallel
    const activitiesArrays = await Promise.all(
      issues.map((issue) =>
        ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
          .order("desc")
          .take(limit),
      ),
    );

    // Flatten, sort by creation time, and take top limit
    const allActivities = activitiesArrays
      .flat()
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);

    // Create issue map from fetched issues
    const issueMap = new Map(issues.map((i) => [i._id, i]));

    // Batch fetch users
    const userIds = allActivities.map((a) => a.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich
    return allActivities.map((activity) => {
      const user = userMap.get(activity.userId);
      const issue = issueMap.get(activity.issueId);

      return {
        ...activity,
        userName: getUserName(user),
        userImage: user?.image,
        issueKey: issue?.key || "Unknown",
        issueTitle: issue?.title || "Unknown",
      };
    });
  },
});
