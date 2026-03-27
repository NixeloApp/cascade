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
import { useEffect, useRef, useState } from "react";
import type { ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { RoadmapDependencyPanel } from "./Roadmap/RoadmapDependencyPanel";
import { RoadmapHeaderControls } from "./Roadmap/RoadmapHeaderControls";
import { RoadmapLoadingState } from "./Roadmap/RoadmapLoadingState";
import {
  type RoadmapRowController,
  RoadmapTimelineSurface,
} from "./Roadmap/RoadmapTimelineSurface";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

// Pure function - no need to be inside component

interface RoadmapViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

import type {
  DragState,
  GroupBy,
  ResizeState,
  RoadmapIssue,
  TimelineSpan,
  TimelineZoom,
  ViewMode,
} from "./Roadmap/types";
import { TIMELINE_BUCKET_WIDTH } from "./Roadmap/types";
import {
  buildDragPatch,
  buildIssueLookupMap,
  buildIssueRowIndexMap,
  buildMonthHeaderCells,
  buildResizePatch,
  buildRoadmapDependencyItems,
  buildTimelineRows,
  buildWeekHeaderCells,
  computeDependencyLines,
  getAvailableRoadmapDependencyTargets,
  getTimelineFitWindow,
  getTimelineLayoutWidth,
  getTimelineRangeLabel,
  getTimelineWindowStepLabel,
  getTodayMarkerOffsetPx,
  shiftTimelineAnchorDate,
} from "./Roadmap/utils";

/** Build a map of issue ID to issue for O(1) lookups */

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
      <div className="h-full" data-testid={TEST_IDS.ROADMAP.CONTENT}>
        <Flex direction="column" className="h-full">
          {/* Header */}
          <Flex
            direction="column"
            directionSm="row"
            align="start"
            alignSm="center"
            justifySm="between"
            gap="sm"
            gapSm="lg"
            mb="lg"
            className="shrink-0"
            data-testid={TEST_IDS.ROADMAP.HEADER}
          >
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

          <RoadmapTimelineSurface
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
      </div>
    </PageLayout>
  );
}
