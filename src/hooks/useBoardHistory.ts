/**
 * Board History Hook
 *
 * Undo/redo stack for Kanban board drag-and-drop actions.
 * Tracks status and order changes for reversal.
 * Syncs with backend mutations for consistency.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { DISPLAY_LIMITS } from "@/lib/constants";
import { showError, showInfo, showSuccess } from "@/lib/toast";

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
  const { mutate: updateIssueStatus } = useAuthenticatedMutation(api.issues.updateStatus);

  // Refs for stable keyboard handler access
  const stateRef = useRef({ historyStack, redoStack, updateIssueStatus });
  stateRef.current = { historyStack, redoStack, updateIssueStatus };

  const pushAction = (action: BoardAction) => {
    setHistoryStack((prev) => [...prev, action].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
    setRedoStack([]);
  };

  const handleUndo = async () => {
    const { historyStack: stack, updateIssueStatus: update } = stateRef.current;
    if (stack.length === 0) {
      showInfo("Nothing to undo");
      return;
    }

    const action = stack[stack.length - 1];
    if (action.isTeamMode) {
      showError("team-mode", "Undo not supported in Team View yet");
      return;
    }

    try {
      await update({
        issueId: action.issueId,
        newStatus: action.oldStatus,
        newOrder: action.oldOrder,
      });
      setHistoryStack(stack.slice(0, -1));
      setRedoStack((prev) => [...prev, action].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
      showSuccess(`Undid move of "${action.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to undo");
    }
  };

  const handleRedo = async () => {
    const { redoStack: stack, updateIssueStatus: update } = stateRef.current;
    if (stack.length === 0) {
      showInfo("Nothing to redo");
      return;
    }

    const action = stack[stack.length - 1];
    if (action.isTeamMode) {
      showError("team-mode", "Redo not supported in Team View yet");
      return;
    }

    try {
      await update({
        issueId: action.issueId,
        newStatus: action.newStatus,
        newOrder: action.newOrder,
      });
      setRedoStack(stack.slice(0, -1));
      setHistoryStack((prev) => [...prev, action].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
      showSuccess(`Redid move of "${action.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to redo");
    }
  };

  // Stable refs for keyboard handler
  const handlersRef = useRef({ handleUndo, handleRedo });
  handlersRef.current = { handleUndo, handleRedo };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handlersRef.current.handleRedo();
        } else {
          handlersRef.current.handleUndo();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { historyStack, redoStack, pushAction, handleUndo, handleRedo };
}
