import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SwimlanConfig } from "@/lib/swimlane-utils";
import { render, screen } from "@/test/custom-render";
import { SwimlanRow } from "./SwimlanRow";

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    "aria-expanded": ariaExpanded,
    "aria-controls": ariaControls,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, id }: { children: ReactNode; id?: string }) => <div id={id}>{children}</div>,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: () => <span>swimlane-icon</span>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({
    children,
    className,
    style,
  }: {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      {children}
    </div>
  ),
}));

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./KanbanColumn", () => ({
  KanbanColumn: ({
    state,
    issues,
    columnIndex,
    hiddenCount,
    totalCount,
    canEdit,
    selectionMode,
  }: {
    state: WorkflowState;
    issues: unknown[];
    columnIndex: number;
    hiddenCount?: number;
    totalCount?: number;
    canEdit: boolean;
    selectionMode: boolean;
  }) => (
    <div>
      {`column:${state.id}:${issues.length}:${columnIndex}:${hiddenCount ?? 0}:${totalCount ?? 0}:${canEdit ? "editable" : "read-only"}:${selectionMode ? "selecting" : "browsing"}`}
    </div>
  ),
}));

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
} as EnrichedIssue;

const workflowStates: WorkflowState[] = [
  { id: "todo", name: "To Do", order: 0, category: "todo" },
  { id: "done", name: "Done", order: 1, category: "done" },
];

const defaultConfig: SwimlanConfig = {
  id: "high",
  name: "High Priority",
  order: 0,
  color: "text-status-error",
};

const defaultProps = {
  config: defaultConfig,
  issuesByStatus: {
    todo: [issueA],
    done: [issueB],
  },
  workflowStates,
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  selectionMode: false,
  selectedIssueIds: new Set<Id<"issues">>(),
  focusedIssueId: null,
  canEdit: true,
  onCreateIssue: vi.fn(),
  onIssueClick: vi.fn(),
  onToggleSelect: vi.fn(),
  statusCounts: {
    todo: { total: 3, loaded: 1, hidden: 2 },
    done: { total: 1, loaded: 1, hidden: 0 },
  },
  onLoadMore: vi.fn(),
  isLoadingMore: false,
  onIssueDrop: vi.fn(),
  onIssueReorder: vi.fn(),
};

describe("SwimlanRow", () => {
  it("renders the expanded swimlane header and fans out columns with per-state counts", () => {
    render(<SwimlanRow {...defaultProps} />);

    expect(screen.getByRole("button", { name: /high priority/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /high priority/i })).toHaveAttribute(
      "aria-controls",
      "swimlane-high",
    );
    expect(screen.getByText("High Priority")).toHaveClass("text-status-error");
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("column:todo:1:0:2:3:editable:browsing")).toBeInTheDocument();
    expect(screen.getByText("column:done:1:1:0:1:editable:browsing")).toBeInTheDocument();
  });

  it("collapses the row and calls back with the swimlane id when toggled", async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();

    render(<SwimlanRow {...defaultProps} isCollapsed={true} onToggleCollapse={onToggleCollapse} />);

    const toggleButton = screen.getByRole("button", { name: /high priority/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/^column:/)).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(onToggleCollapse).toHaveBeenCalledWith("high");
  });

  it("uses inline color styles for hex colors and falls back empty states for missing status buckets", () => {
    render(
      <SwimlanRow
        {...defaultProps}
        config={{ id: "label-a", name: "Label A", order: 1, color: "#123456" }}
        issuesByStatus={{}}
        selectionMode={true}
        canEdit={false}
        statusCounts={{}}
      />,
    );

    expect(screen.getByText("Label A")).toHaveStyle({ color: "rgb(18, 52, 86)" });
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("column:todo:0:0:0:0:read-only:selecting")).toBeInTheDocument();
    expect(screen.getByText("column:done:0:1:0:0:read-only:selecting")).toBeInTheDocument();
  });
});
