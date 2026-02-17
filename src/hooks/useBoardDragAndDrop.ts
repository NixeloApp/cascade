import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showError } from "@/lib/toast";
import { optimisticBoardUpdate } from "./boardOptimisticUpdates";
import type { BoardAction } from "./useBoardHistory";
import type { UseSmartBoardDataOptions } from "./useSmartBoardData";

/**
 * Calculate the new order value for an issue being inserted between others.
 * Uses fractional ordering (midpoint between neighbors) for efficiency.
 */
function calculateReorderPosition(
  sortedIssues: EnrichedIssue[],
  targetIndex: number,
  targetOrder: number,
  edge: "top" | "bottom",
): number {
  if (edge === "top") {
    // Insert before target
    if (targetIndex === 0) {
      return targetOrder - 1;
    }
    const prevOrder = sortedIssues[targetIndex - 1].order;
    return (prevOrder + targetOrder) / 2;
  }
  // Insert after target (bottom edge)
  if (targetIndex === sortedIssues.length - 1) {
    return targetOrder + 1;
  }
  const nextOrder = sortedIssues[targetIndex + 1].order;
  return (targetOrder + nextOrder) / 2;
}

interface UseBoardDragAndDropOptions {
  allIssues: EnrichedIssue[];
  issuesByStatus: Record<string, EnrichedIssue[]>;
  isTeamMode: boolean;
  pushHistoryAction: (action: BoardAction) => void;
  // Options for optimistic updating
  boardOptions?: UseSmartBoardDataOptions;
}

/**
 * Hook for managing Kanban board drag-and-drop with Pragmatic DnD
 *
 * Provides handlers for issue drops and tracks dragging state.
 * Uses Convex mutations with optimistic updates for instant feedback.
 */
export function useBoardDragAndDrop({
  allIssues,
  issuesByStatus,
  isTeamMode,
  pushHistoryAction,
  boardOptions,
}: UseBoardDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);

  // Store data in a ref to keep callbacks stable even when data changes
  const dataRef = useRef({ allIssues, issuesByStatus });
  useEffect(() => {
    dataRef.current = { allIssues, issuesByStatus };
  }, [allIssues, issuesByStatus]);

  const rawUpdateStatus = useMutation(api.issues.updateStatus);

  const optimisticUpdate = useMemo(
    () => optimisticBoardUpdate(boardOptions, isTeamMode),
    [boardOptions, isTeamMode],
  );

  const updateIssueStatus = useMemo(
    () => rawUpdateStatus.withOptimisticUpdate(optimisticUpdate),
    [rawUpdateStatus, optimisticUpdate],
  );

  const updateStatusByCategory = useMutation(api.issues.updateStatusByCategory);

  /**
   * Handle drag state changes from IssueCard
   */
  const handleDragStateChange = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  /**
   * Handle issue drop on a column
   * Called by KanbanColumn when a valid drop occurs
   */
  const handleIssueDrop = useCallback(
    async (issueId: Id<"issues">, sourceStatus: string, targetStatus: string) => {
      // Skip if dropped on same column
      if (sourceStatus === targetStatus) {
        return;
      }

      const { allIssues, issuesByStatus } = dataRef.current;
      const issue = allIssues.find((i) => i._id === issueId);
      if (!issue) return;

      // Calculate new order (append to end of target column)
      const issuesInNewStatus = issuesByStatus[targetStatus] || [];
      const newOrder = Math.max(...issuesInNewStatus.map((i) => i.order), -1) + 1;

      // Action for history (undo/redo)
      const action: BoardAction = {
        issueId,
        oldStatus: sourceStatus,
        newStatus: targetStatus,
        oldOrder: issue.order,
        newOrder,
        issueTitle: issue.title,
        isTeamMode,
      };

      try {
        if (isTeamMode) {
          await updateStatusByCategory({
            issueId,
            category: targetStatus as "todo" | "inprogress" | "done",
            newOrder,
          });
          // Note: History not supported for team mode yet
        } else {
          await updateIssueStatus({
            issueId,
            newStatus: targetStatus,
            newOrder,
          });
          pushHistoryAction(action);
        }
      } catch (error) {
        showError(error, "Failed to update issue status");
      }
    },
    [updateIssueStatus, updateStatusByCategory, isTeamMode, pushHistoryAction],
  );

  /**
   * Handle issue drop on another issue (for reordering within/across columns)
   * Called by IssueCard when a valid drop occurs on another card
   */
  const handleIssueReorder = useCallback(
    async (
      draggedIssueId: Id<"issues">,
      sourceStatus: string,
      targetIssueId: Id<"issues">,
      targetStatus: string,
      edge: "top" | "bottom",
    ) => {
      const { allIssues, issuesByStatus } = dataRef.current;
      const draggedIssue = allIssues.find((i) => i._id === draggedIssueId);
      const targetIssue = allIssues.find((i) => i._id === targetIssueId);
      if (!draggedIssue || !targetIssue) return;

      const issuesInTargetStatus = issuesByStatus[targetStatus] || [];
      const sortedIssues = [...issuesInTargetStatus].sort((a, b) => a.order - b.order);
      const targetIndex = sortedIssues.findIndex((i) => i._id === targetIssueId);

      // Calculate new order based on edge
      const newOrder = calculateReorderPosition(sortedIssues, targetIndex, targetIssue.order, edge);

      // Action for history (undo/redo)
      const action: BoardAction = {
        issueId: draggedIssueId,
        oldStatus: sourceStatus,
        newStatus: targetStatus,
        oldOrder: draggedIssue.order,
        newOrder,
        issueTitle: draggedIssue.title,
        isTeamMode,
      };

      try {
        if (isTeamMode) {
          await updateStatusByCategory({
            issueId: draggedIssueId,
            category: targetStatus as "todo" | "inprogress" | "done",
            newOrder,
          });
        } else {
          await updateIssueStatus({
            issueId: draggedIssueId,
            newStatus: targetStatus,
            newOrder,
          });
          pushHistoryAction(action);
        }
      } catch (error) {
        showError(error, "Failed to reorder issue");
      }
    },
    [updateIssueStatus, updateStatusByCategory, isTeamMode, pushHistoryAction],
  );

  return {
    isDragging,
    handleDragStateChange,
    handleIssueDrop,
    handleIssueReorder,
  };
}
