/**
 * Board History Hook
 *
 * Undo/redo stack for Kanban board drag-and-drop actions.
 * Tracks status and order changes for reversal.
 * Syncs with backend mutations for consistency.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DISPLAY_LIMITS } from "@/lib/constants";
import { showError, showSuccess } from "@/lib/toast";

export interface BoardAction {
  issueId: Id<"issues">;
  oldStatus: string;
  newStatus: string;
  oldOrder: number;
  newOrder: number;
  issueTitle: string;
  isTeamMode?: boolean;
}

/** Hook for undo/redo history of Kanban board drag-and-drop actions. */
export function useBoardHistory() {
  const [historyStack, setHistoryStack] = useState<BoardAction[]>([]);
  const [redoStack, setRedoStack] = useState<BoardAction[]>([]);

  const updateIssueStatus = useMutation(api.issues.updateStatus);

  const pushAction = useCallback((action: BoardAction) => {
    setHistoryStack((prev) => [...prev, action].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(async () => {
    if (historyStack.length === 0) {
      toast.info("Nothing to undo");
      return;
    }

    const lastAction = historyStack[historyStack.length - 1];
    const newHistory = historyStack.slice(0, -1);

    try {
      if (lastAction.isTeamMode) {
        showError("team-mode", "Undo not supported in Team View yet");
        return;
      }

      await updateIssueStatus({
        issueId: lastAction.issueId,
        newStatus: lastAction.oldStatus,
        newOrder: lastAction.oldOrder,
      });

      setHistoryStack(newHistory);
      setRedoStack((prev) => [...prev, lastAction].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
      showSuccess(`Undid move of "${lastAction.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to undo");
    }
  }, [historyStack, updateIssueStatus]);

  const handleRedo = useCallback(async () => {
    if (redoStack.length === 0) {
      toast.info("Nothing to redo");
      return;
    }

    const lastRedo = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    try {
      if (lastRedo.isTeamMode) {
        showError("team-mode", "Redo not supported in Team View yet");
        return;
      }

      await updateIssueStatus({
        issueId: lastRedo.issueId,
        newStatus: lastRedo.newStatus,
        newOrder: lastRedo.newOrder,
      });

      setRedoStack(newRedoStack);
      setHistoryStack((prev) => [...prev, lastRedo].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
      showSuccess(`Redid move of "${lastRedo.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to redo");
    }
  }, [redoStack, updateIssueStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

  return {
    historyStack,
    redoStack,
    pushAction,
    handleUndo,
    handleRedo,
  };
}
