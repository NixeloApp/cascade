/**
 * SwimlanRow - Collapsible row for swimlane grouping
 *
 * Features:
 * - Collapsible header with issue count
 * - Color-coded header based on swimlane type (priority colors, etc.)
 * - Renders columns for each workflow state within the swimlane
 */

import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { memo } from "react";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import type { SwimlanConfig } from "@/lib/swimlane-utils";
import { getSwimlanIssueCount } from "@/lib/swimlane-utils";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { KanbanColumn } from "./KanbanColumn";

interface SwimlanRowProps {
  config: SwimlanConfig;
  issuesByStatus: Record<string, EnrichedIssue[]>;
  workflowStates: WorkflowState[];
  isCollapsed: boolean;
  onToggleCollapse: (swimlanId: string) => void;
  // Pass-through props for KanbanColumn
  selectionMode: boolean;
  selectedIssueIds: Set<Id<"issues">>;
  focusedIssueId?: Id<"issues"> | null;
  canEdit: boolean;
  onCreateIssue?: (stateId: string) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onToggleSelect: (issueId: Id<"issues">) => void;
  statusCounts: Record<string, { total: number; loaded: number; hidden: number }>;
  onLoadMore?: (statusId: string) => void;
  isLoadingMore?: boolean;
  onIssueDrop?: (issueId: Id<"issues">, sourceStatus: string, targetStatus: string) => void;
  onIssueReorder?: (
    draggedIssueId: Id<"issues">,
    sourceStatus: string,
    targetIssueId: Id<"issues">,
    targetStatus: string,
    edge: "top" | "bottom",
  ) => void;
}

const SwimlanRowComponent = function SwimlanRow({
  config,
  issuesByStatus,
  workflowStates,
  isCollapsed,
  onToggleCollapse,
  selectionMode,
  selectedIssueIds,
  focusedIssueId,
  canEdit,
  onCreateIssue,
  onIssueClick,
  onToggleSelect,
  statusCounts,
  onLoadMore,
  isLoadingMore,
  onIssueDrop,
  onIssueReorder,
}: SwimlanRowProps) {
  const totalIssues = getSwimlanIssueCount(issuesByStatus);

  const handleToggle = () => {
    onToggleCollapse(config.id);
  };

  return (
    <div className="mb-4">
      {/* Swimlane Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-ui-bg-hover rounded-secondary transition-fast group"
        aria-expanded={!isCollapsed}
        aria-controls={`swimlane-${config.id}`}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-ui-text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
        )}
        <Typography
          variant="label"
          className={cn("font-medium", config.color || "text-ui-text-secondary")}
        >
          {config.name}
        </Typography>
        <Badge variant="neutral" shape="pill" className="text-xs">
          {totalIssues}
        </Badge>
      </button>

      {/* Swimlane Content */}
      {!isCollapsed && (
        <div id={`swimlane-${config.id}`} className="mt-2">
          <Flex
            direction="column"
            className="lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 px-4 lg:px-0 overflow-x-auto -webkit-overflow-scrolling-touch"
          >
            {workflowStates.map((state, columnIndex) => {
              const counts = statusCounts[state.id] || {
                total: 0,
                loaded: 0,
                hidden: 0,
              };
              return (
                <KanbanColumn
                  key={state.id}
                  state={state}
                  issues={issuesByStatus[state.id] || []}
                  columnIndex={columnIndex}
                  selectionMode={selectionMode}
                  selectedIssueIds={selectedIssueIds}
                  focusedIssueId={focusedIssueId}
                  canEdit={canEdit}
                  onCreateIssue={onCreateIssue}
                  onIssueClick={onIssueClick}
                  onToggleSelect={onToggleSelect}
                  hiddenCount={counts.hidden}
                  totalCount={counts.total}
                  onLoadMore={onLoadMore}
                  isLoadingMore={isLoadingMore}
                  onIssueDrop={onIssueDrop}
                  onIssueReorder={onIssueReorder}
                />
              );
            })}
          </Flex>
        </div>
      )}
    </div>
  );
};

export const SwimlanRow = memo(SwimlanRowComponent);
