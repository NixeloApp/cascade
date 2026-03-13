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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/dates";
import { CalendarDays, LinkIcon } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { Card } from "./ui/Card";
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

/** Timeline span options in months */
type TimelineSpan = 1 | 3 | 6 | 12;

const TIMELINE_SPANS: { value: TimelineSpan; label: string }[] = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 12, label: "1 Year" },
];
/** Dependency line data for rendering SVG arrows */
interface DependencyLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromIssueId: string;
  toIssueId: string;
}

interface RoadmapTimelineIssue {
  _id: Id<"issues">;
  startDate?: number;
  dueDate?: number;
}

interface ResizeState {
  issueId: Id<"issues">;
  edge: "left" | "right";
  startX: number;
  originalStartDate?: number;
  originalDueDate?: number;
}

interface ResizeComputationArgs {
  resizing: ResizeState;
  clientX: number;
  containerWidth: number;
  getPositionOnTimeline: (date: number) => number;
  getDateFromPosition: (percent: number) => number;
}

interface TimelineGeometryArgs {
  issue: RoadmapTimelineIssue;
  getPositionOnTimeline: (date: number) => number;
}

interface DependencyLineBuildArgs {
  issueIndexMap: Map<string, number>;
  issues: RoadmapTimelineIssue[];
  link: {
    fromIssueId: string;
    toIssueId: string;
  };
  rowHeight: number;
  getPositionOnTimeline: (date: number) => number;
}

function getBarWidth(
  startDate: number | undefined,
  dueDate: number,
  getPositionOnTimeline: (date: number) => number,
) {
  if (!startDate) {
    return 5;
  }
  const start = getPositionOnTimeline(startDate);
  const end = getPositionOnTimeline(dueDate);
  return Math.max(2, end - start);
}

function getBarLeft(
  startDate: number | undefined,
  dueDate: number,
  getPositionOnTimeline: (date: number) => number,
) {
  if (startDate) {
    return getPositionOnTimeline(startDate);
  }
  return getPositionOnTimeline(dueDate) - 2.5;
}

function getTimelineGeometry({ issue, getPositionOnTimeline }: TimelineGeometryArgs) {
  if (!issue.dueDate) {
    return null;
  }

  const left = getBarLeft(issue.startDate, issue.dueDate, getPositionOnTimeline);
  const width = getBarWidth(issue.startDate, issue.dueDate, getPositionOnTimeline);

  return {
    left,
    width,
    right: left + width,
  };
}

function buildResizePatch({
  resizing,
  clientX,
  containerWidth,
  getPositionOnTimeline,
  getDateFromPosition,
}: ResizeComputationArgs) {
  const deltaX = clientX - resizing.startX;
  const deltaPercent = (deltaX / containerWidth) * 100;

  if (resizing.edge === "left" && resizing.originalStartDate) {
    const originalPercent = getPositionOnTimeline(resizing.originalStartDate);
    const nextStartDate = getDateFromPosition(originalPercent + deltaPercent);
    const dateObj = new Date(nextStartDate);
    dateObj.setHours(0, 0, 0, 0);
    const startDate = dateObj.getTime();

    if (resizing.originalDueDate && startDate >= resizing.originalDueDate) {
      return null;
    }

    return {
      issueId: resizing.issueId,
      patch: { startDate },
    };
  }

  if (resizing.edge === "right" && resizing.originalDueDate) {
    const originalPercent = getPositionOnTimeline(resizing.originalDueDate);
    const dueDate = getDateFromPosition(originalPercent + deltaPercent);

    if (resizing.originalStartDate && dueDate <= resizing.originalStartDate) {
      return null;
    }

    return {
      issueId: resizing.issueId,
      patch: { dueDate },
    };
  }

  return null;
}

function buildDependencyLine({
  issueIndexMap,
  issues,
  link,
  rowHeight,
  getPositionOnTimeline,
}: DependencyLineBuildArgs): DependencyLine | null {
  const fromIndex = issueIndexMap.get(link.fromIssueId);
  const toIndex = issueIndexMap.get(link.toIssueId);

  if (fromIndex === undefined || toIndex === undefined) {
    return null;
  }

  const fromIssue = issues[fromIndex];
  const toIssue = issues[toIndex];
  if (!fromIssue || !toIssue) {
    return null;
  }

  const fromGeometry = getTimelineGeometry({ issue: fromIssue, getPositionOnTimeline });
  const toGeometry = getTimelineGeometry({ issue: toIssue, getPositionOnTimeline });
  if (!fromGeometry || !toGeometry) {
    return null;
  }

  return {
    fromX: fromGeometry.right,
    fromY: fromIndex * rowHeight + rowHeight / 2,
    toX: toGeometry.left,
    toY: toIndex * rowHeight + rowHeight / 2,
    fromIssueId: link.fromIssueId,
    toIssueId: link.toIssueId,
  };
}

function getDependencyPath(line: DependencyLine) {
  return `M ${line.fromX}% ${line.fromY}
      C ${line.fromX + 5}% ${line.fromY},
        ${line.toX - 5}% ${line.toY},
        ${line.toX}% ${line.toY}`;
}

/** Gantt-style roadmap view with issue timeline bars and dependency lines. */
export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");
  const [timelineSpan, setTimelineSpan] = useState<TimelineSpan>(6);
  const [showDependencies, setShowDependencies] = useState(true);

  // Resize state
  const [resizing, setResizing] = useState<ResizeState | null>(null);

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
  });

  const project = useAuthenticatedQuery(api.projects.getProject, { id: projectId });

  type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];
  type Epic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

  const { startOfMonth, timelineMonths, totalDays } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + timelineSpan, 0);
    const months = Array.from(
      { length: timelineSpan },
      (_, index) => new Date(today.getFullYear(), today.getMonth() + index, 1),
    );
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY));

    return {
      startOfMonth: start,
      timelineMonths: months,
      totalDays: days,
    };
  }, [timelineSpan]);

  const getPositionOnTimeline = useCallback(
    (date: number) => {
      const issueDate = new Date(date);
      const daysSinceStart = Math.floor((issueDate.getTime() - startOfMonth.getTime()) / DAY);
      return (daysSinceStart / totalDays) * 100;
    },
    [startOfMonth, totalDays],
  );

  // Convert percentage position back to timestamp
  const getDateFromPosition = useCallback(
    (percent: number) => {
      const days = Math.round((percent / 100) * totalDays);
      const date = new Date(startOfMonth.getTime() + days * DAY);
      // Set to end of day for due dates
      date.setHours(23, 59, 59, 999);
      return date.getTime();
    },
    [totalDays, startOfMonth],
  );

  // Reference to timeline container for calculating positions
  const timelineRef = useRef<HTMLDivElement>(null);

  // Start resizing
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

  // Handle mouse move during resize
  useEffect(() => {
    if (!resizing || !timelineRef.current) return;

    const handleMouseMove = () => {
      const container = timelineRef.current;
      if (!container) return;

      // Visual feedback only - actual update happens on mouse up
      // Mouse position is tracked relative to container for date calculation
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const container = timelineRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const resizeUpdate = buildResizePatch({
        resizing,
        clientX: e.clientX,
        containerWidth: rect.width,
        getPositionOnTimeline,
        getDateFromPosition,
      });

      if (resizeUpdate) {
        await updateIssue({
          issueId: resizeUpdate.issueId,
          ...resizeUpdate.patch,
        });
      }

      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, getDateFromPosition, getPositionOnTimeline, updateIssue]);

  // Keyboard navigation
  const listRef = useRef<ListImperativeAPI>(null);
  const { selectedIndex } = useListNavigation({
    items: filteredIssues ?? [],
    onSelect: (issue: RoadmapIssue) => setSelectedIssue(issue._id),
  });

  // Sync keyboard selection with scroll
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex });
    }
  }, [selectedIndex]);

  // Create issue index map for dependency line rendering
  // Memoized to avoid O(n) recomputation on every render
  const issueIndexMap = useMemo(() => {
    if (!filteredIssues) return new Map<string, number>();
    const map = new Map<string, number>();
    filteredIssues.forEach((issue, index) => {
      map.set(issue._id, index);
    });
    return map;
  }, [filteredIssues]);

  // Calculate dependency lines for "blocks" relationships
  // Memoized to avoid O(links) recomputation on every render
  const dependencyLines = useMemo((): DependencyLine[] => {
    if (!showDependencies || !issueLinks?.links || !filteredIssues) return [];

    const rowHeight = 56;

    return issueLinks.links
      .filter((link) => link.linkType === "blocks")
      .map((link) =>
        buildDependencyLine({
          issueIndexMap,
          issues: filteredIssues,
          link,
          rowHeight,
          getPositionOnTimeline,
        }),
      )
      .filter((line): line is DependencyLine => line !== null);
  }, [showDependencies, issueLinks, filteredIssues, issueIndexMap, getPositionOnTimeline]);

  // Row renderer for virtualization
  type RowData = {
    issues: typeof filteredIssues;
    selectedIndex: number;
  };

  function Row({
    issues,
    selectedIndex,
    index,
    style,
  }: RowData & {
    index: number;
    style: React.CSSProperties;
  }) {
    if (!issues) return null;
    const issue = issues[index];
    const isSelected = index === selectedIndex;

    return (
      <Card
        recipe={isSelected ? "roadmapRowSelected" : "roadmapRow"}
        style={style}
        className={cn("transition-colors", isSelected && "z-10")}
      >
        <Flex align="center">
          {/* Issue Info */}
          <FlexItem shrink={false} className="w-64 pr-4">
            <Flex align="center" gap="sm" className="mb-1">
              <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
              <Button
                variant="unstyled"
                onClick={() => setSelectedIssue(issue._id)}
                className={cn(
                  "h-auto truncate p-0 text-left text-sm font-medium",
                  isSelected ? "text-brand-hover" : "text-ui-text",
                )}
              >
                {issue.key}
              </Button>
            </Flex>
            <Typography variant="caption">{issue.title}</Typography>
          </FlexItem>

          {/* Timeline Bar */}
          <FlexItem flex="1" className="relative h-8" ref={timelineRef}>
            {issue.dueDate && (
              <Card
                recipe={
                  resizing?.issueId === issue._id
                    ? "roadmapTimelineBarActive"
                    : "roadmapTimelineBar"
                }
                className={cn("group absolute h-6", getPriorityColor(issue.priority, "bg"))}
                style={{
                  left: `${getBarLeft(issue.startDate, issue.dueDate, getPositionOnTimeline)}%`,
                  width: `${getBarWidth(issue.startDate, issue.dueDate, getPositionOnTimeline)}%`,
                }}
              >
                <Flex align="center" className="h-full">
                  {/* Left resize handle */}
                  {canEdit && issue.startDate && (
                    <Button
                      variant="unstyled"
                      size="none"
                      chrome="roadmapResizeHandle"
                      reveal={true}
                      className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize rounded-l-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, issue._id, "left", issue.startDate, issue.dueDate)
                      }
                      title="Drag to change start date"
                    >
                      <div className="h-3 w-0.5 bg-ui-text-tertiary" />
                    </Button>
                  )}

                  {/* Bar content - clickable */}
                  <Button
                    variant="unstyled"
                    className="h-full w-full px-2"
                    onClick={() => setSelectedIssue(issue._id)}
                    title={`${issue.title}${issue.startDate ? ` - Start: ${formatDate(issue.startDate)}` : ""} - Due: ${formatDate(issue.dueDate)}`}
                    aria-label={`View issue ${issue.key}`}
                  >
                    <Flex align="center" justify="center" className="h-full">
                      <Typography variant="label" className="truncate text-brand-foreground">
                        {issue.assignee?.name.split(" ")[0]}
                      </Typography>
                    </Flex>
                  </Button>

                  {/* Right resize handle */}
                  {canEdit && (
                    <Button
                      variant="unstyled"
                      size="none"
                      chrome="roadmapResizeHandle"
                      reveal={true}
                      className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize rounded-r-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, issue._id, "right", issue.startDate, issue.dueDate)
                      }
                      title="Drag to change due date"
                    >
                      <div className="h-3 w-0.5 bg-ui-text-tertiary" />
                    </Button>
                  )}
                </Flex>
              </Card>
            )}

            {/* Today Indicator */}
            <div
              className="absolute top-0 bottom-0 z-10 w-0.5 bg-status-error"
              style={{ left: `${getPositionOnTimeline(Date.now())}%` }}
              title="Today"
            />
          </FlexItem>
        </Flex>
      </Card>
    );
  }

  // Loading State
  if (!(project && filteredIssues && epics)) {
    return (
      <PageLayout fullHeight className="overflow-hidden">
        <Flex direction="column" className="h-full">
          {/* Skeleton Header */}
          <Flex align="center" justify="between" className="mb-6 shrink-0">
            <Stack gap="xs">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </Stack>
            <Flex gap="md">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-8 w-32" />
            </Flex>
          </Flex>

          {/* Skeleton Timeline */}
          <Card variant="default" padding="none" className="flex-1 overflow-hidden">
            {/* Skeleton Dates Header */}
            <Card
              variant="soft"
              padding="md"
              radius="none"
              className="shrink-0 border-b border-ui-border"
            >
              <Flex>
                <FlexItem shrink={false} className="w-64">
                  <Skeleton className="h-5 w-24" />
                </FlexItem>
                <FlexItem flex="1">
                  <Grid cols={6} gap="sm">
                    {[1, 2, 3, 4, 5, 6].map((id) => (
                      <Skeleton key={id} className="h-5 w-full" />
                    ))}
                  </Grid>
                </FlexItem>
              </Flex>
            </Card>

            {/* Skeleton Rows */}
            <FlexItem flex="1">
              <Stack className="overflow-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card
                    key={i}
                    padding="none"
                    radius="none"
                    variant="ghost"
                    className="border-b border-ui-border"
                  >
                    <Flex align="center">
                      <FlexItem shrink={false} className="w-64 pr-4">
                        <Flex align="center" gap="sm">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                        </Flex>
                        <Skeleton className="h-3 w-32" />
                      </FlexItem>
                      <FlexItem flex="1" className="relative h-8">
                        <div
                          className="absolute h-6"
                          style={{
                            left: `${(i * 13) % 70}%`, // Deterministic position
                            width: `${10 + ((i * 3) % 10)}%`,
                          }}
                        >
                          <Skeleton className="h-full w-full rounded-full opacity-50" />
                        </div>
                      </FlexItem>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </FlexItem>
          </Card>
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullHeight className="overflow-hidden">
      <Flex direction="column" className="h-full">
        {/* Header */}
        <Flex align="center" justify="between" className="mb-6 shrink-0">
          <Stack gap="xs">
            <Typography variant="h2">Roadmap</Typography>
            <Typography variant="small" color="secondary">
              Visualize issue timeline and dependencies
            </Typography>
          </Stack>

          <Card recipe="controlRail" padding="xs" radius="full">
            <Flex align="center" gap="sm" wrap>
              {/* Epic Filter */}
              <Select
                value={filterEpic === "all" ? "all" : filterEpic}
                onValueChange={(value) =>
                  setFilterEpic(value === "all" ? "all" : (value as Id<"issues">))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Epics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Epics</SelectItem>
                  {epics?.map((epic: Epic) => (
                    <SelectItem key={epic._id} value={epic._id}>
                      {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Timeline Span Selector */}
              <Select
                value={String(timelineSpan)}
                onValueChange={(value) => setTimelineSpan(Number(value) as TimelineSpan)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_SPANS.map((span) => (
                    <SelectItem key={span.value} value={String(span.value)}>
                      {span.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <SegmentedControl
                value={viewMode}
                onValueChange={(value: string) => value && setViewMode(value as "months" | "weeks")}
                size="sm"
              >
                <SegmentedControlItem value="months">Months</SegmentedControlItem>
                <SegmentedControlItem value="weeks">Weeks</SegmentedControlItem>
              </SegmentedControl>

              {/* Dependency Lines Toggle */}
              <Button
                variant={showDependencies ? "primary" : "ghost"}
                size="sm"
                onClick={() => setShowDependencies(!showDependencies)}
                title={showDependencies ? "Hide dependency lines" : "Show dependency lines"}
              >
                <Icon icon={LinkIcon} size="sm" />
              </Button>
            </Flex>
          </Card>
        </Flex>

        {/* Timeline Container */}
        <Card variant="default" padding="none" className="flex-1 overflow-hidden">
          {/* Timeline Header (Fixed) */}
          <Card
            variant="soft"
            padding="md"
            radius="none"
            className="shrink-0 border-b border-ui-border"
          >
            <Flex>
              <Typography variant="label" className="w-64 shrink-0">
                Issue
              </Typography>
              <FlexItem flex="1">
                <Grid cols={timelineSpan} gap="none">
                  {timelineMonths.map((month) => (
                    <Card
                      key={month.getTime()}
                      recipe="roadmapMonthHeaderCell"
                      padding="none"
                      radius="none"
                    >
                      <Typography variant="label" className="text-center">
                        {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </Typography>
                    </Card>
                  ))}
                </Grid>
              </FlexItem>
            </Flex>
          </Card>

          {/* Timeline Body (Virtualized) */}
          <FlexItem flex="1">
            {filteredIssues.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Roadmap is ready for planning"
                description="No issues with due dates to display yet. Add due dates in your board or backlog to populate this timeline view."
                className="m-6 min-h-96 max-w-none border-dashed"
              />
            ) : (
              <div className="relative">
                <List<RowData>
                  listRef={listRef}
                  style={{ height: 600, width: "100%" }}
                  rowCount={filteredIssues.length}
                  rowHeight={56}
                  rowProps={{ issues: filteredIssues, selectedIndex }}
                  rowComponent={Row}
                />

                {/* Dependency Lines SVG Overlay */}
                {showDependencies && dependencyLines.length > 0 && (
                  <svg
                    className="absolute top-0 pointer-events-none"
                    style={{
                      left: 256, // w-64 issue info column
                      width: "calc(100% - 256px)",
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
                    {dependencyLines.map((line) => {
                      if (!line) return null;
                      return (
                        <path
                          key={`${line.fromIssueId}-${line.toIssueId}`}
                          d={getDependencyPath(line)}
                          fill="none"
                          stroke="var(--color-status-warning)"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          markerEnd="url(#arrowhead)"
                          opacity="0.7"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            )}
          </FlexItem>
        </Card>

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
