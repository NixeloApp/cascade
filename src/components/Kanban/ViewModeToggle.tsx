/**
 * ViewModeToggle - Toggle between modal and peek (side panel) view for issues
 *
 * Allows users to switch how issue details are displayed:
 * - Modal: Centered dialog (default)
 * - Peek: Slide-out panel from the right side
 */

import { useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { Columns2, PanelRightOpen } from "@/lib/icons";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

export function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useIssueViewMode();

  return (
    <Tooltip content={viewMode === "modal" ? "Switch to side panel view" : "Switch to modal view"}>
      <IconButton
        onClick={toggleViewMode}
        aria-label={viewMode === "modal" ? "Switch to side panel view" : "Switch to modal view"}
        aria-pressed={viewMode === "peek"}
      >
        {viewMode === "modal" ? (
          <PanelRightOpen className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Columns2 className="w-4 h-4" aria-hidden="true" />
        )}
      </IconButton>
    </Tooltip>
  );
}
