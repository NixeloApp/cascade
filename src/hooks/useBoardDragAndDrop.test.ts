import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import { act, renderHook } from "@testing-library/react";
import { useMutation } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError } from "@/lib/toast";
import { useBoardDragAndDrop } from "./useBoardDragAndDrop";

// Mock dependencies
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

vi.mock("./boardOptimisticUpdates", () => ({
  optimisticBoardUpdate: vi.fn(() => vi.fn()),
}));

const mockUpdateStatus = vi.fn();
const mockUpdateStatusByCategory = vi.fn();

// Add withOptimisticUpdate method
mockUpdateStatus.withOptimisticUpdate = vi.fn(() => mockUpdateStatus);

const createMockIssue = (overrides: Partial<EnrichedIssue> = {}): EnrichedIssue => ({
  _id: `issue-${Math.random().toString(36).slice(2)}` as Id<"issues">,
  _creationTime: Date.now(),
  key: "PROJ-1",
  title: "Test Issue",
  status: "todo",
  type: "task",
  priority: "medium",
  order: 1,
  projectId: "project-1" as Id<"projects">,
  createdBy: "user-1" as Id<"users">,
  ...overrides,
});

describe("useBoardDragAndDrop", () => {
  const mockPushHistoryAction = vi.fn();

  const defaultOptions = {
    allIssues: [] as EnrichedIssue[],
    issuesByStatus: {} as Record<string, EnrichedIssue[]>,
    isTeamMode: false,
    pushHistoryAction: mockPushHistoryAction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Use mockReturnValue (not Once) so it returns the same value every time
    (useMutation as Mock).mockImplementation((api) => {
      // Return appropriate mock based on which API is being used
      // First call is updateStatus, second is updateStatusByCategory
      return mockUpdateStatus;
    });
    // Override for the actual test usage - since both mutations are called in sequence
    (useMutation as Mock)
      .mockReturnValueOnce(mockUpdateStatus)
      .mockReturnValueOnce(mockUpdateStatusByCategory);
    mockUpdateStatus.mockResolvedValue(undefined);
    mockUpdateStatusByCategory.mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("should start with isDragging false", () => {
      const { result } = renderHook(() => useBoardDragAndDrop(defaultOptions));

      expect(result.current.isDragging).toBe(false);
    });

    it("should return all required handlers", () => {
      const { result } = renderHook(() => useBoardDragAndDrop(defaultOptions));

      expect(result.current.handleDragStateChange).toBeInstanceOf(Function);
      expect(result.current.handleIssueDrop).toBeInstanceOf(Function);
      expect(result.current.handleIssueReorder).toBeInstanceOf(Function);
    });
  });

  describe("handleDragStateChange", () => {
    it("should set isDragging to true", () => {
      const { result } = renderHook(() => useBoardDragAndDrop(defaultOptions));

      act(() => {
        result.current.handleDragStateChange(true);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it("should set isDragging to false", () => {
      const { result } = renderHook(() => useBoardDragAndDrop(defaultOptions));

      act(() => {
        result.current.handleDragStateChange(true);
      });
      act(() => {
        result.current.handleDragStateChange(false);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("handleIssueDrop", () => {
    it("should skip if dropping on same status", async () => {
      const issue = createMockIssue({ _id: "issue-1" as Id<"issues">, status: "todo" });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop("issue-1" as Id<"issues">, "todo", "todo");
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it("should skip if issue not found", async () => {
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [],
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "nonexistent" as Id<"issues">,
          "todo",
          "in-progress",
        );
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it("should call updateIssueStatus with correct parameters", async () => {
      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue], "in-progress": [] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "in-progress",
        );
      });

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        issueId: "issue-1",
        newStatus: "in-progress",
        newOrder: 0, // First in empty column
      });
    });

    it("should push history action in non-team mode", async () => {
      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
        title: "Test Issue",
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue], "in-progress": [] },
          isTeamMode: false,
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "in-progress",
        );
      });

      expect(mockPushHistoryAction).toHaveBeenCalledWith({
        issueId: "issue-1",
        oldStatus: "todo",
        newStatus: "in-progress",
        oldOrder: 1,
        newOrder: 0,
        issueTitle: "Test Issue",
        isTeamMode: false,
      });
    });

    it("should use updateStatusByCategory in team mode", async () => {
      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue], inprogress: [] },
          isTeamMode: true,
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "inprogress",
        );
      });

      expect(mockUpdateStatusByCategory).toHaveBeenCalledWith({
        issueId: "issue-1",
        category: "inprogress",
        newOrder: 0,
      });
    });

    it("should not push history in team mode", async () => {
      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue], inprogress: [] },
          isTeamMode: true,
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "inprogress",
        );
      });

      expect(mockPushHistoryAction).not.toHaveBeenCalled();
    });

    it("should show error on mutation failure", async () => {
      const error = new Error("Network error");
      mockUpdateStatus.mockRejectedValue(error);

      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
          issuesByStatus: { todo: [issue], "in-progress": [] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "in-progress",
        );
      });

      expect(showError).toHaveBeenCalledWith(error, "Failed to update issue status");
    });

    it("should calculate order correctly when target column has issues", async () => {
      const issue = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const existingIssue = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "in-progress",
        order: 5,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue, existingIssue],
          issuesByStatus: { todo: [issue], "in-progress": [existingIssue] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueDrop(
          "issue-1" as Id<"issues">,
          "todo",
          "in-progress",
        );
      });

      // Should be max order + 1 = 6
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newOrder: 6,
        }),
      );
    });
  });

  describe("handleIssueReorder", () => {
    it("should skip if dragged issue not found", async () => {
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [],
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "nonexistent" as Id<"issues">,
          "todo",
          "target" as Id<"issues">,
          "todo",
          "top",
        );
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it("should skip if target issue not found", async () => {
      const issue = createMockIssue({ _id: "issue-1" as Id<"issues"> });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue],
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "nonexistent" as Id<"issues">,
          "todo",
          "top",
        );
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it("should call updateIssueStatus for reorder", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 2,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2],
          issuesByStatus: { todo: [issue1, issue2] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "bottom",
        );
      });

      expect(mockUpdateStatus).toHaveBeenCalled();
    });

    it("should push history action for reorder in non-team mode", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
        title: "Issue One",
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 2,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2],
          issuesByStatus: { todo: [issue1, issue2] },
          isTeamMode: false,
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "bottom",
        );
      });

      expect(mockPushHistoryAction).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: "issue-1",
          oldStatus: "todo",
          newStatus: "todo",
          issueTitle: "Issue One",
        }),
      );
    });

    it("should show error on reorder mutation failure", async () => {
      const error = new Error("Reorder failed");
      mockUpdateStatus.mockRejectedValue(error);

      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 1,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 2,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2],
          issuesByStatus: { todo: [issue1, issue2] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "bottom",
        );
      });

      expect(showError).toHaveBeenCalledWith(error, "Failed to reorder issue");
    });

    it("should calculate correct order for top edge drop", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 10,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 20,
      });
      const issue3 = createMockIssue({
        _id: "issue-3" as Id<"issues">,
        status: "todo",
        order: 30,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2, issue3],
          issuesByStatus: { todo: [issue1, issue2, issue3] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-3" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "top",
        );
      });

      // New order should be between issue1 (10) and issue2 (20) = 15
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newOrder: 15,
        }),
      );
    });

    it("should calculate correct order for bottom edge drop", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 10,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 20,
      });
      const issue3 = createMockIssue({
        _id: "issue-3" as Id<"issues">,
        status: "todo",
        order: 30,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2, issue3],
          issuesByStatus: { todo: [issue1, issue2, issue3] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "bottom",
        );
      });

      // New order should be between issue2 (20) and issue3 (30) = 25
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newOrder: 25,
        }),
      );
    });

    it("should handle drop at beginning of list (top edge of first item)", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 10,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 20,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2],
          issuesByStatus: { todo: [issue1, issue2] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-2" as Id<"issues">,
          "todo",
          "issue-1" as Id<"issues">,
          "todo",
          "top",
        );
      });

      // New order should be targetOrder - 1 = 9
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newOrder: 9,
        }),
      );
    });

    it("should handle drop at end of list (bottom edge of last item)", async () => {
      const issue1 = createMockIssue({
        _id: "issue-1" as Id<"issues">,
        status: "todo",
        order: 10,
      });
      const issue2 = createMockIssue({
        _id: "issue-2" as Id<"issues">,
        status: "todo",
        order: 20,
      });
      const { result } = renderHook(() =>
        useBoardDragAndDrop({
          ...defaultOptions,
          allIssues: [issue1, issue2],
          issuesByStatus: { todo: [issue1, issue2] },
        }),
      );

      await act(async () => {
        await result.current.handleIssueReorder(
          "issue-1" as Id<"issues">,
          "todo",
          "issue-2" as Id<"issues">,
          "todo",
          "bottom",
        );
      });

      // New order should be targetOrder + 1 = 21
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newOrder: 21,
        }),
      );
    });
  });
});
