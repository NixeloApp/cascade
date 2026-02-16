/**
 * Kanban Drag-and-Drop Utilities
 *
 * Utilities for Atlassian Pragmatic DnD in the Kanban board.
 * Provides type-safe payload extraction and drop location helpers.
 */

import type { Id } from "@convex/_generated/dataModel";

// =============================================================================
// Types
// =============================================================================

/** Draggable element types in the Kanban board */
export type DraggableType = "issue" | "column";

/** Payload for a draggable issue card */
export interface IssueCardData extends Record<string | symbol, unknown> {
  type: "issue";
  issueId: Id<"issues">;
  status: string;
  order: number;
}

/** Payload for a droppable column */
export interface ColumnData extends Record<string | symbol, unknown> {
  type: "column";
  columnId: string;
  status: string;
}

/** Union of all draggable/droppable data types */
export type KanbanDragData = IssueCardData | ColumnData;

/** Source information extracted from a drop event */
export interface DragSource {
  issueId: Id<"issues">;
  status: string;
  order: number;
}

/** Destination information extracted from a drop event */
export interface DropDestination {
  status: string;
  /** Index within the column where the item should be inserted */
  index: number;
}

// =============================================================================
// Payload Creators
// =============================================================================

/**
 * Create payload data for a draggable issue card
 */
export function createIssueCardData(
  issueId: Id<"issues">,
  status: string,
  order: number,
): IssueCardData {
  return {
    type: "issue",
    issueId,
    status,
    order,
  };
}

/**
 * Create payload data for a droppable column
 */
export function createColumnData(columnId: string, status: string): ColumnData {
  return {
    type: "column",
    columnId,
    status,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if data is an issue card payload
 */
export function isIssueCardData(data: Record<string, unknown>): boolean {
  return data.type === "issue" && typeof data.issueId === "string";
}

/**
 * Check if data is a column payload
 */
export function isColumnData(data: Record<string, unknown>): boolean {
  return data.type === "column" && typeof data.columnId === "string";
}

// =============================================================================
// Payload Extraction
// =============================================================================

/**
 * Extract source issue data from a Pragmatic DnD drop event
 *
 * @param source - The source data from the drop event
 * @returns The source issue info, or null if invalid
 */
export function extractDragSource(source: Record<string, unknown>): DragSource | null {
  if (!isIssueCardData(source)) {
    return null;
  }

  return {
    issueId: source.issueId as Id<"issues">,
    status: source.status as string,
    order: source.order as number,
  };
}

/**
 * Extract destination column from drop targets
 *
 * Pragmatic DnD provides an array of drop targets from innermost to outermost.
 * We traverse to find the column target.
 *
 * @param dropTargets - Array of drop target data from the event
 * @returns The destination info, or null if no valid column found
 */
export function extractDropDestination(
  dropTargets: Array<{ data: Record<string, unknown> }>,
): DropDestination | null {
  // Find the column drop target
  for (const target of dropTargets) {
    if (isColumnData(target.data)) {
      return {
        status: target.data.status as string,
        // Index will be calculated separately based on drop position
        index: -1,
      };
    }
  }

  return null;
}

/**
 * Calculate the insertion index based on drop position relative to other cards
 *
 * @param closestEdge - "top" or "bottom" from hitbox detection
 * @param targetIndex - Index of the card being dropped on
 * @param isSameColumn - Whether dragging within the same column
 * @param sourceIndex - Original index of the dragged card (only relevant if same column)
 */
export function calculateInsertionIndex(
  closestEdge: "top" | "bottom" | null,
  targetIndex: number,
  isSameColumn: boolean,
  sourceIndex: number,
): number {
  if (closestEdge === null) {
    // Dropped on empty column or at the end
    return targetIndex;
  }

  let insertIndex = closestEdge === "top" ? targetIndex : targetIndex + 1;

  // Adjust for same-column reordering
  if (isSameColumn && sourceIndex < insertIndex) {
    insertIndex -= 1;
  }

  return Math.max(0, insertIndex);
}

// =============================================================================
// Visual Feedback Helpers
// =============================================================================

/** CSS class for drop indicator line at top edge */
export const DROP_INDICATOR_TOP_CLASS =
  "before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:bg-brand before:rounded-full";

/** CSS class for drop indicator line at bottom edge */
export const DROP_INDICATOR_BOTTOM_CLASS =
  "after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-brand after:rounded-full";

/**
 * Get CSS classes for drag preview styling
 */
export function getDragPreviewClasses(isDragging: boolean): string {
  if (!isDragging) return "";
  return "opacity-50 scale-95 rotate-2 shadow-lg";
}

/**
 * Get CSS classes for drop target highlighting
 */
export function getDropTargetClasses(isDraggedOver: boolean): string {
  if (!isDraggedOver) return "";
  return "bg-brand/5 border-brand/30";
}
