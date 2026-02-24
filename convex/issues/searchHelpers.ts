import type { SearchFilterBuilder, SearchFilterFinalizer } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

// Get the search index config type for issues table
type IssuesSearchIndex = DataModel["issues"]["searchIndexes"]["search_title"];

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

  // Handle singular filters
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

  // Handle assignee
  if (args.assigneeId === "me") {
    searchQ = searchQ.eq("assigneeId", userId);
  } else if (args.assigneeId && args.assigneeId !== "unassigned") {
    searchQ = searchQ.eq("assigneeId", args.assigneeId as Id<"users">);
  }

  // Handle reporter
  if (args.reporterId) {
    searchQ = searchQ.eq("reporterId", args.reporterId);
  }

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
      // Cast to any because eq() expects string[] based on schema, but runtime supports matching a single element
      searchQ = searchQ.eq("labels", label as any);
    }
  }

  return searchQ;
}
