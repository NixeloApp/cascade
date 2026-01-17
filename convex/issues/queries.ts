import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { type QueryCtx, query } from "../_generated/server";
import { projectQuery } from "../customFunctions";
import { batchFetchUsers } from "../lib/batchHelpers";
import {
  type EnrichedIssue,
  enrichIssue,
  enrichIssues,
  fetchPaginatedIssues,
} from "../lib/issueHelpers";
import { notDeleted } from "../lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "../lib/userUtils";
import { canAccessProject } from "../projectAccess";
import { matchesSearchFilters, ROOT_ISSUE_TYPES } from "./helpers";

/**
 * List all issues assigned to or reported by the current user
 * Used by onboarding checklist to track user progress
 * Returns paginated results to handle users with many issues
 */
export const listByUser = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Paginate assigned issues
    const assignedResult = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .filter(notDeleted)
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

export const listRoadmapIssues = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) {
      return [];
    }

    let issues: Doc<"issues">[] = [];
    if (args.sprintId) {
      const allSprintIssues = await ctx.db
        .query("issues")
        .withIndex("by_project_sprint_created", (q) =>
          q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
        )
        .filter(notDeleted)
        .collect();

      issues = allSprintIssues.filter((i) =>
        (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );
    } else {
      const outcomes = await Promise.all(
        ROOT_ISSUE_TYPES.map((type) =>
          ctx.db
            .query("issues")
            .withIndex("by_project_type", (q) =>
              q.eq("projectId", args.projectId).eq("type", type as Doc<"issues">["type"]),
            )
            .filter(notDeleted)
            .collect(),
        ),
      );
      issues = outcomes.flat();
    }

    return await enrichIssues(ctx, issues);
  },
});

export const listRoadmapIssuesPaginated = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
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
        .withIndex("by_project_sprint_created", (q) =>
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
        q.eq("projectId", args.projectId).eq("type", ROOT_ISSUE_TYPES[0]),
      )
      .filter(notDeleted)
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await enrichIssues(ctx, result.page),
    };
  },
});

export const listSelectableIssues = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user has access to the project
    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) {
      return [];
    }

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(500);

    return issues
      .filter((i: Doc<"issues">) => !i.parentId && i.type !== "subtask")
      .map((i) => ({
        _id: i._id,
        key: i.key,
        title: i.title,
      }));
  },
});

export const listProjectIssues = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.sprintId) {
          return db
            .query("issues")
            .withIndex("by_project_sprint_created", (q) =>
              q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
            )
            .order("desc");
        }
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_project_status", (q) =>
              q.eq("projectId", args.projectId).eq("status", args.status as string),
            )
            .order("desc");
        }
        return db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .order("desc");
      },
    });
  },
});

export const listTeamIssues = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
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
              q.eq("teamId", args.teamId).eq("status", args.status as string),
            )
            .order("desc");
        }
        return db
          .query("issues")
          .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
          .order("desc");
      },
    });
  },
});

export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const issue = await ctx.db.get(args.id);

    if (!issue) {
      return null;
    }

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      return null;
    }

    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
      if (!hasAccess) {
        throw new Error("Not authorized to access this issue");
      }
    } else {
      if (!project.isPublic) {
        throw new Error("Not authorized to access this issue");
      }
    }

    const [comments, activities, enriched]: [
      Doc<"issueComments">[],
      Doc<"issueActivity">[],
      EnrichedIssue,
    ] = await Promise.all([
      ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", args.id))
        .order("asc")
        .take(200),
      ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", args.id))
        .order("desc")
        .take(20),
      enrichIssue(ctx, issue),
    ]);

    const commentAuthorIds = comments.map((c) => c.authorId);
    const activityUserIds = activities.map((a) => a.userId);
    const allUserIds = [...commentAuthorIds, ...activityUserIds];
    const userMap = await batchFetchUsers(ctx, allUserIds);

    const commentsWithAuthors = comments.map((comment) => {
      const author = userMap.get(comment.authorId);
      return {
        ...comment,
        author: author
          ? {
              _id: author._id,
              name: author.name || author.email || "Unknown",
              email: author.email,
              image: author.image,
            }
          : null,
      };
    });

    const activity = activities.map((act) => {
      const user = userMap.get(act.userId);
      return {
        ...act,
        user: sanitizeUserForAuth(user),
      };
    });

    return {
      ...enriched,
      project,
      comments: commentsWithAuthors,
      activity,
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

    if (!issue) {
      throw new Error("Issue not found");
    }

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      throw new Error("Project not found");
    }

    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
      if (!hasAccess) {
        throw new Error("Not authorized to access this issue");
      }
    } else {
      if (!project.isPublic) {
        throw new Error("Not authorized to access this issue");
      }
    }

    const results = await ctx.db
      .query("issueComments")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("asc")
      .paginate(args.paginationOpts);

    const authorIds = results.page.map((c) => c.authorId);
    const userMap = await batchFetchUsers(ctx, authorIds);

    const enrichedPage = results.page.map((comment) => {
      const author = userMap.get(comment.authorId);
      return {
        ...comment,
        author: author
          ? {
              _id: author._id,
              name: author.name || author.email || "Unknown",
              email: author.email,
              image: author.image,
            }
          : null,
      };
    });

    return {
      ...results,
      page: enrichedPage,
    };
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)
      .first();

    if (!issue) {
      return null;
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId, userId);
      if (!hasAccess) {
        return null;
      }
    } else {
      // Unauthenticated users can only see issues in public projects
      const project = await ctx.db.get(issue.projectId);
      if (!project?.isPublic) {
        return null;
      }
    }

    return await enrichIssue(ctx, issue);
  },
});

export const listSubtasks = query({
  args: { parentId: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const parentIssue = await ctx.db.get(args.parentId);
    if (!parentIssue) {
      return [];
    }

    const project = await ctx.db.get(parentIssue.projectId as Id<"projects">);
    if (!project) {
      return [];
    }

    const subtasks = await ctx.db
      .query("issues")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter(notDeleted)
      .collect();

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

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], total: 0 };

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    let issues: Doc<"issues">[] = [];

    // If query is provided, use search index
    if (args.query) {
      issues = await ctx.db
        .query("issues")
        .withSearchIndex("search_title", (q) => q.search("searchContent", args.query as string))
        .filter(notDeleted)
        .collect();
    } else if (args.projectId) {
      // If no query but projectId, use by_project index
      issues = await ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId as Id<"projects">))
        .filter(notDeleted)
        .order("desc")
        .collect();
    } else {
      // Return empty if no filter is provided to prevent scanning the entire table
      return { page: [], total: 0 };
    }

    // Apply advanced filters in memory
    const filteredIssues = issues.filter((issue: Doc<"issues">) =>
      matchesSearchFilters(issue, args, userId),
    );

    // Return paginated slice
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays);

    const workflowStates = ctx.project.workflowStates;
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        const q = (() => {
          if (args.sprintId) {
            let query = ctx.db.query("issues").withIndex("by_project_sprint_status", (q) =>
              q
                .eq("projectId", ctx.project._id)
                .eq("sprintId", args.sprintId as Id<"sprints">)
                .eq("status", state.id),
            );

            if (state.category === "done") {
              query = query.filter((q) => q.gte(q.field("updatedAt"), doneThreshold));
            }

            return query.filter(notDeleted);
          }

          if (state.category === "done") {
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

          return ctx.db
            .query("issues")
            .withIndex("by_project_status_updated", (q) =>
              q.eq("projectId", ctx.project._id).eq("status", state.id),
            )
            .filter(notDeleted);
        })();

        issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
      }),
    );

    // Enrich all issues by status
    const enrichedIssuesByStatus: Record<string, EnrichedIssue[]> = {};
    for (const [statusId, issues] of Object.entries(issuesByColumn)) {
      enrichedIssuesByStatus[statusId] = await enrichIssues(ctx, issues);
    }

    return {
      issuesByStatus: enrichedIssuesByStatus,
      workflowStates: workflowStates,
    };
  },
});

export const listByTeamSmart = query({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
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

    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays);
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        let q = ctx.db
          .query("issues")
          .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", state.id))
          .filter(notDeleted);

        if (state.category === "done") {
          q = q.filter((q) => q.gte(q.field("updatedAt"), doneThreshold));
        }

        issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
      }),
    );

    const allIssues = Object.values(issuesByColumn).flat();
    return await enrichIssues(ctx, allIssues);
  },
});

export const getTeamIssueCounts = query({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const workflowStates = [
      { id: "todo", name: "To Do", category: "todo", order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress", order: 1 },
      { id: "done", name: "Done", category: "done", order: 2 },
    ];

    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays);
    const counts: Record<string, { total: number; visible: number; hidden: number }> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        const allIssues = await ctx.db
          .query("issues")
          .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", state.id))
          .filter(notDeleted)
          .collect();

        if (state.category === "done") {
          const visible = allIssues.filter((i) => i.updatedAt >= doneThreshold);
          counts[state.id] = {
            total: allIssues.length,
            visible: Math.min(visible.length, DEFAULT_PAGE_SIZE),
            hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
          };
        } else {
          counts[state.id] = {
            total: allIssues.length,
            visible: Math.min(allIssues.length, DEFAULT_PAGE_SIZE),
            hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
          };
        }
      }),
    );

    return counts;
  },
});

export const getIssueCounts = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) return null;

    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays);
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
          const allIssues = await ctx.db
            .query("issues")
            .withIndex("by_project_status", (q) =>
              q.eq("projectId", args.projectId).eq("status", state.id),
            )
            .filter(notDeleted)
            .collect();

          if (state.category === "done") {
            const visibleCount = allIssues.filter((i) => i.updatedAt >= doneThreshold).length;
            addCounts(state.id, {
              total: allIssues.length,
              visible: Math.min(visibleCount, DEFAULT_PAGE_SIZE),
              hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
            });
          } else {
            addCounts(state.id, {
              total: allIssues.length,
              visible: Math.min(allIssues.length, DEFAULT_PAGE_SIZE),
              hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
            });
          }
        }),
      );
    }

    return counts;
  },
});

export const loadMoreDoneIssues = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    beforeTimestamp: v.optional(v.number()),
    beforeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    const outcomes = await Promise.all(
      doneStates.map(async (status) => {
        let q = ctx.db
          .query("issues")
          .withIndex("by_project_status_updated", (q) =>
            q.eq("projectId", args.projectId).eq("status", status),
          )
          .filter(notDeleted);

        if (args.sprintId) {
          q = q.filter((q) => q.eq(q.field("sprintId"), args.sprintId));
        }

        if (args.beforeTimestamp) {
          q = q.filter((q) => q.lt(q.field("updatedAt"), args.beforeTimestamp as number));
        }

        return await q.take(args.limit ?? DEFAULT_PAGE_SIZE);
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
  await Promise.all(
    workflowStates.map(async (state: { id: string; category: string }) => {
      const allIssues = await ctx.db
        .query("issues")
        .withIndex("by_project_sprint_status", (q) =>
          q.eq("projectId", projectId).eq("sprintId", sprintId).eq("status", state.id),
        )
        .filter(notDeleted)
        .collect();

      if (state.category === "done") {
        const visibleCount = allIssues.filter(
          (i: Doc<"issues">) => i.updatedAt >= doneThreshold,
        ).length;
        addCounts(state.id, {
          total: allIssues.length,
          visible: Math.min(visibleCount, DEFAULT_PAGE_SIZE),
          hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
        });
      } else {
        addCounts(state.id, {
          total: allIssues.length,
          visible: Math.min(allIssues.length, DEFAULT_PAGE_SIZE),
          hidden: Math.max(0, allIssues.length - DEFAULT_PAGE_SIZE),
        });
      }
    }),
  );
}

export const listIssuesByDateRange = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) {
      return [];
    }

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project_due_date", (q) =>
        q.eq("projectId", args.projectId).gte("dueDate", args.from).lte("dueDate", args.to),
      )
      .filter(notDeleted)
      .collect();

    // If sprintId is provided, filter in memory
    const filteredIssues = args.sprintId
      ? issues.filter((i) => i.sprintId === args.sprintId)
      : issues;

    // Optimization: Return raw issues instead of enriching them.
    // CalendarView only uses basic fields (title, status, priority) and does not display
    // assignee, reporter, or labels, so we skip the expensive enrichment (N+1 lookups).
    return filteredIssues;
  },
});
