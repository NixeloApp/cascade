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

type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];
type RoadmapEpic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

/** Timeline span options in months */
type TimelineSpan = 1 | 3 | 6 | 12;
type ViewMode = "months" | "weeks";
type GroupBy = "none" | "status" | "assignee" | "priority" | "epic";
type TimelineZoom = "compact" | "standard" | "expanded";

const ISSUE_INFO_COLUMN_WIDTH = 256;
const ROADMAP_ROW_HEIGHT = 56;

const TIMELINE_SPANS: { value: TimelineSpan; label: string }[] = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 12, label: "1 Year" },
];

const TIMELINE_ZOOM_OPTIONS: { label: string; value: TimelineZoom }[] = [
  { label: "Compact", value: "compact" },
  { label: "Standard", value: "standard" },
  { label: "Expanded", value: "expanded" },
];

const TIMELINE_BUCKET_WIDTH: Record<ViewMode, Record<TimelineZoom, number>> = {
  months: {
    compact: 128,
    standard: 176,
    expanded: 224,
  },
  weeks: {
    compact: 88,
    standard: 120,
    expanded: 152,
  },
};

const GROUP_BY_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: "No grouping", value: "none" },
  { label: "Epic", value: "epic" },
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

const ACTIVE_DEPENDENCY_STROKE_WIDTH = 3;
const DEFAULT_DEPENDENCY_STROKE_WIDTH = 2;
const DIMMED_DEPENDENCY_STROKE_WIDTH = 1.5;
const ACTIVE_DEPENDENCY_OPACITY = 1;
const DEFAULT_DEPENDENCY_OPACITY = 0.7;
const DIMMED_DEPENDENCY_OPACITY = 0.18;
const ROADMAP_DEPENDENCY_TARGET_NONE = "none";

interface RoadmapTimelineIssue {
  _id: Id<"issues">;
  assignee?: { name?: string | null } | null;
  startDate?: number;
  dueDate?: number;
  priority: string;
  status: string;
}

interface RoadmapDependencyItem {
  issue: RoadmapIssue;
  linkId: Id<"issueLinks">;
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

interface RoadmapTodayMarkerProps {
  offsetPx: number;
  variant: "body" | "header";
}

interface TimelineGroup {
  collapsed: boolean;
  completedCount: number;
  count: number;
  dueDate?: number;
  kind: Exclude<GroupBy, "none">;
  key: string;
  label: string;
  startDate?: number;
  value: string;
}

type TimelineRow =
  | {
      type: "group";
      group: TimelineGroup;
    }
  | {
      childCount: number;
      childrenCollapsed: boolean;
      depth: 0 | 1;
      hasChildren: boolean;
      summaryCompletedCount: number;
      type: "issue";
      issue: RoadmapIssue;
      parentIssueId?: Id<"issues">;
      summaryDueDate?: number;
      summaryStartDate?: number;
    };

interface HierarchyIssueRow {
  childCount: number;
  childrenCollapsed: boolean;
  depth: 0 | 1;
  hasChildren: boolean;
  issue: RoadmapIssue;
  parentIssueId?: Id<"issues">;
  summaryCompletedCount: number;
  summaryDueDate?: number;
  summaryStartDate?: number;
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

function isRoadmapIssueCompleted(status: string) {
  const normalizedStatus = status.trim().toLowerCase();
  return normalizedStatus === "done" || normalizedStatus === "completed";
}

function getSummaryCompletionLabel(completedCount: number, totalCount: number) {
  return `${completedCount} of ${totalCount} complete`;
}

function getSummaryCompletionPercentage(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
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
  if (!issue.startDate) {
    return `${issue.title}${canEdit ? " - Drag to move milestone" : ""} - Due: ${formatDate(issue.dueDate)}`;
  }

  return `${issue.title}${canEdit ? " - Drag to move date range" : ""}${issue.startDate ? ` - Start: ${formatDate(issue.startDate)}` : ""} - Due: ${formatDate(issue.dueDate)}`;
}

function isRoadmapMilestone(issue: Pick<RoadmapBarIssue, "startDate">) {
  return issue.startDate === undefined;
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

function getTimelineLayoutWidth(
  viewMode: ViewMode,
  timelineZoom: TimelineZoom,
  timelineCellCount: number,
) {
  return (
    ISSUE_INFO_COLUMN_WIDTH + timelineCellCount * TIMELINE_BUCKET_WIDTH[viewMode][timelineZoom]
  );
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

function getTodayMarkerOffsetPx(
  date: number,
  startDate: Date,
  endDate: Date,
  timelineLayoutWidth: number,
) {
  if (date < startDate.getTime() || date > endDate.getTime()) {
    return null;
  }

  const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / DAY));
  const daysSinceStart = Math.floor((date - startDate.getTime()) / DAY);
  const timelineWidth = timelineLayoutWidth - ISSUE_INFO_COLUMN_WIDTH;

  return ISSUE_INFO_COLUMN_WIDTH + (daysSinceStart / totalDays) * timelineWidth;
}

function shiftTimelineAnchorDate(anchorDate: Date, direction: -1 | 1, timelineSpan: TimelineSpan) {
  const nextAnchor = new Date(anchorDate);
  nextAnchor.setMonth(nextAnchor.getMonth() + direction * timelineSpan);
  return nextAnchor;
}

function getTimelineWindowStepLabel(direction: "previous" | "next", timelineSpan: TimelineSpan) {
  const spanLabel = timelineSpan === 1 ? "1-month window" : `${timelineSpan}-month window`;
  return `${direction === "previous" ? "Previous" : "Next"} ${spanLabel}`;
}

function getTimelineMonthsCovered(startDate: Date, endDate: Date) {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1
  );
}

function getBestFitTimelineSpan(monthsCovered: number): TimelineSpan {
  for (const { value } of TIMELINE_SPANS) {
    if (monthsCovered <= value) {
      return value;
    }
  }

  return TIMELINE_SPANS[TIMELINE_SPANS.length - 1]?.value ?? 12;
}

function getTimelineFitWindow(
  issues: FunctionReturnType<typeof api.issues.listRoadmapIssues> | undefined,
): { anchorDate: Date; timelineSpan: TimelineSpan } | null {
  if (!issues || issues.length === 0) {
    return null;
  }

  const datedIssues = issues.filter((issue) => issue.dueDate !== undefined);
  if (datedIssues.length === 0) {
    return null;
  }

  const earliestDate = Math.min(
    ...datedIssues.map((issue) => issue.startDate ?? issue.dueDate ?? Number.POSITIVE_INFINITY),
  );
  const latestDate = Math.max(
    ...datedIssues.map((issue) => issue.dueDate ?? Number.NEGATIVE_INFINITY),
  );

  if (!Number.isFinite(earliestDate) || !Number.isFinite(latestDate)) {
    return null;
  }

  const anchorDate = new Date(
    new Date(earliestDate).getFullYear(),
    new Date(earliestDate).getMonth(),
    1,
  );
  const endDate = new Date(latestDate);

  return {
    anchorDate,
    timelineSpan: getBestFitTimelineSpan(getTimelineMonthsCovered(anchorDate, endDate)),
  };
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
        completedCount: 0,
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
        completedCount: 0,
        count: 0,
        kind: groupBy,
        key: `priority:${issue.priority}`,
        label: getPriorityLabel(issue.priority),
        value: issue.priority,
      };
    case "epic": {
      const epicTitle = issue.epic?.title?.trim() || "No epic";
      const epicKey = issue.epic?._id ?? "none";
      return {
        collapsed: false,
        completedCount: 0,
        count: 0,
        kind: groupBy,
        key: `epic:${epicKey}`,
        label: epicTitle,
        value: issue.epic?.key ?? epicTitle,
      };
    }
    case "status":
      return {
        collapsed: false,
        completedCount: 0,
        count: 0,
        kind: groupBy,
        key: `status:${issue.status.toLowerCase()}`,
        label: issue.status,
        value: issue.status,
      };
  }
}

function comparePriorityTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  return (
    (PRIORITY_SORT_ORDER[a.value] ?? Number.MAX_SAFE_INTEGER) -
      (PRIORITY_SORT_ORDER[b.value] ?? Number.MAX_SAFE_INTEGER) || a.label.localeCompare(b.label)
  );
}

function compareAssigneeTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.value === "Unassigned") return 1;
  if (b.value === "Unassigned") return -1;
  return null;
}

function compareEpicTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.label === "No epic") return 1;
  if (b.label === "No epic") return -1;
  return null;
}

function compareTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.kind === "priority" && b.kind === "priority") {
    return comparePriorityTimelineGroups(a, b);
  }

  if (a.kind === "assignee" && b.kind === "assignee") {
    const assigneeComparison = compareAssigneeTimelineGroups(a, b);
    if (assigneeComparison !== null) {
      return assigneeComparison;
    }
  }

  if (a.kind === "epic" && b.kind === "epic") {
    const epicComparison = compareEpicTimelineGroups(a, b);
    if (epicComparison !== null) {
      return epicComparison;
    }
  }

  return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
}

function getTimelineGroupSummary(
  issues: FunctionReturnType<typeof api.issues.listRoadmapIssues>,
): Pick<TimelineGroup, "completedCount" | "dueDate" | "startDate"> {
  const issuesWithDueDate = issues.filter((issue) => issue.dueDate !== undefined);
  const completedCount = issues.filter((issue) => isRoadmapIssueCompleted(issue.status)).length;
  if (issuesWithDueDate.length === 0) {
    return { completedCount };
  }

  let earliestStartDate = Number.POSITIVE_INFINITY;
  let latestDueDate = Number.NEGATIVE_INFINITY;

  for (const issue of issuesWithDueDate) {
    const startDate = issue.startDate ?? issue.dueDate;
    if (startDate !== undefined) {
      earliestStartDate = Math.min(earliestStartDate, startDate);
    }
    latestDueDate = Math.max(latestDueDate, issue.dueDate ?? latestDueDate);
  }

  return {
    completedCount,
    startDate: Number.isFinite(earliestStartDate) ? earliestStartDate : undefined,
    dueDate: Number.isFinite(latestDueDate) ? latestDueDate : undefined,
  };
}

function getRoadmapIssueSortDate(
  issue: Pick<RoadmapIssue, "_id" | "dueDate" | "startDate">,
  childSortDates: Map<string, number>,
) {
  return (
    issue.startDate ??
    issue.dueDate ??
    childSortDates.get(issue._id.toString()) ??
    Number.MAX_SAFE_INTEGER
  );
}

function compareRoadmapIssues(
  left: RoadmapIssue,
  right: RoadmapIssue,
  childSortDates: Map<string, number>,
) {
  return (
    getRoadmapIssueSortDate(left, childSortDates) -
      getRoadmapIssueSortDate(right, childSortDates) ||
    (left.dueDate ?? Number.MAX_SAFE_INTEGER) - (right.dueDate ?? Number.MAX_SAFE_INTEGER) ||
    left.key.localeCompare(right.key, undefined, { sensitivity: "base" })
  );
}

function buildIssueHierarchyRows(
  issues: FunctionReturnType<typeof api.issues.listRoadmapIssues>,
  collapsedParentIssueIds: string[],
): HierarchyIssueRow[] {
  const issueById = new Map(issues.map((issue) => [issue._id.toString(), issue]));
  const childIssuesByParent = new Map<string, RoadmapIssue[]>();
  const rootIssues: RoadmapIssue[] = [];

  for (const issue of issues) {
    const parentIssueId = issue.parentId?.toString();
    if (parentIssueId && issueById.has(parentIssueId)) {
      const existingChildren = childIssuesByParent.get(parentIssueId);
      if (existingChildren) {
        existingChildren.push(issue);
      } else {
        childIssuesByParent.set(parentIssueId, [issue]);
      }
      continue;
    }

    rootIssues.push(issue);
  }

  const childSortDates = new Map<string, number>();
  for (const [parentIssueId, childIssues] of childIssuesByParent) {
    const earliestChildDate = Math.min(
      ...childIssues.map((issue) => getRoadmapIssueSortDate(issue, new Map())),
    );
    childSortDates.set(parentIssueId, earliestChildDate);
  }

  const sortIssues = (issueList: RoadmapIssue[]) =>
    [...issueList].sort((left, right) => compareRoadmapIssues(left, right, childSortDates));

  return sortIssues(rootIssues).flatMap((issue) => {
    const childIssues = sortIssues(childIssuesByParent.get(issue._id.toString()) ?? []);
    const childrenCollapsed = collapsedParentIssueIds.includes(issue._id.toString());
    const childSummary = getTimelineGroupSummary(childIssues);

    return [
      {
        childCount: childIssues.length,
        childrenCollapsed,
        depth: 0 as const,
        hasChildren: childIssues.length > 0,
        issue,
        summaryCompletedCount: childSummary.completedCount ?? 0,
        summaryDueDate: childSummary.dueDate,
        summaryStartDate: childSummary.startDate,
      },
      ...(childrenCollapsed
        ? []
        : childIssues.map((childIssue) => ({
            childCount: 0,
            childrenCollapsed: false,
            depth: 1 as const,
            hasChildren: false,
            issue: childIssue,
            parentIssueId: issue._id,
            summaryCompletedCount: 0,
            summaryDueDate: undefined,
            summaryStartDate: undefined,
          }))),
    ];
  });
}

function buildTimelineRows(
  issues: FunctionReturnType<typeof api.issues.listRoadmapIssues> | undefined,
  groupBy: GroupBy,
  collapsedGroupKeys: string[],
  collapsedParentIssueIds: string[],
): TimelineRow[] {
  if (!issues || issues.length === 0) {
    return [];
  }

  if (groupBy === "none") {
    return buildIssueHierarchyRows(issues, collapsedParentIssueIds).map((row) => ({
      type: "issue",
      ...row,
    }));
  }

  const groupedIssues = new Map<string, { group: TimelineGroup; issues: typeof issues }>();

  for (const issue of issues) {
    const group = getGroupDescriptor(issue, groupBy);
    const existingGroup = groupedIssues.get(group.key);
    if (existingGroup) {
      existingGroup.group.completedCount += isRoadmapIssueCompleted(issue.status) ? 1 : 0;
      existingGroup.group.count += 1;
      existingGroup.issues.push(issue);
      continue;
    }

    groupedIssues.set(group.key, {
      group: {
        ...group,
        completedCount: isRoadmapIssueCompleted(issue.status) ? 1 : 0,
        count: 1,
      },
      issues: [issue],
    });
  }

  return [...groupedIssues.values()]
    .sort((left, right) => compareTimelineGroups(left.group, right.group))
    .flatMap(({ group, issues: groupedRows }) => {
      const collapsed = collapsedGroupKeys.includes(group.key);
      const groupSummary = getTimelineGroupSummary(groupedRows);
      return [
        { type: "group" as const, group: { ...group, ...groupSummary, collapsed } },
        ...(collapsed
          ? []
          : buildIssueHierarchyRows(groupedRows, collapsedParentIssueIds).map((row) => ({
              type: "issue" as const,
              ...row,
            }))),
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
    case "epic":
      return "Epic";
  }
}

function getTimelineGroupBadgeTone(group: TimelineGroup) {
  if (group.kind === "priority") {
    return { priorityTone: getPriorityBadgeTone(group.value) } as const;
  }

  if (group.kind === "status") {
    return { statusTone: getStatusBadgeTone(group.value) } as const;
  }

  return { statusTone: "neutral" } as const;
}

function getStickyIssueColumnClassName(selected: boolean) {
  return cn(
    "sticky left-0 z-20 w-64 shrink-0 border-r border-ui-border/70 pr-4",
    selected ? "bg-brand-subtle/50" : "bg-ui-bg group-hover:bg-ui-bg-secondary",
  );
}

function RoadmapTodayMarker({ offsetPx, variant }: RoadmapTodayMarkerProps) {
  const markerTestId =
    variant === "header"
      ? TEST_IDS.ROADMAP.TODAY_MARKER_HEADER
      : TEST_IDS.ROADMAP.TODAY_MARKER_BODY;

  return (
    <div
      data-testid={markerTestId}
      className="pointer-events-none absolute top-0 bottom-0 z-20 w-0"
      style={{ left: `${offsetPx}px` }}
      aria-hidden="true"
    >
      {variant === "header" ? (
        <Badge
          variant="roadmapToday"
          shape="pill"
          className="absolute top-2 left-0 -translate-x-1/2"
        >
          Today
        </Badge>
      ) : null}
      <div
        className={cn(
          "absolute left-0 -translate-x-1/2 bg-status-error/80",
          variant === "header" ? "top-0 bottom-0 w-px" : "top-0 bottom-0 w-px",
        )}
      />
    </div>
  );
}

function renderRoadmapTodayMarker(offsetPx: number | null, variant: "body" | "header") {
  if (offsetPx === null) {
    return null;
  }

  return <RoadmapTodayMarker offsetPx={offsetPx} variant={variant} />;
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
  const isMilestone = isRoadmapMilestone(issue);
  const left = getBarLeft(issue.startDate, issue.dueDate, getPositionOnTimeline);
  const width = getBarWidth(issue.startDate, issue.dueDate, getPositionOnTimeline);

  if (isMilestone) {
    return (
      <div
        className="absolute h-6"
        style={{
          left: `${left}%`,
          width: `${width}%`,
        }}
      >
        <Button
          chrome="roadmapTimelineHitArea"
          chromeSize="roadmapTimelineFill"
          data-testid={`roadmap-milestone-${issue._id}`}
          onMouseDown={(e) => onBarDragStart(e, issue._id, issue.startDate, issue.dueDate)}
          onClick={() => onOpenIssue(issue._id)}
          title={getRoadmapBarTitle(issue, canEdit)}
          aria-label={`View milestone ${issue.key}`}
        >
          <div
            className={cn(
              getCardRecipeClassName(isActive ? "roadmapTimelineBarActive" : "roadmapTimelineBar"),
              "absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm transition-transform",
              getPriorityColor(issue.priority, "bg"),
              isActive && "scale-110",
            )}
          />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        getCardRecipeClassName(isActive ? "roadmapTimelineBarActive" : "roadmapTimelineBar"),
        "group absolute h-6",
        getPriorityColor(issue.priority, "bg"),
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      <Flex align="center" className="h-full">
        {canEdit && issue.startDate ? (
          <Button
            chrome="roadmapResizeHandle"
            chromeSize="roadmapResizeLeft"
            reveal={true}
            onMouseDown={(e) => onResizeStart(e, issue._id, "left", issue.startDate, issue.dueDate)}
            title="Drag to change start date"
          >
            <div className="h-3 w-0.5 bg-ui-text-tertiary" />
          </Button>
        ) : null}

        <Button
          chrome="roadmapTimelineHitArea"
          chromeSize="roadmapTimelineLabel"
          data-testid={`roadmap-bar-${issue._id}`}
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
            chrome="roadmapResizeHandle"
            chromeSize="roadmapResizeRight"
            reveal={true}
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
  getPositionOnTimeline: (date: number) => number;
  group: TimelineGroup;
  onToggle: (groupKey: string) => void;
  style: React.CSSProperties;
}

function shouldRenderEpicSummaryBar(group: TimelineGroup) {
  return (
    group.kind === "epic" &&
    group.key !== "epic:none" &&
    group.startDate !== undefined &&
    group.dueDate !== undefined
  );
}

function RoadmapGroupRow({ getPositionOnTimeline, group, onToggle, style }: RoadmapGroupRowProps) {
  const epicSummaryDueDate = shouldRenderEpicSummaryBar(group) ? group.dueDate : undefined;
  const epicCompletionLabel = getSummaryCompletionLabel(group.completedCount, group.count);
  const epicCompletionPercentage = getSummaryCompletionPercentage(
    group.completedCount,
    group.count,
  );

  return (
    <Button
      type="button"
      chrome="roadmapGroupRow"
      chromeSize="roadmapGroupRow"
      onClick={() => onToggle(group.key)}
      aria-expanded={!group.collapsed}
      aria-label={`Toggle ${group.label} group`}
      style={style}
      data-testid={`roadmap-group-${group.key}`}
    >
      <Flex align="center">
        <FlexItem
          flex="none"
          className="sticky left-0 z-20 w-64 border-r border-ui-border/70 bg-ui-bg-secondary/80 pr-4"
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
              <Badge
                variant="roadmapGroup"
                size="md"
                shape="pill"
                {...getTimelineGroupBadgeTone(group)}
              >
                {group.label}
              </Badge>
            </Flex>
            <Typography variant="caption" color="secondary">
              {group.count} {group.count === 1 ? "issue" : "issues"} · {epicCompletionPercentage}%
            </Typography>
          </Flex>
        </FlexItem>

        <FlexItem flex="1" className="relative h-8">
          {group.startDate !== undefined && epicSummaryDueDate !== undefined ? (
            <div
              className={cn(
                getCardRecipeClassName("roadmapTimelineBar"),
                "absolute top-2 h-4 border border-accent-border bg-accent-subtle text-accent-active opacity-90",
              )}
              style={{
                left: `${getBarLeft(group.startDate, epicSummaryDueDate, getPositionOnTimeline)}%`,
                width: `${getBarWidth(group.startDate, epicSummaryDueDate, getPositionOnTimeline)}%`,
              }}
              title={`Epic summary for ${group.label} · ${epicCompletionLabel}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent-active/20"
                style={{ width: `${epicCompletionPercentage}%` }}
              />
              <Flex align="center" justify="center" className="h-full px-2">
                <Typography variant="caption" className="relative truncate">
                  {group.value}
                </Typography>
                <Typography variant="caption" className="relative shrink-0">
                  {epicCompletionPercentage}%
                </Typography>
              </Flex>
            </div>
          ) : null}
        </FlexItem>
      </Flex>
    </Button>
  );
}

interface RoadmapIssueRowProps {
  childCount: number;
  canEdit: boolean;
  childrenCollapsed: boolean;
  depth: 0 | 1;
  draggingIssueId?: Id<"issues">;
  getPositionOnTimeline: (date: number) => number;
  hasChildren: boolean;
  issue: RoadmapIssue;
  onBarDragStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  onOpenIssue: (issueId: Id<"issues">) => void;
  onToggleChildren: (issueId: Id<"issues">) => void;
  onResizeStart: (
    e: React.MouseEvent,
    issueId: Id<"issues">,
    edge: "left" | "right",
    startDate: number | undefined,
    dueDate: number | undefined,
  ) => void;
  resizingIssueId?: Id<"issues">;
  selected: boolean;
  summaryCompletedCount: number;
  summaryDueDate?: number;
  summaryStartDate?: number;
  style: React.CSSProperties;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  parentIssue: Pick<RoadmapIssue, "_id" | "key" | "title"> | null;
}

interface RoadmapIssueIdentityProps {
  childCount: number;
  childrenCollapsed: boolean;
  hasChildren: boolean;
  isNestedSubtask: boolean;
  issue: RoadmapIssue;
  onOpenIssue: (issueId: Id<"issues">) => void;
  onToggleChildren: (issueId: Id<"issues">) => void;
  parentIssue: Pick<RoadmapIssue, "_id" | "key" | "title"> | null;
  selected: boolean;
  summaryDueDate?: number;
  summaryStartDate?: number;
}

function getRoadmapSubtaskCaption(
  childCount: number,
  hasChildren: boolean,
  isNestedSubtask: boolean,
  parentIssue: Pick<RoadmapIssue, "_id" | "key" | "title"> | null,
) {
  if (isNestedSubtask && parentIssue) {
    return `Subtask of ${parentIssue.key}`;
  }

  if (hasChildren) {
    return `${childCount} ${childCount === 1 ? "subtask" : "subtasks"}`;
  }

  return null;
}

function getRoadmapStatusLabel(status: string) {
  return status
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRoadmapDateBadgeLabel(
  issue: Pick<RoadmapIssue, "dueDate" | "startDate">,
  summaryStartDate?: number,
  summaryDueDate?: number,
) {
  const startDate = issue.startDate ?? summaryStartDate;
  const dueDate = issue.dueDate ?? summaryDueDate;

  if (dueDate === undefined) {
    return null;
  }

  const prefix = issue.dueDate === undefined && summaryDueDate !== undefined ? "Rollup " : "";
  if (startDate !== undefined && startDate !== dueDate) {
    return `${prefix}${formatDate(startDate)} - ${formatDate(dueDate)}`;
  }

  return `${prefix}Due ${formatDate(dueDate)}`;
}

function RoadmapIssueIdentity({
  childCount,
  childrenCollapsed,
  hasChildren,
  isNestedSubtask,
  issue,
  onOpenIssue,
  onToggleChildren,
  parentIssue,
  selected,
  summaryDueDate,
  summaryStartDate,
}: RoadmapIssueIdentityProps) {
  const childToggleLabel = `${childrenCollapsed ? "Expand" : "Collapse"} subtasks for ${issue.key}`;
  const subtaskCaption = getRoadmapSubtaskCaption(
    childCount,
    hasChildren,
    isNestedSubtask,
    parentIssue,
  );
  const dateBadgeLabel = getRoadmapDateBadgeLabel(issue, summaryStartDate, summaryDueDate);
  const assigneeLabel = issue.assignee?.name?.trim() || "Unassigned";
  const statusLabel = getRoadmapStatusLabel(issue.status);
  const priorityLabel = getPriorityLabel(issue.priority);

  return (
    <div className="relative">
      {isNestedSubtask ? (
        <>
          <div className="absolute top-1 bottom-3 left-2 w-px bg-ui-border/80" />
          <div className="absolute top-4 left-2 h-px w-3 bg-ui-border/80" />
        </>
      ) : null}

      <div className={cn(isNestedSubtask && "pl-6")}>
        <Flex align="center" gap="sm" className="mb-1">
          {hasChildren ? (
            <Button
              type="button"
              chrome="roadmapSubtaskToggle"
              chromeSize="roadmapSubtaskToggle"
              onClick={() => onToggleChildren(issue._id)}
              aria-expanded={!childrenCollapsed}
              aria-label={childToggleLabel}
            >
              <Icon icon={childrenCollapsed ? ChevronRight : ChevronDown} size="sm" />
            </Button>
          ) : (
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
          )}
          {hasChildren ? <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" /> : null}
          <Button
            chrome={selected ? "roadmapIssueKeyActive" : "roadmapIssueKey"}
            chromeSize="roadmapIssueKey"
            onClick={() => onOpenIssue(issue._id)}
            className="truncate"
          >
            {issue.key}
          </Button>
        </Flex>
        {subtaskCaption ? (
          <Typography variant="caption" color="secondary" className="truncate">
            {subtaskCaption}
          </Typography>
        ) : null}
        <Typography variant="caption" className="truncate">
          {issue.title}
        </Typography>
        <Flex align="center" gap="xs" wrap className="mt-2">
          <Badge shape="pill" statusTone={getStatusBadgeTone(issue.status)}>
            {statusLabel}
          </Badge>
          <Badge shape="pill" priorityTone={getPriorityBadgeTone(issue.priority)}>
            {priorityLabel}
          </Badge>
          <Badge variant="secondary" shape="pill">
            {assigneeLabel}
          </Badge>
          {dateBadgeLabel ? (
            <Badge variant="secondary" shape="pill">
              {dateBadgeLabel}
            </Badge>
          ) : null}
        </Flex>
      </div>
    </div>
  );
}

interface RoadmapSummaryBarProps {
  completedCount: number;
  dueDate: number;
  getPositionOnTimeline: (date: number) => number;
  issueKey: string;
  totalCount: number;
  startDate?: number;
}

function RoadmapSummaryBar({
  completedCount,
  dueDate,
  getPositionOnTimeline,
  issueKey,
  totalCount,
  startDate,
}: RoadmapSummaryBarProps) {
  const completionLabel = getSummaryCompletionLabel(completedCount, totalCount);
  const completionPercentage = getSummaryCompletionPercentage(completedCount, totalCount);

  return (
    <div
      className={cn(
        getCardRecipeClassName("roadmapTimelineBar"),
        "absolute top-2 h-4 border border-accent-border bg-accent-subtle text-accent-active opacity-90",
      )}
      style={{
        left: `${getBarLeft(startDate, dueDate, getPositionOnTimeline)}%`,
        width: `${getBarWidth(startDate, dueDate, getPositionOnTimeline)}%`,
      }}
      title={`Task rollup for ${issueKey} · ${completionLabel}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent-active/20"
        style={{ width: `${completionPercentage}%` }}
      />
      <Flex align="center" justify="center" className="h-full px-2">
        <Typography variant="caption" className="relative truncate">
          Rollup
        </Typography>
        <Typography variant="caption" className="relative shrink-0">
          {completionPercentage}%
        </Typography>
      </Flex>
    </div>
  );
}

function RoadmapIssueRow({
  childCount,
  canEdit,
  childrenCollapsed,
  depth,
  draggingIssueId,
  getPositionOnTimeline,
  hasChildren,
  issue,
  onBarDragStart,
  onOpenIssue,
  onToggleChildren,
  onResizeStart,
  resizingIssueId,
  selected,
  summaryCompletedCount,
  summaryDueDate,
  summaryStartDate,
  style,
  timelineRef,
  parentIssue,
}: RoadmapIssueRowProps) {
  const isNestedSubtask = depth === 1 && parentIssue !== null;
  const shouldRenderSummaryBar =
    issue.dueDate === undefined && hasChildren && summaryDueDate !== undefined;

  return (
    <Card
      recipe={selected ? "roadmapRowSelected" : "roadmapRow"}
      style={style}
      className={cn("group transition-colors", selected && "z-10")}
    >
      <Flex align="center">
        <FlexItem
          shrink={false}
          className={getStickyIssueColumnClassName(selected)}
          data-testid={TEST_IDS.ROADMAP.ISSUE_COLUMN}
        >
          <RoadmapIssueIdentity
            childCount={childCount}
            childrenCollapsed={childrenCollapsed}
            hasChildren={hasChildren}
            isNestedSubtask={isNestedSubtask}
            issue={issue}
            onOpenIssue={onOpenIssue}
            onToggleChildren={onToggleChildren}
            parentIssue={parentIssue}
            selected={selected}
            summaryDueDate={summaryDueDate}
            summaryStartDate={summaryStartDate}
          />
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
          ) : shouldRenderSummaryBar ? (
            <RoadmapSummaryBar
              completedCount={summaryCompletedCount}
              dueDate={summaryDueDate}
              getPositionOnTimeline={getPositionOnTimeline}
              issueKey={issue.key}
              totalCount={childCount}
              startDate={summaryStartDate}
            />
          ) : null}
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

function isDependencyLineFocused(line: DependencyLine, activeIssueId: string | null) {
  if (activeIssueId === null) {
    return false;
  }

  return line.fromIssueId === activeIssueId || line.toIssueId === activeIssueId;
}

function getDependencyLineStrokeWidth(hasActiveIssue: boolean, dependencyFocused: boolean) {
  if (dependencyFocused) {
    return ACTIVE_DEPENDENCY_STROKE_WIDTH;
  }

  return hasActiveIssue ? DIMMED_DEPENDENCY_STROKE_WIDTH : DEFAULT_DEPENDENCY_STROKE_WIDTH;
}

function getDependencyLineOpacity(hasActiveIssue: boolean, dependencyFocused: boolean) {
  if (dependencyFocused) {
    return ACTIVE_DEPENDENCY_OPACITY;
  }

  return hasActiveIssue ? DIMMED_DEPENDENCY_OPACITY : DEFAULT_DEPENDENCY_OPACITY;
}

function renderDependencyLine(line: DependencyLine, activeIssueId: string | null) {
  const dependencyFocused = isDependencyLineFocused(line, activeIssueId);
  const hasActiveIssue = activeIssueId !== null;

  return (
    <path
      key={`${line.fromIssueId}-${line.toIssueId}`}
      d={getDependencyPath(line)}
      fill="none"
      stroke="var(--color-status-warning)"
      strokeWidth={getDependencyLineStrokeWidth(hasActiveIssue, dependencyFocused)}
      strokeDasharray="4 2"
      markerEnd="url(#arrowhead)"
      opacity={getDependencyLineOpacity(hasActiveIssue, dependencyFocused)}
    />
  );
}

function buildRoadmapDependencyItems({
  activeIssueId,
  issueLinks,
  roadmapIssueById,
}: {
  activeIssueId: string | null;
  issueLinks: FunctionReturnType<typeof api.issueLinks.getForProject> | undefined;
  roadmapIssueById: Map<string, RoadmapIssue>;
}) {
  if (activeIssueId === null || !issueLinks?.links) {
    return {
      blockedBy: [] as RoadmapDependencyItem[],
      blocks: [] as RoadmapDependencyItem[],
    };
  }

  const blocks: RoadmapDependencyItem[] = [];
  const blockedBy: RoadmapDependencyItem[] = [];

  for (const link of issueLinks.links) {
    if (link.linkType !== "blocks") {
      continue;
    }

    if (link.fromIssueId === activeIssueId) {
      const issue = roadmapIssueById.get(link.toIssueId.toString());
      if (issue) {
        blocks.push({ issue, linkId: link.linkId });
      }
    }

    if (link.toIssueId === activeIssueId) {
      const issue = roadmapIssueById.get(link.fromIssueId.toString());
      if (issue) {
        blockedBy.push({ issue, linkId: link.linkId });
      }
    }
  }

  const sortDependencyItems = (left: RoadmapDependencyItem, right: RoadmapDependencyItem) =>
    left.issue.key.localeCompare(right.issue.key);

  blocks.sort(sortDependencyItems);
  blockedBy.sort(sortDependencyItems);

  return { blockedBy, blocks };
}

function getAvailableRoadmapDependencyTargets({
  activeIssueId,
  blocks,
  issues,
}: {
  activeIssueId: string | null;
  blocks: RoadmapDependencyItem[];
  issues: RoadmapIssue[] | undefined;
}) {
  if (activeIssueId === null || !issues) {
    return [] as RoadmapIssue[];
  }

  const excludedIssueIds = new Set([
    activeIssueId,
    ...blocks.map((dependency) => dependency.issue._id.toString()),
  ]);

  return issues.filter((issue) => !excludedIssueIds.has(issue._id.toString()));
}

function RoadmapDependencySection({
  canEdit,
  emptyLabel,
  items,
  onFocusIssue,
  onRemove,
  removeLabelPrefix,
  title,
}: {
  canEdit: boolean;
  emptyLabel: string;
  items: RoadmapDependencyItem[];
  onFocusIssue: (issueId: Id<"issues">) => void;
  onRemove: (linkId: Id<"issueLinks">) => void;
  removeLabelPrefix: string;
  title: string;
}) {
  return (
    <Stack gap="sm" className="min-w-0 flex-1">
      <Flex align="center" justify="between" gap="sm">
        <Typography variant="label">{title}</Typography>
        <Badge variant="secondary" shape="pill">
          {items.length}
        </Badge>
      </Flex>

      {items.length === 0 ? (
        <Card padding="sm" variant="ghost">
          <Typography variant="caption" color="secondary">
            {emptyLabel}
          </Typography>
        </Card>
      ) : (
        <Stack gap="sm">
          {items.map((item) => (
            <Card recipe="dependencyRow" padding="sm" key={item.linkId}>
              <Flex align="center" justify="between" gap="sm">
                <Button
                  variant="unstyled"
                  className="min-w-0 flex-1 truncate p-0 text-left"
                  onClick={() => onFocusIssue(item.issue._id)}
                >
                  <Flex direction="column" align="start" gap="xs" className="min-w-0">
                    <Typography variant="label" className="truncate">
                      {item.issue.key}
                    </Typography>
                    <Typography variant="caption" color="secondary" className="truncate">
                      {item.issue.title}
                    </Typography>
                  </Flex>
                </Button>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.linkId)}
                    aria-label={`${removeLabelPrefix} ${item.issue.key}`}
                    title={`${removeLabelPrefix} ${item.issue.key}`}
                  >
                    <Icon icon={X} size="sm" />
                  </Button>
                ) : null}
              </Flex>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function RoadmapDependencyPanel({
  activeIssue,
  availableTargetIssues,
  blockedBy,
  blocks,
  canEdit,
  onFocusIssue,
}: {
  activeIssue: RoadmapIssue;
  availableTargetIssues: RoadmapIssue[];
  blockedBy: RoadmapDependencyItem[];
  blocks: RoadmapDependencyItem[];
  canEdit: boolean;
  onFocusIssue: (issueId: Id<"issues">) => void;
}) {
  const [dependencyTargetIssueId, setDependencyTargetIssueId] = useState<
    Id<"issues"> | typeof ROADMAP_DEPENDENCY_TARGET_NONE
  >(ROADMAP_DEPENDENCY_TARGET_NONE);
  const { mutate: createIssueLink } = useAuthenticatedMutation(api.issueLinks.create);
  const { mutate: removeIssueLink } = useAuthenticatedMutation(api.issueLinks.remove);

  const handleAddDependency = async () => {
    if (dependencyTargetIssueId === ROADMAP_DEPENDENCY_TARGET_NONE) {
      return;
    }

    try {
      await createIssueLink({
        fromIssueId: activeIssue._id,
        toIssueId: dependencyTargetIssueId,
        linkType: "blocks",
      });
      showSuccess("Blocking dependency added");
      setDependencyTargetIssueId(ROADMAP_DEPENDENCY_TARGET_NONE);
    } catch (error) {
      showError(error, "Failed to add blocking dependency");
    }
  };

  const handleRemoveDependency = async (linkId: Id<"issueLinks">) => {
    try {
      await removeIssueLink({ linkId });
      showSuccess("Blocking dependency removed");
    } catch (error) {
      showError(error, "Failed to remove blocking dependency");
    }
  };

  return (
    <Card
      variant="default"
      padding="md"
      className="mb-4 shrink-0"
      data-testid={TEST_IDS.ROADMAP.DEPENDENCY_PANEL}
    >
      <Stack gap="md">
        <Flex align="center" justify="between" gap="md" wrap>
          <Stack gap="xs">
            <Flex align="center" gap="sm">
              <Icon icon={LinkIcon} size="sm" />
              <Typography variant="label">Dependencies for {activeIssue.key}</Typography>
            </Flex>
            <Typography variant="caption" color="secondary">
              Manage visible roadmap blockers without leaving the timeline.
            </Typography>
          </Stack>

          {canEdit ? (
            <Flex align="center" gap="sm" wrap>
              <Select
                value={dependencyTargetIssueId}
                onValueChange={(value) =>
                  setDependencyTargetIssueId(
                    value === ROADMAP_DEPENDENCY_TARGET_NONE
                      ? ROADMAP_DEPENDENCY_TARGET_NONE
                      : (value as Id<"issues">),
                  )
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Issue this blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROADMAP_DEPENDENCY_TARGET_NONE}>Select issue</SelectItem>
                  {availableTargetIssues.map((issue) => (
                    <SelectItem key={issue._id} value={issue._id}>
                      {issue.key} · {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void handleAddDependency();
                }}
                disabled={
                  dependencyTargetIssueId === ROADMAP_DEPENDENCY_TARGET_NONE ||
                  availableTargetIssues.length === 0
                }
                aria-label="Add blocked issue"
              >
                <Icon icon={Plus} size="sm" />
                Add blocked issue
              </Button>
            </Flex>
          ) : null}
        </Flex>

        <Flex gap="md" wrap>
          <RoadmapDependencySection
            canEdit={canEdit}
            title="Blocks"
            items={blocks}
            emptyLabel="This issue does not block any visible roadmap items yet."
            onFocusIssue={onFocusIssue}
            onRemove={handleRemoveDependency}
            removeLabelPrefix="Remove blocked issue"
          />
          <RoadmapDependencySection
            canEdit={canEdit}
            title="Blocked by"
            items={blockedBy}
            emptyLabel="No visible roadmap blockers yet."
            onFocusIssue={onFocusIssue}
            onRemove={handleRemoveDependency}
            removeLabelPrefix="Remove blocker"
          />
        </Flex>
      </Stack>
    </Card>
  );
}

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

function RoadmapLoadingState() {
  return (
    <PageLayout fullHeight className="overflow-hidden">
      <Flex direction="column" className="h-full">
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

        <Card variant="default" padding="none" className="flex-1 overflow-hidden">
          <div className="border-b border-ui-border bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 p-4">
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

          <FlexItem flex="1">
            <Stack className="overflow-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="border-b border-ui-border">
                  <Flex align="center">
                    <FlexItem shrink={false} className="w-64 pr-4">
                      <Flex align="center" gap="sm">
                        <Skeleton className="size-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </Flex>
                      <Skeleton className="h-3 w-32" />
                    </FlexItem>
                    <FlexItem flex="1" className="relative h-8">
                      <div
                        className="absolute h-6"
                        style={{
                          left: `${(i * 13) % 70}%`,
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

function RoadmapHeaderControls({
  epics,
  filterEpic,
  fitTimelineWindow,
  groupBy,
  nextWindowLabel,
  onFilterEpicChange,
  onFitToIssues,
  onGroupByChange,
  onNextWindow,
  onPreviousWindow,
  onTimelineSpanChange,
  onTimelineZoomChange,
  onToday,
  onToggleDependencies,
  onViewModeChange,
  previousWindowLabel,
  showDependencies,
  timelineRangeLabel,
  timelineSpan,
  timelineZoom,
  viewMode,
}: {
  epics: RoadmapEpic[];
  filterEpic: Id<"issues"> | "all";
  fitTimelineWindow: ReturnType<typeof getTimelineFitWindow>;
  groupBy: GroupBy;
  nextWindowLabel: string;
  onFilterEpicChange: (value: Id<"issues"> | "all") => void;
  onFitToIssues: () => void;
  onGroupByChange: (value: GroupBy) => void;
  onNextWindow: () => void;
  onPreviousWindow: () => void;
  onTimelineSpanChange: (value: TimelineSpan) => void;
  onTimelineZoomChange: (value: TimelineZoom) => void;
  onToday: () => void;
  onToggleDependencies: () => void;
  onViewModeChange: (value: ViewMode) => void;
  previousWindowLabel: string;
  showDependencies: boolean;
  timelineRangeLabel: string;
  timelineSpan: TimelineSpan;
  timelineZoom: TimelineZoom;
  viewMode: ViewMode;
}) {
  return (
    <Card recipe="controlRail" padding="xs" radius="full">
      <Flex align="center" gap="sm" wrap>
        <Flex align="center" gap="xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousWindow}
            aria-label={previousWindowLabel}
            title={previousWindowLabel}
          >
            <Icon icon={ChevronLeft} size="sm" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onFitToIssues}
            disabled={fitTimelineWindow === null}
          >
            Fit to issues
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextWindow}
            aria-label={nextWindowLabel}
            title={nextWindowLabel}
          >
            <Icon icon={ChevronRight} size="sm" />
          </Button>
        </Flex>

        <Typography
          variant="label"
          color="secondary"
          className="min-w-36"
          data-testid={TEST_IDS.ROADMAP.RANGE_LABEL}
        >
          {timelineRangeLabel}
        </Typography>

        <Select
          value={filterEpic === "all" ? "all" : filterEpic}
          onValueChange={(value) =>
            onFilterEpicChange(value === "all" ? "all" : (value as Id<"issues">))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Epics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            {epics.map((epic) => (
              <SelectItem key={epic._id} value={epic._id}>
                {epic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(timelineSpan)}
          onValueChange={(value) => onTimelineSpanChange(Number(value) as TimelineSpan)}
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

        <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as GroupBy)}>
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

        <SegmentedControl
          value={viewMode}
          onValueChange={(value: string) => value && onViewModeChange(value as ViewMode)}
          size="sm"
        >
          <SegmentedControlItem value="months">Months</SegmentedControlItem>
          <SegmentedControlItem value="weeks">Weeks</SegmentedControlItem>
        </SegmentedControl>

        <SegmentedControl
          value={timelineZoom}
          onValueChange={(value: string) => value && onTimelineZoomChange(value as TimelineZoom)}
          size="sm"
        >
          {TIMELINE_ZOOM_OPTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value}>
              {option.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <Button
          variant={showDependencies ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleDependencies}
          title={showDependencies ? "Hide dependency lines" : "Show dependency lines"}
        >
          <Icon icon={LinkIcon} size="sm" />
        </Button>
      </Flex>
    </Card>
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
                      className="sticky left-0 z-30 w-64 shrink-0 border-r border-ui-border/70 bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 pr-4"
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

  return issueLinks.links
    .filter((link) => link.linkType === "blocks")
    .map((link) =>
      buildDependencyLine({
        issueById,
        issueRowIndexMap,
        link,
        rowHeight: ROADMAP_ROW_HEIGHT,
        getPositionOnTimeline,
      }),
    )
    .filter((line): line is DependencyLine => line !== null);
}

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
