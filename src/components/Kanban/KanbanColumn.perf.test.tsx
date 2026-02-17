import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/custom-render";
import { KanbanColumn } from "./KanbanColumn";

// Mock dependencies
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: vi.fn(() => () => {}),
}));

// Mock IssueCard to track renders
const IssueCardSpy = vi.fn();

vi.mock("@/components/IssueCard", () => ({
  IssueCard: (props: any) => {
    IssueCardSpy(props);
    return <div data-testid="issue-card">{props.issue.title}</div>;
  },
  areIssuesEqual: (prev: any, next: any) =>
    prev._id === next._id && prev.updatedAt === next.updatedAt,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: any) => <div>{children}</div>,
  FlexItem: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/issue-utils", () => ({
  getWorkflowCategoryColor: () => "mock-color",
  getTypeLabel: () => "Task",
  getPriorityColor: () => "mock-color",
}));

describe("KanbanColumn Performance", () => {
  const mockState: WorkflowState = {
    id: "todo",
    name: "To Do",
    category: "todo",
    order: 0,
  };

  const createIssue = (id: string) => ({
    _id: id as Id<"issues">,
    title: `Issue ${id}`,
    order: 1,
    key: `ISSUE-${id}`,
    status: "todo",
    priority: "medium" as const,
    type: "task" as const,
    labels: [],
    updatedAt: 1000,
  });

  it("should not re-render issues when props are deeply equal but referentially different", () => {
    const issue1 = createIssue("1");
    // Deep clone to ensure different reference but same content
    const issue1Clone = { ...issue1 };

    const issuesA = [issue1];
    const issuesB = [issue1Clone];

    const baseProps = {
      state: mockState,
      columnIndex: 0,
      selectionMode: false,
      selectedIssueIds: new Set<Id<"issues">>(),
      canEdit: true,
      onIssueClick: vi.fn(),
      onToggleSelect: vi.fn(),
    };

    const { rerender } = render(<KanbanColumn {...baseProps} issues={issuesA} />);

    expect(IssueCardSpy).toHaveBeenCalledTimes(1);

    // Re-render with new issue references (but same content)
    rerender(<KanbanColumn {...baseProps} issues={issuesB} />);

    // Without optimization: IssueCardSpy called again -> 2 times.
    // With optimization: IssueCardSpy NOT called again -> 1 time.
    expect(IssueCardSpy).toHaveBeenCalledTimes(1);
  });
});
