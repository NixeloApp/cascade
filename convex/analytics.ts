/**
 * Analytics queries for project insights
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { projectQuery, sprintQuery } from "./customFunctions";
import { batchFetchIssues, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import {
  MAX_ACTIVITY_FOR_ANALYTICS,
  MAX_SPRINT_ISSUES,
  MAX_VELOCITY_SPRINTS,
} from "./lib/queryLimits";
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
      .withIndex("by_project_deleted", (q) =>
        q.eq("projectId", ctx.projectId).lt("isDeleted", true),
      )
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
      .withIndex("by_sprint", (q) => q.eq("sprintId", ctx.sprint._id).lt("isDeleted", true))
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
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId).lt("isDeleted", true))
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
    // Get recent activity (global, limited)
    const activities = await ctx.db
      .query("issueActivity")
      .order("desc")
      .take(MAX_ACTIVITY_FOR_ANALYTICS);

    // Batch fetch all referenced issues (NOT all project issues!)
    const activityIssueIds = activities.map((a) => a.issueId);
    const issueMap = await batchFetchIssues(ctx, activityIssueIds);

    // Filter to only activities for this project's issues
    const projectActivities = activities
      .filter((a) => {
        const issue = issueMap.get(a.issueId);
        return issue && issue.projectId === ctx.projectId;
      })
      .slice(0, args.limit || 20);

    // Batch fetch users for filtered activities
    const userIds = projectActivities.map((a) => a.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    return projectActivities.map((activity) => {
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
