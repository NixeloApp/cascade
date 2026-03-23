/**
 * Analytics queries for project insights
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { authenticatedQuery, projectQuery, sprintQuery } from "./customFunctions";
import { batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { efficientCount } from "./lib/boundedQueries";
import { isOrganizationAdmin, isOrganizationMember } from "./lib/organizationAccess";
import { logQueryPayloadTelemetry } from "./lib/payloadTelemetry";
import {
  clampLimit,
  MAX_PAGE_SIZE,
  MAX_SPRINT_ISSUES,
  MAX_VELOCITY_SPRINTS,
} from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { DAY } from "./lib/timeUtils";

// Helper: Build Set of done-state IDs from workflow states
function getDoneStates(workflowStates: Array<{ id: string; category: string }>): Set<string> {
  return new Set(
    workflowStates.filter((state) => state.category === "done").map((state) => state.id),
  );
}

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
    const issueTypes = ["task", "bug", "story", "epic", "subtask"] as const;
    const priorities = ["lowest", "low", "medium", "high", "highest"] as const;

    const [totalIssues, statusEntries, typeEntries, priorityEntries, unassignedCount, members] =
      await Promise.all([
        efficientCount(
          ctx.db
            .query("issues")
            .withIndex("by_project_deleted", (q) =>
              q.eq("projectId", ctx.projectId).lt("isDeleted", true),
            ),
          MAX_SPRINT_ISSUES,
        ),
        Promise.all(
          ctx.project.workflowStates.map(async (state) => [
            state.id,
            await efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_project_status_deleted", (q) =>
                  q.eq("projectId", ctx.projectId).eq("status", state.id).lt("isDeleted", true),
                ),
              MAX_SPRINT_ISSUES,
            ),
          ]),
        ),
        Promise.all(
          issueTypes.map(async (type) => [
            type,
            await efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_project_type_deleted", (q) =>
                  q.eq("projectId", ctx.projectId).eq("type", type).lt("isDeleted", true),
                ),
              MAX_SPRINT_ISSUES,
            ),
          ]),
        ),
        Promise.all(
          priorities.map(async (priority) => [
            priority,
            await efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_project_priority_deleted", (q) =>
                  q.eq("projectId", ctx.projectId).eq("priority", priority).lt("isDeleted", true),
                ),
              MAX_SPRINT_ISSUES,
            ),
          ]),
        ),
        efficientCount(
          ctx.db
            .query("issues")
            .withIndex("by_project_assignee", (q) =>
              q.eq("projectId", ctx.projectId).eq("assigneeId", undefined).lt("isDeleted", true),
            ),
          MAX_SPRINT_ISSUES,
        ),
        ctx.db
          .query("projectMembers")
          .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
          .filter(notDeleted)
          .take(MAX_PAGE_SIZE),
      ]);

    const statusCounts = Object.fromEntries(statusEntries);
    const typeCounts = Object.fromEntries(typeEntries);
    const priorityCounts = Object.fromEntries(priorityEntries);

    const assigneeIds = [...new Set(members.map((member) => member.userId))];
    const assigneeCountEntries: Array<[Id<"users">, number]> = await Promise.all(
      assigneeIds.map(async (assigneeId) => [
        assigneeId,
        await efficientCount(
          ctx.db
            .query("issues")
            .withIndex("by_project_assignee", (q) =>
              q.eq("projectId", ctx.projectId).eq("assigneeId", assigneeId).lt("isDeleted", true),
            ),
          MAX_SPRINT_ISSUES,
        ),
      ]),
    );
    const assigneeCounts = Object.fromEntries(
      assigneeCountEntries.filter(([, count]) => count > 0),
    ) as Record<string, number>;

    // Build structured data using helpers
    const issuesByStatus = buildIssuesByStatus(ctx.project.workflowStates, statusCounts);
    const issuesByType = buildIssuesByType(typeCounts);
    const issuesByPriority = buildIssuesByPriority(priorityCounts);

    // Batch fetch assignee users and build assignee map
    const countedAssigneeIds = Object.keys(assigneeCounts).map((id) => id as Id<"users">);
    const userMap = await batchFetchUsers(ctx, countedAssigneeIds);

    const issuesByAssignee: Record<string, { count: number; name: string }> = {};
    let assignedKnownCount = 0;
    for (const [assigneeId, count] of Object.entries(assigneeCounts)) {
      assignedKnownCount += count;
      issuesByAssignee[assigneeId] = {
        count,
        name: getUserName(userMap.get(assigneeId as Id<"users">)),
      };
    }

    const totalAssignedCount = Math.max(0, totalIssues - unassignedCount);
    const unknownAssignedCount = Math.max(0, totalAssignedCount - assignedKnownCount);
    if (unknownAssignedCount > 0) {
      issuesByAssignee.unknown = {
        count: unknownAssignedCount,
        name: "Unknown",
      };
    }

    const response = {
      totalIssues,
      issuesByStatus,
      issuesByType,
      issuesByPriority,
      issuesByAssignee,
      unassignedCount,
    };

    logQueryPayloadTelemetry("analytics.getProjectAnalytics", response, {
      workflowStates: ctx.project.workflowStates.length,
      assignees: Object.keys(issuesByAssignee).length,
    });

    return response;
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

    // Get done states
    const doneStates = getDoneStates(ctx.project.workflowStates);

    // Single pass over sprint issues for totals/completion counts.
    let totalPoints = 0;
    let completedPoints = 0;
    let completedIssues = 0;
    for (const issue of sprintIssues) {
      const points = issue.storyPoints || issue.estimatedHours || 0;
      totalPoints += points;
      if (doneStates.has(issue.status)) {
        completedPoints += points;
        completedIssues += 1;
      }
    }

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
        completedIssues,
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
      completedIssues,
      idealBurndown: [],
      daysElapsed: 0,
      totalDays: 0,
    };
  },
});

/**
 * Compare burndown curves across the last N completed sprints.
 * Each sprint's progress is normalized to 0-100% of total days so
 * sprints of different lengths can be overlaid on the same chart.
 * Includes per-sprint velocity (completed points) for trend analysis.
 */
export const getSprintBurndownComparison = projectQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sprints: v.array(
      v.object({
        sprintId: v.id("sprints"),
        name: v.string(),
        totalPoints: v.number(),
        completedPoints: v.number(),
        totalDays: v.number(),
        /** Normalized burndown: progress at each 10% interval (0%, 10%, ... 100%) */
        normalizedBurndown: v.array(
          v.object({
            percent: v.number(),
            remainingRatio: v.number(),
          }),
        ),
      }),
    ),
    averageCompletionRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const sprintLimit = clampLimit(args.limit, MAX_VELOCITY_SPRINTS);
    const project = ctx.project;
    if (!project) return { sprints: [], averageCompletionRate: 0 };

    const doneStates = getDoneStates(project.workflowStates);

    // Fetch completed sprints with dates
    const completedSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.neq(q.field("startDate"), undefined),
          q.neq(q.field("endDate"), undefined),
        ),
      )
      .order("desc")
      .take(sprintLimit);

    if (completedSprints.length === 0) {
      return { sprints: [], averageCompletionRate: 0 };
    }

    // Batch fetch issues and activity for all sprints
    const sprintData = await Promise.all(
      completedSprints.map(async (sprint) => {
        const issues = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .filter(notDeleted)
          .take(MAX_SPRINT_ISSUES);

        // Get status change activities for done transitions
        const doneTransitions = await Promise.all(
          issues.map(async (issue) => {
            if (!doneStates.has(issue.status)) return null;
            const activities = await ctx.db
              .query("issueActivity")
              .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
              .filter((q) =>
                q.and(q.eq(q.field("action"), "updated"), q.eq(q.field("field"), "status")),
              )
              .take(50);
            // Find when it entered done
            const doneActivity = [...activities]
              .reverse()
              .find((a) => a.newValue && doneStates.has(a.newValue));
            return {
              points: issue.storyPoints || issue.estimatedHours || 0,
              doneAt: doneActivity?._creationTime ?? issue.updatedAt,
            };
          }),
        );

        let totalPoints = 0;
        let completedPoints = 0;
        for (const issue of issues) {
          const pts = issue.storyPoints || issue.estimatedHours || 0;
          totalPoints += pts;
          if (doneStates.has(issue.status)) completedPoints += pts;
        }

        const startDate = sprint.startDate!;
        const endDate = sprint.endDate!;
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / DAY));

        // Build normalized burndown: what % of points remained at each 10% time interval
        const intervals = 11; // 0%, 10%, 20%, ... 100%
        const normalizedBurndown: Array<{ percent: number; remainingRatio: number }> = [];

        for (let i = 0; i < intervals; i++) {
          const pct = i * 10;
          const cutoffTime = startDate + (totalDays * DAY * pct) / 100;
          // Count points completed by this time
          let completedByTime = 0;
          for (const t of doneTransitions) {
            if (t && t.doneAt <= cutoffTime) completedByTime += t.points;
          }
          const remainingRatio =
            totalPoints > 0 ? (totalPoints - completedByTime) / totalPoints : 1;
          normalizedBurndown.push({ percent: pct, remainingRatio: Math.max(0, remainingRatio) });
        }

        return {
          sprintId: sprint._id,
          name: sprint.name,
          totalPoints,
          completedPoints,
          totalDays,
          normalizedBurndown,
        };
      }),
    );

    const totalCompletion = sprintData.reduce((sum, s) => {
      return sum + (s.totalPoints > 0 ? s.completedPoints / s.totalPoints : 0);
    }, 0);
    const averageCompletionRate =
      sprintData.length > 0 ? Math.round((totalCompletion / sprintData.length) * 100) : 0;

    return {
      sprints: sprintData.reverse(), // oldest first for chart
      averageCompletionRate,
    };
  },
});

/**
 * Get sprint assignee breakdown
 * Shows workload distribution by assignee for a sprint
 */
export const getSprintAssigneeBreakdown = sprintQuery({
  args: {},
  handler: async (ctx) => {
    // Get all issues in the sprint
    const sprintIssues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", ctx.sprint._id))
      .filter(notDeleted)
      .take(MAX_SPRINT_ISSUES);

    // Get done states
    const doneStates = getDoneStates(ctx.project.workflowStates);

    // Count issues by assignee
    const assigneeCounts: Record<string, { total: number; done: number }> = {};
    const unassigned = { total: 0, done: 0 };

    for (const issue of sprintIssues) {
      const isDone = doneStates.has(issue.status);
      if (issue.assigneeId) {
        if (!assigneeCounts[issue.assigneeId]) {
          assigneeCounts[issue.assigneeId] = { total: 0, done: 0 };
        }
        assigneeCounts[issue.assigneeId].total += 1;
        if (isDone) {
          assigneeCounts[issue.assigneeId].done += 1;
        }
      } else {
        unassigned.total += 1;
        if (isDone) {
          unassigned.done += 1;
        }
      }
    }

    // Batch fetch assignee users
    const assigneeIds = Object.keys(assigneeCounts).map((id) => id as Id<"users">);
    const userMap = await batchFetchUsers(ctx, assigneeIds);

    // Build result with user names
    const assignees = Object.entries(assigneeCounts).map(([id, counts]) => ({
      id: id as Id<"users">,
      name: getUserName(userMap.get(id as Id<"users">)),
      total: counts.total,
      done: counts.done,
      percent: Math.round((counts.done / counts.total) * 100),
    }));

    // Sort by total issues (most to least)
    assignees.sort((a, b) => b.total - a.total);

    return {
      assignees,
      unassigned: unassigned.total > 0 ? unassigned : null,
      totalIssues: sprintIssues.length,
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
    const doneStates = getDoneStates(ctx.project.workflowStates);

    // Batch fetch issues for all sprints in parallel (not sequential)
    const sprintIssuesArrays = await Promise.all(
      completedSprints.map((sprint) =>
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .filter(notDeleted)
          .take(MAX_SPRINT_ISSUES),
      ),
    );

    // Calculate velocity data using pre-fetched issues (no N+1)
    let totalCompletedPoints = 0;
    const velocityData = completedSprints.map((sprint, index) => {
      const sprintIssues = sprintIssuesArrays[index] || [];

      let completedPoints = 0;
      let issuesCompleted = 0;
      for (const issue of sprintIssues) {
        if (doneStates.has(issue.status)) {
          completedPoints += issue.storyPoints || issue.estimatedHours || 0;
          issuesCompleted += 1;
        }
      }
      totalCompletedPoints += completedPoints;

      return {
        sprintName: sprint.name,
        sprintId: sprint._id,
        points: completedPoints,
        issuesCompleted,
      };
    });

    // Calculate average velocity
    const avgVelocity =
      velocityData.length > 0 ? Math.round(totalCompletedPoints / velocityData.length) : 0;

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
    const limit = clampLimit(args.limit, 20);

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

    // Keep only the top `limit` newest activities to avoid sorting large flattened arrays.
    const allActivities: Doc<"issueActivity">[] = [];
    for (const activities of activitiesArrays) {
      for (const activity of activities) {
        let insertIndex = 0;
        while (
          insertIndex < allActivities.length &&
          allActivities[insertIndex]._creationTime >= activity._creationTime
        ) {
          insertIndex += 1;
        }
        if (insertIndex >= limit) {
          continue;
        }
        allActivities.splice(insertIndex, 0, activity);
        if (allActivities.length > limit) {
          allActivities.pop();
        }
      }
    }

    // Create issue map from fetched issues
    const issueMap = new Map(issues.map((i) => [i._id, i]));

    // Batch fetch users
    const userIds = [...new Set(allActivities.map((a) => a.userId))];
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

// ---------------------------------------------------------------------------
// Organization-level analytics
// ---------------------------------------------------------------------------

/**
 * Get organization-wide analytics — aggregate issue stats across accessible projects.
 * Uses per-project index-based counting (no bulk issue loading).
 */
export const getOrgAnalytics = authenticatedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const isMember = await isOrganizationMember(ctx, organizationId, ctx.userId);
    if (!isMember) throw new Error("Not a member of this organization");

    const isAdmin = await isOrganizationAdmin(ctx, organizationId, ctx.userId);

    // 1. Resolve accessible projects
    const orgProjects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .take(MAX_PAGE_SIZE);
    const allProjects = orgProjects.filter((p) => !p.isDeleted);

    let projects: typeof allProjects;
    if (isAdmin) {
      projects = allProjects;
    } else {
      const memberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user_deleted", (q) => q.eq("userId", ctx.userId).lt("isDeleted", true))
        .take(MAX_PAGE_SIZE);
      const memberProjectIds = new Set(memberships.map((m) => m.projectId));
      projects = allProjects.filter((p) => p.isPublic || memberProjectIds.has(p._id));
    }

    // 2. Count per-project using indexes (no bulk issue loading)
    const issueTypes = ["task", "bug", "story", "epic", "subtask"] as const;
    const priorities = ["lowest", "low", "medium", "high", "highest"] as const;

    const perProject = await Promise.all(
      projects.map(async (project) => {
        const pid = project._id;
        const doneStateIds = new Set(
          project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
        );

        // Parallel index counts for this project
        const [total, unassigned, typeEntries, priorityEntries, doneEntries] = await Promise.all([
          efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_project_deleted", (q) => q.eq("projectId", pid).lt("isDeleted", true)),
            MAX_SPRINT_ISSUES,
          ),
          efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_project_assignee", (q) =>
                q.eq("projectId", pid).eq("assigneeId", undefined).lt("isDeleted", true),
              ),
            MAX_SPRINT_ISSUES,
          ),
          Promise.all(
            issueTypes.map(
              async (type) =>
                [
                  type,
                  await efficientCount(
                    ctx.db
                      .query("issues")
                      .withIndex("by_project_type_deleted", (q) =>
                        q.eq("projectId", pid).eq("type", type).lt("isDeleted", true),
                      ),
                    MAX_SPRINT_ISSUES,
                  ),
                ] as const,
            ),
          ),
          Promise.all(
            priorities.map(
              async (priority) =>
                [
                  priority,
                  await efficientCount(
                    ctx.db
                      .query("issues")
                      .withIndex("by_project_priority_deleted", (q) =>
                        q.eq("projectId", pid).eq("priority", priority).lt("isDeleted", true),
                      ),
                    MAX_SPRINT_ISSUES,
                  ),
                ] as const,
            ),
          ),
          // Count completed: sum across done workflow states
          Promise.all(
            [...doneStateIds].map(async (stateId) =>
              efficientCount(
                ctx.db
                  .query("issues")
                  .withIndex("by_project_status_deleted", (q) =>
                    q.eq("projectId", pid).eq("status", stateId).lt("isDeleted", true),
                  ),
                MAX_SPRINT_ISSUES,
              ),
            ),
          ),
        ]);

        return {
          projectId: pid,
          name: project.name,
          key: project.key,
          total,
          unassigned,
          completed: doneEntries.reduce((sum, n) => sum + n, 0),
          types: Object.fromEntries(typeEntries),
          priorities: Object.fromEntries(priorityEntries),
        };
      }),
    );

    // 3. Aggregate across projects
    const typeCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    let totalIssues = 0;
    let completedCount = 0;
    let unassignedCount = 0;

    for (const p of perProject) {
      totalIssues += p.total;
      completedCount += p.completed;
      unassignedCount += p.unassigned;
      for (const [type, count] of Object.entries(p.types)) {
        typeCounts[type] = (typeCounts[type] || 0) + count;
      }
      for (const [priority, count] of Object.entries(p.priorities)) {
        priorityCounts[priority] = (priorityCounts[priority] || 0) + count;
      }
    }

    const projectBreakdown = perProject
      .filter((p) => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((p) => ({
        projectId: p.projectId,
        name: p.name,
        key: p.key,
        issueCount: p.total,
      }));

    return {
      totalIssues,
      completedCount,
      unassignedCount,
      projectCount: projects.length,
      issuesByType: buildIssuesByType(typeCounts),
      issuesByPriority: buildIssuesByPriority(priorityCounts),
      projectBreakdown,
      isProjectsTruncated: orgProjects.length >= MAX_PAGE_SIZE,
    };
  },
});

/**
 * Get cycle time and lead time stats for a project.
 *
 * Cycle time: median time from first "inprogress" status to "done" status.
 * Lead time: median time from issue creation to "done" status.
 *
 * Analyzes the most recent completed issues (up to 100).
 */
export const getTimeMetrics = projectQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 100);
    const project = ctx.project;
    if (!project) return null;

    // Find done status IDs
    const doneStatusIds = new Set(
      project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
    );

    const inProgressStatusIds = new Set(
      project.workflowStates.filter((s) => s.category === "inprogress").map((s) => s.id),
    );

    if (doneStatusIds.size === 0) return null;

    // Find recently completed issues
    const completedIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) =>
        q.and(q.neq(q.field("isDeleted"), true), q.eq(q.field("archivedAt"), undefined)),
      )
      .order("desc")
      .take(MAX_PAGE_SIZE);

    const doneIssues = completedIssues
      .filter((issue) => doneStatusIds.has(issue.status))
      .slice(0, limit);

    if (doneIssues.length === 0) {
      return {
        cycleTimeMedianDays: null,
        leadTimeMedianDays: null,
        sampleSize: 0,
        cycleTimeData: [],
        leadTimeData: [],
      };
    }

    // For each done issue, find when it first entered inprogress (cycle time start)
    // and use _creationTime for lead time start
    const cycleTimeDays: number[] = [];
    const leadTimeDays: number[] = [];

    for (const issue of doneIssues) {
      // Lead time: creation → now (issue is in done status)
      const leadTime = (issue.updatedAt - issue._creationTime) / DAY;
      if (leadTime >= 0) leadTimeDays.push(Math.round(leadTime * 10) / 10);

      // Cycle time: first inprogress activity → updatedAt
      // We approximate using the issue's updatedAt as the "done" timestamp
      // and look for the first status change to inprogress in activity
      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .filter((q) => q.and(q.eq(q.field("action"), "updated"), q.eq(q.field("field"), "status")))
        .take(50);

      // Find earliest transition to inprogress
      const inProgressActivity = activities.find(
        (a) => a.newValue && inProgressStatusIds.has(a.newValue),
      );

      if (inProgressActivity) {
        const cycleTime = (issue.updatedAt - inProgressActivity._creationTime) / DAY;
        if (cycleTime >= 0) cycleTimeDays.push(Math.round(cycleTime * 10) / 10);
      }
    }

    // Calculate medians
    const median = (arr: number[]) => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    return {
      cycleTimeMedianDays: median(cycleTimeDays),
      leadTimeMedianDays: median(leadTimeDays),
      sampleSize: doneIssues.length,
      cycleTimeData: cycleTimeDays.slice(0, 20), // Last 20 for sparkline
      leadTimeData: leadTimeDays.slice(0, 20),
    };
  },
});

/**
 * Get cycle/lead time breakdowns per assignee and per label.
 * Extends getTimeMetrics with dimensional grouping so teams can
 * identify which assignees or label categories are slower.
 */
export const getTimeMetricsBreakdown = projectQuery({
  args: {
    groupBy: v.union(v.literal("assignee"), v.literal("label")),
  },
  returns: v.object({
    groups: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        cycleTimeMedianDays: v.union(v.number(), v.null()),
        leadTimeMedianDays: v.union(v.number(), v.null()),
        issueCount: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const project = ctx.project;
    if (!project) return { groups: [] };

    const doneStatusIds = new Set(
      project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
    );
    const inProgressStatusIds = new Set(
      project.workflowStates.filter((s) => s.category === "inprogress").map((s) => s.id),
    );

    if (doneStatusIds.size === 0) return { groups: [] };

    // Fetch completed issues
    const allIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) =>
        q.and(q.neq(q.field("isDeleted"), true), q.eq(q.field("archivedAt"), undefined)),
      )
      .order("desc")
      .take(MAX_PAGE_SIZE);

    const doneIssues = allIssues.filter((issue) => doneStatusIds.has(issue.status));

    if (doneIssues.length === 0) return { groups: [] };

    // Batch fetch activity for cycle time calculation
    const activityByIssue = new Map<Id<"issues">, Doc<"issueActivity">[]>();
    await Promise.all(
      doneIssues.map(async (issue) => {
        const activities = await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
          .filter((q) =>
            q.and(q.eq(q.field("action"), "updated"), q.eq(q.field("field"), "status")),
          )
          .take(50);
        activityByIssue.set(issue._id, activities);
      }),
    );

    // Calculate times and group keys for each issue
    type IssueWithTimes = {
      leadTimeDays: number;
      cycleTimeDays: number | null;
      groupKeys: string[];
    };

    const issuesWithTimes: IssueWithTimes[] = doneIssues.map((issue) => {
      const leadTimeDays = Math.round(((issue.updatedAt - issue._creationTime) / DAY) * 10) / 10;

      const activities = activityByIssue.get(issue._id) ?? [];
      const inProgressActivity = activities.find(
        (a) => a.newValue && inProgressStatusIds.has(a.newValue),
      );
      const cycleTimeDays = inProgressActivity
        ? Math.round(((issue.updatedAt - inProgressActivity._creationTime) / DAY) * 10) / 10
        : null;

      let groupKeys: string[];
      if (args.groupBy === "assignee") {
        groupKeys = [issue.assigneeId ?? "unassigned"];
      } else {
        groupKeys = issue.labels.length > 0 ? issue.labels : ["unlabeled"];
      }

      return { leadTimeDays, cycleTimeDays, groupKeys };
    });

    // Aggregate into groups
    const groupMap = new Map<
      string,
      { leadTimes: number[]; cycleTimes: number[]; count: number }
    >();

    for (const item of issuesWithTimes) {
      for (const key of item.groupKeys) {
        const group = groupMap.get(key) ?? { leadTimes: [], cycleTimes: [], count: 0 };
        if (item.leadTimeDays >= 0) group.leadTimes.push(item.leadTimeDays);
        if (item.cycleTimeDays !== null && item.cycleTimeDays >= 0)
          group.cycleTimes.push(item.cycleTimeDays);
        group.count++;
        groupMap.set(key, group);
      }
    }

    const median = (arr: number[]) => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    if (args.groupBy === "assignee") {
      const userIds = [...groupMap.keys()]
        .filter((k) => k !== "unassigned")
        .map((k) => k as Id<"users">);
      const userMap = await batchFetchUsers(ctx, userIds);

      const groups = [...groupMap.entries()]
        .map(([key, data]) => ({
          key,
          label:
            key === "unassigned"
              ? "Unassigned"
              : (getUserName(userMap.get(key as Id<"users">)) ?? "Unknown"),
          cycleTimeMedianDays: median(data.cycleTimes),
          leadTimeMedianDays: median(data.leadTimes),
          issueCount: data.count,
        }))
        .sort((a, b) => b.issueCount - a.issueCount);

      return { groups };
    }

    // Label grouping
    const groups = [...groupMap.entries()]
      .map(([key, data]) => ({
        key,
        label: key === "unlabeled" ? "Unlabeled" : key,
        cycleTimeMedianDays: median(data.cycleTimes),
        leadTimeMedianDays: median(data.leadTimes),
        issueCount: data.count,
      }))
      .sort((a, b) => b.issueCount - a.issueCount);

    return { groups };
  },
});
