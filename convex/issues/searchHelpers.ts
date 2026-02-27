import type { SearchFilterBuilder, SearchFilterFinalizer } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

// Get the search index config type for issues table
type IssuesSearchIndex = DataModel["issues"]["searchIndexes"]["search_title"];

/**
 * Applies singular filters (type, status, priority) to the search query.
 *
 * NOTE: Convex search indexes do not support "IN" queries or OR logic for filter fields.
 * Therefore, we can only apply these filters at the database level if a SINGLE value is provided.
 * If multiple values are provided (e.g., status=["todo", "inprogress"]), we skip the filter here
 * and rely on in-memory filtering later.
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
 * Applies user filters (assignee, reporter) to the search query.
 *
 * NOTE: Handles "me" alias for current user. Skips "unassigned" as it requires a specific
 * check (eq null) which might not be supported or is handled better in memory for search queries.
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
 * Constructs a Convex search query for issues.
 *
 * This helper translates high-level search arguments into a Convex `search_title` index query.
 * It optimizes for search relevance by pushing down as many filters as possible to the database level.
 *
 * IMPORTANT LIMITATIONS:
 * 1. **Multi-value filters**: Convex search indexes do not support "IN" clauses. Filters for `type`,
 *    `status`, and `priority` are ONLY applied if a single value is provided. If multiple values
 *    are requested, filtering is deferred to the in-memory step.
 * 2. **Special values**: Values like "unassigned" (assignee), "backlog" (sprint), and "none" (epic)
 *    are skipped here and must be handled in-memory.
 * 3. **Labels**: Multiple labels are treated with AND logic (must have all).
 *
 * @param q - The search query builder.
 * @param args - Search arguments including query text and filters.
 * @param userId - The ID of the current user (for "me" filters).
 * @returns The final search query with applied filters.
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
