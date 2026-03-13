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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import type { SwimlanConfig } from "@/lib/swimlane-utils";
import { getSwimlanIssueCount } from "@/lib/swimlane-utils";
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
  onLoadMore?: () => void;
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

  const swimlaneTitleStyle = config.color?.startsWith("#") ? { color: config.color } : undefined;
  const swimlaneTitleClassName = !swimlaneTitleStyle && config.color ? config.color : undefined;

  return (
    <Stack gap="sm" className="mb-4">
      <Button
        onClick={handleToggle}
        variant="unstyled"
        chrome="swimlaneHeader"
        chromeSize="swimlaneHeader"
        aria-expanded={!isCollapsed}
        aria-controls={`swimlane-${config.id}`}
      >
        {isCollapsed ? (
          <Icon icon={ChevronRight} size="sm" className="text-ui-text-tertiary" />
        ) : (
          <Icon icon={ChevronDown} size="sm" className="text-ui-text-tertiary" />
        )}
        <Typography
          variant="label"
          color={!swimlaneTitleClassName && !swimlaneTitleStyle ? "secondary" : "auto"}
          className={swimlaneTitleClassName}
          style={swimlaneTitleStyle}
        >
          {config.name}
        </Typography>
        <Badge variant="neutral" shape="pill">
          {totalIssues}
        </Badge>
      </Button>

      {!isCollapsed && (
        <Card id={`swimlane-${config.id}`} recipe="kanbanSwimlaneContent">
          <Flex direction="column" directionMd="row" gap="xl">
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
        </Card>
      )}
    </Stack>
  );
};

export const SwimlanRow = memo(SwimlanRowComponent);
