import type { SearchFilterBuilder, SearchFilterFinalizer } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

// Get the search index config type for issues table
type IssuesSearchIndex = DataModel["issues"]["searchIndexes"]["search_title"];

/**
 * Helper to apply singular filters (type, status, priority) to the search query.
 *
 * OPTIMIZATION NOTE:
 * Convex search indexes only support simple equality checks. They do not support "IN" clauses
 * or complex OR logic for fields other than the search text itself.
 *
 * Therefore, this helper ONLY applies filters if a single value is provided.
 * If multiple values are provided (e.g. status=["todo", "inprogress"]), the filter
 * is skipped here and must be applied in-memory by the caller.
 */
function applySingularFilters(
  q: SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex>,
  args: {
    type?: string[];
    status?: string[];
    priority?: string[];
  },
): SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex> {
  let searchQ = q;

  const singleType =
    args.type?.length === 1
      ? (args.type[0] as "task" | "bug" | "story" | "epic" | "subtask")
      : null;
  if (singleType) {
    searchQ = searchQ.eq("type", singleType);
  }

  const singleStatus = args.status?.length === 1 ? args.status[0] : null;
  if (singleStatus) {
    searchQ = searchQ.eq("status", singleStatus);
  }

  const singlePriority =
    args.priority?.length === 1
      ? (args.priority[0] as "high" | "low" | "lowest" | "medium" | "highest")
      : null;
  if (singlePriority) {
    searchQ = searchQ.eq("priority", singlePriority);
  }

  return searchQ;
}

/**
 * Helper to apply user filters (assignee, reporter) to the search query.
 *
 * Handles special values:
 * - "me": Resolves to the current user's ID.
 * - "unassigned": Ignored here (search indexes don't support "is null" well with other filters).
 *   This case must be handled in-memory by the caller.
 */
function applyUserFilters(
  q: SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex>,
  args: {
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
  },
  userId: Id<"users">,
): SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex> {
  let searchQ = q;

  if (args.assigneeId === "me") {
    searchQ = searchQ.eq("assigneeId", userId);
  } else if (args.assigneeId && args.assigneeId !== "unassigned") {
    searchQ = searchQ.eq("assigneeId", args.assigneeId as Id<"users">);
  }

  if (args.reporterId) {
    searchQ = searchQ.eq("reporterId", args.reporterId);
  }

  return searchQ;
}

/**
 * Constructs a Convex search query for issues using the `search_title` index.
 *
 * This function optimizes the search by pushing supported filters down to the
 * search engine. It attempts to filter by `projectId`, `organizationId`,
 * `assigneeId`, `reporterId`, `sprintId`, `epicId`, and `labels` directly in the index.
 *
 * LIMITATIONS & GOTCHAS:
 * 1. Single-Value Only: For `type`, `status`, and `priority`, filters are ONLY applied
 *    if a single value is provided. Multi-value filters (e.g. status IN [...]) are
 *    ignored here and MUST be handled in-memory by the caller.
 * 2. Label Semantics: Label filters are applied with AND semantics. If multiple labels
 *    are provided, the issue must contain ALL of them.
 * 3. Special Values: `assigneeId="unassigned"` is ignored and must be filtered in-memory.
 *
 * @param q - The initial search filter builder.
 * @param args - Search arguments and filters.
 * @param userId - The current user's ID (for resolving "me").
 * @returns The final search filter builder.
 */
export function buildIssueSearch(
  q: SearchFilterBuilder<Doc<"issues">, IssuesSearchIndex>,
  args: {
    query: string;
    projectId?: Id<"projects">;
    organizationId?: Id<"organizations">;
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
    type?: string[];
    status?: string[];
    priority?: string[];
    sprintId?: Id<"sprints"> | "backlog" | "none";
    epicId?: Id<"issues"> | "none";
    labels?: string[];
  },
  userId: Id<"users">,
): SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex> {
  let searchQ = q.search("searchContent", args.query);

  if (args.projectId) {
    searchQ = searchQ.eq("projectId", args.projectId);
  }
  if (args.organizationId) {
    searchQ = searchQ.eq("organizationId", args.organizationId);
  }

  searchQ = applySingularFilters(searchQ, args);
  searchQ = applyUserFilters(searchQ, args, userId);

  // Handle sprintId (only specific sprint ID, not backlog/none)
  if (args.sprintId && args.sprintId !== "backlog" && args.sprintId !== "none") {
    searchQ = searchQ.eq("sprintId", args.sprintId);
  }

  // Handle epicId (only specific epic ID, not none)
  if (args.epicId && args.epicId !== "none") {
    searchQ = searchQ.eq("epicId", args.epicId);
  }

  // Handle labels (match all labels)
  if (args.labels && args.labels.length > 0) {
    for (const label of args.labels) {
      // Use unknown cast to bypass string[] check while keeping it safer than any
      searchQ = searchQ.eq("labels", label as unknown as string[]);
    }
  }

  return searchQ;
}
