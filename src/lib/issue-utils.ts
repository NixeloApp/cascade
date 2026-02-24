/**
 * Issue utility functions for consistent handling of issue types, priorities, and statuses
 */

import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bug,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Zap,
} from "./icons";

export type IssueType = IssueTypeWithSubtask;
export type { IssuePriority };

export { ISSUE_PRIORITIES, ISSUE_TYPES_WITH_SUBTASK } from "@convex/validators";

/** Icon mapping for issue types - use with <Icon icon={ISSUE_TYPE_ICONS[type]} /> */
export const ISSUE_TYPE_ICONS: Record<IssueType, typeof Bug> = {
  bug: Bug,
  story: BookOpen,
  epic: Zap,
  subtask: CircleDot,
  task: CheckSquare,
};

/** Icon mapping for priorities - use with <Icon icon={PRIORITY_ICONS[priority]} /> */
export const PRIORITY_ICONS: Record<IssuePriority, typeof ChevronUp> = {
  highest: ChevronUp,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
  lowest: ChevronDown,
};

/**
 * Priority colors configuration
 */
const PRIORITY_COLORS = {
  highest: {
    text: "text-priority-highest",
    bg: "bg-status-error-bg text-status-error-text",
    badge: "text-priority-highest bg-status-error-bg",
  },
  high: {
    text: "text-priority-high",
    bg: "bg-status-warning-bg text-status-warning-text",
    badge: "text-priority-high bg-status-warning-bg",
  },
  medium: {
    text: "text-priority-medium",
    bg: "bg-status-warning-bg text-status-warning-text",
    badge: "text-priority-medium bg-status-warning-bg",
  },
  low: {
    text: "text-priority-low",
    bg: "bg-status-info-bg text-status-info-text",
    badge: "text-priority-low bg-status-info-bg",
  },
  lowest: {
    text: "text-priority-lowest",
    bg: "bg-ui-bg-tertiary text-ui-text-secondary",
    badge: "text-priority-lowest bg-ui-bg-tertiary",
  },
} as const;

/**
 * Get the color classes for an issue priority
 * Uses semantic theme tokens with full dark mode support
 * @param variant - The style variant: 'text', 'bg', or 'badge'
 */
export function getPriorityColor(
  priority: string,
  variant: "text" | "bg" | "badge" = "text",
): string {
  return (
    PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]?.[variant] ||
    PRIORITY_COLORS.lowest[variant]
  );
}

/**
 * Get the label for an issue type
 */
export function getTypeLabel(type: string): string {
  switch (type) {
    case "bug":
      return "Bug";
    case "story":
      return "Story";
    case "epic":
      return "Epic";
    case "subtask":
      return "Sub-task";
    default:
      return "Task";
  }
}

/**
 * Get the color for a sprint/workflow status
 * Uses semantic theme tokens with full dark mode support
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "in progress":
      return "bg-status-success-bg text-status-success-text";
    case "completed":
    case "done":
      return "bg-ui-bg-tertiary text-ui-text-secondary";
    case "future":
    case "todo":
      return "bg-status-info-bg text-status-info-text";
    case "blocked":
      return "bg-status-error-bg text-status-error-text";
    default:
      return "bg-ui-bg-tertiary text-ui-text-secondary";
  }
}

/**
 * Workflow category colors configuration
 */
const WORKFLOW_CATEGORY_COLORS = {
  todo: {
    border: "border-t-ui-border",
    text: "text-ui-text-tertiary",
    bg: "bg-ui-bg-tertiary",
  },
  inprogress: {
    border: "border-t-status-info",
    text: "text-status-info-text",
    bg: "bg-status-info-bg",
  },
  done: {
    border: "border-t-status-success",
    text: "text-status-success-text",
    bg: "bg-status-success-bg",
  },
} as const;

/**
 * Get the color classes for a workflow category
 * Uses semantic theme tokens with full dark mode support
 */
export function getWorkflowCategoryColor(
  category: string,
  variant: "border" | "text" | "bg" = "border",
): string {
  const normalizedCategory = category.toLowerCase();
  return (
    WORKFLOW_CATEGORY_COLORS[normalizedCategory as keyof typeof WORKFLOW_CATEGORY_COLORS]?.[
      variant
    ] || WORKFLOW_CATEGORY_COLORS.todo[variant]
  );
}

/**
 * Generate an accessible label for an issue card
 */
export function getIssueAccessibleLabel(issue: {
  key: string;
  title: string;
  type: string;
  priority: string;
  assignee?: { name: string } | null;
  storyPoints?: number;
  labels?: { name: string }[];
}): string {
  const typeLabel = getTypeLabel(issue.type);
  const capitalizedPriority = issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1);
  const priorityLabel = `${capitalizedPriority} priority`;
  const assigneeLabel = issue.assignee ? `assigned to ${issue.assignee.name}` : "unassigned";
  const pointsLabel = issue.storyPoints !== undefined ? `, ${issue.storyPoints} points` : "";
  const labelsLabel =
    issue.labels && issue.labels.length > 0
      ? `, Labels: ${issue.labels.map((l) => l.name).join(", ")}`
      : "";

  return `${typeLabel} ${issue.key}: ${issue.title}, ${priorityLabel}, ${assigneeLabel}${pointsLabel}${labelsLabel}`;
}
