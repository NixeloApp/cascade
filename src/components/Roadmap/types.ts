/**
 * Shared types and constants for the Roadmap / Gantt view.
 * Extracted from RoadmapView.tsx to enable incremental decomposition.
 */

import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

// ── Derived API types ──

export type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];
export type RoadmapEpic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

// ── Enums & option types ──

/** Timeline span options in months */
export type TimelineSpan = 1 | 3 | 6 | 12;
export type ViewMode = "months" | "weeks";
export type GroupBy = "none" | "status" | "assignee" | "priority" | "epic";
export type TimelineZoom = "compact" | "standard" | "expanded";

// ── Layout constants ──

export const ISSUE_INFO_COLUMN_WIDTH = 256;
export const ROADMAP_ROW_HEIGHT = 56;

export const TIMELINE_SPANS: { value: TimelineSpan; label: string }[] = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 12, label: "1 Year" },
];

export const TIMELINE_ZOOM_OPTIONS: { label: string; value: TimelineZoom }[] = [
  { label: "Compact", value: "compact" },
  { label: "Standard", value: "standard" },
  { label: "Expanded", value: "expanded" },
];

export const TIMELINE_BUCKET_WIDTH: Record<ViewMode, Record<TimelineZoom, number>> = {
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

export const GROUP_BY_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: "No grouping", value: "none" },
  { label: "Epic", value: "epic" },
  { label: "Assignee", value: "assignee" },
  { label: "Status", value: "status" },
  { label: "Priority", value: "priority" },
];

export const PRIORITY_ORDER: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

// ── Dependency constants ──

export const ACTIVE_DEPENDENCY_STROKE_WIDTH = 3;
export const DEFAULT_DEPENDENCY_STROKE_WIDTH = 2;
export const DIMMED_DEPENDENCY_STROKE_WIDTH = 1.5;
export const ACTIVE_DEPENDENCY_OPACITY = 1;
export const DEFAULT_DEPENDENCY_OPACITY = 0.7;
export const DIMMED_DEPENDENCY_OPACITY = 0.18;
export const ROADMAP_DEPENDENCY_TARGET_NONE = "none";

// ── Data interfaces ──

export interface DependencyLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromIssueId: string;
  toIssueId: string;
}

export interface RoadmapTimelineIssue {
  _id: Id<"issues">;
  assignee?: { name?: string | null } | null;
  startDate?: number;
  dueDate?: number;
  priority: string;
  status: string;
}

export interface RoadmapDependencyItem {
  issue: RoadmapIssue;
  linkId: Id<"issueLinks">;
}

export interface ResizeState {
  issueId: Id<"issues">;
  edge: "left" | "right";
  startX: number;
  originalStartDate?: number;
  originalDueDate?: number;
}

export interface DragState {
  issueId: Id<"issues">;
  startX: number;
  originalStartDate?: number;
  originalDueDate?: number;
}

export interface ResizeComputationArgs {
  resizing: ResizeState;
  clientX: number;
  containerWidth: number;
  getPositionOnTimeline: (date: number) => number;
  getDateFromPosition: (percent: number) => number;
}

export interface DragComputationArgs {
  dragging: DragState;
  clientX: number;
  containerWidth: number;
  totalDays: number;
}

export interface TimelineGeometryArgs {
  issue: RoadmapTimelineIssue;
  getPositionOnTimeline: (date: number) => number;
}

export interface DependencyLineBuildArgs {
  issueById: Map<string, RoadmapTimelineIssue>;
  issueRowIndexMap: Map<string, number>;
  link: {
    fromIssueId: string;
    toIssueId: string;
  };
  rowHeight: number;
  getPositionOnTimeline: (date: number) => number;
}

export interface RoadmapBarIssue {
  _id: Id<"issues">;
  assignee?: { name?: string | null } | null;
  dueDate: number;
  key: string;
  priority: string;
  startDate?: number;
  title: string;
}

export interface TimelineHeaderCell {
  key: string;
  label: string;
}

export interface TimelineGroup {
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

export type TimelineRow =
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

export interface HierarchyIssueRow {
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

// ── Component prop interfaces ──

export interface RoadmapTimelineBarProps {
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

export interface RoadmapGroupRowProps {
  getPositionOnTimeline: (date: number) => number;
  group: TimelineGroup;
  onToggle: (groupKey: string) => void;
  style: React.CSSProperties;
}

export interface RoadmapIssueRowProps {
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

export interface RoadmapIssueIdentityProps {
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

export interface RoadmapSummaryBarProps {
  completedCount: number;
  dueDate: number;
  getPositionOnTimeline: (date: number) => number;
  issueKey: string;
  totalCount: number;
  startDate?: number;
}
