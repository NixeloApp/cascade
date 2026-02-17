import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { act, renderHook, waitFor } from "@/test/custom-render";
import { usePaginatedIssues } from "./usePaginatedIssues";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: {
      listProjectIssues: "api.issues.listProjectIssues",
      getIssueCounts: "api.issues.getIssueCounts",
    },
  },
}));

const mockIssues = [
  {
    _id: "issue1" as Id<"issues">,
    _creationTime: Date.now(),
    title: "Fix bug",
    key: "PROJ-1",
    status: "in_progress",
    priority: "high",
    type: "bug",
    order: 1,
    projectId: "project1" as Id<"projects">,
  },
  {
    _id: "issue2" as Id<"issues">,
    _creationTime: Date.now(),
    title: "Add feature",
    key: "PROJ-2",
    status: "todo",
    priority: "medium",
    type: "feature",
    order: 2,
    projectId: "project1" as Id<"projects">,
  },
];

const mockCounts = {
  in_progress: { total: 5, completed: 2 },
  todo: { total: 10, completed: 0 },
  done: { total: 20, completed: 20 },
};

const projectId = "project1" as Id<"projects">;

describe("usePaginatedIssues", () => {
  const mockLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadMore.mockClear();
  });

  describe("Loading State", () => {
    it("should return isLoading=true when loading first page", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "LoadingFirstPage",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.issues).toEqual([]);
    });

    it("should return isLoadingMore=true when loading more pages", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "LoadingMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingMore).toBe(true);
    });
  });

  describe("Data Loading", () => {
    it("should return issues when loaded", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.issues).toEqual(mockIssues);
      expect(result.current.issues.length).toBe(2);
    });

    it("should return empty array when no results", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: undefined,
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.issues).toEqual([]);
    });
  });

  describe("Total Count", () => {
    it("should calculate total count from all statuses", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      // 5 + 10 + 20 = 35
      expect(result.current.totalCount).toBe(35);
    });

    it("should return count for specific status when filtered", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId, status: "in_progress" }));

      expect(result.current.totalCount).toBe(5);
    });

    it("should return 0 when counts not loaded", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.totalCount).toBe(0);
    });

    it("should return 0 for non-existent status", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId, status: "nonexistent" }));

      expect(result.current.totalCount).toBe(0);
    });
  });

  describe("Pagination", () => {
    it("should return hasMore=true when more pages available", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.hasMore).toBe(true);
    });

    it("should return hasMore=false when exhausted", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(result.current.hasMore).toBe(false);
    });

    it("should call loadMore when hasMore is true", async () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId, pageSize: 25 }));

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledWith(25);
      });
    });

    it("should not call loadMore when exhausted", async () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(mockLoadMore).not.toHaveBeenCalled();
      });
    });
  });

  describe("Options", () => {
    it("should use default pageSize of 50", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      renderHook(() => usePaginatedIssues({ projectId }));

      expect(usePaginatedQuery).toHaveBeenCalledWith(
        "api.issues.listProjectIssues",
        { projectId, sprintId: undefined, status: undefined },
        { initialNumItems: 50 },
      );
    });

    it("should pass sprintId when provided", () => {
      const sprintId = "sprint1" as Id<"sprints">;
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      renderHook(() => usePaginatedIssues({ projectId, sprintId }));

      expect(usePaginatedQuery).toHaveBeenCalledWith(
        "api.issues.listProjectIssues",
        { projectId, sprintId, status: undefined },
        { initialNumItems: 50 },
      );
    });

    it("should pass status when provided", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      renderHook(() => usePaginatedIssues({ projectId, status: "in_progress" }));

      expect(usePaginatedQuery).toHaveBeenCalledWith(
        "api.issues.listProjectIssues",
        { projectId, sprintId: undefined, status: "in_progress" },
        { initialNumItems: 50 },
      );
    });

    it("should use custom pageSize", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      renderHook(() => usePaginatedIssues({ projectId, pageSize: 100 }));

      expect(usePaginatedQuery).toHaveBeenCalledWith(
        "api.issues.listProjectIssues",
        { projectId, sprintId: undefined, status: undefined },
        { initialNumItems: 100 },
      );
    });
  });

  describe("Reset", () => {
    it("should provide reset function", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: mockIssues,
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });
      (useQuery as Mock).mockReturnValue(mockCounts);

      const { result } = renderHook(() => usePaginatedIssues({ projectId }));

      expect(typeof result.current.reset).toBe("function");
      // Reset is a no-op since usePaginatedQuery handles it
      expect(() => result.current.reset()).not.toThrow();
    });
  });
});
