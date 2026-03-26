import type { Id } from "@convex/_generated/dataModel";
import { type CSSProperties, createContext, type RefObject, useContext } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { renderDependencyLine } from "@/components/Roadmap/RoadmapDependencyPanel";
import { RoadmapGroupRow, RoadmapIssueRow } from "@/components/Roadmap/RoadmapRows";
import type {
  DependencyLine,
  RoadmapIssue,
  RoadmapIssueRowProps,
  TimelineHeaderCell,
  TimelineRow,
} from "@/components/Roadmap/types";
import { ISSUE_INFO_COLUMN_WIDTH, ROADMAP_ROW_HEIGHT } from "@/components/Roadmap/types";
import { getStickyHeaderColumnClassName } from "@/components/Roadmap/utils";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";
import { CalendarDays } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { renderRoadmapTodayMarker } from "./RoadmapTodayMarker";

type RoadmapRowData = {
  rows: TimelineRow[];
  activeIssueId: Id<"issues"> | null;
};

const ROADMAP_TIMELINE_VIEWPORT_STYLE = {
  height: 600,
  width: "100%",
} satisfies CSSProperties;

const ROADMAP_DEPENDENCY_OVERLAY_STYLE = {
  height: 600,
} satisfies CSSProperties;

export type RoadmapRowController = {
  canEdit: boolean;
  draggingIssueId?: Id<"issues">;
  getPositionOnTimeline: (date: number) => number;
  onBarDragStart: RoadmapIssueRowProps["onBarDragStart"];
  onOpenIssue: (issueId: Id<"issues">) => void;
  onResizeStart: RoadmapIssueRowProps["onResizeStart"];
  onToggleChildren: (issueId: Id<"issues">) => void;
  onToggleGroup: (groupKey: string) => void;
  resizingIssueId?: Id<"issues">;
  roadmapIssueById: Map<string, RoadmapIssue>;
  timelineRef: RefObject<HTMLDivElement | null>;
};

const RoadmapRowControllerContext = createContext<RoadmapRowController | null>(null);

function useRoadmapRowController() {
  const controller = useContext(RoadmapRowControllerContext);
  if (controller === null) {
    throw new Error("Roadmap row controller is missing");
  }

  return controller;
}

function RoadmapVirtualizedRow({
  rows,
  activeIssueId,
  index,
  style,
}: RoadmapRowData & {
  index: number;
  style: CSSProperties;
}) {
  const {
    canEdit,
    draggingIssueId,
    getPositionOnTimeline,
    onBarDragStart,
    onOpenIssue,
    onResizeStart,
    onToggleChildren,
    onToggleGroup,
    resizingIssueId,
    roadmapIssueById,
    timelineRef,
  } = useRoadmapRowController();
  const row = rows[index];
  if (!row) {
    return null;
  }

  if (row.type === "group") {
    return (
      <RoadmapGroupRow
        getPositionOnTimeline={getPositionOnTimeline}
        group={row.group}
        onToggle={onToggleGroup}
        style={style}
      />
    );
  }

  return (
    <RoadmapIssueRow
      canEdit={canEdit}
      childCount={row.childCount}
      childrenCollapsed={row.childrenCollapsed}
      depth={row.depth}
      draggingIssueId={draggingIssueId}
      getPositionOnTimeline={getPositionOnTimeline}
      hasChildren={row.hasChildren}
      issue={row.issue}
      onBarDragStart={onBarDragStart}
      onOpenIssue={onOpenIssue}
      onToggleChildren={onToggleChildren}
      onResizeStart={onResizeStart}
      resizingIssueId={resizingIssueId}
      selected={row.issue._id === activeIssueId}
      summaryCompletedCount={row.summaryCompletedCount}
      summaryDueDate={row.summaryDueDate}
      summaryStartDate={row.summaryStartDate}
      style={style}
      timelineRef={timelineRef}
      parentIssue={
        row.parentIssueId ? (roadmapIssueById.get(row.parentIssueId.toString()) ?? null) : null
      }
    />
  );
}

function RoadmapEmptyState() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Roadmap is ready for planning"
      description="No issues with due dates to display yet. Add due dates in your board or backlog to populate this timeline view."
      surface="page"
      className="h-full max-w-none border-dashed"
      data-testid={TEST_IDS.ROADMAP.EMPTY_STATE}
    />
  );
}

function RoadmapTimelineHeader({
  timelineHeaderCells,
  timelineBucketWidth,
  todayMarkerOffsetPx,
}: {
  timelineHeaderCells: TimelineHeaderCell[];
  timelineBucketWidth: number;
  todayMarkerOffsetPx: number | null;
}) {
  return (
    <div className={getCardRecipeClassName("roadmapTimelineHeaderStrip")}>
      <div className="relative">
        {renderRoadmapTodayMarker(todayMarkerOffsetPx, "header")}
        <Flex>
          <FlexItem
            shrink={false}
            className={getStickyHeaderColumnClassName()}
            data-testid={TEST_IDS.ROADMAP.ISSUE_HEADER}
          >
            <Typography variant="label">Issue</Typography>
          </FlexItem>
          <FlexItem flex="1">
            <Grid
              gap="none"
              templateColumns={`repeat(${timelineHeaderCells.length}, minmax(${timelineBucketWidth}px, 1fr))`}
            >
              {timelineHeaderCells.map((headerCell) => (
                <div
                  key={headerCell.key}
                  className={getCardRecipeClassName("roadmapMonthHeaderCell")}
                >
                  <Typography variant="label" className="text-center">
                    {headerCell.label}
                  </Typography>
                </div>
              ))}
            </Grid>
          </FlexItem>
        </Flex>
      </div>
    </div>
  );
}

function RoadmapDependencyOverlay({
  activeIssueId,
  dependencyLines,
}: {
  activeIssueId: Id<"issues"> | null;
  dependencyLines: DependencyLine[];
}) {
  if (dependencyLines.length === 0) {
    return null;
  }

  return (
    <svg
      data-testid={TEST_IDS.ROADMAP.DEPENDENCY_LINES}
      className="pointer-events-none absolute top-0"
      style={{
        left: ISSUE_INFO_COLUMN_WIDTH,
        width: `calc(100% - ${ISSUE_INFO_COLUMN_WIDTH}px)`,
        ...ROADMAP_DEPENDENCY_OVERLAY_STYLE,
      }}
      role="img"
      aria-label="Issue dependency lines"
    >
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-status-warning)" />
        </marker>
      </defs>
      {dependencyLines.map((line) => renderDependencyLine(line, activeIssueId?.toString() ?? null))}
    </svg>
  );
}

/** Timeline surface for the roadmap view, including empty state, header strip, rows, and overlays. */
export function RoadmapTimelineSurface({
  activeIssueId,
  dependencyLines,
  filteredIssues,
  listRef,
  roadmapRowController,
  showDependencies,
  timelineHeaderCells,
  timelineLayoutWidth,
  timelineRows,
  timelineBucketWidth,
  todayMarkerOffsetPx,
}: {
  activeIssueId: Id<"issues"> | null;
  dependencyLines: DependencyLine[];
  filteredIssues: RoadmapIssue[];
  listRef: RefObject<ListImperativeAPI | null>;
  roadmapRowController: RoadmapRowController;
  showDependencies: boolean;
  timelineHeaderCells: TimelineHeaderCell[];
  timelineLayoutWidth: number;
  timelineRows: TimelineRow[];
  timelineBucketWidth: number;
  todayMarkerOffsetPx: number | null;
}) {
  return (
    <Card variant="default" padding="none" className="flex-1 overflow-hidden">
      <FlexItem flex="1">
        {filteredIssues.length === 0 ? (
          <RoadmapEmptyState />
        ) : (
          <div className="h-full overflow-x-auto">
            <div
              data-testid={TEST_IDS.ROADMAP.TIMELINE_CANVAS}
              className="min-w-full"
              style={{ width: `${timelineLayoutWidth}px` }}
            >
              <RoadmapTimelineHeader
                timelineHeaderCells={timelineHeaderCells}
                timelineBucketWidth={timelineBucketWidth}
                todayMarkerOffsetPx={todayMarkerOffsetPx}
              />

              <div className="relative">
                {renderRoadmapTodayMarker(todayMarkerOffsetPx, "body")}
                <RoadmapRowControllerContext.Provider value={roadmapRowController}>
                  <List<RoadmapRowData>
                    listRef={listRef}
                    style={ROADMAP_TIMELINE_VIEWPORT_STYLE}
                    rowCount={timelineRows.length}
                    rowHeight={ROADMAP_ROW_HEIGHT}
                    rowProps={{
                      rows: timelineRows,
                      activeIssueId,
                    }}
                    rowComponent={RoadmapVirtualizedRow}
                  />
                </RoadmapRowControllerContext.Provider>

                {showDependencies ? (
                  <RoadmapDependencyOverlay
                    activeIssueId={activeIssueId}
                    dependencyLines={dependencyLines}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </FlexItem>
    </Card>
  );
}
