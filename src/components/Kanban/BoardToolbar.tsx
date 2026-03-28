import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { CardDisplayOptions } from "@/lib/card-display-utils";
import { CheckSquare, RotateCcw } from "@/lib/icons";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import { TEST_IDS } from "@/lib/test-ids";
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
  /** Optional mobile-only controls injected by the route shell */
  mobileActions?: ReactNode;
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
  mobileActions,
}: BoardToolbarProps) {
  if (!showControls) {
    return null;
  }

  return (
    <Card
      data-testid={TEST_IDS.BOARD.TOOLBAR}
      recipe="floatingToolbar"
      padding="none"
      className="pointer-events-auto mx-2 mb-2 w-fit max-w-full px-1.5 py-1 sm:mx-6 sm:mt-4 sm:mb-0 sm:max-w-none sm:px-5 sm:pb-3 sm:pt-4"
    >
      <Flex align="center" justify="between" gap="xs" gapSm="sm">
        <div className="hidden sm:block">
          <Typography variant="boardSurfaceTitle">
            {sprintId ? "Sprint Board" : "Kanban Board"}
          </Typography>
          <Typography variant="caption" className="mt-1 hidden sm:block">
            Move work between stages, keep limits visible, and start new items from the right
            column.
          </Typography>
        </div>
        {showControls && (
          <Flex align="center" justify="end" gap="xs" gapSm="sm" className="shrink-0">
            <Flex align="center" gap="xs" className="min-w-0 sm:hidden">
              {mobileActions}
            </Flex>

            {/* Undo/Redo buttons */}
            <div className="mr-2 hidden sm:block sm:mr-4">
              <Flex align="center" gap="xs">
                <Tooltip content="Undo (Ctrl+Z)">
                  <IconButton
                    onClick={onUndo}
                    disabled={historyStack.length === 0}
                    aria-label="Undo (Ctrl+Z)"
                  >
                    <Icon icon={RotateCcw} size="sm" aria-hidden="true" />
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
                      className="size-4"
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
            </div>

            {/* View mode toggle (modal/peek) */}
            <div className="hidden sm:block">
              <ViewModeToggle />
            </div>

            {/* Display properties selector */}
            {displayOptions && onDisplayOptionsChange && (
              <div className="hidden sm:block">
                <DisplayPropertiesSelector
                  value={displayOptions}
                  onChange={onDisplayOptionsChange}
                />
              </div>
            )}

            {/* Swimlane selector */}
            {onSwimlanGroupByChange && (
              <div className="hidden sm:block">
                <SwimlanSelector value={swimlaneGroupBy} onChange={onSwimlanGroupByChange} />
              </div>
            )}

            {/* Selection mode toggle */}
            <IconButton
              variant={selectionMode ? "brand" : "solid"}
              size="xs"
              onClick={onToggleSelectionMode}
              aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
              className="sm:hidden"
            >
              <Icon icon={CheckSquare} size="xs" aria-hidden="true" />
            </IconButton>
            <Button
              variant={selectionMode ? "primary" : "outline"}
              size="sm"
              onClick={onToggleSelectionMode}
              aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
              className={cn("hidden sm:inline-block", selectionMode && "shadow-soft")}
            >
              {selectionMode ? "Exit Selection" : "Select Multiple"}
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
