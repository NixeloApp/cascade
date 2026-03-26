import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { type RoadmapRowController, RoadmapTimelineSurface } from "./RoadmapTimelineSurface";
import type { DependencyLine, RoadmapIssue, TimelineHeaderCell, TimelineRow } from "./types";

vi.mock("react-window", () => ({
  List: ({
    rowCount,
    rowComponent: Row,
    rowProps,
    listRef,
    style,
  }: {
    rowCount: number;
    rowComponent: React.ComponentType<
      {
        index: number;
        style: React.CSSProperties;
        rows: TimelineRow[];
        activeIssueId: Id<"issues"> | null;
      } & Record<string, unknown>
    >;
    rowProps: {
      rows: TimelineRow[];
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
            key={
              rowProps.rows[index]?.type === "issue"
                ? rowProps.rows[index].issue._id
                : rowProps.rows[index]?.group.key
            }
            index={index}
            style={{}}
            {...rowProps}
          />
        ))}
      </div>
    );
  },
}));

vi.mock("./RoadmapRows", () => ({
  RoadmapGroupRow: ({ group }: { group: { key: string; label: string } }) => (
    <div data-testid={`group-row-${group.key}`}>{group.label}</div>
  ),
  RoadmapIssueRow: ({ issue }: { issue: { key: string } }) => (
    <div data-testid={`issue-row-${issue.key}`}>{issue.key}</div>
  ),
}));

vi.mock("./RoadmapDependencyPanel", () => ({
  renderDependencyLine: (line: DependencyLine) => (
    <path key={`${line.fromIssueId}-${line.toIssueId}`} data-testid="dependency-line" />
  ),
}));

const issueId = "issue_1" as Id<"issues">;
const organizationId = "org_1" as Id<"organizations">;
const workspaceId = "workspace_1" as Id<"workspaces">;
const projectId = "project_1" as Id<"projects">;
const reporterId = "user_1" as Id<"users">;

const roadmapIssue: RoadmapIssue = {
  _id: issueId,
  _creationTime: Date.UTC(2026, 2, 1),
  projectId,
  organizationId,
  workspaceId,
  key: "DEMO-2",
  title: "Plan onboarding",
  type: "task",
  status: "todo",
  reporterId,
  updatedAt: Date.UTC(2026, 2, 2),
  startDate: Date.UTC(2026, 2, 10),
  dueDate: Date.UTC(2026, 2, 20),
  priority: "medium",
  labels: [],
  linkedDocuments: [],
  attachments: [],
  order: 1,
  version: 1,
  assignee: null,
  reporter: {
    _id: reporterId,
    name: "Alex Rivera",
  },
  epic: null,
};

const timelineHeaderCells: TimelineHeaderCell[] = [
  { key: "2026-03", label: "Mar 2026" },
  { key: "2026-04", label: "Apr 2026" },
];

const issueRow: TimelineRow = {
  type: "issue",
  issue: roadmapIssue,
  childCount: 0,
  childrenCollapsed: false,
  depth: 0,
  hasChildren: false,
  summaryCompletedCount: 0,
};

const dependencyLines: DependencyLine[] = [
  {
    fromIssueId: issueId,
    toIssueId: "issue_2" as Id<"issues">,
    fromX: 10,
    fromY: 10,
    toX: 80,
    toY: 40,
  },
];

function createController(): RoadmapRowController {
  return {
    canEdit: true,
    getPositionOnTimeline: () => 50,
    onBarDragStart: vi.fn(),
    onOpenIssue: vi.fn(),
    onResizeStart: vi.fn(),
    onToggleChildren: vi.fn(),
    onToggleGroup: vi.fn(),
    roadmapIssueById: new Map([[issueId.toString(), roadmapIssue]]),
    timelineRef: { current: document.createElement("div") },
  };
}

describe("RoadmapTimelineSurface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty roadmap state when there are no filtered issues", () => {
    const listRef = { current: null };

    render(
      <RoadmapTimelineSurface
        activeIssueId={null}
        dependencyLines={[]}
        filteredIssues={[]}
        listRef={listRef}
        roadmapRowController={createController()}
        showDependencies={false}
        timelineHeaderCells={timelineHeaderCells}
        timelineLayoutWidth={512}
        timelineRows={[]}
        timelineBucketWidth={128}
        todayMarkerOffsetPx={null}
      />,
    );

    expect(screen.getByTestId(TEST_IDS.ROADMAP.EMPTY_STATE)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS)).not.toBeInTheDocument();
  });

  it("renders the timeline canvas, issue header, rows, and dependency overlay", () => {
    const listRef = { current: null };

    render(
      <RoadmapTimelineSurface
        activeIssueId={issueId}
        dependencyLines={dependencyLines}
        filteredIssues={[roadmapIssue]}
        listRef={listRef}
        roadmapRowController={createController()}
        showDependencies={true}
        timelineHeaderCells={timelineHeaderCells}
        timelineLayoutWidth={512}
        timelineRows={[issueRow]}
        timelineBucketWidth={128}
        todayMarkerOffsetPx={64}
      />,
    );

    expect(screen.getByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ROADMAP.ISSUE_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId("issue-row-DEMO-2")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue dependency lines")).toBeInTheDocument();
    expect(screen.getByTestId("dependency-line")).toBeInTheDocument();
  });
});
