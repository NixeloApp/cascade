import type { SearchFilterBuilder, SearchFilterFinalizer } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

// Get the search index config type for issues table
type IssuesSearchIndex = DataModel["issues"]["searchIndexes"]["search_title"];

// Helper to apply singular filters (type, status, priority)
function applySingularFilters(
  q: SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex>,
  args: {
    type?: string[];
    status?: string[];
    priority?: string[];
  },
) {
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

// Helper to apply user filters (assignee, reporter)
function applyUserFilters(
  q: SearchFilterFinalizer<Doc<"issues">, IssuesSearchIndex>,
  args: {
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
  },
  userId: Id<"users">,
) {
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
