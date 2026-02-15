import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { showError } from "@/lib/toast";
import { optimisticBoardUpdate } from "./boardOptimisticUpdates";
import type { BoardAction } from "./useBoardHistory";
import type { UseSmartBoardDataOptions } from "./useSmartBoardData";

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
    [
      allIssues,
      issuesByStatus,
      updateIssueStatus,
      updateStatusByCategory,
      isTeamMode,
      pushHistoryAction,
    ],
  );

  return {
    isDragging,
    handleDragStateChange,
    handleIssueDrop,
  };
}
