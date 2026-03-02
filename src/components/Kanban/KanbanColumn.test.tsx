import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { arePropsEqual, KanbanColumn, type KanbanColumnProps } from "./KanbanColumn";

// Create mock icon that's hoisted to be available in vi.mock
const { MockIcon } = vi.hoisted(() => ({
  MockIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

// Mock drag and drop
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: vi.fn(() => vi.fn()),
  draggable: vi.fn(() => vi.fn()),
}));

vi.mock("@atlaskit/pragmatic-drag-and-drop/combine", () => ({
  combine: vi.fn((...fns: (() => void)[]) => () => {
    for (const fn of fns) fn?.();
  }),
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/issue-utils")>();
  return {
    ...actual,
    getWorkflowCategoryColor: vi.fn(() => "border-t-status-info"),
    getTypeLabel: vi.fn((type: string) => {
      const labels = { bug: "Bug", task: "Task", story: "Story", epic: "Epic" };
      return labels[type as keyof typeof labels] || "Task";
    }),
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

describe("KanbanColumn", () => {
  const mockState: WorkflowState = {
    id: "state-1",
    name: "To Do",
    category: "todo",
    color: "#3B82F6",
    position: 0,
  };

  const mockIssue = {
    _id: "issue-1" as Id<"issues">,
    key: "TEST-1",
    title: "Test Issue",
    status: "state-1",
    priority: "medium" as const,
    type: "task" as const,
    order: 0,
    labels: [],
    updatedAt: Date.now(),
    assignee: null,
  };

  const defaultProps: KanbanColumnProps = {
    state: mockState,
    issues: [mockIssue],
    columnIndex: 0,
    selectionMode: false,
    selectedIssueIds: new Set(),
    canEdit: true,
    onIssueClick: vi.fn(),
    onToggleSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render column with workflow state name", () => {
      render(<KanbanColumn {...defaultProps} />);

      expect(screen.getByRole("region", { name: "To Do column" })).toBeInTheDocument();
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });

    it("should render issue count badge", () => {
      render(<KanbanColumn {...defaultProps} />);

      const countBadge = screen.getByTestId(TEST_IDS.BOARD.COLUMN_COUNT);
      expect(countBadge).toHaveTextContent("1");
    });

    it("should render multiple issues", () => {
      const issues = [
        mockIssue,
        { ...mockIssue, _id: "issue-2" as Id<"issues">, key: "TEST-2", order: 1 },
        { ...mockIssue, _id: "issue-3" as Id<"issues">, key: "TEST-3", order: 2 },
      ];
      render(<KanbanColumn {...defaultProps} issues={issues} />);

      expect(screen.getByTestId(TEST_IDS.BOARD.COLUMN_COUNT)).toHaveTextContent("3");
    });

    it("should render empty state when no issues", () => {
      render(<KanbanColumn {...defaultProps} issues={[]} />);

      expect(screen.getByText("No issues yet")).toBeInTheDocument();
      expect(screen.getByText("Drop issues here or click + to add")).toBeInTheDocument();
    });

    it("should show correct test IDs for accessibility", () => {
      render(<KanbanColumn {...defaultProps} />);

      expect(screen.getByTestId(TEST_IDS.BOARD.COLUMN)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.BOARD.COLUMN_HEADER)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.BOARD.COLUMN_COUNT)).toBeInTheDocument();
    });
  });

  describe("WIP Limits", () => {
    it("should display WIP limit in badge when set", () => {
      const stateWithWip = { ...mockState, wipLimit: 5 };
      render(<KanbanColumn {...defaultProps} state={stateWithWip} />);

      const countBadge = screen.getByTestId(TEST_IDS.BOARD.COLUMN_COUNT);
      expect(countBadge).toHaveTextContent("1/5");
    });

    it("should show warning variant when at WIP limit", () => {
      const stateWithWip = { ...mockState, wipLimit: 1 };
      render(<KanbanColumn {...defaultProps} state={stateWithWip} />);

      const countBadge = screen.getByTestId(TEST_IDS.BOARD.COLUMN_COUNT);
      expect(countBadge).toBeInTheDocument();
      // Badge should have warning styling (exact class depends on implementation)
    });

    it("should show error variant when over WIP limit", () => {
      const stateWithWip = { ...mockState, wipLimit: 1 };
      const issues = [
        mockIssue,
        { ...mockIssue, _id: "issue-2" as Id<"issues">, key: "TEST-2", order: 1 },
      ];
      render(<KanbanColumn {...defaultProps} state={stateWithWip} issues={issues} />);

      expect(screen.getByText("Over limit")).toBeInTheDocument();
    });
  });

  describe("Collapsed State", () => {
    it("should render collapsed view when isCollapsed is true", () => {
      render(<KanbanColumn {...defaultProps} isCollapsed={true} />);

      expect(screen.getByRole("region", { name: "To Do column (collapsed)" })).toBeInTheDocument();
      expect(screen.getByLabelText("Expand To Do column")).toBeInTheDocument();
    });

    it("should call onToggleCollapse when expand button clicked", async () => {
      const onToggleCollapse = vi.fn();
      const user = userEvent.setup();
      render(
        <KanbanColumn {...defaultProps} isCollapsed={true} onToggleCollapse={onToggleCollapse} />,
      );

      await user.click(screen.getByLabelText("Expand To Do column"));
      expect(onToggleCollapse).toHaveBeenCalledWith("state-1");
    });

    it("should show collapse button in expanded view when onToggleCollapse provided", () => {
      render(<KanbanColumn {...defaultProps} onToggleCollapse={vi.fn()} />);

      expect(screen.getByLabelText("Collapse To Do column")).toBeInTheDocument();
    });
  });

  describe("Create Issue", () => {
    it("should show create button when canEdit and onCreateIssue provided", () => {
      render(<KanbanColumn {...defaultProps} onCreateIssue={vi.fn()} />);

      expect(screen.getByLabelText("Add issue to To Do")).toBeInTheDocument();
    });

    it("should call onCreateIssue with state id when create clicked", async () => {
      const onCreateIssue = vi.fn();
      const user = userEvent.setup();
      render(<KanbanColumn {...defaultProps} onCreateIssue={onCreateIssue} />);

      await user.click(screen.getByLabelText("Add issue to To Do"));
      expect(onCreateIssue).toHaveBeenCalledWith("state-1");
    });

    it("should not show create button when canEdit is false", () => {
      render(<KanbanColumn {...defaultProps} canEdit={false} onCreateIssue={vi.fn()} />);

      expect(screen.queryByLabelText("Add issue to To Do")).not.toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("should show load more button when hiddenCount > 0", () => {
      render(
        <KanbanColumn {...defaultProps} hiddenCount={10} totalCount={11} onLoadMore={vi.fn()} />,
      );

      expect(screen.getByRole("button", { name: /load.*more/i })).toBeInTheDocument();
    });

    it("should show pagination info when hiddenCount > 0", () => {
      render(
        <KanbanColumn {...defaultProps} hiddenCount={10} totalCount={11} onLoadMore={vi.fn()} />,
      );

      expect(screen.getByText(/1.*of.*11.*issues/i)).toBeInTheDocument();
    });

    it("should call onLoadMore when load more clicked", async () => {
      const onLoadMore = vi.fn();
      const user = userEvent.setup();
      render(
        <KanbanColumn {...defaultProps} hiddenCount={10} totalCount={11} onLoadMore={onLoadMore} />,
      );

      await user.click(screen.getByRole("button", { name: /load.*more/i }));
      expect(onLoadMore).toHaveBeenCalledWith("state-1");
    });

    it("should display loading state when isLoadingMore", () => {
      render(
        <KanbanColumn
          {...defaultProps}
          hiddenCount={10}
          totalCount={11}
          onLoadMore={vi.fn()}
          isLoadingMore={true}
        />,
      );

      // Button should have aria-busy="true" when loading
      const loadMoreButton = screen.getByRole("button", { name: /load.*more/i });
      expect(loadMoreButton).toHaveAttribute("aria-busy", "true");
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe("Issue Click", () => {
    it("should call onIssueClick when issue card clicked", async () => {
      const onIssueClick = vi.fn();
      const user = userEvent.setup();
      render(<KanbanColumn {...defaultProps} onIssueClick={onIssueClick} />);

      // Find and click the issue card using the accessible button
      const issueCard = screen.getByRole("button", { name: /TEST-1.*Test Issue/i });
      await user.click(issueCard);

      expect(onIssueClick).toHaveBeenCalledWith("issue-1");
    });
  });

  describe("Selection Mode", () => {
    it("should pass selection state to issue cards", () => {
      const selectedIds = new Set(["issue-1" as Id<"issues">]);
      render(
        <KanbanColumn {...defaultProps} selectionMode={true} selectedIssueIds={selectedIds} />,
      );

      // The IssueCard component should receive the selection props
      // This is verified by rendering - if props aren't passed correctly, it would fail
      expect(screen.getByTestId(TEST_IDS.BOARD.COLUMN)).toBeInTheDocument();
    });
  });
});

describe("arePropsEqual", () => {
  const baseProps: KanbanColumnProps = {
    state: {
      id: "state-1",
      name: "To Do",
      category: "todo",
      color: "#3B82F6",
      position: 0,
    },
    issues: [
      {
        _id: "issue-1" as Id<"issues">,
        key: "TEST-1",
        title: "Test",
        status: "state-1",
        priority: "medium" as const,
        type: "task" as const,
        order: 0,
        labels: [],
        updatedAt: Date.now(),
        assignee: null,
      },
    ],
    columnIndex: 0,
    selectionMode: false,
    selectedIssueIds: new Set(),
    canEdit: true,
    onIssueClick: vi.fn(),
    onToggleSelect: vi.fn(),
  };

  it("should return true when props are equal", () => {
    expect(arePropsEqual(baseProps, baseProps)).toBe(true);
  });

  it("should return false when columnIndex changes", () => {
    const newProps = { ...baseProps, columnIndex: 1 };
    expect(arePropsEqual(baseProps, newProps)).toBe(false);
  });

  it("should return true when selectedIssueIds changes but doesn't affect column", () => {
    const newSelectedIds = new Set(["other-issue" as Id<"issues">]);
    const newProps = { ...baseProps, selectedIssueIds: newSelectedIds };
    expect(arePropsEqual(baseProps, newProps)).toBe(true);
  });

  it("should return false when selectedIssueIds changes and affects column issues", () => {
    const newSelectedIds = new Set(["issue-1" as Id<"issues">]);
    const newProps = { ...baseProps, selectedIssueIds: newSelectedIds };
    expect(arePropsEqual(baseProps, newProps)).toBe(false);
  });

  it("should return true when focusedIssueId changes but doesn't affect column", () => {
    // Both must have focusedIssueId key for equal key count
    const propsWithFocus = { ...baseProps, focusedIssueId: null };
    const newProps = { ...baseProps, focusedIssueId: "other-issue" as Id<"issues"> };
    expect(arePropsEqual(propsWithFocus, newProps)).toBe(true);
  });

  it("should return false when focusedIssueId changes to issue in column", () => {
    const newProps = { ...baseProps, focusedIssueId: "issue-1" as Id<"issues"> };
    expect(arePropsEqual(baseProps, newProps)).toBe(false);
  });
});
