/**
 * Roadmap View
 *
 * Gantt-style timeline view for issue planning and dependency visualization.
 * Supports drag-and-drop date editing, dependency lines, and virtualized scrolling.
 * Provides sprint filtering and keyboard navigation for roadmap planning.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import type { FunctionReturnType } from "convex/server";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/formatting";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LinkIcon,
  Plus,
  X,
} from "@/lib/icons";
import {
  getPriorityBadgeTone,
  getPriorityColor,
  getStatusBadgeTone,
  ISSUE_TYPE_ICONS,
} from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { RoadmapDependencyPanel, renderDependencyLine } from "./Roadmap/RoadmapDependencyPanel";
import { RoadmapHeaderControls } from "./Roadmap/RoadmapHeaderControls";
import { RoadmapLoadingState } from "./Roadmap/RoadmapLoadingState";
import {
  RoadmapGroupRow,
  RoadmapIssueIdentity,
  RoadmapIssueRow,
  RoadmapSummaryBar,
  RoadmapTimelineBar,
} from "./Roadmap/RoadmapRows";
import { renderRoadmapTodayMarker } from "./Roadmap/RoadmapTodayMarker";
import { Badge } from "./ui/Badge";
import { Card, getCardRecipeClassName } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { SegmentedControl, SegmentedControlItem } from "./ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Skeleton } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

// Pure function - no need to be inside component

interface RoadmapViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

import type {
  DependencyLine,
  DependencyLineBuildArgs,
  DragComputationArgs,
  DragState,
  GroupBy,
  HierarchyIssueRow,
  ResizeComputationArgs,
  ResizeState,
  RoadmapBarIssue,
  RoadmapDependencyItem,
  RoadmapEpic,
  RoadmapIssue,
  RoadmapIssueRowProps,
  RoadmapTimelineIssue,
  TimelineGeometryArgs,
  TimelineGroup,
  TimelineHeaderCell,
  TimelineRow,
  TimelineSpan,
  TimelineZoom,
  ViewMode,
} from "./Roadmap/types";
import {
  ACTIVE_DEPENDENCY_OPACITY,
  ACTIVE_DEPENDENCY_STROKE_WIDTH,
  DEFAULT_DEPENDENCY_OPACITY,
  DEFAULT_DEPENDENCY_STROKE_WIDTH,
  DIMMED_DEPENDENCY_OPACITY,
  DIMMED_DEPENDENCY_STROKE_WIDTH,
  GROUP_BY_OPTIONS,
  ISSUE_INFO_COLUMN_WIDTH,
  PRIORITY_ORDER,
  ROADMAP_DEPENDENCY_TARGET_NONE,
  ROADMAP_ROW_HEIGHT,
  TIMELINE_BUCKET_WIDTH,
  TIMELINE_SPANS,
  TIMELINE_ZOOM_OPTIONS,
} from "./Roadmap/types";
import {
  buildDependencyLine,
  buildDragPatch,
  buildIssueHierarchyRows,
  buildIssueLookupMap,
  buildIssueRowIndexMap,
  buildMonthHeaderCells,
  buildResizePatch,
  buildRoadmapDependencyItems,
  buildTimelineRows,
  buildWeekHeaderCells,
  compareTimelineGroups,
  computeDependencyLines,
  getAvailableRoadmapDependencyTargets,
  getBarLeft,
  getBarWidth,
  getBestFitTimelineSpan,
  getDependencyLineOpacity,
  getDependencyLineStrokeWidth,
  getDependencyPath,
  getGroupDescriptor,
  getPriorityLabel,
  getRoadmapBarTitle,
  getRoadmapDateBadgeLabel,
  getRoadmapStatusLabel,
  getRoadmapSubtaskCaption,
  getStickyIssueColumnClassName,
  getSummaryCompletionLabel,
  getSummaryCompletionPercentage,
  getTimelineFitWindow,
  getTimelineGroupBadgeTone,
  getTimelineGroupLabel,
  getTimelineGroupSummary,
  getTimelineLayoutWidth,
  getTimelineMonthsCovered,
  getTimelineRangeLabel,
  getTimelineWindowStepLabel,
  getTodayMarkerOffsetPx,
  isDependencyLineFocused,
  isRoadmapIssueCompleted,
  isRoadmapMilestone,
  shiftTimelineAnchorDate,
  shouldRenderEpicSummaryBar,
} from "./Roadmap/utils";

const PRIORITY_SORT_ORDER: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

/** Build a map of issue ID to issue for O(1) lookups */

type RoadmapRowData = {
  rows: TimelineRow[];
  activeIssueId: Id<"issues"> | null;
};

type RoadmapRowController = {
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
  timelineRef: React.RefObject<HTMLDivElement | null>;
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
  style: React.CSSProperties;
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
  if (!row) return null;

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

function RoadmapTimelineContainer({
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
  listRef: React.RefObject<ListImperativeAPI | null>;
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
          <EmptyState
            icon={CalendarDays}
            title="Roadmap is ready for planning"
            description="No issues with due dates to display yet. Add due dates in your board or backlog to populate this timeline view."
            className="m-6 min-h-96 max-w-none border-dashed"
          />
        ) : (
          <div className="h-full overflow-x-auto">
            <div
              data-testid={TEST_IDS.ROADMAP.TIMELINE_CANVAS}
              className="min-w-full"
              style={{ width: `${timelineLayoutWidth}px` }}
            >
              <div className="border-b border-ui-border bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 p-4">
                <div className="relative">
                  {renderRoadmapTodayMarker(todayMarkerOffsetPx, "header")}
                  <Flex>
                    <FlexItem
                      shrink={false}
                      className="sticky left-0 z-30 w-sidebar shrink-0 border-r border-ui-border/70 bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 pr-4"
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

              <div className="relative">
                {renderRoadmapTodayMarker(todayMarkerOffsetPx, "body")}
                <RoadmapRowControllerContext.Provider value={roadmapRowController}>
                  <List<RoadmapRowData>
                    listRef={listRef}
                    style={{ height: 600, width: "100%" }}
                    rowCount={timelineRows.length}
                    rowHeight={ROADMAP_ROW_HEIGHT}
                    rowProps={{
                      rows: timelineRows,
                      activeIssueId,
                    }}
                    rowComponent={RoadmapVirtualizedRow}
                  />
                </RoadmapRowControllerContext.Provider>

                {showDependencies && dependencyLines.length > 0 ? (
                  <svg
                    className="pointer-events-none absolute top-0"
                    style={{
                      left: ISSUE_INFO_COLUMN_WIDTH,
                      width: `calc(100% - ${ISSUE_INFO_COLUMN_WIDTH}px)`,
                      height: 600,
                    }}
                    role="img"
                    aria-label="Issue dependency lines"
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="6"
                        markerHeight="4"
                        refX="5"
                        refY="2"
                        orient="auto"
                      >
                        <polygon points="0 0, 6 2, 0 4" fill="var(--color-status-warning)" />
                      </marker>
                    </defs>
                    {dependencyLines.map((line) =>
                      renderDependencyLine(line, activeIssueId?.toString() ?? null),
                    )}
                  </svg>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </FlexItem>
    </Card>
  );
}

function useRoadmapTimelineInteractions({
  canEdit,
  startOfMonth,
  timelineRef,
  totalDays,
  updateIssue,
}: {
  canEdit: boolean;
  startOfMonth: Date;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  totalDays: number;
  updateIssue: ReturnType<typeof useAuthenticatedMutation<typeof api.issues.update>>["mutate"];
}) {
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    edge: "left" | "right",
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      issueId,
      edge,
      startX: e.clientX,
      originalStartDate: startDate,
      originalDueDate: dueDate,
    });
  };

  const handleBarDragStart = (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => {
    if (!canEdit || !dueDate) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging({
      issueId,
      startX: e.clientX,
      originalStartDate: startDate,
      originalDueDate: dueDate,
    });
  };

  useEffect(() => {
    if (!(resizing || dragging) || !timelineRef.current) return;

    const handleMouseMove = () => {
      const container = timelineRef.current;
      if (!container) return;
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const container = timelineRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const getPosition = (date: number) => {
        const issueDate = new Date(date);
        const daysSinceStart = Math.floor((issueDate.getTime() - startOfMonth.getTime()) / DAY);
        return (daysSinceStart / totalDays) * 100;
      };
      const getDate = (percent: number) => {
        const days = Math.round((percent / 100) * totalDays);
        const date = new Date(startOfMonth.getTime() + days * DAY);
        date.setHours(23, 59, 59, 999);
        return date.getTime();
      };

      const nextUpdate = resizing
        ? buildResizePatch({
            resizing,
            clientX: e.clientX,
            containerWidth: rect.width,
            getPositionOnTimeline: getPosition,
            getDateFromPosition: getDate,
          })
        : dragging
          ? buildDragPatch({
              dragging,
              clientX: e.clientX,
              containerWidth: rect.width,
              totalDays,
            })
          : null;

      try {
        if (nextUpdate) {
          await updateIssue({
            issueId: nextUpdate.issueId,
            ...nextUpdate.patch,
          });
        }
      } finally {
        setResizing(null);
        setDragging(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, startOfMonth, timelineRef, totalDays, updateIssue]);

  return {
    dragging,
    handleBarDragStart,
    handleResizeStart,
    resizing,
  };
}

/** Compute dependency lines from issue links */
/** Gantt-style roadmap view with issue timeline bars and dependency lines. */
export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("months");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<string[]>([]);
  const [collapsedParentIssueIds, setCollapsedParentIssueIds] = useState<string[]>([]);
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");
  const [timelineSpan, setTimelineSpan] = useState<TimelineSpan>(6);
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>("standard");
  const [timelineAnchorDate, setTimelineAnchorDate] = useState(() => new Date());
  const [showDependencies, setShowDependencies] = useState(true);

  const { mutate: updateIssue } = useAuthenticatedMutation(api.issues.update);

  // Fetch epics for the dropdown (separate optimized query)
  const epics = useAuthenticatedQuery(api.issues.listEpics, { projectId });

  // Fetch issue dependencies for visualizing connections
  const issueLinks = useAuthenticatedQuery(api.issueLinks.getForProject, { projectId });

  // Fetch filtered issues - backend applies all filters
  const filteredIssues = useAuthenticatedQuery(api.issues.listRoadmapIssues, {
    projectId,
    sprintId,
    excludeEpics: true, // Don't include epics in main list
    epicId: filterEpic !== "all" ? filterEpic : undefined, // Filter by selected epic
    hasDueDate: true, // Only show issues with due dates
    includeSubtasks: true,
  });

  const project = useAuthenticatedQuery(api.projects.getProject, { id: projectId });

  const startOfMonth = new Date(timelineAnchorDate.getFullYear(), timelineAnchorDate.getMonth(), 1);
  const endOfTimespan = new Date(
    timelineAnchorDate.getFullYear(),
    timelineAnchorDate.getMonth() + timelineSpan,
    0,
  );
  const totalDays = Math.max(
    1,
    Math.floor((endOfTimespan.getTime() - startOfMonth.getTime()) / DAY),
  );
  const timelineRangeLabel = getTimelineRangeLabel(startOfMonth, endOfTimespan);
  const timelineHeaderCells =
    viewMode === "weeks"
      ? buildWeekHeaderCells(startOfMonth, endOfTimespan)
      : buildMonthHeaderCells(startOfMonth, timelineSpan);
  const timelineLayoutWidth = getTimelineLayoutWidth(
    viewMode,
    timelineZoom,
    timelineHeaderCells.length,
  );
  const timelineBucketWidth = TIMELINE_BUCKET_WIDTH[viewMode][timelineZoom];
  const timelineRows = buildTimelineRows(
    filteredIssues,
    groupBy,
    collapsedGroupKeys,
    collapsedParentIssueIds,
  );
  const fitTimelineWindow = getTimelineFitWindow(filteredIssues);
  const todayMarkerOffsetPx = getTodayMarkerOffsetPx(
    Date.now(),
    startOfMonth,
    endOfTimespan,
    timelineLayoutWidth,
  );
  const previousWindowLabel = getTimelineWindowStepLabel("previous", timelineSpan);
  const nextWindowLabel = getTimelineWindowStepLabel("next", timelineSpan);

  const getPositionOnTimeline = (date: number) => {
    const issueDate = new Date(date);
    const daysSinceStart = Math.floor((issueDate.getTime() - startOfMonth.getTime()) / DAY);
    return (daysSinceStart / totalDays) * 100;
  };

  // Reference to timeline container for calculating positions
  const timelineRef = useRef<HTMLDivElement>(null);
  const { dragging, handleBarDragStart, handleResizeStart, resizing } =
    useRoadmapTimelineInteractions({
      canEdit,
      startOfMonth,
      timelineRef,
      totalDays,
      updateIssue,
    });

  // Keyboard navigation
  const listRef = useRef<ListImperativeAPI>(null);
  const { selectedIndex } = useListNavigation({
    items: filteredIssues ?? [],
    onSelect: (issue: RoadmapIssue) => setSelectedIssue(issue._id),
  });
  const selectedIssueId =
    selectedIndex >= 0 ? (filteredIssues?.[selectedIndex]?._id ?? null) : null;
  const activeRoadmapIssueId = selectedIssue ?? selectedIssueId;
  const issueById = buildIssueLookupMap(filteredIssues);
  const roadmapIssueById = new Map(
    (filteredIssues ?? []).map((issue) => [issue._id.toString(), issue]),
  );
  const activeRoadmapIssue =
    activeRoadmapIssueId === null
      ? null
      : (roadmapIssueById.get(activeRoadmapIssueId.toString()) ?? null);
  const activeRoadmapIssueDependencies = buildRoadmapDependencyItems({
    activeIssueId: activeRoadmapIssueId?.toString() ?? null,
    issueLinks,
    roadmapIssueById,
  });
  const availableRoadmapDependencyTargets = getAvailableRoadmapDependencyTargets({
    activeIssueId: activeRoadmapIssueId?.toString() ?? null,
    blocks: activeRoadmapIssueDependencies.blocks,
    issues: filteredIssues,
  });
  const issueRowIndexMap = buildIssueRowIndexMap(timelineRows);

  // Sync keyboard selection with scroll
  useEffect(() => {
    if (!selectedIssueId || !listRef.current) {
      return;
    }
    const selectedRowIndex = issueRowIndexMap.get(selectedIssueId);
    if (selectedRowIndex !== undefined) {
      listRef.current.scrollToRow({ index: selectedRowIndex });
    }
  }, [issueRowIndexMap, selectedIssueId]);

  // Calculate dependency lines for "blocks" relationships
  const dependencyLines = computeDependencyLines({
    showDependencies,
    issueLinks,
    issueById,
    issueRowIndexMap,
    getPositionOnTimeline,
  });
  const handleToggleChildren = (issueId: Id<"issues">) => {
    setCollapsedParentIssueIds((currentIds) =>
      currentIds.includes(issueId)
        ? currentIds.filter((currentId) => currentId !== issueId)
        : [...currentIds, issueId],
    );
  };
  const handleToggleGroup = (groupKey: string) => {
    setCollapsedGroupKeys((currentKeys) =>
      currentKeys.includes(groupKey)
        ? currentKeys.filter((key) => key !== groupKey)
        : [...currentKeys, groupKey],
    );
  };
  const roadmapRowController: RoadmapRowController = {
    canEdit,
    draggingIssueId: dragging?.issueId,
    getPositionOnTimeline,
    onBarDragStart: handleBarDragStart,
    onOpenIssue: setSelectedIssue,
    onResizeStart: handleResizeStart,
    onToggleChildren: handleToggleChildren,
    onToggleGroup: handleToggleGroup,
    resizingIssueId: resizing?.issueId,
    roadmapIssueById,
    timelineRef,
  };
  const handlePreviousWindow = () => {
    setTimelineAnchorDate((currentDate) => shiftTimelineAnchorDate(currentDate, -1, timelineSpan));
  };
  const handleNextWindow = () => {
    setTimelineAnchorDate((currentDate) => shiftTimelineAnchorDate(currentDate, 1, timelineSpan));
  };
  const handleFitToIssues = () => {
    if (!fitTimelineWindow) {
      return;
    }

    setTimelineAnchorDate(fitTimelineWindow.anchorDate);
    setTimelineSpan(fitTimelineWindow.timelineSpan);
  };
  const handleGroupByChange = (value: GroupBy) => {
    setGroupBy(value);
    setCollapsedGroupKeys([]);
  };

  // Loading State
  if (!(project && filteredIssues && epics)) {
    return <RoadmapLoadingState />;
  }

  return (
    <PageLayout fullHeight className="overflow-hidden">
      <Flex direction="column" className="h-full">
        {/* Header */}
        <Flex align="center" justify="between" className="mb-6 shrink-0">
          <Stack gap="xs">
            <Typography variant="h2">Roadmap</Typography>
            <Typography variant="small" color="secondary">
              Visualize issue timeline and dependencies across {timelineRangeLabel}
            </Typography>
          </Stack>

          <RoadmapHeaderControls
            epics={epics}
            filterEpic={filterEpic}
            fitTimelineWindow={fitTimelineWindow}
            groupBy={groupBy}
            nextWindowLabel={nextWindowLabel}
            onFilterEpicChange={setFilterEpic}
            onFitToIssues={handleFitToIssues}
            onGroupByChange={handleGroupByChange}
            onNextWindow={handleNextWindow}
            onPreviousWindow={handlePreviousWindow}
            onTimelineSpanChange={setTimelineSpan}
            onTimelineZoomChange={setTimelineZoom}
            onToday={() => setTimelineAnchorDate(new Date())}
            onToggleDependencies={() => setShowDependencies((current) => !current)}
            onViewModeChange={setViewMode}
            previousWindowLabel={previousWindowLabel}
            showDependencies={showDependencies}
            timelineRangeLabel={timelineRangeLabel}
            timelineSpan={timelineSpan}
            timelineZoom={timelineZoom}
            viewMode={viewMode}
          />
        </Flex>

        {activeRoadmapIssue ? (
          <RoadmapDependencyPanel
            key={activeRoadmapIssue._id}
            activeIssue={activeRoadmapIssue}
            availableTargetIssues={availableRoadmapDependencyTargets}
            blockedBy={activeRoadmapIssueDependencies.blockedBy}
            blocks={activeRoadmapIssueDependencies.blocks}
            canEdit={canEdit}
            onFocusIssue={setSelectedIssue}
          />
        ) : null}

        <RoadmapTimelineContainer
          activeIssueId={activeRoadmapIssueId}
          dependencyLines={dependencyLines}
          filteredIssues={filteredIssues}
          listRef={listRef}
          roadmapRowController={roadmapRowController}
          showDependencies={showDependencies}
          timelineHeaderCells={timelineHeaderCells}
          timelineLayoutWidth={timelineLayoutWidth}
          timelineRows={timelineRows}
          timelineBucketWidth={timelineBucketWidth}
          todayMarkerOffsetPx={todayMarkerOffsetPx}
        />

        {/* Issue Detail */}
        {selectedIssue && (
          <IssueDetailViewer
            issueId={selectedIssue}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedIssue(null);
              }
            }}
            canEdit={canEdit}
          />
        )}
      </Flex>
    </PageLayout>
  );
}
