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

/** Icon mapping for issue types - use with <Icon icon={ISSUE_TYPE_ICONS[type]} /> */
export const ISSUE_TYPE_ICONS = {
  bug: Bug,
  story: BookOpen,
  epic: Zap,
  subtask: CircleDot,
  task: CheckSquare,
} as const;

/** Icon mapping for priorities - use with <Icon icon={PRIORITY_ICONS[priority]} /> */
export const PRIORITY_ICONS = {
  highest: ChevronUp,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
  lowest: ChevronDown,
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
  const colors = {
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
  };

  return colors[priority as keyof typeof colors]?.[variant] || colors.lowest[variant];
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
 * Get the color classes for a workflow category
 * Uses semantic theme tokens with full dark mode support
 */
export function getWorkflowCategoryColor(
  category: string,
  variant: "border" | "text" | "bg" = "border",
): string {
  const normalizedCategory = category.toLowerCase();
  const colors = {
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
  };

  return colors[normalizedCategory as keyof typeof colors]?.[variant] || colors.todo[variant];
}
