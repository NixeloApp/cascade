import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server"; // Added
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import {
  batchFetchIssues,
  batchFetchProjects,
  batchFetchUsers,
  getUserName,
} from "./lib/batchHelpers";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { DEFAULT_SEARCH_PAGE_SIZE, MAX_ACTIVITY_ITEMS } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";

// Get all issues assigned to the current user across all projects
export const getMyIssues = query({
  args: { paginationOpts: v.optional(paginationOptsValidator) }, // Pagination args
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const paginationOpts = args.paginationOpts || { numItems: 20, cursor: null };

    // Paginate using the by_assignee index
    const results = await fetchPaginatedQuery<Doc<"issues">>(ctx, {
      paginationOpts,
      query: (db) =>
        db
          .query("issues")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
          .order("desc"), // Sort by creation time (descending)
    });

    // Batch fetch all related data to avoid N+1 queries
    const projectIds = [
      ...new Set(
        results.page
          .map((i) => i.projectId)
          .filter((id): id is Id<"projects"> => id !== undefined && id !== null),
      ),
    ];
    const userIds = [
      ...new Set(results.page.flatMap((i) => [i.reporterId, i.assigneeId]).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, users] = await Promise.all([
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(userIds.map((id) => ctx.db.get(id))),
    ]);

    const projectMap = new Map(
      projects.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p._id, p]),
    );
    const userMap = new Map(
      users.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u._id, u]),
    );

    // Enrich with pre-fetched data
    const enrichedIssues = results.page.map((issue) => {
      const project = issue.projectId ? projectMap.get(issue.projectId) : null;
      const reporter = issue.reporterId ? userMap.get(issue.reporterId) : null;
      const assignee = issue.assigneeId ? userMap.get(issue.assigneeId) : null;

      return {
        ...issue,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
        reporterName: reporter?.name || reporter?.email || "Unknown",
        assigneeName: assignee?.name || assignee?.email || "Unassigned",
      };
    });

    return {
      ...results,
      page: enrichedIssues,
    };
  },
});

// Get issues created by the current user
export const getMyCreatedIssues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .filter(notDeleted)
      .collect();

    // Batch fetch all related data to avoid N+1 queries
    const projectIds = [
      ...new Set(
        issues
          .map((i) => i.projectId)
          .filter((id): id is Id<"projects"> => id !== undefined && id !== null),
      ),
    ];
    const assigneeIds = [
      ...new Set(issues.map((i) => i.assigneeId).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, assignees] = await Promise.all([
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(assigneeIds.map((id) => ctx.db.get(id))),
    ]);

    const projectMap = new Map(
      projects.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p._id, p]),
    );
    const assigneeMap = new Map(
      assignees.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u._id, u]),
    );

    // Enrich with pre-fetched data
    const enrichedIssues = issues.map((issue) => {
      const project = issue.projectId ? projectMap.get(issue.projectId) : null;
      const assignee = issue.assigneeId ? assigneeMap.get(issue.assigneeId) : null;

      return {
        ...issue,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
        assigneeName: assignee?.name || assignee?.email || "Unassigned",
      };
    });

    return enrichedIssues.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get projects the user is a member of
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted)
      .collect();

    if (memberships.length === 0) return [];

    // Batch fetch all projects
    const projectIds = memberships.map((m) => m.projectId);
    const projectMap = await batchFetchProjects(ctx, projectIds);

    // Calculate "My Issues" count efficiently by querying issues assigned to ME
    // This is scalable because per-user assignment count is usually small (<1000)
    const myIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .filter(notDeleted)
      .collect();

    const myIssuesByProject = new Map<string, number>();
    for (const issue of myIssues) {
      if (issue.projectId) {
        const projId = issue.projectId.toString();
        myIssuesByProject.set(projId, (myIssuesByProject.get(projId) || 0) + 1);
      }
    }

    // Note: We removed "totalQuestions" / "totalIssues" calculation because fetching ALL issues
    // for every project is a performance killer and OOM risk (loading 10k+ items).
    // If total counts are needed, they should be pre-aggregated in a stats table.

    // Enrich memberships with project data and counts
    const projects = memberships
      .map((membership) => {
        const project = projectMap.get(membership.projectId);
        if (!project) return null;

        const projId = membership.projectId.toString();
        return {
          ...project,
          _id: membership.projectId,
          role: membership.role,
          totalIssues: 0, // Disabled for performance
          myIssues: myIssuesByProject.get(projId) ?? 0,
        };
      })
      .filter((p) => p !== null);

    return projects;
  },
});

// Get recent activity across all projects the user has access to
export const getMyRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || DEFAULT_SEARCH_PAGE_SIZE;

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted)
      .collect();

    const projectIdSet = new Set(memberships.map((m) => m.projectId.toString()));

    // Get recent activity
    const allActivity = await ctx.db.query("issueActivity").order("desc").take(MAX_ACTIVITY_ITEMS);

    // Batch fetch all issues referenced by activity
    const issueIds = allActivity.map((a) => a.issueId);
    const issueMap = await batchFetchIssues(ctx, issueIds);

    // Filter to only activities for accessible issues
    const accessibleActivity = allActivity.filter((activity) => {
      const issue = issueMap.get(activity.issueId);
      return issue?.projectId && projectIdSet.has(issue.projectId.toString());
    });

    // Batch fetch projects and users for accessible activities
    // Filter out undefined projectIds to prevent batch fetch failures
    const projectIdsToFetch = accessibleActivity
      .map((a) => issueMap.get(a.issueId)?.projectId)
      .filter((id): id is Id<"projects"> => id !== undefined);
    const userIds = accessibleActivity.map((a) => a.userId);

    const [projectMap, userMap] = await Promise.all([
      batchFetchProjects(ctx, projectIdsToFetch),
      batchFetchUsers(ctx, userIds),
    ]);

    // Enrich activities
    const enrichedActivity = accessibleActivity
      .map((activity) => {
        const issue = issueMap.get(activity.issueId);
        if (!issue?.projectId) return null;
        const project = projectMap.get(issue.projectId);
        const user = userMap.get(activity.userId);

        return {
          ...activity,
          issueKey: issue.key,
          issueTitle: issue.title,
          projectName: project?.name || "Unknown",
          userName: getUserName(user),
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    return enrichedActivity.slice(0, limit);
  },
});

// Get dashboard stats
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        assignedToMe: 0,
        createdByMe: 0,
        completedThisWeek: 0,
        highPriority: 0,
      };
    }

    // Issues assigned to me
    const assignedIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .filter(notDeleted)
      .collect();

    // Filter for different stats
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Batch fetch all projects to check workflow states (avoid N+1)
    const projectIds = [...new Set(assignedIssues.map((i) => i.projectId))];
    const projectMap = await batchFetchProjects(ctx, projectIds);

    // Build a map of projectId -> done workflow states
    const doneStatesMap = new Map<string, Set<string>>();
    projectMap.forEach((project, projectId) => {
      const doneStates = new Set(
        project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
      );
      doneStatesMap.set(projectId, doneStates);
    });

    const completedThisWeek = assignedIssues.filter((issue) => {
      if (!issue.projectId) return false;
      const doneStates = doneStatesMap.get(issue.projectId);
      return doneStates?.has(issue.status) && issue.updatedAt >= weekAgo;
    }).length;

    const highPriority = assignedIssues.filter(
      (i) => i.priority === "high" || i.priority === "highest",
    ).length;

    // Created by me - using index instead of filter (avoids full table scan)
    const createdByMe = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .filter(notDeleted)
      .collect();

    return {
      assignedToMe: assignedIssues.length,
      createdByMe: createdByMe.length,
      completedThisWeek,
      highPriority,
    };
  },
});

// Get the single most important task for the Focus Zone
export const getFocusTask = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Fetch highest priority uncompleted tasks
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .filter((q) => q.and(notDeleted(q), q.neq(q.field("status"), "done")))
      .collect();

    if (issues.length === 0) return null;

    // Priority ordering: highest > high > medium > low > lowest
    const priorityMap: Record<string, number> = {
      highest: 5,
      high: 4,
      medium: 3,
      low: 2,
      lowest: 1,
    };

    const focusTask = issues.sort((a, b) => {
      const pA = priorityMap[a.priority || "none"] || 0;
      const pB = priorityMap[b.priority || "none"] || 0;
      if (pA !== pB) return pB - pA;
      return b.updatedAt - a.updatedAt; // Newest first for same priority
    })[0];

    // Enrich with project details
    if (focusTask.projectId) {
      const project = await ctx.db.get(focusTask.projectId);
      return {
        ...focusTask,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
      };
    }

    return {
      ...focusTask,
      projectName: "Unknown",
      projectKey: "???",
    };
  },
});
