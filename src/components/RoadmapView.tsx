import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/dates";
import { LinkIcon } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { Card } from "./ui/Card";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Skeleton } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";
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

export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");
  const [timelineSpan, setTimelineSpan] = useState<TimelineSpan>(6);
  const [showDependencies, setShowDependencies] = useState(true);

  // Resize state
  const [resizing, setResizing] = useState<{
    issueId: Id<"issues">;
    edge: "left" | "right";
    startX: number;
    originalStartDate?: number;
    originalDueDate?: number;
  } | null>(null);

  const updateIssue = useMutation(api.issues.update);

  // Fetch epics for the dropdown (separate optimized query)
  const epics = useQuery(api.issues.listEpics, { projectId });

  // Fetch issue dependencies for visualizing connections
  const issueLinks = useQuery(api.issueLinks.getForProject, { projectId });

  // Fetch filtered issues - backend applies all filters
  const filteredIssues = useQuery(api.issues.listRoadmapIssues, {
    projectId,
    sprintId,
    excludeEpics: true, // Don't include epics in main list
    epicId: filterEpic !== "all" ? filterEpic : undefined, // Filter by selected epic
    hasDueDate: true, // Only show issues with due dates
  });

  const project = useQuery(api.projects.getProject, { id: projectId });

  type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];
  type Epic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + timelineSpan, 0);

  // Generate timeline columns based on selected span
  const timelineMonths: Date[] = [];
  for (let i = 0; i < timelineSpan; i++) {
    timelineMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }

  const totalDays = Math.floor(
    (endDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
  );

  function getPositionOnTimeline(date: number) {
    const issueDate = new Date(date);
    const daysSinceStart = Math.floor(
      (issueDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (daysSinceStart / totalDays) * 100;
  }

  // Convert percentage position back to timestamp
  const getDateFromPosition = useCallback(
    (percent: number) => {
      const days = Math.round((percent / 100) * totalDays);
      const date = new Date(startOfMonth.getTime() + days * 24 * 60 * 60 * 1000);
      // Set to end of day for due dates
      date.setHours(23, 59, 59, 999);
      return date.getTime();
    },
    [totalDays, startOfMonth],
  );

  // Get bar width as percentage from startDate to dueDate
  function getBarWidth(startDate: number | undefined, dueDate: number) {
    if (!startDate) {
      return 5; // Default width when no start date
    }
    const start = getPositionOnTimeline(startDate);
    const end = getPositionOnTimeline(dueDate);
    return Math.max(2, end - start); // Minimum 2% width
  }

  // Get bar left position
  function getBarLeft(startDate: number | undefined, dueDate: number) {
    if (startDate) {
      return getPositionOnTimeline(startDate);
    }
    // When no start date, position at dueDate minus half the default width
    return getPositionOnTimeline(dueDate) - 2.5;
  }

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

    const handleMouseMove = (e: MouseEvent) => {
      const container = timelineRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const deltaX = e.clientX - resizing.startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      // Calculate new dates based on drag delta
      // This is visual feedback only - actual update happens on mouse up
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const container = timelineRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const deltaX = e.clientX - resizing.startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      // Calculate new date
      let newDate: number;
      if (resizing.edge === "left" && resizing.originalStartDate) {
        const originalPercent = getPositionOnTimeline(resizing.originalStartDate);
        newDate = getDateFromPosition(originalPercent + deltaPercent);
        // Set to start of day for start dates
        const dateObj = new Date(newDate);
        dateObj.setHours(0, 0, 0, 0);
        newDate = dateObj.getTime();

        // Don't allow start date after due date
        if (resizing.originalDueDate && newDate >= resizing.originalDueDate) {
          setResizing(null);
          return;
        }

        await updateIssue({
          issueId: resizing.issueId,
          startDate: newDate,
        });
      } else if (resizing.edge === "right" && resizing.originalDueDate) {
        const originalPercent = getPositionOnTimeline(resizing.originalDueDate);
        newDate = getDateFromPosition(originalPercent + deltaPercent);

        // Don't allow due date before start date
        if (resizing.originalStartDate && newDate <= resizing.originalStartDate) {
          setResizing(null);
          return;
        }

        await updateIssue({
          issueId: resizing.issueId,
          dueDate: newDate,
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
  const issueIndexMap = useMemo(() => {
    if (!filteredIssues) return new Map<string, number>();
    const map = new Map<string, number>();
    filteredIssues.forEach((issue, index) => {
      map.set(issue._id, index);
    });
    return map;
  }, [filteredIssues]);

  // Calculate dependency lines for "blocks" relationships
  const dependencyLines = useMemo((): DependencyLine[] => {
    if (!showDependencies || !issueLinks?.links || !filteredIssues) return [];

    const rowHeight = 56;

    // Inline position calculator using closure over totalDays and startOfMonth
    const getPos = (date: number) => {
      const issueDate = new Date(date);
      const daysSinceStart = Math.floor(
        (issueDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
      );
      return (daysSinceStart / totalDays) * 100;
    };

    return issueLinks.links
      .filter((link) => link.linkType === "blocks")
      .map((link) => {
        const fromIndex = issueIndexMap.get(link.fromIssueId);
        const toIndex = issueIndexMap.get(link.toIssueId);

        if (fromIndex === undefined || toIndex === undefined) return null;

        const fromIssue = filteredIssues[fromIndex];
        const toIssue = filteredIssues[toIndex];

        if (!fromIssue?.dueDate || !toIssue?.dueDate) return null;

        // Calculate Y positions based on row index
        const fromY = fromIndex * rowHeight + rowHeight / 2;
        const toY = toIndex * rowHeight + rowHeight / 2;

        // Calculate X positions as percentages
        // From: end of blocking issue bar
        const fromStartX = fromIssue.startDate
          ? getPos(fromIssue.startDate)
          : getPos(fromIssue.dueDate) - 2.5;
        const fromWidth = fromIssue.startDate
          ? Math.max(2, getPos(fromIssue.dueDate) - getPos(fromIssue.startDate))
          : 5;
        const fromX = fromStartX + fromWidth;

        // To: start of blocked issue bar
        const toX = toIssue.startDate ? getPos(toIssue.startDate) : getPos(toIssue.dueDate) - 2.5;

        return {
          fromX,
          fromY,
          toX,
          toY,
          fromIssueId: link.fromIssueId,
          toIssueId: link.toIssueId,
        };
      })
      .filter((line): line is DependencyLine => line !== null);
  }, [showDependencies, issueLinks, filteredIssues, issueIndexMap, totalDays, startOfMonth]);

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
      <Flex
        align="center"
        style={style}
        className={cn(
          "transition-colors border-b border-ui-border",
          isSelected
            ? "bg-brand-subtle/50 ring-1 ring-inset ring-brand-ring/50 z-10"
            : "hover:bg-ui-bg-secondary",
        )}
      >
        {/* Issue Info */}
        <FlexItem shrink={false} className="w-64 pr-4">
          <Flex align="center" gap="sm" className="mb-1">
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
            <Button
              variant="unstyled"
              onClick={() => setSelectedIssue(issue._id)}
              className={cn(
                "text-sm font-medium truncate text-left p-0 h-auto",
                isSelected ? "text-brand-hover" : "text-ui-text hover:text-brand-muted",
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
            <div
              className={cn(
                "group/bar absolute h-6 rounded-full opacity-80 hover:opacity-100 transition-opacity flex items-center",
                getPriorityColor(issue.priority, "bg"),
                resizing?.issueId === issue._id && "opacity-100 ring-2 ring-brand-ring",
              )}
              style={{
                left: `${getBarLeft(issue.startDate, issue.dueDate)}%`,
                width: `${getBarWidth(issue.startDate, issue.dueDate)}%`,
              }}
            >
              {/* Left resize handle */}
              {canEdit && issue.startDate && (
                <Flex
                  align="center"
                  justify="center"
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-ui-bg-elevated/50 rounded-l-full"
                  onMouseDown={(e) =>
                    handleResizeStart(e, issue._id, "left", issue.startDate, issue.dueDate)
                  }
                  title="Drag to change start date"
                >
                  <div className="w-0.5 h-3 bg-ui-text-tertiary" />
                </Flex>
              )}

              {/* Bar content - clickable */}
              <Button
                variant="unstyled"
                className="flex-1 h-full flex items-center justify-center px-2 cursor-pointer"
                onClick={() => setSelectedIssue(issue._id)}
                title={`${issue.title}${issue.startDate ? ` - Start: ${formatDate(issue.startDate)}` : ""} - Due: ${formatDate(issue.dueDate)}`}
                aria-label={`View issue ${issue.key}`}
              >
                <Typography variant="label" className="text-brand-foreground truncate">
                  {issue.assignee?.name.split(" ")[0]}
                </Typography>
              </Button>

              {/* Right resize handle */}
              {canEdit && (
                <Flex
                  align="center"
                  justify="center"
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-ui-bg-elevated/50 rounded-r-full"
                  onMouseDown={(e) =>
                    handleResizeStart(e, issue._id, "right", issue.startDate, issue.dueDate)
                  }
                  title="Drag to change due date"
                >
                  <div className="w-0.5 h-3 bg-ui-text-tertiary" />
                </Flex>
              )}
            </div>
          )}

          {/* Today Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-status-error z-10"
            style={{ left: `${getPositionOnTimeline(Date.now())}%` }}
            title="Today"
          />
        </FlexItem>
      </Flex>
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
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </Flex>
          </Flex>

          {/* Skeleton Timeline */}
          <Card padding="none" className="flex-1 overflow-hidden">
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
                <Grid cols={6} gap="sm" className="flex-1">
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <Skeleton key={id} className="h-5 w-full" />
                  ))}
                </Grid>
              </Flex>
            </Card>

            {/* Skeleton Rows */}
            <Stack className="flex-1 overflow-auto">
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

          <Flex gap="md">
            {/* Epic Filter */}
            <Select
              value={filterEpic === "all" ? "all" : filterEpic}
              onValueChange={(value) =>
                setFilterEpic(value === "all" ? "all" : (value as Id<"issues">))
              }
            >
              <SelectTrigger className="px-3 py-2 border border-ui-border rounded-lg bg-ui-bg text-ui-text">
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
              <SelectTrigger className="w-28 px-3 py-2 border border-ui-border rounded-lg bg-ui-bg text-ui-text">
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
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "months" | "weeks")}
              size="sm"
            >
              <ToggleGroupItem value="months">Months</ToggleGroupItem>
              <ToggleGroupItem value="weeks">Weeks</ToggleGroupItem>
            </ToggleGroup>

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
        </Flex>

        {/* Timeline Container */}
        <Card padding="none" className="flex-1 overflow-hidden">
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
              <FlexItem
                flex="1"
                className="grid"
                style={{ gridTemplateColumns: `repeat(${timelineSpan}, minmax(0, 1fr))` }}
              >
                {timelineMonths.map((month) => (
                  <Typography
                    key={month.getTime()}
                    variant="label"
                    className="text-center border-l border-ui-border px-2"
                  >
                    {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </Typography>
                ))}
              </FlexItem>
            </Flex>
          </Card>

          {/* Timeline Body (Virtualized) */}
          <FlexItem flex="1">
            {filteredIssues.length === 0 ? (
              <Card padding="xl" className="text-center">
                <Stack gap="xs" align="center">
                  <Typography color="secondary">No issues with due dates to display</Typography>
                  <Typography variant="small" color="secondary">
                    Add due dates to issues to see them on the roadmap
                  </Typography>
                </Stack>
              </Card>
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
                      // Calculate path with curve
                      const midX = (line.fromX + line.toX) / 2;
                      const controlOffset = Math.abs(line.toY - line.fromY) * 0.3;

                      return (
                        <path
                          key={`${line.fromIssueId}-${line.toIssueId}`}
                          d={`M ${line.fromX}% ${line.fromY}
                              C ${line.fromX + 5}% ${line.fromY},
                                ${line.toX - 5}% ${line.toY},
                                ${line.toX}% ${line.toY}`}
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
