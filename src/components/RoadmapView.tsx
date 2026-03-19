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
import { useEffect, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/dates";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, LinkIcon } from "@/lib/icons";
import { getPriorityColor, getStatusColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailViewer } from "./IssueDetailViewer";
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

type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];

/** Timeline span options in months */
type TimelineSpan = 1 | 3 | 6 | 12;
type GroupBy = "none" | "status" | "assignee" | "priority";

const TIMELINE_SPANS: { value: TimelineSpan; label: string }[] = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 12, label: "1 Year" },
];

const GROUP_BY_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: "No grouping", value: "none" },
  { label: "Status", value: "status" },
  { label: "Assignee", value: "assignee" },
  { label: "Priority", value: "priority" },
];

const PRIORITY_SORT_ORDER: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};
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
  assignee?: { name?: string | null } | null;
  startDate?: number;
  dueDate?: number;
  priority: string;
  status: string;
}

interface ResizeState {
  issueId: Id<"issues">;
  edge: "left" | "right";
  startX: number;
  originalStartDate?: number;
  originalDueDate?: number;
}

interface DragState {
  issueId: Id<"issues">;
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

interface DragComputationArgs {
  dragging: DragState;
  clientX: number;
  containerWidth: number;
  totalDays: number;
}

interface TimelineGeometryArgs {
  issue: RoadmapTimelineIssue;
  getPositionOnTimeline: (date: number) => number;
}

interface DependencyLineBuildArgs {
  issueById: Map<string, RoadmapTimelineIssue>;
  issueRowIndexMap: Map<string, number>;
  link: {
    fromIssueId: string;
    toIssueId: string;
  };
  rowHeight: number;
  getPositionOnTimeline: (date: number) => number;
}

interface RoadmapBarIssue {
  _id: Id<"issues">;
  assignee?: { name?: string | null } | null;
  dueDate: number;
  key: string;
  priority: string;
  startDate?: number;
  title: string;
}

interface RoadmapTimelineBarProps {
  canEdit: boolean;
  draggingIssueId?: Id<"issues">;
  getPositionOnTimeline: (date: number) => number;
  issue: RoadmapBarIssue;
  onBarDragStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  onOpenIssue: (issueId: Id<"issues">) => void;
  onResizeStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    edge: "left" | "right",
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  resizingIssueId?: Id<"issues">;
}

interface TimelineHeaderCell {
  key: string;
  label: string;
}

interface TimelineGroup {
  collapsed: boolean;
  count: number;
  kind: Exclude<GroupBy, "none">;
  key: string;
  label: string;
  value: string;
}

type TimelineRow =
  | {
      type: "group";
      group: TimelineGroup;
    }
  | {
      type: "issue";
      issue: RoadmapIssue;
    };

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

function buildDragPatch({ dragging, clientX, containerWidth, totalDays }: DragComputationArgs) {
  if (!dragging.originalDueDate) {
    return null;
  }

  const deltaX = clientX - dragging.startX;
  const deltaDays = Math.round((deltaX / containerWidth) * totalDays);

  if (deltaDays === 0) {
    return null;
  }

  const startDate =
    dragging.originalStartDate === undefined
      ? undefined
      : new Date(dragging.originalStartDate + deltaDays * DAY).setHours(0, 0, 0, 0);
  const dueDate = new Date(dragging.originalDueDate + deltaDays * DAY).setHours(23, 59, 59, 999);

  return {
    issueId: dragging.issueId,
    patch: {
      startDate,
      dueDate,
    },
  };
}

function buildDependencyLine({
  issueById,
  issueRowIndexMap,
  link,
  rowHeight,
  getPositionOnTimeline,
}: DependencyLineBuildArgs): DependencyLine | null {
  const fromIndex = issueRowIndexMap.get(link.fromIssueId);
  const toIndex = issueRowIndexMap.get(link.toIssueId);

  if (fromIndex === undefined || toIndex === undefined) {
    return null;
  }

  const fromIssue = issueById.get(link.fromIssueId);
  const toIssue = issueById.get(link.toIssueId);
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

function getRoadmapBarTitle(issue: RoadmapBarIssue, canEdit: boolean): string {
  return `${issue.title}${canEdit ? " - Drag to move date range" : ""}${issue.startDate ? ` - Start: ${formatDate(issue.startDate)}` : ""} - Due: ${formatDate(issue.dueDate)}`;
}

function buildMonthHeaderCells(startDate: Date, timelineSpan: TimelineSpan): TimelineHeaderCell[] {
  return Array.from({ length: timelineSpan }, (_, index) => {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
    return {
      key: String(month.getTime()),
      label: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
  });
}

function buildWeekHeaderCells(startDate: Date, endDate: Date): TimelineHeaderCell[] {
  const weekCells: TimelineHeaderCell[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(Math.min(cursor.getTime() + 6 * DAY, endDate.getTime()));
    weekCells.push({
      key: String(weekStart.getTime()),
      label: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weekCells;
}

function getTimelineRangeLabel(startDate: Date, endDate: Date) {
  const sameMonthAndYear =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();

  if (sameMonthAndYear) {
    return startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return `${startDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })} - ${endDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function shiftTimelineAnchorDate(anchorDate: Date, direction: -1 | 1) {
  const nextAnchor = new Date(anchorDate);
  nextAnchor.setMonth(nextAnchor.getMonth() + direction);
  return nextAnchor;
}

function getPriorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getGroupDescriptor(issue: RoadmapIssue, groupBy: Exclude<GroupBy, "none">): TimelineGroup {
  switch (groupBy) {
    case "assignee": {
      const assigneeName = issue.assignee?.name?.trim() || "Unassigned";
      return {
        collapsed: false,
        count: 0,
        kind: groupBy,
        key: `assignee:${assigneeName.toLowerCase()}`,
        label: assigneeName,
        value: assigneeName,
      };
    }
    case "priority":
      return {
        collapsed: false,
        count: 0,
        kind: groupBy,
        key: `priority:${issue.priority}`,
        label: getPriorityLabel(issue.priority),
        value: issue.priority,
      };
    case "status":
      return {
        collapsed: false,
        count: 0,
        kind: groupBy,
        key: `status:${issue.status.toLowerCase()}`,
        label: issue.status,
        value: issue.status,
      };
  }
}

function compareTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.kind === "priority" && b.kind === "priority") {
    return (
      (PRIORITY_SORT_ORDER[a.value] ?? Number.MAX_SAFE_INTEGER) -
        (PRIORITY_SORT_ORDER[b.value] ?? Number.MAX_SAFE_INTEGER) || a.label.localeCompare(b.label)
    );
  }

  if (a.kind === "assignee" && b.kind === "assignee") {
    if (a.value === "Unassigned") return 1;
    if (b.value === "Unassigned") return -1;
  }

  return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
}

function buildTimelineRows(
  issues: FunctionReturnType<typeof api.issues.listRoadmapIssues> | undefined,
  groupBy: GroupBy,
  collapsedGroupKeys: string[],
): TimelineRow[] {
  if (!issues || issues.length === 0) {
    return [];
  }

  if (groupBy === "none") {
    return issues.map((issue) => ({ type: "issue", issue }));
  }

  const groupedIssues = new Map<string, { group: TimelineGroup; issues: typeof issues }>();

  for (const issue of issues) {
    const group = getGroupDescriptor(issue, groupBy);
    const existingGroup = groupedIssues.get(group.key);
    if (existingGroup) {
      existingGroup.group.count += 1;
      existingGroup.issues.push(issue);
      continue;
    }

    groupedIssues.set(group.key, {
      group: { ...group, count: 1 },
      issues: [issue],
    });
  }

  return [...groupedIssues.values()]
    .sort((left, right) => compareTimelineGroups(left.group, right.group))
    .flatMap(({ group, issues: groupedRows }) => {
      const collapsed = collapsedGroupKeys.includes(group.key);
      return [
        { type: "group" as const, group: { ...group, collapsed } },
        ...(collapsed ? [] : groupedRows.map((issue) => ({ type: "issue" as const, issue }))),
      ];
    });
}

function getTimelineGroupLabel(group: TimelineGroup) {
  switch (group.kind) {
    case "assignee":
      return "Assignee";
    case "priority":
      return "Priority";
    case "status":
      return "Status";
  }
}

function getTimelineGroupBadgeClassName(group: TimelineGroup) {
  if (group.kind === "priority") {
    return getPriorityColor(group.value, "badge");
  }

  if (group.kind === "status") {
    return getStatusColor(group.value);
  }

  return "bg-ui-bg-tertiary text-ui-text-secondary";
}

function RoadmapTimelineBar({
  canEdit,
  draggingIssueId,
  getPositionOnTimeline,
  issue,
  onBarDragStart,
  onOpenIssue,
  onResizeStart,
  resizingIssueId,
}: RoadmapTimelineBarProps) {
  if (!issue.dueDate) {
    return null;
  }

  const isActive = resizingIssueId === issue._id || draggingIssueId === issue._id;

  return (
    <div
      className={cn(
        getCardRecipeClassName(isActive ? "roadmapTimelineBarActive" : "roadmapTimelineBar"),
        "group absolute h-6",
        getPriorityColor(issue.priority, "bg"),
      )}
      style={{
        left: `${getBarLeft(issue.startDate, issue.dueDate, getPositionOnTimeline)}%`,
        width: `${getBarWidth(issue.startDate, issue.dueDate, getPositionOnTimeline)}%`,
      }}
    >
      <Flex align="center" className="h-full">
        {canEdit && issue.startDate ? (
          <Button
            variant="unstyled"
            size="none"
            chrome="roadmapResizeHandle"
            reveal={true}
            className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize rounded-l-full"
            onMouseDown={(e) => onResizeStart(e, issue._id, "left", issue.startDate, issue.dueDate)}
            title="Drag to change start date"
          >
            <div className="h-3 w-0.5 bg-ui-text-tertiary" />
          </Button>
        ) : null}

        <Button
          variant="unstyled"
          data-testid={`roadmap-bar-${issue._id}`}
          className="h-full w-full px-2"
          onMouseDown={(e) => onBarDragStart(e, issue._id, issue.startDate, issue.dueDate)}
          onClick={() => onOpenIssue(issue._id)}
          title={getRoadmapBarTitle(issue, canEdit)}
          aria-label={`View issue ${issue.key}`}
        >
          <Flex align="center" justify="center" className="h-full">
            <Typography variant="label" className="truncate text-brand-foreground">
              {issue.assignee?.name?.split(" ")[0] ?? ""}
            </Typography>
          </Flex>
        </Button>

        {canEdit ? (
          <Button
            variant="unstyled"
            size="none"
            chrome="roadmapResizeHandle"
            reveal={true}
            className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize rounded-r-full"
            onMouseDown={(e) =>
              onResizeStart(e, issue._id, "right", issue.startDate, issue.dueDate)
            }
            title="Drag to change due date"
          >
            <div className="h-3 w-0.5 bg-ui-text-tertiary" />
          </Button>
        ) : null}
      </Flex>
    </div>
  );
}

interface RoadmapGroupRowProps {
  group: TimelineGroup;
  onToggle: (groupKey: string) => void;
  style: React.CSSProperties;
}

function RoadmapGroupRow({ group, onToggle, style }: RoadmapGroupRowProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={() => onToggle(group.key)}
      aria-expanded={!group.collapsed}
      aria-label={`Toggle ${group.label} group`}
      style={style}
      className="w-full border-b border-ui-border bg-ui-bg-secondary/60 px-4 text-left"
      data-testid={`roadmap-group-${group.key}`}
    >
      <Flex align="center" justify="between" className="h-full">
        <Flex align="center" gap="sm">
          <Icon
            icon={group.collapsed ? ChevronRight : ChevronDown}
            size="sm"
            className="text-ui-text-tertiary"
          />
          <Typography variant="label" color="secondary">
            {getTimelineGroupLabel(group)}
          </Typography>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              getTimelineGroupBadgeClassName(group),
            )}
          >
            {group.label}
          </span>
        </Flex>
        <Typography variant="caption" color="secondary">
          {group.count} {group.count === 1 ? "issue" : "issues"}
        </Typography>
      </Flex>
    </Button>
  );
}

interface RoadmapIssueRowProps {
  canEdit: boolean;
  draggingIssueId?: Id<"issues">;
  getPositionOnTimeline: (date: number) => number;
  issue: RoadmapIssue;
  onBarDragStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  onOpenIssue: (issueId: Id<"issues">) => void;
  onResizeStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    edge: "left" | "right",
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  resizingIssueId?: Id<"issues">;
  selected: boolean;
  style: React.CSSProperties;
  timelineRef: React.RefObject<HTMLDivElement | null>;
}

function RoadmapIssueRow({
  canEdit,
  draggingIssueId,
  getPositionOnTimeline,
  issue,
  onBarDragStart,
  onOpenIssue,
  onResizeStart,
  resizingIssueId,
  selected,
  style,
  timelineRef,
}: RoadmapIssueRowProps) {
  return (
    <Card
      recipe={selected ? "roadmapRowSelected" : "roadmapRow"}
      style={style}
      className={cn("transition-colors", selected && "z-10")}
    >
      <Flex align="center">
        <FlexItem shrink={false} className="w-64 pr-4">
          <Flex align="center" gap="sm" className="mb-1">
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
            <Button
              variant="unstyled"
              onClick={() => onOpenIssue(issue._id)}
              className={cn(
                "h-auto truncate p-0 text-left text-sm font-medium",
                selected ? "text-brand-hover" : "text-ui-text",
              )}
            >
              {issue.key}
            </Button>
          </Flex>
          <Typography variant="caption">{issue.title}</Typography>
        </FlexItem>

        <FlexItem flex="1" className="relative h-8" ref={timelineRef}>
          {issue.dueDate ? (
            <RoadmapTimelineBar
              canEdit={canEdit}
              draggingIssueId={draggingIssueId}
              getPositionOnTimeline={getPositionOnTimeline}
              issue={{
                _id: issue._id,
                assignee: issue.assignee ?? undefined,
                dueDate: issue.dueDate,
                key: issue.key,
                priority: issue.priority,
                startDate: issue.startDate,
                title: issue.title,
              }}
              onBarDragStart={onBarDragStart}
              onOpenIssue={onOpenIssue}
              onResizeStart={onResizeStart}
              resizingIssueId={resizingIssueId}
            />
          ) : null}

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

/** Build a map of issue ID to issue for O(1) lookups */
function buildIssueLookupMap(issues: RoadmapTimelineIssue[] | undefined) {
  if (!issues) return new Map<string, RoadmapTimelineIssue>();
  return new Map(issues.map((issue) => [issue._id, issue]));
}

function buildIssueRowIndexMap(rows: TimelineRow[]) {
  const map = new Map<string, number>();
  rows.forEach((row, index) => {
    if (row.type === "issue") {
      map.set(row.issue._id, index);
    }
  });
  return map;
}

/** Compute dependency lines from issue links */
function computeDependencyLines({
  showDependencies,
  issueLinks,
  issueById,
  issueRowIndexMap,
  getPositionOnTimeline,
}: {
  showDependencies: boolean;
  issueLinks: FunctionReturnType<typeof api.issueLinks.getForProject> | undefined;
  issueById: Map<string, RoadmapTimelineIssue>;
  issueRowIndexMap: Map<string, number>;
  getPositionOnTimeline: (date: number) => number;
}): DependencyLine[] {
  if (!showDependencies || !issueLinks?.links || issueById.size === 0) return [];

  const rowHeight = 56;

  return issueLinks.links
    .filter((link) => link.linkType === "blocks")
    .map((link) =>
      buildDependencyLine({
        issueById,
        issueRowIndexMap,
        link,
        rowHeight,
        getPositionOnTimeline,
      }),
    )
    .filter((line): line is DependencyLine => line !== null);
}

/** Gantt-style roadmap view with issue timeline bars and dependency lines. */
export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<string[]>([]);
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");
  const [timelineSpan, setTimelineSpan] = useState<TimelineSpan>(6);
  const [timelineAnchorDate, setTimelineAnchorDate] = useState(() => new Date());
  const [showDependencies, setShowDependencies] = useState(true);

  // Resize state
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

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

  type Epic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

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
  const timelineRows = buildTimelineRows(filteredIssues, groupBy, collapsedGroupKeys);

  const getPositionOnTimeline = (date: number) => {
    const issueDate = new Date(date);
    const daysSinceStart = Math.floor((issueDate.getTime() - startOfMonth.getTime()) / DAY);
    return (daysSinceStart / totalDays) * 100;
  };

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

  // Handle mouse move during resize
  useEffect(() => {
    if (!(resizing || dragging) || !timelineRef.current) return;

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

      // Inline position calculations to avoid dependency issues
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

      if (nextUpdate) {
        await updateIssue({
          issueId: nextUpdate.issueId,
          ...nextUpdate.patch,
        });
      }

      setResizing(null);
      setDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, startOfMonth, totalDays, updateIssue]);

  // Keyboard navigation
  const listRef = useRef<ListImperativeAPI>(null);
  const { selectedIndex } = useListNavigation({
    items: filteredIssues ?? [],
    onSelect: (issue: RoadmapIssue) => setSelectedIssue(issue._id),
  });
  const selectedIssueId =
    selectedIndex >= 0 ? (filteredIssues?.[selectedIndex]?._id ?? null) : null;
  const issueById = buildIssueLookupMap(filteredIssues);
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

  // Row renderer for virtualization
  type RowData = {
    rows: TimelineRow[];
    selectedIssueId: Id<"issues"> | null;
  };

  function Row({
    rows,
    selectedIssueId,
    index,
    style,
  }: RowData & {
    index: number;
    style: React.CSSProperties;
  }) {
    const row = rows[index];
    if (!row) return null;

    if (row.type === "group") {
      return (
        <RoadmapGroupRow
          group={row.group}
          onToggle={(groupKey) =>
            setCollapsedGroupKeys((currentKeys) =>
              currentKeys.includes(groupKey)
                ? currentKeys.filter((key) => key !== groupKey)
                : [...currentKeys, groupKey],
            )
          }
          style={style}
        />
      );
    }

    return (
      <RoadmapIssueRow
        canEdit={canEdit}
        draggingIssueId={dragging?.issueId}
        getPositionOnTimeline={getPositionOnTimeline}
        issue={row.issue}
        onBarDragStart={handleBarDragStart}
        onOpenIssue={(issueId) => setSelectedIssue(issueId)}
        onResizeStart={handleResizeStart}
        resizingIssueId={resizing?.issueId}
        selected={row.issue._id === selectedIssueId}
        style={style}
        timelineRef={timelineRef}
      />
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
            <div className="p-4 border-b border-ui-border bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78">
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
            </div>

            {/* Skeleton Rows */}
            <FlexItem flex="1">
              <Stack className="overflow-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="border-b border-ui-border">
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
                  </div>
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
              Visualize issue timeline and dependencies across {timelineRangeLabel}
            </Typography>
          </Stack>

          <Card recipe="controlRail" padding="xs" radius="full">
            <Flex align="center" gap="sm" wrap>
              <Flex align="center" gap="xs">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setTimelineAnchorDate((currentDate) => shiftTimelineAnchorDate(currentDate, -1))
                  }
                  aria-label="Previous timeline window"
                  title="Previous timeline window"
                >
                  <Icon icon={ChevronLeft} size="sm" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTimelineAnchorDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setTimelineAnchorDate((currentDate) => shiftTimelineAnchorDate(currentDate, 1))
                  }
                  aria-label="Next timeline window"
                  title="Next timeline window"
                >
                  <Icon icon={ChevronRight} size="sm" />
                </Button>
              </Flex>

              <Typography variant="label" color="secondary" className="min-w-36">
                {timelineRangeLabel}
              </Typography>

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

              <Select
                value={groupBy}
                onValueChange={(value) => {
                  setGroupBy(value as GroupBy);
                  setCollapsedGroupKeys([]);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          <div className="p-4 border-b border-ui-border bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78">
            <Flex>
              <Typography variant="label" className="w-64 shrink-0">
                Issue
              </Typography>
              <FlexItem flex="1">
                <Grid
                  gap="none"
                  templateColumns={`repeat(${timelineHeaderCells.length}, minmax(0, 1fr))`}
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
                  rowCount={timelineRows.length}
                  rowHeight={56}
                  rowProps={{ rows: timelineRows, selectedIssueId }}
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
