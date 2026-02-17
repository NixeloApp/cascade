import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { KanbanColumn } from "./KanbanColumn";

// Mock @atlaskit/pragmatic-drag-and-drop
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: vi.fn(() => () => {}),
}));

// Mock IssueCard to simplify testing
vi.mock("@/components/IssueCard", () => ({
  IssueCard: ({ issue }: { issue: any }) => (
    <div data-testid="issue-card" data-issue-id={issue._id}>
      {issue.title}
    </div>
  ),
}));

// Mock UI components that might cause issues in render
vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: any) => <div>{children}</div>,
  FlexItem: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock issue utils
vi.mock("@/lib/issue-utils", () => ({
  getWorkflowCategoryColor: () => "mock-color",
  getTypeLabel: () => "Task",
  getPriorityColor: () => "mock-color",
}));

describe("KanbanColumn", () => {
  const mockState: WorkflowState = {
    id: "todo",
    name: "To Do",
    category: "todo",
    order: 0,
  };

  const mockIssues = [
    {
      _id: "issue-3" as Id<"issues">,
      title: "Issue 3",
      order: 3,
      key: "ISSUE-3",
      status: "todo",
      priority: "medium" as const,
      type: "task" as const,
      labels: [],
      updatedAt: Date.now(),
    },
    {
      _id: "issue-1" as Id<"issues">,
      title: "Issue 1",
      order: 1,
      key: "ISSUE-1",
      status: "todo",
      priority: "high" as const,
      type: "bug" as const,
      labels: [],
      updatedAt: Date.now(),
    },
    {
      _id: "issue-2" as Id<"issues">,
      title: "Issue 2",
      order: 2,
      key: "ISSUE-2",
      status: "todo",
      priority: "low" as const,
      type: "story" as const,
      labels: [],
      updatedAt: Date.now(),
    },
  ];

  it("should render issues in original order for todo category (optimization)", () => {
    // Current behavior (before optimization): Issues are sorted by order (1, 2, 3)
    // Expected behavior (after optimization): Issues are rendered as provided (3, 1, 2)

    // We pass unsorted issues to verify that the component does NOT sort them
    // The server is expected to provide them sorted, so passing unsorted mimics
    // "server provided order" which happens to be unsorted here for test purposes.
    const unsortedIssues = [...mockIssues]; // 3, 1, 2

    render(
      <KanbanColumn
        state={{ ...mockState, category: "todo" }}
        issues={unsortedIssues}
        columnIndex={0}
        selectionMode={false}
        selectedIssueIds={new Set()}
        canEdit={true}
        onIssueClick={() => {}}
        onToggleSelect={() => {}}
      />,
    );

    const cards = screen.getAllByTestId("issue-card");
    const ids = cards.map((card) => card.getAttribute("data-issue-id"));

    // This expectation will FAIL before the fix (it will be sorted: 1, 2, 3)
    // After fix, it should be 3, 1, 2
    expect(ids).toEqual(["issue-3", "issue-1", "issue-2"]);
  });

  it("should render issues sorted by order for done category (legacy behavior)", () => {
    const unsortedIssues = [...mockIssues]; // 3, 1, 2

    render(
      <KanbanColumn
        state={{ ...mockState, category: "done", id: "done" }}
        issues={unsortedIssues}
        columnIndex={0}
        selectionMode={false}
        selectedIssueIds={new Set()}
        canEdit={true}
        onIssueClick={() => {}}
        onToggleSelect={() => {}}
      />,
    );

    const cards = screen.getAllByTestId("issue-card");
    const ids = cards.map((card) => card.getAttribute("data-issue-id"));

    // This expectation should PASS (sorted: 1, 2, 3)
    expect(ids).toEqual(["issue-1", "issue-2", "issue-3"]);
  });
});
