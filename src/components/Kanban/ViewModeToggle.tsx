/**
 * ViewModeToggle - Toggle between modal and peek (side panel) view for issues
 *
 * Allows users to switch how issue details are displayed:
 * - Modal: Centered dialog (default)
 * - Peek: Slide-out panel from the right side
 */

import { useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { Columns2, PanelRightOpen } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

export function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useIssueViewMode();

  return (
    <Tooltip content={viewMode === "modal" ? "Switch to side panel view" : "Switch to modal view"}>
      <IconButton
        onClick={toggleViewMode}
        data-testid={TEST_IDS.BOARD.VIEW_MODE_TOGGLE}
        aria-label={viewMode === "modal" ? "Switch to side panel view" : "Switch to modal view"}
        aria-pressed={viewMode === "peek"}
      >
        <Icon
          icon={viewMode === "modal" ? PanelRightOpen : Columns2}
          size="sm"
          aria-hidden="true"
        />
      </IconButton>
    </Tooltip>
  );
}
