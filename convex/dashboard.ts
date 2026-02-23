import { paginationOptsValidator } from "convex/server"; // Added
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import type { Doc, Id } from "./_generated/dataModel";
import { authenticatedQuery } from "./customFunctions";
import {
  batchFetchIssues,
  batchFetchProjects,
  batchFetchUsers,
} from "./lib/batchHelpers";
import { getUserName } from "./lib/userUtils";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import {
  DEFAULT_SEARCH_PAGE_SIZE,
  MAX_ACTIVITY_ITEMS,
  MAX_PAGE_SIZE,
  MAX_USER_ASSIGNED_ISSUES,
} from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { WEEK } from "./lib/timeUtils";
import { issueActivityFields, issuesFields, projectsFields } from "./schemaFields";
import { projectRoles } from "./validators";

// Get all issues assigned to the current user across all projects
export const getMyIssues = authenticatedQuery({
  args: { paginationOpts: paginationOptsValidator }, // Pagination args
  returns: v.object({
    page: v.array(
      v.object({
        ...issuesFields,
        _id: v.id("issues"),
        _creationTime: v.number(),
        projectName: v.string(),
        projectKey: v.string(),
        reporterName: v.string(),
        assigneeName: v.string(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
    // Convex pagination internal fields (added in recent versions)
    pageStatus: v.optional(
      v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null()),
    ),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 20, cursor: null };

    // Paginate using the by_assignee index
    const results = await fetchPaginatedQuery<Doc<"issues">>(ctx, {
      paginationOpts,
      query: (db) =>
        db
          .query("issues")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
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

    const [projectMap, userMap] = await Promise.all([
      batchFetchProjects(ctx, projectIds),
      batchFetchUsers(ctx, userIds),
    ]);

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
export const getMyCreatedIssues = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      ...issuesFields,
      _id: v.id("issues"),
      _creationTime: v.number(),
      projectName: v.string(),
      projectKey: v.string(),
      assigneeName: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_USER_ASSIGNED_ISSUES);

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

    const [projectMap, assigneeMap] = await Promise.all([
      batchFetchProjects(ctx, projectIds),
      batchFetchUsers(ctx, assigneeIds),
    ]);

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

    return enrichedIssues.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get projects the user is a member of
export const getMyProjects = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      ...projectsFields,
      _id: v.id("projects"),
      _creationTime: v.number(),
      role: projectRoles,
      totalIssues: v.number(),
      myIssues: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    if (memberships.length === 0) return [];

    // Batch fetch all projects
    const projectIds = memberships.map((m) => m.projectId);
    const projectMap = await batchFetchProjects(ctx, projectIds);

    // Calculate "My Issues" count efficiently by querying issues assigned to ME
    // This is scalable because per-user assignment count is usually small (<1000)
    const myIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_USER_ASSIGNED_ISSUES);

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
    const projects = pruneNull(
      memberships.map((membership) => {
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
      }),
    );

    return projects;
  },
});

// Get recent activity across all projects the user has access to
export const getMyRecentActivity = authenticatedQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      ...issueActivityFields,
      _id: v.id("issueActivity"),
      _creationTime: v.number(),
      issueKey: v.string(),
      issueTitle: v.string(),
      projectName: v.string(),
      userName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || DEFAULT_SEARCH_PAGE_SIZE;

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

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
    const enrichedActivity = pruneNull(
      accessibleActivity.map((activity) => {
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
      }),
    );

    return enrichedActivity.slice(0, limit);
  },
});

// Get dashboard stats
export const getMyStats = authenticatedQuery({
  args: {},
  returns: v.object({
    assignedToMe: v.number(),
    createdByMe: v.number(),
    completedThisWeek: v.number(),
    highPriority: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    // Issues assigned to me
    const assignedIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_USER_ASSIGNED_ISSUES);

    // Filter for different stats
    const weekAgo = now - WEEK;

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
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_USER_ASSIGNED_ISSUES);

    return {
      assignedToMe: assignedIssues.length,
      createdByMe: createdByMe.length,
      completedThisWeek,
      highPriority,
    };
  },
});

// Get the single most important task for the Focus Zone
export const getFocusTask = authenticatedQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("issues"),
      _creationTime: v.number(),
      title: v.string(),
      key: v.string(),
      status: v.string(),
      priority: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
      assigneeId: v.optional(v.id("users")),
      reporterId: v.optional(v.id("users")),
      description: v.optional(v.string()),
      updatedAt: v.number(),
      isDeleted: v.optional(v.boolean()),
      projectName: v.string(),
      projectKey: v.string(),
    }),
  ),
  handler: async (ctx) => {
    // Fetch tasks assigned to me (with reasonable limit)
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_USER_ASSIGNED_ISSUES);

    if (issues.length === 0) return null;

    // Fetch projects to determine done states (avoid hardcoded "done" status)
    const projectIds = [...new Set(issues.map((i) => i.projectId).filter(Boolean))];
    const projectMap = await batchFetchProjects(ctx, projectIds as Id<"projects">[]);

    const doneStatesMap = new Map<string, Set<string>>();
    projectMap.forEach((project, projectId) => {
      const doneStates = new Set(
        project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
      );
      doneStatesMap.set(projectId, doneStates);
    });

    // Filter out uncompleted issues
    const uncompletedIssues = issues.filter((issue) => {
      if (!issue.projectId) return true;
      const doneStates = doneStatesMap.get(issue.projectId.toString());
      return !doneStates?.has(issue.status);
    });

    if (uncompletedIssues.length === 0) return null;

    // Priority ordering: highest > high > medium > low > lowest
    const priorityMap: Record<string, number> = {
      highest: 5,
      high: 4,
      medium: 3,
      low: 2,
      lowest: 1,
    };

    const focusTask = uncompletedIssues.sort((a, b) => {
      const pA = priorityMap[a.priority || "none"] || 0;
      const pB = priorityMap[b.priority || "none"] || 0;
      if (pA !== pB) return pB - pA;
      return b.updatedAt - a.updatedAt; // Newest first for same priority
    })[0];

    // Pick only the fields declared in the return validator
    const picked = {
      _id: focusTask._id,
      _creationTime: focusTask._creationTime,
      title: focusTask.title,
      key: focusTask.key,
      status: focusTask.status,
      priority: focusTask.priority,
      projectId: focusTask.projectId,
      assigneeId: focusTask.assigneeId,
      reporterId: focusTask.reporterId,
      description: focusTask.description,
      updatedAt: focusTask.updatedAt,
      isDeleted: focusTask.isDeleted,
    };

    // Enrich with project details
    if (focusTask.projectId) {
      const project = await ctx.db.get(focusTask.projectId);
      return {
        ...picked,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
      };
    }

    return {
      ...picked,
      projectName: "Unknown",
      projectKey: "???",
    };
  },
});
