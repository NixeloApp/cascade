/**
 * Pure utility functions for the Roadmap / Gantt view.
 * No React dependencies — just math, formatting, and data transformation.
 */

import type { api } from "@convex/_generated/api";
import { DAY } from "@convex/lib/timeUtils";
import type { FunctionReturnType } from "convex/server";
import { formatDate } from "@/lib/formatting";
import { getPriorityBadgeTone, getStatusBadgeTone } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import type {
  DependencyLine,
  DependencyLineBuildArgs,
  DragComputationArgs,
  GroupBy,
  HierarchyIssueRow,
  ResizeComputationArgs,
  RoadmapBarIssue,
  RoadmapDependencyItem,
  RoadmapIssue,
  RoadmapTimelineIssue,
  TimelineGeometryArgs,
  TimelineGroup,
  TimelineHeaderCell,
  TimelineRow,
  TimelineSpan,
  TimelineZoom,
  ViewMode,
} from "./types";
import {
  ACTIVE_DEPENDENCY_OPACITY,
  ACTIVE_DEPENDENCY_STROKE_WIDTH,
  DEFAULT_DEPENDENCY_OPACITY,
  DEFAULT_DEPENDENCY_STROKE_WIDTH,
  DIMMED_DEPENDENCY_OPACITY,
  DIMMED_DEPENDENCY_STROKE_WIDTH,
  ISSUE_INFO_COLUMN_WIDTH,
  PRIORITY_ORDER,
  ROADMAP_ROW_HEIGHT,
  TIMELINE_BUCKET_WIDTH,
  TIMELINE_SPANS,
} from "./types";

export function getBarWidth(
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

export function getBarLeft(
  startDate: number | undefined,
  dueDate: number,
  getPositionOnTimeline: (date: number) => number,
) {
  if (startDate) {
    return getPositionOnTimeline(startDate);
  }
  return getPositionOnTimeline(dueDate) - 2.5;
}

export function isRoadmapIssueCompleted(status: string) {
  const normalizedStatus = status.trim().toLowerCase();
  return normalizedStatus === "done" || normalizedStatus === "completed";
}

export function getSummaryCompletionLabel(completedCount: number, totalCount: number) {
  return `${completedCount} of ${totalCount} complete`;
}

export function getSummaryCompletionPercentage(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
}

export function getTimelineGeometry({ issue, getPositionOnTimeline }: TimelineGeometryArgs) {
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

export function buildResizePatch({
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

export function buildDragPatch({
  dragging,
  clientX,
  containerWidth,
  totalDays,
}: DragComputationArgs) {
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

export function buildDependencyLine({
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

export function getDependencyPath(line: DependencyLine) {
  return `M ${line.fromX}% ${line.fromY}
      C ${line.fromX + 5}% ${line.fromY},
        ${line.toX - 5}% ${line.toY},
        ${line.toX}% ${line.toY}`;
}

export function getRoadmapBarTitle(issue: RoadmapBarIssue, canEdit: boolean): string {
  if (!issue.startDate) {
    return `${issue.title}${canEdit ? " - Drag to move milestone" : ""} - Due: ${formatDate(issue.dueDate)}`;
  }

  return `${issue.title}${canEdit ? " - Drag to move date range" : ""}${issue.startDate ? ` - Start: ${formatDate(issue.startDate)}` : ""} - Due: ${formatDate(issue.dueDate)}`;
}

export function isRoadmapMilestone(issue: Pick<RoadmapBarIssue, "startDate">) {
  return issue.startDate === undefined;
}

export function buildMonthHeaderCells(
  startDate: Date,
  timelineSpan: TimelineSpan,
): TimelineHeaderCell[] {
  return Array.from({ length: timelineSpan }, (_, index) => {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
    return {
      key: String(month.getTime()),
      label: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
  });
}

export function buildWeekHeaderCells(startDate: Date, endDate: Date): TimelineHeaderCell[] {
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

export function getTimelineLayoutWidth(
  viewMode: ViewMode,
  timelineZoom: TimelineZoom,
  timelineCellCount: number,
) {
  return (
    ISSUE_INFO_COLUMN_WIDTH + timelineCellCount * TIMELINE_BUCKET_WIDTH[viewMode][timelineZoom]
  );
}

export function getTimelineRangeLabel(startDate: Date, endDate: Date) {
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

export function getTodayMarkerOffsetPx(
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

export function shiftTimelineAnchorDate(
  anchorDate: Date,
  direction: -1 | 1,
  timelineSpan: TimelineSpan,
) {
  const nextAnchor = new Date(anchorDate);
  nextAnchor.setMonth(nextAnchor.getMonth() + direction * timelineSpan);
  return nextAnchor;
}

export function getTimelineWindowStepLabel(
  direction: "previous" | "next",
  timelineSpan: TimelineSpan,
) {
  const spanLabel = timelineSpan === 1 ? "1-month window" : `${timelineSpan}-month window`;
  return `${direction === "previous" ? "Previous" : "Next"} ${spanLabel}`;
}

export function getTimelineMonthsCovered(startDate: Date, endDate: Date) {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1
  );
}

export function getBestFitTimelineSpan(monthsCovered: number): TimelineSpan {
  for (const { value } of TIMELINE_SPANS) {
    if (monthsCovered <= value) {
      return value;
    }
  }

  return TIMELINE_SPANS[TIMELINE_SPANS.length - 1]?.value ?? 12;
}

export function getTimelineFitWindow(
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

export function getPriorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getGroupDescriptor(
  issue: RoadmapIssue,
  groupBy: Exclude<GroupBy, "none">,
): TimelineGroup {
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

export function comparePriorityTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  return (
    (PRIORITY_ORDER[a.value] ?? Number.MAX_SAFE_INTEGER) -
      (PRIORITY_ORDER[b.value] ?? Number.MAX_SAFE_INTEGER) || a.label.localeCompare(b.label)
  );
}

export function compareAssigneeTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.value === "Unassigned") return 1;
  if (b.value === "Unassigned") return -1;
  return null;
}

export function compareEpicTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
  if (a.label === "No epic") return 1;
  if (b.label === "No epic") return -1;
  return null;
}

export function compareTimelineGroups(a: TimelineGroup, b: TimelineGroup) {
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

export function getTimelineGroupSummary(
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

export function getRoadmapIssueSortDate(
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

export function compareRoadmapIssues(
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

export function buildIssueHierarchyRows(
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

export function buildTimelineRows(
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

export function getTimelineGroupLabel(group: TimelineGroup) {
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

export function getTimelineGroupBadgeTone(group: TimelineGroup) {
  if (group.kind === "priority") {
    return { priorityTone: getPriorityBadgeTone(group.value) } as const;
  }

  if (group.kind === "status") {
    return { statusTone: getStatusBadgeTone(group.value) } as const;
  }

  return { statusTone: "neutral" } as const;
}

export function getStickyHeaderColumnClassName() {
  return "sticky left-0 z-30 w-sidebar shrink-0 border-r border-ui-border/70 bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 pr-4";
}

export function getStickyGroupColumnClassName() {
  return "sticky left-0 z-20 w-sidebar border-r border-ui-border/70 bg-ui-bg-secondary/80 pr-4";
}

export function getStickyIssueColumnClassName(selected: boolean) {
  return cn(
    "sticky left-0 z-20 w-sidebar shrink-0 border-r border-ui-border/70 pr-4",
    selected ? "bg-brand-subtle/50" : "bg-ui-bg group-hover:bg-ui-bg-secondary",
  );
}

export function shouldRenderEpicSummaryBar(group: TimelineGroup) {
  return (
    group.kind === "epic" &&
    group.key !== "epic:none" &&
    group.startDate !== undefined &&
    group.dueDate !== undefined
  );
}

export function getRoadmapSubtaskCaption(
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

export function getRoadmapStatusLabel(status: string) {
  return status
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRoadmapDateBadgeLabel(
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

export function buildIssueLookupMap(issues: RoadmapTimelineIssue[] | undefined) {
  if (!issues) return new Map<string, RoadmapTimelineIssue>();
  return new Map(issues.map((issue) => [issue._id, issue]));
}

export function buildIssueRowIndexMap(rows: TimelineRow[]) {
  const map = new Map<string, number>();
  rows.forEach((row, index) => {
    if (row.type === "issue") {
      map.set(row.issue._id, index);
    }
  });
  return map;
}

export function isDependencyLineFocused(line: DependencyLine, activeIssueId: string | null) {
  if (activeIssueId === null) {
    return false;
  }

  return line.fromIssueId === activeIssueId || line.toIssueId === activeIssueId;
}

export function getDependencyLineStrokeWidth(hasActiveIssue: boolean, dependencyFocused: boolean) {
  if (dependencyFocused) {
    return ACTIVE_DEPENDENCY_STROKE_WIDTH;
  }

  return hasActiveIssue ? DIMMED_DEPENDENCY_STROKE_WIDTH : DEFAULT_DEPENDENCY_STROKE_WIDTH;
}

export function getDependencyLineOpacity(hasActiveIssue: boolean, dependencyFocused: boolean) {
  if (dependencyFocused) {
    return ACTIVE_DEPENDENCY_OPACITY;
  }

  return hasActiveIssue ? DIMMED_DEPENDENCY_OPACITY : DEFAULT_DEPENDENCY_OPACITY;
}

export function buildRoadmapDependencyItems({
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

export function getAvailableRoadmapDependencyTargets({
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

export function computeDependencyLines({
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
