import type { Id } from "../_generated/dataModel";

// Define a local interface for the query builder compatible with q in .withSearchIndex("index", (q) => ...)
// Since SearchBuilder is not exported from convex/server
export interface SearchFilterBuilder<T extends string> {
  search(field: string, query: string): SearchFilterBuilder<T>;
  eq(field: string, value: any): SearchFilterBuilder<T>;
}

export function buildIssueSearch(
  q: SearchFilterBuilder<"issues">,
  args: {
    query: string;
    projectId?: Id<"projects">;
    organizationId?: Id<"organizations">;
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
    type?: string[];
    status?: string[];
    priority?: string[];
  },
  userId: Id<"users">,
) {
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

  return searchQ;
}
