import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { CardDisplayOptions } from "@/lib/card-display-utils";
import { CheckSquare } from "@/lib/icons";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import { cn } from "@/lib/utils";
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
    <Flex
      align="center"
      justify="between"
      gap="xs"
      className="relative z-10 mx-2 h-0 overflow-visible px-0 py-0 sm:mx-6 sm:mt-4 sm:h-auto sm:gap-sm sm:rounded-2xl sm:border sm:border-ui-border/70 sm:bg-ui-bg-elevated sm:px-5 sm:pb-3 sm:pt-4 sm:shadow-soft"
    >
      <div className="hidden sm:block">
        <Typography variant="h2" className="text-xs font-semibold tracking-tight sm:text-lg">
          <span className="sm:hidden">{sprintId ? "Sprint" : "Board"}</span>
          <span className="hidden sm:inline">{sprintId ? "Sprint Board" : "Kanban Board"}</span>
        </Typography>
        <Typography variant="caption" className="mt-1 hidden sm:block">
          Move work between stages, keep limits visible, and start new items from the right column.
        </Typography>
      </div>
      {showControls && (
        <Flex
          align="center"
          justify="end"
          gap="xs"
          className="absolute right-0 top-1 shrink-0 justify-end sm:static sm:w-auto sm:justify-start sm:gap-2"
        >
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
          <div className="hidden sm:block">
            <ViewModeToggle />
          </div>

          {/* Display properties selector */}
          {displayOptions && onDisplayOptionsChange && (
            <div className="hidden sm:block">
              <DisplayPropertiesSelector value={displayOptions} onChange={onDisplayOptionsChange} />
            </div>
          )}

          {/* Swimlane selector */}
          {onSwimlanGroupByChange && (
            <div className="hidden sm:block">
              <SwimlanSelector value={swimlaneGroupBy} onChange={onSwimlanGroupByChange} />
            </div>
          )}

          {/* Selection mode toggle */}
          <Button
            variant={selectionMode ? "primary" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
            className={cn(
              "h-5 w-5 rounded-full px-0 text-xs shadow-none sm:h-9 sm:w-auto sm:rounded-xl sm:px-3 sm:text-sm",
              selectionMode
                ? "sm:shadow-soft"
                : "border-ui-border/35 bg-ui-bg/78 text-ui-text-tertiary opacity-80 sm:border-ui-border sm:bg-ui-bg-elevated sm:text-ui-text sm:opacity-100",
            )}
          >
            <CheckSquare className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">
              {selectionMode ? "Exit Selection" : "Select Multiple"}
            </span>
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
