import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import userEvent from "@testing-library/user-event";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { KanbanBoard } from "./KanbanBoard";

vi.mock("@atlaskit/pragmatic-drag-and-drop-auto-scroll/element", () => ({
  autoScrollForElements: vi.fn(() => vi.fn()),
}));

vi.mock("@/hooks/useBoardDragAndDrop", () => ({
  useBoardDragAndDrop: vi.fn(),
}));

vi.mock("@/hooks/useBoardHistory", () => ({
  useBoardHistory: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useListNavigation", () => ({
  useListNavigation: vi.fn(),
}));

vi.mock("@/hooks/useSmartBoardData", () => ({
  useSmartBoardData: vi.fn(),
}));

vi.mock("./BulkOperationsBar", () => ({
  BulkOperationsBar: ({ selectedIssueIds }: { selectedIssueIds: Set<Id<"issues">> }) => (
    <div>{`bulk:${selectedIssueIds.size}`}</div>
  ),
}));

vi.mock("./IssueDetail", () => ({
  CreateIssueModal: ({ open, projectId }: { open: boolean; projectId?: Id<"projects"> }) => (
    <div>{`create-modal:${projectId ?? "none"}:${open ? "open" : "closed"}`}</div>
  ),
}));

vi.mock("./IssueDetailViewer", () => ({
  IssueDetailViewer: ({ issueId, canEdit }: { issueId: Id<"issues">; canEdit?: boolean }) => (
    <div>{`detail-viewer:${issueId}:${canEdit ? "editable" : "read-only"}`}</div>
  ),
}));

vi.mock("./Kanban/BoardToolbar", () => ({
  BoardToolbar: ({
    showControls,
    onToggleSelectionMode,
    onSwimlanGroupByChange,
  }: {
    showControls?: boolean;
    onToggleSelectionMode: () => void;
    onSwimlanGroupByChange?: (value: "none" | "priority" | "assignee" | "type" | "label") => void;
  }) =>
    showControls ? (
      <div>
        <button type="button" onClick={onToggleSelectionMode}>
          toggle-selection
        </button>
        <button type="button" onClick={() => onSwimlanGroupByChange?.("priority")}>
          set-swimlane-priority
        </button>
      </div>
    ) : null,
}));

vi.mock("./Kanban/KanbanColumn", () => ({
  KanbanColumn: ({
    state,
    issues,
    hiddenCount,
    totalCount,
    canEdit,
    focusedIssueId,
    onCreateIssue,
    onIssueClick,
  }: {
    state: WorkflowState;
    issues: Array<{ _id: Id<"issues"> }>;
    hiddenCount?: number;
    totalCount?: number;
    canEdit: boolean;
    focusedIssueId?: Id<"issues"> | null;
    onCreateIssue?: (stateId: string) => void;
    onIssueClick: (issueId: Id<"issues">) => void;
  }) => (
    <div>
      <div>{`column:${state.id}:${issues.length}:${hiddenCount ?? 0}:${totalCount ?? 0}:${canEdit ? "editable" : "read-only"}:${focusedIssueId ?? "none"}`}</div>
      <button type="button" onClick={() => onCreateIssue?.(state.id)}>
        {`create-${state.id}`}
      </button>
      {issues[0] && (
        <button type="button" onClick={() => onIssueClick(issues[0]._id)}>
          {`open-${state.id}`}
        </button>
      )}
    </div>
  ),
}));

vi.mock("./Kanban/SwimlanRow", () => ({
  SwimlanRow: ({ config, canEdit }: { config: { id: string }; canEdit: boolean }) => (
    <div>{`swimlane:${config.id}:${canEdit ? "editable" : "read-only"}`}</div>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: forwardRef(function Card(
    {
      children,
      id,
    }: {
      children: ReactNode;
      id?: string;
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} id={id}>
        {children}
      </div>
    );
  }),
  getCardRecipeClassName: (recipe: string) => `recipe-${recipe}`,
}));

vi.mock("./ui/Flex", () => ({
  Flex: ({
    children,
    ...props
  }: {
    children: ReactNode;
  } & Record<string, unknown>) => <div {...props}>{children}</div>,
  FlexItem: ({
    children,
    ...props
  }: {
    children: ReactNode;
  } & Record<string, unknown>) => <div {...props}>{children}</div>,
}));

vi.mock("./ui/Skeleton", () => ({
  SkeletonKanbanCard: () => <div>loading-card</div>,
  SkeletonText: () => <div>loading-text</div>,
}));

const mockAutoScrollForElements = vi.mocked(autoScrollForElements);
const mockUseBoardDragAndDrop = vi.mocked(useBoardDragAndDrop);
const mockUseBoardHistory = vi.mocked(useBoardHistory);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseListNavigation = vi.mocked(useListNavigation);
const mockUseSmartBoardData = vi.mocked(useSmartBoardData);

const workflowStates: WorkflowState[] = [
  { id: "done", name: "Done", order: 2, category: "done" },
  { id: "todo", name: "To Do", order: 1, category: "todo" },
];

const issueA = {
  _id: "issue_1" as Id<"issues">,
  _creationTime: 1,
  organizationId: "org_1" as Id<"organizations">,
  workspaceId: "workspace_1" as Id<"workspaces">,
  projectId: "project_1" as Id<"projects">,
  reporterId: "user_1" as Id<"users">,
  assigneeId: undefined,
  epicId: undefined,
  key: "PROJ-1",
  title: "First issue",
  description: "First issue description",
  type: "task",
  priority: "high",
  status: "todo",
  labels: [],
  linkedDocuments: [],
  attachments: [],
  epic: null,
  assignee: null,
  reporter: null,
  order: 0,
  updatedAt: 1,
  storyPoints: 2,
  estimatedHours: 1,
  loggedHours: 0,
} as EnrichedIssue;

const issueB = {
  ...issueA,
  _id: "issue_2" as Id<"issues">,
  key: "PROJ-2",
  title: "Second issue",
  status: "done",
  priority: "medium",
} as EnrichedIssue;

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(max-width: 767px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  });
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });
    mockUseAuthenticatedQuery.mockReturnValue({
      userRole: "admin",
      workflowStates,
    });
    mockUseSmartBoardData.mockReturnValue({
      issuesByStatus: {
        todo: [issueA],
        done: [issueB],
      },
      statusCounts: {
        todo: { total: 3, loaded: 1, hidden: 2 },
        done: { total: 1, loaded: 1, hidden: 0 },
      },
      isLoading: false,
      doneStatusesWithMore: [],
      loadMoreDone: vi.fn(),
      isLoadingMore: false,
      hiddenDoneCount: 0,
      workflowStates,
    });
    mockUseBoardHistory.mockReturnValue({
      historyStack: [],
      redoStack: [],
      handleUndo: vi.fn(),
      handleRedo: vi.fn(),
      pushAction: vi.fn(),
    });
    mockUseListNavigation.mockReturnValue({
      selectedIndex: 0,
      setSelectedIndex: vi.fn(),
      listRef: { current: null },
      getItemProps: vi.fn((index: number) => ({
        "data-list-index": index,
        className: "",
        onMouseEnter: vi.fn(),
      })),
    });
    mockUseBoardDragAndDrop.mockReturnValue({
      isDragging: false,
      handleDragStateChange: vi.fn(),
      handleIssueDrop: vi.fn(),
      handleIssueReorder: vi.fn(),
    });
  });

  it("renders the loading skeletons while project data is still unresolved", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<KanbanBoard projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByTestId(TEST_IDS.BOARD.LOADING_STATE)).toBeInTheDocument();
    const loadingColumns = screen.getAllByTestId(TEST_IDS.BOARD.LOADING_COLUMN);
    expect(loadingColumns).toHaveLength(4);
    expect(loadingColumns[0]).toHaveClass("block");
    expect(loadingColumns[1]).toHaveClass("hidden", "sm:block");
    expect(loadingColumns[2]).toHaveClass("hidden", "md:block");
    expect(loadingColumns[3]).toHaveClass("hidden", "xl:block");
    expect(screen.getAllByText("loading-text").length).toBeGreaterThan(0);
    expect(screen.getAllByText("loading-card")).toHaveLength(12);
    expect(mockAutoScrollForElements).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("toggle-selection")).not.toBeInTheDocument();
  });

  it("renders the standard board, opens create/detail overlays, and shows bulk actions in project mode", async () => {
    const user = userEvent.setup();

    render(<KanbanBoard projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByText("toggle-selection")).toBeInTheDocument();
    expect(screen.getByText("column:todo:1:2:3:editable:issue_1")).toBeInTheDocument();
    expect(screen.getByText("column:done:1:0:1:editable:issue_1")).toBeInTheDocument();
    expect(screen.getByText("create-modal:project_1:closed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "create-todo" }));
    expect(screen.getByText("create-modal:project_1:open")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "open-todo" }));
    expect(screen.getByText("detail-viewer:issue_1:editable")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "toggle-selection" }));
    expect(screen.getByText("bulk:0")).toBeInTheDocument();
  });

  it("renders a single workflow column at a time on mobile and switches with the selector", async () => {
    const user = userEvent.setup();
    mockMatchMedia(true);

    render(<KanbanBoard projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByRole("radio", { name: /to do/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /done/i })).toBeInTheDocument();
    expect(screen.getByText("column:todo:1:2:3:editable:issue_1")).toBeInTheDocument();
    expect(screen.queryByText("column:done:1:0:1:editable:issue_1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /done/i }));

    expect(screen.getByText("column:done:1:0:1:editable:issue_1")).toBeInTheDocument();
    expect(screen.queryByText("column:todo:1:2:3:editable:issue_1")).not.toBeInTheDocument();
  });

  it("falls back to loaded issue counts for mobile selector badges when totals are unavailable", () => {
    mockMatchMedia(true);
    mockUseSmartBoardData.mockReturnValue({
      issuesByStatus: {
        todo: [issueA],
        done: [issueB],
      },
      statusCounts: {},
      isLoading: false,
      doneStatusesWithMore: [],
      loadMoreDone: vi.fn(),
      isLoadingMore: false,
      hiddenDoneCount: 0,
      workflowStates,
    });

    render(<KanbanBoard teamId={"team_1" as Id<"teams">} />);

    expect(screen.getByRole("radio", { name: "To Do1" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Done1" })).toBeInTheDocument();
  });

  it("switches into swimlane rendering in project mode", async () => {
    const user = userEvent.setup();

    render(<KanbanBoard projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByText("column:todo:1:2:3:editable:issue_1")).toBeInTheDocument();
    expect(screen.getByText("toggle-selection")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "set-swimlane-priority" }));

    expect(screen.getByText("swimlane:high:editable")).toBeInTheDocument();
    expect(screen.getByText("swimlane:highest:editable")).toBeInTheDocument();
    expect(screen.getByText("swimlane:medium:editable")).toBeInTheDocument();
    expect(screen.getByText("swimlane:low:editable")).toBeInTheDocument();
    expect(screen.getByText("swimlane:lowest:editable")).toBeInTheDocument();
    expect(screen.queryByText("column:todo:1:2:3:editable:issue_1")).not.toBeInTheDocument();
    expect(screen.queryByText(/^bulk:/)).not.toBeInTheDocument();
  });
});
