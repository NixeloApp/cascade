import type { Id } from "@convex/_generated/dataModel";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock dependencies
const { MockIcon } = vi.hoisted(() => ({
  MockIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
}));

// Mock drag and drop
vi.mock("@atlaskit/pragmatic-drag-and-drop-auto-scroll/element", () => ({
  autoScrollForElements: vi.fn(() => vi.fn()),
}));

vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: vi.fn(() => vi.fn()),
  draggable: vi.fn(() => vi.fn()),
}));

vi.mock("@atlaskit/pragmatic-drag-and-drop/combine", () => ({
  combine: vi.fn((...fns: (() => void)[]) => () => {
    for (const fn of fns) fn?.();
  }),
}));

// Mock custom hooks with complete SmartBoardData type
vi.mock("@/hooks/useSmartBoardData", () => ({
  useSmartBoardData: vi.fn(() => ({
    issuesByStatus: {},
    statusCounts: {},
    isLoading: false,
    loadMoreDone: vi.fn(),
    isLoadingMore: false,
    workflowStates: [],
    doneStatusesWithMore: [],
    hiddenDoneCount: 0,
  })),
}));

vi.mock("@/hooks/useBoardHistory", () => ({
  useBoardHistory: vi.fn(() => ({
    historyStack: [],
    redoStack: [],
    handleUndo: vi.fn(),
    handleRedo: vi.fn(),
    pushAction: vi.fn(),
  })),
}));

vi.mock("@/hooks/useBoardDragAndDrop", () => ({
  useBoardDragAndDrop: vi.fn(() => ({
    handleIssueDrop: vi.fn(),
    handleIssueReorder: vi.fn(),
  })),
}));

vi.mock("@/hooks/useListNavigation", () => ({
  useListNavigation: vi.fn(() => ({
    selectedIndex: -1,
  })),
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/issue-utils")>();
  return {
    ...actual,
    getWorkflowCategoryColor: vi.fn(() => "border-t-status-info"),
    getTypeLabel: vi.fn((type: string) => type),
    getPriorityColor: vi.fn(() => "text-priority-medium"),
    ISSUE_TYPE_ICONS: {
      bug: MockIcon,
      story: MockIcon,
      epic: MockIcon,
      subtask: MockIcon,
      task: MockIcon,
    },
    PRIORITY_ICONS: {
      highest: MockIcon,
      high: MockIcon,
      medium: MockIcon,
      low: MockIcon,
      lowest: MockIcon,
    },
  };
});

// Import after mocks
import { useQuery } from "convex/react";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import { KanbanBoard } from "./KanbanBoard";

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading skeleton when data is loading", () => {
      vi.mocked(useSmartBoardData).mockReturnValue({
        issuesByStatus: {},
        statusCounts: {},
        isLoading: true,
        loadMoreDone: vi.fn(),
        isLoadingMore: false,
        workflowStates: [],
        doneStatusesWithMore: [],
        hiddenDoneCount: 0,
      });

      render(<KanbanBoard projectId={"proj-1" as Id<"projects">} />);

      // Loading skeleton should be visible
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Project Mode", () => {
    it("should render board with project workflow states", () => {
      const mockProject = {
        _id: "proj-1" as Id<"projects">,
        name: "Test Project",
        key: "TEST",
        userRole: "admin",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "done", name: "Done", category: "done", order: 1 },
        ],
      };

      vi.mocked(useQuery).mockReturnValue(mockProject);
      vi.mocked(useSmartBoardData).mockReturnValue({
        issuesByStatus: { todo: [], done: [] },
        statusCounts: {},
        isLoading: false,
        loadMoreDone: vi.fn(),
        isLoadingMore: false,
        workflowStates: [],
        doneStatusesWithMore: [],
        hiddenDoneCount: 0,
      });

      render(<KanbanBoard projectId={"proj-1" as Id<"projects">} />);

      // Columns should be rendered
      expect(screen.getByRole("region", { name: "To Do column" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Done column" })).toBeInTheDocument();
    });

    it("should render board toolbar", () => {
      const mockProject = {
        _id: "proj-1" as Id<"projects">,
        name: "Test Project",
        key: "TEST",
        userRole: "admin",
        workflowStates: [{ id: "todo", name: "To Do", category: "todo", order: 0 }],
      };

      vi.mocked(useQuery).mockReturnValue(mockProject);
      vi.mocked(useSmartBoardData).mockReturnValue({
        issuesByStatus: { todo: [] },
        statusCounts: {},
        isLoading: false,
        loadMoreDone: vi.fn(),
        isLoadingMore: false,
        workflowStates: [],
        doneStatusesWithMore: [],
        hiddenDoneCount: 0,
      });

      render(<KanbanBoard projectId={"proj-1" as Id<"projects">} />);

      // Toolbar should have selection mode button
      expect(screen.getByLabelText(/select.*issues/i)).toBeInTheDocument();
    });
  });

  describe("Team Mode", () => {
    it("should render board in team mode without create button", () => {
      vi.mocked(useSmartBoardData).mockReturnValue({
        issuesByStatus: { todo: [] },
        statusCounts: {},
        isLoading: false,
        loadMoreDone: vi.fn(),
        isLoadingMore: false,
        workflowStates: [{ id: "todo", name: "To Do", category: "todo", order: 0 }],
        doneStatusesWithMore: [],
        hiddenDoneCount: 0,
      });

      render(<KanbanBoard teamId={"team-1" as Id<"teams">} />);

      // Column should be rendered
      expect(screen.getByRole("region", { name: "To Do column" })).toBeInTheDocument();

      // Create button should NOT be present in team mode
      expect(screen.queryByLabelText(/add issue/i)).not.toBeInTheDocument();
    });
  });
});
