/**
 * Swimlane Utilities for Kanban Board
 *
 * Implements Plane-style swimlanes (sub-grouping) for the Kanban board.
 * Swimlanes allow grouping issues by a secondary dimension (priority, assignee, etc.)
 * while the primary grouping remains by status (columns).
 */

import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { IssuePriority } from "./issue-utils";

// =============================================================================
// Types
// =============================================================================

/** Available swimlane grouping options */
export type SwimlanGroupBy = "none" | "priority" | "assignee" | "type" | "label";

/** Swimlane configuration for display */
export interface SwimlanConfig {
  id: string;
  name: string;
  /** Display order (lower = higher priority) */
  order: number;
  /** Optional icon or color for the swimlane header */
  color?: string;
}

/** Issues organized by swimlane and then by status */
export type SwimlanIssues = Record<string, Record<string, EnrichedIssue[]>>;

/** Collapsed state for swimlanes */
export type CollapsedSwimlanes = Set<string>;

// =============================================================================
// Constants
// =============================================================================

/** Priority order for swimlane display (highest first) - reserved for future sorting */
const _PRIORITY_ORDER: Record<IssuePriority, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};
void _PRIORITY_ORDER;

/** Priority colors for swimlane headers */
const PRIORITY_COLORS: Record<IssuePriority, string> = {
  highest: "text-status-error",
  high: "text-palette-orange",
  medium: "text-status-warning",
  low: "text-palette-blue",
  lowest: "text-ui-text-tertiary",
};

/** Type order for swimlane display - reserved for future sorting */
const _TYPE_ORDER: Record<string, number> = {
  epic: 0,
  story: 1,
  task: 2,
  bug: 3,
  subtask: 4,
};
void _TYPE_ORDER;

// =============================================================================
// Swimlane Grouping Logic
// =============================================================================

/**
 * Get the swimlane ID for an issue based on the grouping type
 */
export function getSwimlanId(issue: EnrichedIssue, groupBy: SwimlanGroupBy): string {
  switch (groupBy) {
    case "priority":
      return issue.priority;
    case "assignee":
      return issue.assigneeId ?? "unassigned";
    case "type":
      return issue.type;
    case "label":
      // Use first label or "unlabeled"
      return issue.labels?.[0]?.name ?? "unlabeled";
    default:
      return "all";
  }
}

/** Get priority swimlane configs */
function getPrioritySwimlanes(): SwimlanConfig[] {
  return [
    { id: "highest", name: "Highest", order: 0, color: PRIORITY_COLORS.highest },
    { id: "high", name: "High", order: 1, color: PRIORITY_COLORS.high },
    { id: "medium", name: "Medium", order: 2, color: PRIORITY_COLORS.medium },
    { id: "low", name: "Low", order: 3, color: PRIORITY_COLORS.low },
    { id: "lowest", name: "Lowest", order: 4, color: PRIORITY_COLORS.lowest },
  ];
}

/** Get assignee swimlane configs */
function getAssigneeSwimlanes(
  issues: EnrichedIssue[],
  assignees?: Map<Id<"users">, { name?: string; image?: string }>,
): SwimlanConfig[] {
  const assigneeIds = new Set<string>();
  for (const issue of issues) {
    assigneeIds.add(issue.assigneeId ?? "unassigned");
  }

  const configs: SwimlanConfig[] = [];
  let order = 0;

  for (const id of assigneeIds) {
    if (id !== "unassigned") {
      const assignee = assignees?.get(id as Id<"users">);
      configs.push({ id, name: assignee?.name ?? "Unknown", order: order++ });
    }
  }

  if (assigneeIds.has("unassigned")) {
    configs.push({ id: "unassigned", name: "Unassigned", order, color: "text-ui-text-tertiary" });
  }

  return configs;
}

/** Get type swimlane configs */
function getTypeSwimlanes(issues: EnrichedIssue[]): SwimlanConfig[] {
  const allTypes = [
    { id: "epic", name: "Epic", order: 0 },
    { id: "story", name: "Story", order: 1 },
    { id: "task", name: "Task", order: 2 },
    { id: "bug", name: "Bug", order: 3 },
    { id: "subtask", name: "Subtask", order: 4 },
  ];
  return allTypes.filter((config) => issues.some((i) => i.type === config.id));
}

/** Get label swimlane configs */
function getLabelSwimlanes(
  issues: EnrichedIssue[],
  labels?: Array<{ name: string; color: string }>,
): SwimlanConfig[] {
  const labelNames = new Set<string>();
  for (const issue of issues) {
    labelNames.add(issue.labels?.length ? issue.labels[0].name : "unlabeled");
  }

  const configs: SwimlanConfig[] = [];
  let order = 0;

  for (const name of labelNames) {
    if (name !== "unlabeled") {
      const label = labels?.find((l) => l.name === name);
      configs.push({ id: name, name, order: order++, color: label?.color });
    }
  }

  if (labelNames.has("unlabeled")) {
    configs.push({ id: "unlabeled", name: "No Label", order, color: "text-ui-text-tertiary" });
  }

  return configs;
}

/**
 * Get swimlane configurations based on the grouping type
 */
export function getSwimlanConfigs(
  groupBy: SwimlanGroupBy,
  issues: EnrichedIssue[],
  assignees?: Map<Id<"users">, { name?: string; image?: string }>,
  labels?: Array<{ name: string; color: string }>,
): SwimlanConfig[] {
  switch (groupBy) {
    case "priority":
      return getPrioritySwimlanes();
    case "assignee":
      return getAssigneeSwimlanes(issues, assignees);
    case "type":
      return getTypeSwimlanes(issues);
    case "label":
      return getLabelSwimlanes(issues, labels);
    default:
      return [{ id: "all", name: "All Issues", order: 0 }];
  }
}

/**
 * Group issues by swimlane and then by status
 *
 * Returns a nested structure: swimlaneId -> statusId -> issues[]
 */
export function groupIssuesBySwimlane(
  issuesByStatus: Record<string, EnrichedIssue[]>,
  groupBy: SwimlanGroupBy,
): SwimlanIssues {
  if (groupBy === "none") {
    // No swimlanes - just wrap the existing structure
    return { all: issuesByStatus };
  }

  const result: SwimlanIssues = {};

  for (const [status, issues] of Object.entries(issuesByStatus)) {
    for (const issue of issues) {
      const swimlanId = getSwimlanId(issue, groupBy);

      if (!result[swimlanId]) {
        result[swimlanId] = {};
      }

      if (!result[swimlanId][status]) {
        result[swimlanId][status] = [];
      }

      result[swimlanId][status].push(issue);
    }
  }

  return result;
}

/**
 * Get issue count for a swimlane
 */
export function getSwimlanIssueCount(swimlanIssues: Record<string, EnrichedIssue[]>): number {
  return Object.values(swimlanIssues).reduce((sum, issues) => sum + issues.length, 0);
}

/**
 * Check if a swimlane is empty (no issues in any status)
 */
export function isSwimlanEmpty(swimlanIssues: Record<string, EnrichedIssue[]>): boolean {
  return getSwimlanIssueCount(swimlanIssues) === 0;
}

// =============================================================================
// Display Helpers
// =============================================================================

/** Get display name for swimlane grouping option */
export function getSwimlanGroupByLabel(groupBy: SwimlanGroupBy): string {
  switch (groupBy) {
    case "priority":
      return "Priority";
    case "assignee":
      return "Assignee";
    case "type":
      return "Type";
    case "label":
      return "Label";
    default:
      return "No Swimlanes";
  }
}

/** Get all available swimlane grouping options */
export function getSwimlanGroupByOptions(): Array<{ value: SwimlanGroupBy; label: string }> {
  return [
    { value: "none", label: "No Swimlanes" },
    { value: "priority", label: "Priority" },
    { value: "assignee", label: "Assignee" },
    { value: "type", label: "Type" },
    { value: "label", label: "Label" },
  ];
}
