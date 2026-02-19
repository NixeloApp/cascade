/**
 * Hook for cursor-based paginated issue loading
 *
 * Designed for list views where issues are loaded incrementally.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";

type PaginatedQuery = FunctionReference<"query", "public">;

export interface UsePaginatedIssuesOptions {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
  pageSize?: number;
}

export interface PaginatedIssuesResult {
  /** Loaded issues */
  issues: EnrichedIssue[];
  /** Total count of issues matching the query */
  totalCount: number;
  /** Whether there are more issues to load */
  hasMore: boolean;
  /** Load the next page of issues */
  loadMore: () => void;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether more data is being loaded */
  isLoadingMore: boolean;
  /** Reset pagination to start */
  reset: () => void;
}

/**
 * Hook for paginated issue loading in list views
 *
 * @example
 * const {
 *   issues,
 *   totalCount,
 *   hasMore,
 *   loadMore,
 *   isLoading,
 * } = usePaginatedIssues({
 *   projectId,
 *   status: "In Progress",
 *   pageSize: 25,
 * });
 */
export function usePaginatedIssues({
  projectId,
  sprintId,
  status,
  pageSize = 50,
}: UsePaginatedIssuesOptions): PaginatedIssuesResult {
  const {
    results: issues,
    status: queryStatus,
    loadMore: convexLoadMore,
  } = usePaginatedQuery(
    api.issues.listProjectIssues as PaginatedQuery,
    { projectId, sprintId, status },
    { initialNumItems: pageSize },
  ) as { results: EnrichedIssue[]; status: string; loadMore: (n: number) => void };

  const countsData = useQuery(api.issues.getIssueCounts, {
    projectId,
    sprintId,
  });

  const totalCount = !countsData
    ? 0
    : status
      ? countsData[status]?.total || 0
      : Object.values(countsData).reduce((acc, curr) => acc + (curr.total || 0), 0);

  const loadMore = () => {
    if (queryStatus === "CanLoadMore") {
      convexLoadMore(pageSize);
    }
  };

  const reset = () => {
    // usePaginatedQuery handles reset automatically when args change
  };

  return {
    issues: issues || [],
    totalCount,
    hasMore: queryStatus === "CanLoadMore",
    loadMore,
    isLoading: queryStatus === "LoadingFirstPage",
    isLoadingMore: queryStatus === "LoadingMore",
    reset,
  };
}
