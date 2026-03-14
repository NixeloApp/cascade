import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { renderHook } from "@/test/custom-render";
import { usePaginatedIssues } from "./usePaginatedIssues";

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const projectId = "project_1" as Id<"projects">;
const sprintId = "sprint_1" as Id<"sprints">;
const issueA = { _id: "issue_1" as Id<"issues">, title: "Refine roadmap" };
const issueB = { _id: "issue_2" as Id<"issues">, title: "Ship billing" };
const pageSize = 25;
const loadMore = vi.fn();

describe("usePaginatedIssues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaginatedQuery.mockReturnValue({
      results: [issueA, issueB],
      status: "CanLoadMore",
      isLoading: false,
      loadMore,
    });
    mockUseAuthenticatedQuery.mockReturnValue({
      todo: { total: 2 },
      done: { total: 3 },
    });
  });

  it("returns paginated issues, aggregates totals, and loads more when more pages exist", () => {
    const { result } = renderHook(() =>
      usePaginatedIssues({
        projectId,
        sprintId,
        pageSize,
      }),
    );

    expect(result.current.issues).toEqual([issueA, issueB]);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);

    result.current.loadMore();

    expect(loadMore).toHaveBeenCalledWith(pageSize);
  });

  it("uses the filtered status total and maps loading states correctly", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      isLoading: true,
      loadMore,
    });
    mockUseAuthenticatedQuery.mockReturnValue({
      todo: { total: 2 },
      done: { total: 3 },
    });

    const { result } = renderHook(() =>
      usePaginatedIssues({
        projectId,
        status: "done",
      }),
    );

    expect(result.current.issues).toEqual([]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("does not load more unless the paginated query can load more and handles missing counts", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [issueA],
      status: "LoadingMore",
      isLoading: true,
      loadMore,
    });
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      usePaginatedIssues({
        projectId,
      }),
    );

    expect(result.current.totalCount).toBe(0);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingMore).toBe(true);

    result.current.loadMore();
    result.current.reset();

    expect(loadMore).not.toHaveBeenCalled();
  });
});
