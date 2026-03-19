import type { Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import { act } from "@testing-library/react";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/dates";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen, within } from "@/test/custom-render";
import { RoadmapView } from "./RoadmapView";

const { mockUseListNavigation } = vi.hoisted(() => ({
  mockUseListNavigation: vi.fn(),
}));

const SelectContext = createContext<{
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

const SegmentedControlContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/hooks/useListNavigation", () => ({
  useListNavigation: mockUseListNavigation,
}));

vi.mock("./ui/Select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <SelectContext.Provider value={{ disabled, onValueChange, value }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
  SelectValue: ({ children, placeholder }: { children?: ReactNode; placeholder?: string }) => {
    const context = useContext(SelectContext);
    return <span>{children ?? context.value ?? placeholder}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button
        type="button"
        onClick={() => context.onValueChange?.(value)}
        disabled={context.disabled}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("./ui/SegmentedControl", () => ({
  SegmentedControl: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <SegmentedControlContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SegmentedControlContext.Provider>
  ),
  SegmentedControlItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SegmentedControlContext);
    return (
      <button
        type="button"
        aria-pressed={context.value === value}
        onClick={() => context.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("react-window", () => ({
  List: ({
    rowCount,
    rowComponent: Row,
    rowProps,
    listRef,
    style,
  }: {
    rowCount: number;
    rowComponent: React.ComponentType<{
      index: number;
      style: React.CSSProperties;
      rows: Array<{ _id?: Id<"issues"> }>;
      activeIssueId: Id<"issues"> | null;
    } & Record<string, unknown>>;
    rowProps: {
      rows: Array<{ _id?: Id<"issues"> }>;
      activeIssueId: Id<"issues"> | null;
    } & Record<string, unknown>;
    listRef: { current: { scrollToRow: (options: { index: number }) => void } | null };
    style?: React.CSSProperties;
  }) => {
    listRef.current = { scrollToRow: vi.fn() };
    return (
      <div data-testid="roadmap-list" style={style}>
        {Array.from({ length: rowCount }, (_, index) => (
          <Row
            key={rowProps.rows[index]?._id ?? `roadmap-row-${index}`}
            index={index}
            style={{}}
            {...rowProps}
          />
        ))}
      </div>
    );
  },
}));

vi.mock("./IssueDetailViewer", () => ({
  IssueDetailViewer: ({
    issueId,
    onOpenChange,
  }: {
    issueId: string;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="issue-detail-viewer">
      <span>{issueId}</span>
      <button type="button" onClick={() => onOpenChange(false)}>
        Close detail
      </button>
    </div>
  ),
}));

vi.mock("./ui/Icon", () => ({
  Icon: () => <span data-testid="roadmap-icon" />,
}));

type RoadmapIssue = {
  _id: Id<"issues">;
  key: string;
  title: string;
  status: string;
  startDate?: number;
  dueDate?: number;
  parentId?: Id<"issues">;
  type: IssueType;
  priority: IssuePriority;
  assignee?: { name: string };
  epic?: { _id: Id<"issues">; key: string; title: string } | null;
};

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const projectId = "project_1" as Id<"projects">;
const epicId = "epic_1" as Id<"issues">;
const issue1Id = "issue_1" as Id<"issues">;
const issue2Id = "issue_2" as Id<"issues">;
const issue3Id = "issue_3" as Id<"issues">;
const issue4Id = "issue_4" as Id<"issues">;
const now = Date.UTC(2026, 2, 14);
const updateIssueDates = vi.fn();
const createIssueLink = vi.fn();
const removeIssueLink = vi.fn();

function createMutationMock<Args extends unknown[], ReturnValue>(
  procedure: (...args: Args) => ReturnValue,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Args) => procedure(...args)) as ReactMutation<
    FunctionReference<"mutation">
  >;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

function mockRoadmapQueries({
  epics = [],
  links = [],
  issues = [],
}: {
  epics?: Array<{ _id: Id<"issues">; title: string }>;
  links?: Array<{
    linkId?: Id<"issueLinks">;
    fromIssueId: string;
    toIssueId: string;
    linkType: string;
  }>;
  issues?: RoadmapIssue[];
} = {}) {
  let callIndex = 0;
  const projectLinks = {
    links: links.map((link, index) => ({
      linkId: link.linkId ?? (`link_${index + 1}` as Id<"issueLinks">),
      fromIssueId: link.fromIssueId,
      toIssueId: link.toIssueId,
      linkType: link.linkType,
    })),
  };

  mockUseAuthenticatedQuery.mockImplementation(() => {
    const result = [epics, projectLinks, issues, { _id: projectId, name: "Roadmap Project" }][
      callIndex % 4
    ];

    callIndex += 1;
    return result;
  });

  return { projectLinks };
}

describe("RoadmapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    updateIssueDates.mockResolvedValue(undefined);
    createIssueLink.mockResolvedValue({ linkId: "new_link" as Id<"issueLinks"> });
    removeIssueLink.mockResolvedValue({ success: true, deleted: true });
    mockUseListNavigation.mockReturnValue({ selectedIndex: -1 });
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const mutate = createMutationMock((args: Record<string, unknown>) => {
        if ("fromIssueId" in args && "toIssueId" in args) {
          return createIssueLink(args);
        }

        if ("linkId" in args) {
          return removeIssueLink(args);
        }

        if ("issueId" in args) {
          return updateIssueDates(args);
        }

        throw new Error("Unexpected mutation arguments");
      });

      return {
        mutate,
        canAct: true,
        isAuthLoading: false,
      };
    });
  });

  it("renders the empty state when there are no roadmap issues", () => {
    mockRoadmapQueries();

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
    expect(screen.getByText("Roadmap is ready for planning")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No issues with due dates to display yet. Add due dates in your board or backlog to populate this timeline view.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Issue dependency lines")).not.toBeInTheDocument();
  });

  it("renders timeline rows, dependency lines, and closes the issue detail viewer", async () => {
    const issues: RoadmapIssue[] = [
      {
        _id: issue1Id,
        key: "PROJ-1",
        title: "Plan onboarding",
        status: "todo",
        startDate: Date.UTC(2026, 2, 10),
        dueDate: Date.UTC(2026, 2, 20),
        type: "task",
        priority: "medium",
        assignee: { name: "Alex Rivera" },
      },
      {
        _id: issue2Id,
        key: "PROJ-2",
        title: "Ship migration",
        status: "in progress",
        startDate: Date.UTC(2026, 2, 18),
        dueDate: Date.UTC(2026, 2, 28),
        type: "story",
        priority: "high",
        assignee: { name: "Sam Lee" },
      },
    ];

    mockRoadmapQueries({
      epics: [{ _id: epicId, title: "Growth" }],
      links: [{ fromIssueId: issue1Id, toIssueId: issue2Id, linkType: "blocks" }],
      issues,
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByTestId("roadmap-list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PROJ-1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PROJ-2" })).toBeInTheDocument();
    expect(screen.getByLabelText("Issue dependency lines")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "PROJ-1" }));
    expect(screen.getByTestId("issue-detail-viewer")).toHaveTextContent(issue1Id);

    fireEvent.click(screen.getByRole("button", { name: "Close detail" }));
    expect(screen.queryByTestId("issue-detail-viewer")).not.toBeInTheDocument();
  });

  it("renders due-date-only issues as milestone markers and drags them by due date", async () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Launch checkpoint",
          status: "todo",
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "high",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    const getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    getBoundingClientRectSpy.mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 32,
      top: 0,
      right: 300,
      bottom: 32,
      left: 0,
      toJSON: () => ({}),
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    expect(screen.getByTestId(`roadmap-milestone-${issue1Id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`roadmap-bar-${issue1Id}`)).not.toBeInTheDocument();

    const milestoneMarker = screen.getByTestId(`roadmap-milestone-${issue1Id}`);
    const expectedDueDate = new Date(Date.UTC(2026, 2, 20) + 3 * DAY);
    expectedDueDate.setHours(23, 59, 59, 999);

    await act(async () => {
      fireEvent.mouseDown(milestoneMarker, { clientX: 100 });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.mouseUp(document, { clientX: 130 });
      await Promise.resolve();
    });

    expect(updateIssueDates).toHaveBeenCalledWith({
      issueId: issue1Id,
      startDate: undefined,
      dueDate: expectedDueDate.getTime(),
    });
  });

  it("renders sticky sidebar metadata badges for roadmap rows", () => {
    const startDate = Date.UTC(2026, 2, 10);
    const dueDate = Date.UTC(2026, 2, 20);

    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate,
          dueDate,
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(
      screen.getByText(`${formatDate(startDate)} - ${formatDate(dueDate)}`),
    ).toBeInTheDocument();
  });

  it("renders parent context rows and nests subtasks beneath them", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration slice",
          status: "in progress",
          dueDate: Date.UTC(2026, 2, 16),
          parentId: issue1Id,
          type: "subtask",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Ship migration",
          status: "todo",
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    const parentIssueButton = screen.getByRole("button", { name: "PROJ-1" });
    const childIssueButton = screen.getByRole("button", { name: "PROJ-2" });

    expect(parentIssueButton.compareDocumentPosition(childIssueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText("Subtask of PROJ-1")).toBeInTheDocument();
  });

  it("collapses subtasks beneath their parent roadmap row", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration slice",
          status: "in progress",
          dueDate: Date.UTC(2026, 2, 16),
          parentId: issue1Id,
          type: "subtask",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Ship migration",
          status: "todo",
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    const parentToggle = screen.getByRole("button", { name: "Collapse subtasks for PROJ-1" });
    expect(parentToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "PROJ-2" })).toBeInTheDocument();

    fireEvent.click(parentToggle);

    expect(screen.getByRole("button", { name: "Expand subtasks for PROJ-1" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: "PROJ-2" })).not.toBeInTheDocument();
    expect(screen.queryByText("Subtask of PROJ-1")).not.toBeInTheDocument();
  });

  it("renders a parent rollup bar when only subtasks have roadmap dates", () => {
    const subtaskStartDate = Date.UTC(2026, 2, 14);
    const subtaskDueDate = Date.UTC(2026, 2, 16);
    const childDueDate = Date.UTC(2026, 2, 18);

    mockRoadmapQueries({
      issues: [
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration slice",
          status: "in progress",
          startDate: subtaskStartDate,
          dueDate: subtaskDueDate,
          parentId: issue1Id,
          type: "subtask",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue3Id,
          key: "PROJ-3",
          title: "Finish rollout checks",
          status: "done",
          startDate: subtaskDueDate,
          dueDate: childDueDate,
          parentId: issue1Id,
          type: "subtask",
          priority: "medium",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Ship migration",
          status: "todo",
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByTitle("Task rollup for PROJ-1 · 1 of 2 complete")).toHaveTextContent("50%");
    expect(screen.queryByTestId(`roadmap-bar-${issue1Id}`)).not.toBeInTheDocument();
    expect(
      screen.getByText(`Rollup ${formatDate(subtaskStartDate)} - ${formatDate(childDueDate)}`),
    ).toBeInTheDocument();
  });

  it("hides dependency lines when the toggle is clicked", async () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 28),
          type: "story",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
      ],
      links: [{ fromIssueId: issue1Id, toIssueId: issue2Id, linkType: "blocks" }],
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByLabelText("Issue dependency lines")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Hide dependency lines"));

    expect(screen.queryByLabelText("Issue dependency lines")).not.toBeInTheDocument();
  });

  it("highlights only the selected issue dependencies", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 28),
          type: "story",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue3Id,
          key: "PROJ-3",
          title: "Review launch",
          status: "todo",
          startDate: Date.UTC(2026, 2, 8),
          dueDate: Date.UTC(2026, 2, 14),
          type: "task",
          priority: "medium",
          assignee: { name: "Terry Jones" },
        },
        {
          _id: issue4Id,
          key: "PROJ-4",
          title: "Publish release notes",
          status: "backlog",
          startDate: Date.UTC(2026, 2, 22),
          dueDate: Date.UTC(2026, 2, 25),
          type: "task",
          priority: "low",
          assignee: { name: "Morgan Diaz" },
        },
      ],
      links: [
        { fromIssueId: issue1Id, toIssueId: issue2Id, linkType: "blocks" },
        { fromIssueId: issue3Id, toIssueId: issue4Id, linkType: "blocks" },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    const dependencyLines = screen
      .getByLabelText("Issue dependency lines")
      .querySelectorAll("path");
    expect(dependencyLines).toHaveLength(2);
    expect(dependencyLines[0]).toHaveAttribute("stroke-width", "2");
    expect(dependencyLines[0]).toHaveAttribute("opacity", "0.7");
    expect(dependencyLines[1]).toHaveAttribute("stroke-width", "2");
    expect(dependencyLines[1]).toHaveAttribute("opacity", "0.7");

    fireEvent.click(screen.getByRole("button", { name: "PROJ-1" }));

    const focusedDependencyLines = screen
      .getByLabelText("Issue dependency lines")
      .querySelectorAll("path");
    expect(focusedDependencyLines[0]).toHaveAttribute("stroke-width", "3");
    expect(focusedDependencyLines[0]).toHaveAttribute("opacity", "1");
    expect(focusedDependencyLines[1]).toHaveAttribute("stroke-width", "1.5");
    expect(focusedDependencyLines[1]).toHaveAttribute("opacity", "0.18");

    fireEvent.click(screen.getByRole("button", { name: "Close detail" }));

    const resetDependencyLines = screen
      .getByLabelText("Issue dependency lines")
      .querySelectorAll("path");
    expect(resetDependencyLines[0]).toHaveAttribute("stroke-width", "2");
    expect(resetDependencyLines[0]).toHaveAttribute("opacity", "0.7");
    expect(resetDependencyLines[1]).toHaveAttribute("stroke-width", "2");
    expect(resetDependencyLines[1]).toHaveAttribute("opacity", "0.7");
  });

  it("manages visible blockers for the active roadmap issue", async () => {
    const { projectLinks } = mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 12),
          dueDate: Date.UTC(2026, 2, 24),
          type: "story",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
        {
          _id: issue3Id,
          key: "PROJ-3",
          title: "Review launch",
          status: "todo",
          startDate: Date.UTC(2026, 2, 16),
          dueDate: Date.UTC(2026, 2, 28),
          type: "task",
          priority: "medium",
          assignee: { name: "Terry Jones" },
        },
        {
          _id: issue4Id,
          key: "PROJ-4",
          title: "Publish release notes",
          status: "backlog",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 30),
          type: "task",
          priority: "low",
          assignee: { name: "Morgan Diaz" },
        },
      ],
      links: [
        {
          linkId: "link_existing_blocker" as Id<"issueLinks">,
          fromIssueId: issue2Id,
          toIssueId: issue1Id,
          linkType: "blocks",
        },
        {
          linkId: "link_existing_blocked_issue" as Id<"issueLinks">,
          fromIssueId: issue1Id,
          toIssueId: issue3Id,
          linkType: "blocks",
        },
      ],
    });
    createIssueLink.mockImplementation(async ({ fromIssueId, toIssueId, linkType }) => {
      projectLinks.links.push({
        linkId: "link_new_blocked_issue" as Id<"issueLinks">,
        fromIssueId,
        toIssueId,
        linkType,
      });
      return { linkId: "link_new_blocked_issue" as Id<"issueLinks"> };
    });
    removeIssueLink.mockImplementation(async ({ linkId }) => {
      projectLinks.links = projectLinks.links.filter((link) => link.linkId !== linkId);
      return { success: true, deleted: true } as const;
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "PROJ-1" }));

    const dependencyPanel = screen.getByTestId(TEST_IDS.ROADMAP.DEPENDENCY_PANEL);
    expect(within(dependencyPanel).getByText("Dependencies for PROJ-1")).toBeInTheDocument();
    expect(within(dependencyPanel).getByText("PROJ-2")).toBeInTheDocument();
    expect(within(dependencyPanel).getByText("PROJ-3")).toBeInTheDocument();

    fireEvent.click(within(dependencyPanel).getByText("PROJ-3"));
    expect(screen.getByTestId("issue-detail-viewer")).toHaveTextContent(issue3Id);

    fireEvent.click(screen.getByRole("button", { name: "PROJ-1" }));
    const refreshedDependencyPanel = screen.getByTestId(TEST_IDS.ROADMAP.DEPENDENCY_PANEL);

    await act(async () => {
      fireEvent.click(
        within(refreshedDependencyPanel).getByRole("button", {
          name: "PROJ-4 · Publish release notes",
        }),
      );
    });
    const updatedDependencyPanel = screen.getByTestId(TEST_IDS.ROADMAP.DEPENDENCY_PANEL);
    await act(async () => {
      fireEvent.click(
        within(updatedDependencyPanel).getByRole("button", { name: "Add blocked issue" }),
      );
    });

    expect(createIssueLink).toHaveBeenCalledWith({
      fromIssueId: issue1Id,
      toIssueId: issue4Id,
      linkType: "blocks",
    });

    await act(async () => {
      fireEvent.click(
        within(screen.getByTestId(TEST_IDS.ROADMAP.DEPENDENCY_PANEL)).getByLabelText(
          "Remove blocked issue PROJ-3",
        ),
      );
    });

    expect(removeIssueLink).toHaveBeenCalledWith({
      linkId: "link_existing_blocked_issue" as Id<"issueLinks">,
    });
  });

  it("switches the roadmap header between month and week buckets", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByText("Mar 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Weeks" }));

    expect(screen.getByText("Mar 1 - Mar 7")).toBeInTheDocument();
    expect(screen.queryByText("Mar 2026")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Months" }));

    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
  });

  it("navigates the timeline window and resets back to today", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next 1-month window" }));

    expect(screen.getByText("April 2026")).toBeInTheDocument();
    expect(screen.getByText("Apr 2026")).toBeInTheDocument();
    expect(screen.queryByText("March 2026")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
  });

  it("moves the timeline by the active visible span", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "3 Months" }));

    expect(screen.getByText("Mar 2026 - May 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next 3-month window" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next 3-month window" }));

    expect(screen.getByText("Jun 2026 - Aug 2026")).toBeInTheDocument();
    expect(screen.queryByText("Mar 2026 - May 2026")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous 3-month window" }));

    expect(screen.getByText("Mar 2026 - May 2026")).toBeInTheDocument();
  });

  it("fits the timeline window to the visible issues", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan launch",
          status: "todo",
          startDate: Date.UTC(2026, 10, 10),
          dueDate: Date.UTC(2026, 10, 15),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship launch",
          status: "in progress",
          startDate: Date.UTC(2026, 11, 2),
          dueDate: Date.UTC(2026, 11, 20),
          type: "story",
          priority: "high",
          assignee: { name: "Sam Lee" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    expect(screen.getByText("Mar 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fit to issues" }));

    expect(screen.queryByText("Mar 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("Dec 2026")).toBeInTheDocument();
    expect(screen.getByText("Jan 2027")).toBeInTheDocument();
  });

  it("changes roadmap canvas width when the timeline zoom changes", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    const timelineCanvas = screen.getByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS);
    expect(timelineCanvas).toHaveStyle({ width: "432px" });

    fireEvent.click(screen.getByRole("button", { name: "Expanded" }));

    expect(timelineCanvas).toHaveStyle({ width: "480px" });

    fireEvent.click(screen.getByRole("button", { name: "Compact" }));

    expect(timelineCanvas).toHaveStyle({ width: "384px" });
  });

  it("keeps the issue sidebar sticky while the timeline scrolls", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Year" }));
    fireEvent.click(screen.getByRole("button", { name: "Expanded" }));

    expect(screen.getByTestId(TEST_IDS.ROADMAP.ISSUE_HEADER)).toHaveClass("sticky", "left-0");
    expect(screen.getAllByTestId(TEST_IDS.ROADMAP.ISSUE_COLUMN)[0]).toHaveClass("sticky", "left-0");
  });

  it("shows a unified today marker only when the visible timeline includes today", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    expect(screen.getByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_BODY)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next 1-month window" }));

    expect(screen.queryByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_HEADER)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_BODY)).not.toBeInTheDocument();
  });

  it("groups roadmap rows by assignee", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 28),
          type: "story",
          priority: "high",
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "Assignee" }));

    expect(screen.getByTestId("roadmap-group-assignee:alex rivera")).toHaveTextContent(
      "Alex Rivera",
    );
    expect(screen.getByTestId("roadmap-group-assignee:unassigned")).toHaveTextContent("Unassigned");
    expect(screen.getAllByText(/1 issue/)).toHaveLength(2);
  });

  it("groups roadmap rows by epic", () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "done",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
          epic: { _id: epicId, key: "PROJ-EPIC", title: "Growth" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 28),
          type: "story",
          priority: "high",
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "Epic" }));

    expect(screen.getByTestId(`roadmap-group-epic:${epicId}`)).toHaveTextContent("Growth");
    expect(screen.getByTestId("roadmap-group-epic:none")).toHaveTextContent("No epic");
    expect(screen.getByTitle("Epic summary for Growth · 1 of 1 complete")).toHaveTextContent(
      "100%",
    );
    expect(screen.queryByTitle("Epic summary for No epic")).not.toBeInTheDocument();
    expect(screen.getAllByText(/1 issue/)).toHaveLength(2);
  });

  it("collapses grouped roadmap sections and hides dependency lines for hidden rows", () => {
    mockRoadmapQueries({
      links: [{ fromIssueId: issue1Id, toIssueId: issue2Id, linkType: "blocks" }],
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
        {
          _id: issue2Id,
          key: "PROJ-2",
          title: "Ship migration",
          status: "in progress",
          startDate: Date.UTC(2026, 2, 18),
          dueDate: Date.UTC(2026, 2, 28),
          type: "story",
          priority: "high",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "Assignee" }));

    const groupToggle = screen.getByTestId("roadmap-group-assignee:alex rivera");
    expect(groupToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "PROJ-1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Issue dependency lines")).toBeInTheDocument();

    fireEvent.click(groupToggle);

    expect(screen.getByTestId("roadmap-group-assignee:alex rivera")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: "PROJ-1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PROJ-2" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Issue dependency lines")).not.toBeInTheDocument();
  });

  it("shifts an issue date range when its roadmap bar is dragged", async () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    const getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    getBoundingClientRectSpy.mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 32,
      top: 0,
      right: 300,
      bottom: 32,
      left: 0,
      toJSON: () => ({}),
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    const roadmapBar = screen.getByTestId(`roadmap-bar-${issue1Id}`);
    const expectedStartDate = new Date(Date.UTC(2026, 2, 10) + 3 * DAY);
    expectedStartDate.setHours(0, 0, 0, 0);
    const expectedDueDate = new Date(Date.UTC(2026, 2, 20) + 3 * DAY);
    expectedDueDate.setHours(23, 59, 59, 999);

    await act(async () => {
      fireEvent.mouseDown(roadmapBar, { clientX: 100 });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.mouseUp(document, { clientX: 130 });
      await Promise.resolve();
    });

    expect(updateIssueDates).toHaveBeenCalledWith({
      issueId: issue1Id,
      startDate: expectedStartDate.getTime(),
      dueDate: expectedDueDate.getTime(),
    });
  });

  it("does not update issue dates when the bar drag stays within the same day bucket", async () => {
    mockRoadmapQueries({
      issues: [
        {
          _id: issue1Id,
          key: "PROJ-1",
          title: "Plan onboarding",
          status: "todo",
          startDate: Date.UTC(2026, 2, 10),
          dueDate: Date.UTC(2026, 2, 20),
          type: "task",
          priority: "medium",
          assignee: { name: "Alex Rivera" },
        },
      ],
    });

    const getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    getBoundingClientRectSpy.mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 32,
      top: 0,
      right: 300,
      bottom: 32,
      left: 0,
      toJSON: () => ({}),
    });

    render(<RoadmapView projectId={projectId} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Month" }));

    const roadmapBar = screen.getByTestId(`roadmap-bar-${issue1Id}`);

    await act(async () => {
      fireEvent.mouseDown(roadmapBar, { clientX: 100 });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.mouseUp(document, { clientX: 102 });
      await Promise.resolve();
    });

    expect(updateIssueDates).not.toHaveBeenCalled();
  });
});
