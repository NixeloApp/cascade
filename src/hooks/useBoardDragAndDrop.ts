import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import { useMutation } from "convex/react";
import { useCallback, useMemo, useRef } from "react";
import { showError } from "@/lib/toast";
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

import { optimisticBoardUpdate } from "./boardOptimisticUpdates";

export function useBoardDragAndDrop({
  allIssues,
  issuesByStatus,
  isTeamMode,
  pushHistoryAction,
  boardOptions,
}: UseBoardDragAndDropOptions) {
  // Use ref instead of state to avoid re-renders during drag
  // This stabilizes handleDrop and prevents KanbanColumn from re-rendering
  const draggedIssueRef = useRef<Id<"issues"> | null>(null);

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
  // TODO: Add optimistic update for team mode if needed

  const handleDragStart = useCallback((e: React.DragEvent, issueId: Id<"issues">) => {
    draggedIssueRef.current = issueId;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();

      const draggedIssueId = draggedIssueRef.current;

      if (!(draggedIssueId && allIssues.length > 0)) return;

      const issue = allIssues.find((i) => i._id === draggedIssueId);
      if (!issue) return;

      if (issue.status === newStatus) {
        draggedIssueRef.current = null;
        return;
      }

      // Calculate new order
      const issuesInNewStatus = issuesByStatus[newStatus] || [];
      const newOrder = Math.max(...issuesInNewStatus.map((i) => i.order), -1) + 1;

      // Action for history
      const action: BoardAction = {
        issueId: draggedIssueId,
        oldStatus: issue.status,
        newStatus,
        oldOrder: issue.order,
        newOrder,
        issueTitle: issue.title,
        isTeamMode,
      };

      try {
        if (isTeamMode) {
          await updateStatusByCategory({
            issueId: draggedIssueId,
            category: newStatus as "todo" | "inprogress" | "done",
            newOrder,
          });
          // Note: History not supported for team mode yet
        } else {
          await updateIssueStatus({
            issueId: draggedIssueId,
            newStatus,
            newOrder,
          });
          pushHistoryAction(action);
        }
      } catch (error) {
        showError(error, "Failed to update issue status");
      }

      draggedIssueRef.current = null;
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
    draggedIssue: draggedIssueRef.current,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
