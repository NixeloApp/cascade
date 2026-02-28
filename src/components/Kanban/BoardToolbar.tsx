import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { CardDisplayOptions } from "@/lib/card-display-utils";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import { Typography } from "../ui/Typography";
import { DisplayPropertiesSelector } from "./DisplayPropertiesSelector";
import { SwimlanSelector } from "./SwimlanSelector";
import { ViewModeToggle } from "./ViewModeToggle";

interface BoardToolbarProps {
  sprintId?: string;
  selectionMode: boolean;
  historyStack: unknown[];
  redoStack: unknown[];
  onUndo: () => void;
  onRedo: () => void;
  onToggleSelectionMode: () => void;
  showControls?: boolean;
  /** Swimlane grouping option */
  swimlaneGroupBy?: SwimlanGroupBy;
  /** Callback when swimlane grouping changes */
  onSwimlanGroupByChange?: (value: SwimlanGroupBy) => void;
  /** Card display options */
  displayOptions?: CardDisplayOptions;
  /** Callback when display options change */
  onDisplayOptionsChange?: (value: CardDisplayOptions) => void;
}

/**
 * Kanban board toolbar with title, undo/redo buttons, and selection mode toggle
 * Extracted from KanbanBoard for better organization
 */
export function BoardToolbar({
  sprintId,
  selectionMode,
  historyStack,
  redoStack,
  onUndo,
  onRedo,
  onToggleSelectionMode,
  showControls = true,
  swimlaneGroupBy = "none",
  onSwimlanGroupByChange,
  displayOptions,
  onDisplayOptionsChange,
}: BoardToolbarProps) {
  return (
    <Flex align="center" justify="between" gap="sm" className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
      <Typography variant="h2" className="text-base sm:text-lg font-semibold tracking-tight">
        {sprintId ? "Sprint Board" : "Kanban Board"}
      </Typography>
      {showControls && (
        <Flex align="center" gap="xs" className="sm:gap-2 shrink-0">
          {/* Undo/Redo buttons */}
          <Flex align="center" gap="xs" className="hidden sm:flex mr-2 sm:mr-4">
            <Tooltip content="Undo (Ctrl+Z)">
              <IconButton
                onClick={onUndo}
                disabled={historyStack.length === 0}
                aria-label="Undo (Ctrl+Z)"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)">
              <IconButton
                onClick={onRedo}
                disabled={redoStack.length === 0}
                aria-label="Redo (Ctrl+Shift+Z)"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                  />
                </svg>
              </IconButton>
            </Tooltip>
          </Flex>

          {/* View mode toggle (modal/peek) */}
          <ViewModeToggle />

          {/* Display properties selector */}
          {displayOptions && onDisplayOptionsChange && (
            <DisplayPropertiesSelector value={displayOptions} onChange={onDisplayOptionsChange} />
          )}

          {/* Swimlane selector */}
          {onSwimlanGroupByChange && (
            <SwimlanSelector value={swimlaneGroupBy} onChange={onSwimlanGroupByChange} />
          )}

          {/* Selection mode toggle */}
          <Button
            variant={selectionMode ? "primary" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
          >
            <span className="hidden sm:inline">
              {selectionMode ? "Exit Selection" : "Select Multiple"}
            </span>
            <span className="sm:hidden">{selectionMode ? "Exit" : "Select"}</span>
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
