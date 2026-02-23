import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalQuery, type QueryCtx, query } from "../_generated/server";
import { authenticatedQuery, organizationQuery, projectQuery } from "../customFunctions";
import { batchFetchUsers } from "../lib/batchHelpers";
import {
  BOUNDED_LIST_LIMIT,
  BOUNDED_SEARCH_LIMIT,
  BOUNDED_SELECT_LIMIT,
  efficientCount,
  safeCollect,
} from "../lib/boundedQueries";
import { forbidden, notFound } from "../lib/errors";
import {
  batchEnrichIssuesByStatus,
  enrichComments,
  enrichIssue,
  enrichIssues,
  fetchPaginatedIssues,
} from "../lib/issueHelpers";
import { notDeleted } from "../lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "../lib/userUtils";
import { canAccessProject } from "../projectAccess";
import { matchesSearchFilters, ROOT_ISSUE_TYPES } from "./helpers";
import { buildIssueSearch } from "./searchHelpers";

/**
 * Internal query for API usage that accepts explicit userId
 * Bypasses getAuthUserId() which returns null in HTTP actions
 */
export const listIssuesInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Verify access for the specific user
    const hasAccess = await canAccessProject(ctx, args.projectId, args.userId);
    if (!hasAccess) {
      throw forbidden();
    }

    // 2. Fetch issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project_deleted", (q) =>
        q.eq("projectId", args.projectId).lt("isDeleted", true),
      )
      .order("desc")
      .take(100); // Limit for API

    // 3. enrich issues
    return await enrichIssues(ctx, issues);
  },
});

/**
 * List all issues assigned to or reported by the current user
 * Used by onboarding checklist to track user progress
 * Returns paginated results to handle users with many issues
 */
/**
 * Get count of issues assigned to current user (for onboarding)
 * More efficient than loading all issues
 */
export const getUserIssueCount = authenticatedQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId).lt("isDeleted", true))
      .take(1); // Just need to know if there's at least one

    return issues.length;
  },
});

export const listByUser = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Paginate assigned issues
    const assignedResult = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId).lt("isDeleted", true))
      .paginate(args.paginationOpts);

    const mappedIssues = assignedResult.page.map((issue) => ({
      _id: issue._id,
      key: issue.key,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
      projectId: issue.projectId as Id<"projects">,
    }));

    return {
      page: mappedIssues,
      isDone: assignedResult.isDone,
      continueCursor: assignedResult.continueCursor,
    };
  },
});

/**
 * List epics for a project (for dropdowns/filters)
 * Optimized to only return epics, avoiding loading all issues
 */
export const listEpics = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    const epics = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", args.projectId).eq("type", "epic").lt("isDeleted", true),
        ),
      200, // Reasonable limit for epics
      "project epics",
    );

    return epics.map((e) => ({
      _id: e._id,
      key: e.key,
      title: e.title,
    }));
  },
});

export const listRoadmapIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    // Backend filters to avoid client-side filtering
    epicId: v.optional(v.id("issues")), // Filter by epic
    excludeEpics: v.optional(v.boolean()), // Exclude epic type issues
    hasDueDate: v.optional(v.boolean()), // Only issues with due dates
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    let issues: Doc<"issues">[] = [];
    if (args.sprintId) {
      // Bounded: sprint issues are typically limited (<500 per sprint)
      // Optimization: use index with isDeleted to skip deleted items efficiently
      // Optimization: filter out subtasks in DB to fill buffer with root types
      const allSprintIssues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) =>
            q.eq("sprintId", args.sprintId as Id<"sprints">).lt("isDeleted", true),
          )
          .filter((q) => q.neq(q.field("type"), "subtask")),
        BOUNDED_LIST_LIMIT,
        "roadmap sprint issues",
      );

      // Verify projectId matches (security check) and filter root types
      issues = allSprintIssues.filter(
        (i) =>
          i.projectId === args.projectId &&
          (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );
    } else if (args.epicId) {
      // Optimization: Fetch by epic directly if filtering by specific epic
      // This is much faster (O(K)) than scanning the whole project (O(N))
      const allEpicIssues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_epic", (q) => q.eq("epicId", args.epicId).lt("isDeleted", true)),
        BOUNDED_LIST_LIMIT,
        "roadmap epic issues",
      );

      // Filter by project (security) and ensure root types only (no subtasks)
      // Note: Epics themselves don't have an epicId, so this excludes epics naturally
      issues = allEpicIssues.filter(
        (i) =>
          i.projectId === args.projectId &&
          (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );
    } else if (args.hasDueDate) {
      // Optimization: Use parallel queries for each root issue type (task, bug, story, epic).
      // This allows us to use the `by_project_type_due_date` index to efficiently skip subtasks
      // (which are common but excluded) and deleted items.
      // We fetch the top earliest items for each type and merge them.
      const typesToFetch = args.excludeEpics
        ? ROOT_ISSUE_TYPES.filter((t) => t !== "epic")
        : ROOT_ISSUE_TYPES;

      const issuesByType = await Promise.all(
        typesToFetch.map((type) =>
          safeCollect(
            ctx.db
              .query("issues")
              .withIndex("by_project_type_due_date", (q) =>
                q
                  .eq("projectId", args.projectId)
                  .eq("type", type as Doc<"issues">["type"])
                  .gt("dueDate", 0),
              )
              .filter(notDeleted),
            BOUNDED_LIST_LIMIT * 4, // Match previous capacity per type to ensure enough candidate items
            `roadmap dated issues type=${type}`,
          ),
        ),
      );

      // Merge and sort globally by due date (ascending)
      issues = issuesByType
        .flat()
        .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
        .slice(0, BOUNDED_LIST_LIMIT * 4); // Preserve the original total limit
    } else {
      // Bounded: fetch by type with limits
      // Optimization: Skip fetching epics if they will be excluded anyway
      const typesToFetch = args.excludeEpics
        ? ROOT_ISSUE_TYPES.filter((t) => t !== "epic")
        : ROOT_ISSUE_TYPES;

      const outcomes = await Promise.all(
        typesToFetch.map((type) =>
          safeCollect(
            ctx.db.query("issues").withIndex("by_project_type", (q) =>
              q
                .eq("projectId", args.projectId)
                .eq("type", type as Doc<"issues">["type"])
                .lt("isDeleted", true),
            ),
            BOUNDED_LIST_LIMIT,
            `roadmap issues type=${type}`,
          ),
        ),
      );
      issues = outcomes.flat();
    }

    // Apply backend filters
    if (args.excludeEpics) {
      issues = issues.filter((i) => i.type !== "epic");
    }
    if (args.epicId) {
      issues = issues.filter((i) => i.epicId === args.epicId);
    }
    if (args.hasDueDate) {
      issues = issues.filter((i) => i.dueDate !== undefined);
    }

    const enriched = await enrichIssues(ctx, issues);
    // Optimization: Strip description to reduce payload size for list views
    return enriched.map((i) => ({ ...i, description: undefined }));
  },
});

export const listRoadmapIssuesPaginated = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    if (args.sprintId) {
      const result = await ctx.db
        .query("issues")
        .withIndex("by_project_sprint_status", (q) =>
          q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
        )
        .filter(notDeleted)
        .paginate(args.paginationOpts);

      const rootIssues = result.page.filter((i: Doc<"issues">) =>
        (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );

      return {
        ...result,
        page: await enrichIssues(ctx, rootIssues),
      };
    }

    const result = await ctx.db
      .query("issues")
      .withIndex("by_project_type", (q) =>
        q.eq("projectId", args.projectId).eq("type", ROOT_ISSUE_TYPES[0]).lt("isDeleted", true),
      )
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await enrichIssues(ctx, result.page),
    };
  },
});

export const listSelectableIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Check if user has access to the project
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    // Optimization: Use parallel queries for each root issue type (task, bug, story, epic).
    // This allows us to use the `by_project_type` index to efficiently skip subtasks and deleted items.
    // Scanning the `by_project` index would force us to scan through potentially thousands of subtasks
    // or deleted items to find the most recent selectable issues.
    // Since we only need the top 50 (BOUNDED_SELECT_LIMIT), fetching 50 of each type and merging is very fast.
    const issuesByType = await Promise.all(
      ROOT_ISSUE_TYPES.map((type) =>
        ctx.db
          .query("issues")
          .withIndex("by_project_type", (q) =>
            q
              .eq("projectId", args.projectId)
              .eq("type", type as Doc<"issues">["type"])
              .lt("isDeleted", true),
          )
          .order("desc")
          .take(BOUNDED_SELECT_LIMIT),
      ),
    );

    // Merge all results, sort by creation time (descending), and take the top limit
    const issues = issuesByType
      .flat()
      .sort((a, b) => b._creationTime - a._creationTime) // _id correlates with creation time
      .slice(0, BOUNDED_SELECT_LIMIT);

    return issues.map((i) => ({
      _id: i._id,
      key: i.key,
      title: i.title,
    }));
  },
});

export const listProjectIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.sprintId) {
          return db
            .query("issues")
            .withIndex("by_project_sprint_status", (q) =>
              q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
            )
            .order("asc")
            .filter(notDeleted);
        }
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_project_status", (q) =>
              q
                .eq("projectId", args.projectId)
                .eq("status", args.status as string)
                .lt("isDeleted", true),
            )
            .order("asc");
        }
        return db
          .query("issues")
          .withIndex("by_project_deleted", (q) =>
            q.eq("projectId", args.projectId).lt("isDeleted", true),
          )
          .order("desc");
      },
    });
  },
});

export const listOrganizationIssues = organizationQuery({
  args: {
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // organizationQuery handles auth and membership check
    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_organization_status", (q) =>
              q
                .eq("organizationId", ctx.organizationId)
                .eq("status", args.status as string)
                .lt("isDeleted", true),
            )
            .order("desc");
        }
        return db
          .query("issues")
          .withIndex("by_organization_deleted", (q) =>
            q.eq("organizationId", ctx.organizationId).lt("isDeleted", true),
          )
          .order("desc");
      },
    });
  },
});

export const listTeamIssues = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (!teamMember) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_team_status", (q) =>
              q
                .eq("teamId", args.teamId)
                .eq("status", args.status as string)
                .lt("isDeleted", true),
            )
            .order("asc");
        }
        return db
          .query("issues")
          .withIndex("by_team_deleted", (q) => q.eq("teamId", args.teamId).lt("isDeleted", true))
          .order("desc");
      },
    });
  },
});

export const getIssue = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const issue = await ctx.db.get(args.id);

    if (!issue || issue.isDeleted) {
      return null;
    }

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      return null;
    }

    if (!userId) {
      throw forbidden();
    }

    const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
    if (!hasAccess) {
      throw forbidden();
    }

    const enriched = await enrichIssue(ctx, issue);

    // Optimization: Comments and activity are fetched separately by the frontend components
    // (IssueComments and IssueActivity) to allow for pagination and better performance.
    return {
      ...enriched,
      project,
    };
  },
});

export const listComments = query({
  args: {
    issueId: v.id("issues"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const issue = await ctx.db.get(args.issueId);

    if (!issue || issue.isDeleted) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      throw notFound("project");
    }

    if (!userId) {
      throw forbidden();
    }

    const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
    if (!hasAccess) {
      throw forbidden();
    }

    const results = await ctx.db
      .query("issueComments")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("asc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await enrichComments(ctx, results.page),
    };
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)
      .first();

    if (!issue) {
      return null;
    }

    // Check if user has access to the project
    const hasAccess = await canAccessProject(ctx, issue.projectId, userId);
    if (!hasAccess) {
      return null;
    }

    return await enrichIssue(ctx, issue);
  },
});

export const listSubtasks = authenticatedQuery({
  args: { parentId: v.id("issues") },
  handler: async (ctx, args) => {
    const parentIssue = await ctx.db.get(args.parentId);
    if (!parentIssue || parentIssue.isDeleted) {
      return [];
    }

    const project = await ctx.db.get(parentIssue.projectId as Id<"projects">);
    if (!project) {
      return [];
    }

    // Bounded: subtasks per issue are typically limited (<100)
    const subtasks = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId).lt("isDeleted", true)),
      100, // Issues rarely have >100 subtasks
      "subtasks",
    );

    if (subtasks.length === 0) {
      return [];
    }

    const userIds = [
      ...subtasks.map((s) => s.assigneeId).filter(Boolean),
      ...subtasks.map((s) => s.reporterId),
    ] as Id<"users">[];
    const userMap = await batchFetchUsers(ctx, userIds);

    const enrichedSubtasks = subtasks.map((subtask) => {
      const assignee = subtask.assigneeId ? userMap.get(subtask.assigneeId) : null;
      const reporter = userMap.get(subtask.reporterId);

      return {
        ...subtask,
        assignee: sanitizeUserForAuth(assignee),
        reporter: sanitizeUserForAuth(reporter),
      };
    });

    return enrichedSubtasks;
  },
});

export const search = authenticatedQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    organizationId: v.optional(v.id("organizations")),
    assigneeId: v.optional(v.union(v.id("users"), v.literal("unassigned"), v.literal("me"))),
    reporterId: v.optional(v.id("users")),
    type: v.optional(v.array(v.string())),
    status: v.optional(v.array(v.string())),
    priority: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    sprintId: v.optional(v.union(v.id("sprints"), v.literal("backlog"), v.literal("none"))),
    epicId: v.optional(v.union(v.id("issues"), v.literal("none"))),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    // Exclude a specific issue from results (useful for dependencies)
    excludeIssueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    // Calculate fetch limit: need enough to filter and still get requested results
    // Fetch 3x the needed amount to account for filtering, capped at search limit
    const fetchLimit = Math.min((offset + limit) * 3, BOUNDED_SEARCH_LIMIT);

    let issues: Doc<"issues">[] = [];

    // If query is provided, use search index
    if (args.query) {
      // Bounded: search results limited to prevent huge result sets
      // Optimization: Push down filters to search index to improve relevance and performance
      issues = await safeCollect(
        ctx.db
          .query("issues")
          .withSearchIndex("search_title", (q) =>
            buildIssueSearch(q, { ...args, query: args.query as string }, ctx.userId),
          )
          .filter(notDeleted),
        fetchLimit,
        "issue search",
      );
    } else if (args.projectId) {
      const projectId = args.projectId;
      // Bounded: project issues limited
      issues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_project_deleted", (q) =>
            q.eq("projectId", projectId).lt("isDeleted", true),
          )
          .order("desc"),
        fetchLimit,
        "issue search by project",
      );
    } else if (args.organizationId) {
      const organizationId = args.organizationId;
      // Bounded: organization issues limited
      issues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
          .filter(notDeleted)
          .order("desc"),
        fetchLimit,
        "issue search by organization",
      );
    } else {
      // Return empty if no filter is provided to prevent scanning the entire table
      return { page: [], total: 0 };
    }

    // Apply advanced filters in memory
    let filteredIssues = issues.filter((issue: Doc<"issues">) =>
      matchesSearchFilters(issue, args, ctx.userId),
    );

    // Exclude specific issue if requested (for dependencies)
    if (args.excludeIssueId) {
      filteredIssues = filteredIssues.filter((i) => i._id !== args.excludeIssueId);
    }

    // Return paginated slice
    // Note: total may be approximate if results were truncated
    return {
      page: filteredIssues.slice(offset, offset + limit),
      total: filteredIssues.length,
    };
  },
});

// Import the rest of the smart loading queries
import { DEFAULT_PAGE_SIZE, getDoneColumnThreshold } from "../lib/pagination";

export const listByProjectSmart = projectQuery({
  args: {
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // ctx.userId provided by projectQuery wrapper
    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);

    const workflowStates = ctx.project.workflowStates;
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    if (args.sprintId) {
      // Optimization: Fetch all issues in the sprint (bounded) and distribute them to columns in memory.
      // This reduces N queries (one per status) to a single query.
      // Since sprints are typically small (< 200 issues), this is much faster and reduces DB ops.
      const sprintIssues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) =>
            q.eq("sprintId", args.sprintId as Id<"sprints">).lt("isDeleted", true),
          )
          .order("desc"),
        BOUNDED_LIST_LIMIT * 5, // Allow up to 500 issues per sprint
        "listByProjectSmart sprint issues",
      );

      // Verify projectId matches (security check)
      const projectIssues = sprintIssues.filter((i) => i.projectId === ctx.project._id);

      // Group by status
      for (const state of workflowStates) {
        let issuesForState = projectIssues.filter((i) => i.status === state.id);

        if (state.category === "done") {
          // Filter by threshold and sort by updatedAt ascending (matching original query behavior)
          issuesForState = issuesForState
            .filter((i) => i.updatedAt >= doneThreshold)
            .sort((a, b) => a.updatedAt - b.updatedAt);
        } else {
          // Sort by order ascending
          issuesForState = issuesForState.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }

        issuesByColumn[state.id] = issuesForState.slice(0, DEFAULT_PAGE_SIZE);
      }
    } else {
      await Promise.all(
        workflowStates.map(async (state: { id: string; category: string }) => {
          const q = (() => {
            if (state.category === "done") {
              // Batch query: Promise.all handles parallelism
              return ctx.db
                .query("issues")
                .withIndex("by_project_status_updated", (q) =>
                  q
                    .eq("projectId", ctx.project._id)
                    .eq("status", state.id)
                    .gte("updatedAt", doneThreshold),
                )
                .filter(notDeleted);
            }

            // Batch query: Promise.all handles parallelism
            return ctx.db
              .query("issues")
              .withIndex("by_project_status", (q) =>
                q.eq("projectId", ctx.project._id).eq("status", state.id).lt("isDeleted", true),
              )
              .order("asc");
          })();

          issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
        }),
      );
    }

    const enrichedIssuesByStatus = await batchEnrichIssuesByStatus(ctx, issuesByColumn);

    return {
      issuesByStatus: enrichedIssuesByStatus,
      workflowStates: workflowStates,
    };
  },
});

export const listByTeamSmart = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (!teamMember) return [];

    const team = await ctx.db.get(args.teamId);
    if (!team) return [];

    const workspace = await ctx.db.get(team.workspaceId);
    // Workspace may have custom workflow states, fallback to defaults
    const workflowStates: { id: string; name: string; category: string; order: number }[] = (
      workspace as {
        defaultWorkflowStates?: { id: string; name: string; category: string; order: number }[];
      }
    )?.defaultWorkflowStates || [
      { id: "todo", name: "To Do", category: "todo", order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress", order: 1 },
      { id: "done", name: "Done", category: "done", order: 2 },
    ];

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        const q = (() => {
          if (state.category === "done") {
            // Batch query: Promise.all handles parallelism
            return ctx.db
              .query("issues")
              .withIndex("by_team_status_updated", (q) =>
                q.eq("teamId", args.teamId).eq("status", state.id).gte("updatedAt", doneThreshold),
              )
              .filter(notDeleted);
          }

          // Batch query: Promise.all handles parallelism
          return ctx.db
            .query("issues")
            .withIndex("by_team_status", (q) =>
              q.eq("teamId", args.teamId).eq("status", state.id).lt("isDeleted", true),
            )
            .order("asc");
        })();

        issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
      }),
    );

    const enrichedIssuesByStatus = await batchEnrichIssuesByStatus(ctx, issuesByColumn);

    return {
      issuesByStatus: enrichedIssuesByStatus,
      workflowStates: workflowStates,
    };
  },
});

export const getTeamIssueCounts = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const workflowStates = [
      { id: "todo", name: "To Do", category: "todo", order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress", order: 1 },
      { id: "done", name: "Done", category: "done", order: 2 },
    ];

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const counts: Record<string, { total: number; visible: number; hidden: number }> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        let visibleCount = 0;
        let totalCount = 0;

        if (state.category === "done") {
          // Optimization: fetch visible items efficiently using index
          // Batch query: Promise.all handles parallelism
          const visibleIssues = await ctx.db
            .query("issues")
            .withIndex("by_team_status_updated", (q) =>
              q.eq("teamId", args.teamId).eq("status", state.id).gte("updatedAt", doneThreshold),
            )
            .filter(notDeleted)
            .take(DEFAULT_PAGE_SIZE + 1);

          visibleCount = Math.min(visibleIssues.length, DEFAULT_PAGE_SIZE);

          // Fetch total count efficiently
          // Batch query: Promise.all handles parallelism
          totalCount = await efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_team_status", (q) =>
                q.eq("teamId", args.teamId).eq("status", state.id).lt("isDeleted", true),
              ),
          );
        } else {
          // Non-done columns
          // Batch query: Promise.all handles parallelism
          totalCount = await efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_team_status", (q) =>
                q.eq("teamId", args.teamId).eq("status", state.id).lt("isDeleted", true),
              ),
          );

          visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
        }

        counts[state.id] = {
          total: totalCount,
          visible: visibleCount,
          hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
        };
      }),
    );

    return counts;
  },
});

export const getIssueCounts = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) return null;

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const counts: Record<string, { total: number; visible: number; hidden: number }> = {};

    const addCounts = (
      statusId: string,
      countsObj: { total: number; visible: number; hidden: number },
    ) => {
      counts[statusId] = countsObj;
    };

    if (args.sprintId) {
      await getSprintIssueCounts(
        ctx,
        args.projectId,
        args.sprintId,
        project.workflowStates,
        doneThreshold,
        addCounts,
      );
    } else {
      await Promise.all(
        project.workflowStates.map(async (state: { id: string; category: string }) => {
          let visibleCount = 0;
          let totalCount = 0;

          if (state.category === "done") {
            // Optimization: fetch visible items efficiently using index
            // Batch query: Promise.all handles parallelism
            const visibleIssues = await ctx.db
              .query("issues")
              .withIndex("by_project_status_updated", (q) =>
                q
                  .eq("projectId", args.projectId)
                  .eq("status", state.id)
                  .gte("updatedAt", doneThreshold),
              )
              .filter(notDeleted)
              .take(DEFAULT_PAGE_SIZE + 1);

            visibleCount = Math.min(visibleIssues.length, DEFAULT_PAGE_SIZE);

            // Fetch total count efficiently
            // Batch query: Promise.all handles parallelism
            totalCount = await efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_project_status", (q) =>
                  q.eq("projectId", args.projectId).eq("status", state.id).lt("isDeleted", true),
                ),
            );
          } else {
            // Batch query: Promise.all handles parallelism
            totalCount = await efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_project_status", (q) =>
                  q.eq("projectId", args.projectId).eq("status", state.id).lt("isDeleted", true),
                ),
            );

            visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
          }

          addCounts(state.id, {
            total: totalCount,
            visible: visibleCount,
            hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
          });
        }),
      );
    }

    return counts;
  },
});

export const loadMoreDoneIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    beforeTimestamp: v.optional(v.number()),
    beforeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    const outcomes = await Promise.all(
      doneStates.map(async (status) => {
        const limit = args.limit ?? DEFAULT_PAGE_SIZE;
        // Use a large number if no cursor provided, effectively "from the beginning (newest)"
        const beforeTs = args.beforeTimestamp ?? Number.MAX_SAFE_INTEGER;

        const q = args.sprintId
          ? ctx.db
              .query("issues")
              .withIndex("by_project_sprint_status_updated", (q) =>
                q
                  .eq("projectId", args.projectId)
                  .eq("sprintId", args.sprintId as Id<"sprints">)
                  .eq("status", status)
                  .lt("updatedAt", beforeTs),
              )
              .order("desc") // Descending to get the items immediately preceding the cursor
          : ctx.db
              .query("issues")
              .withIndex("by_project_status_updated", (q) =>
                q.eq("projectId", args.projectId).eq("status", status).lt("updatedAt", beforeTs),
              )
              .order("desc"); // Descending to get the items immediately preceding the cursor

        return await q.filter(notDeleted).take(limit);
      }),
    );

    const allIssues = outcomes.flat();
    return await enrichIssues(ctx, allIssues);
  },
});

async function getSprintIssueCounts(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  sprintId: Id<"sprints">,
  workflowStates: { id: string; category: string }[],
  doneThreshold: number,
  addCounts: (statusId: string, counts: { total: number; visible: number; hidden: number }) => void,
) {
  // Optimization: Fetch all issues in the sprint (bounded) and aggregate counts in memory.
  // This reduces N queries (one per status) to a single query.
  // Since sprints are typically small (< 200 issues), this is much faster and reduces DB ops.

  const issues = await safeCollect(
    ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId).lt("isDeleted", true)),
    BOUNDED_LIST_LIMIT * 5, // Allow up to 500 issues per sprint (generous limit)
    "sprint issue counts",
  );

  // Filter by projectId for safety (though sprintId implies project)
  const projectIssues = issues.filter((i) => i.projectId === projectId);

  // Group by status
  const issuesByStatus: Record<string, Doc<"issues">[]> = {};
  for (const issue of projectIssues) {
    if (!issuesByStatus[issue.status]) {
      issuesByStatus[issue.status] = [];
    }
    issuesByStatus[issue.status].push(issue);
  }

  for (const state of workflowStates) {
    const statusIssues = issuesByStatus[state.id] || [];
    const totalCount = statusIssues.length;
    let visibleCount = 0;

    if (state.category === "done") {
      // For done columns, filter by date (recent only)
      // Count items updated after doneThreshold
      const recentCount = statusIssues.filter((i) => i.updatedAt >= doneThreshold).length;
      // Cap visible count at page size (consistent with old logic)
      visibleCount = Math.min(recentCount, DEFAULT_PAGE_SIZE);
    } else {
      // For non-done columns, visible is simply total capped at page size
      visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
    }

    addCounts(state.id, {
      total: totalCount,
      visible: visibleCount,
      hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
    });
  }
}

export const listIssuesByDateRange = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    // Validate sprint belongs to this project if provided
    if (args.sprintId) {
      const sprint = await ctx.db.get(args.sprintId);
      if (!sprint || sprint.projectId !== args.projectId) {
        throw forbidden("Sprint not found in this project");
      }

      // Optimization: Fetch all issues in the sprint and filter by date in memory.
      // Sprints are typically small (<200 issues), whereas finding all issues in the project
      // within a date range could return thousands of items, most of which are not in the sprint.
      const sprintIssues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) =>
            q.eq("sprintId", args.sprintId as Id<"sprints">).lt("isDeleted", true),
          ),
        BOUNDED_LIST_LIMIT,
        "sprint issues by date",
      );

      return sprintIssues
        .filter((i) => i.dueDate !== undefined && i.dueDate >= args.from && i.dueDate <= args.to)
        .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
    }

    // Fallback: Use date range index for project-wide query
    const issues = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_project_due_date", (q) =>
          q.eq("projectId", args.projectId).gte("dueDate", args.from).lte("dueDate", args.to),
        )
        .filter(notDeleted),
      BOUNDED_LIST_LIMIT,
      "issues by date range",
    );

    // Optimization: Return raw issues instead of enriching them.
    // CalendarView only uses basic fields (title, status, priority) and does not display
    // assignee, reporter, or labels, so we skip the expensive enrichment (N+1 lookups).
    return issues;
  },
});
