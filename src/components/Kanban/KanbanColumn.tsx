import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Plus } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ANIMATION } from "@/lib/constants";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getWorkflowCategoryColor } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { IssueCard } from "../IssueCard";
import { Badge } from "../ui/Badge";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { PaginationInfo } from "../ui/PaginationInfo";

interface Issue {
  _id: Id<"issues">;
  title: string;
  key: string;
  status: string;
  priority: IssuePriority;
  type: IssueType;
  order: number;
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: LabelInfo[];
}

interface KanbanColumnProps {
  state: WorkflowState;
  issues: Issue[];
  columnIndex: number;
  selectionMode: boolean;
  selectedIssueIds: Set<Id<"issues">>;
  canEdit: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stateId: string) => void;
  onDragStart: (e: React.DragEvent, issueId: Id<"issues">) => void;
  onCreateIssue?: (stateId: string) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onToggleSelect: (issueId: Id<"issues">) => void;
  focusedIssueId?: Id<"issues"> | null;
  // Pagination props (optional - for done columns)
  hiddenCount?: number;
  totalCount?: number;
  onLoadMore?: (statusId: string) => void;
  isLoadingMore?: boolean;
}

/**
 * Custom equality check for KanbanColumn props
 * Optimizes performance by checking if selectedIssueIds actually affects this column
 */
function arePropsEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  // Check shallow equality for all props except selectedIssueIds
  const prevKeys = Object.keys(prev) as (keyof KanbanColumnProps)[];
  const nextKeys = Object.keys(next) as (keyof KanbanColumnProps)[];

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (key === "selectedIssueIds") continue;
    if (prev[key] !== next[key]) return false;
  }

  // If selectedIssueIds is the same reference, no change
  if (prev.selectedIssueIds === next.selectedIssueIds) {
    return true;
  }

  // If selectedIssueIds changed, check if it affects any issue in this column
  // We assume issues are stable if step 1 passed (prev.issues === next.issues)
  // If issues changed reference but same content, step 1 failed so we re-render anyway (safe)
  for (const issue of next.issues) {
    if (prev.selectedIssueIds.has(issue._id) !== next.selectedIssueIds.has(issue._id)) {
      return false; // Selection state changed for an issue in this column
    }
  }

  return true; // No relevant change
}

/**
 * Individual Kanban column for a workflow state
 * Extracted from KanbanBoard for better organization
 * Memoized to prevent unnecessary re-renders when other columns change
 */
const KanbanColumnComponent = function KanbanColumn({
  state,
  issues,
  columnIndex,
  selectionMode,
  selectedIssueIds,
  focusedIssueId,
  canEdit,
  onDragOver,
  onDrop,
  onDragStart,
  onCreateIssue,
  onIssueClick,
  onToggleSelect,
  // Pagination props
  hiddenCount = 0,
  totalCount = 0,
  onLoadMore,
  isLoadingMore = false,
}: KanbanColumnProps) {
  // Issues are now pre-filtered by status from parent - memoize sorting
  const stateIssues = useMemo(() => {
    return [...issues].sort((a, b) => a.order - b.order);
  }, [issues]);

  // Memoize handlers that use state.id to preserve memo() benefits
  const handleDrop = useCallback((e: React.DragEvent) => onDrop(e, state.id), [onDrop, state.id]);

  const handleCreateIssue = useCallback(() => onCreateIssue?.(state.id), [onCreateIssue, state.id]);

  const handleLoadMore = useCallback(() => onLoadMore?.(state.id), [onLoadMore, state.id]);

  return (
    <section
      aria-label={`${state.name} column`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className={cn(
        "flex-shrink-0 w-full lg:w-80 bg-ui-bg-soft rounded-container animate-slide-up border border-ui-border border-t-2 transition-default",
        getWorkflowCategoryColor(state.category),
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        data-testid={TEST_IDS.BOARD.COLUMN_HEADER}
        className="p-3 sm:p-4 border-b border-ui-border/50 bg-transparent rounded-t-container"
      >
        <Flex align="center" justify="between" gap="sm">
          <Flex align="center" className="space-x-2 min-w-0">
            <Typography
              variant="h3"
              className="font-medium text-ui-text-secondary truncate tracking-tight text-sm"
            >
              {state.name}
            </Typography>
            <Badge
              data-testid={TEST_IDS.BOARD.COLUMN_COUNT}
              variant="neutral"
              shape="pill"
              className="shrink-0"
            >
              {hiddenCount > 0 ? `${stateIssues.length}/${totalCount}` : stateIssues.length}
            </Badge>
          </Flex>
          {canEdit && (
            <Tooltip content="Create issue">
              <button
                type="button"
                onClick={handleCreateIssue}
                className="text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover p-2.5 sm:p-3 shrink-0 rounded-secondary transition-fast"
                aria-label={`Add issue to ${state.name}`}
                {...(columnIndex === 0 ? { "data-tour": "create-issue" } : {})}
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </Flex>
      </div>

      {/* Issues */}
      <div className="p-2 space-y-2 min-h-96 transition-default">
        {stateIssues.length === 0 && hiddenCount === 0 ? (
          /* Empty column state */
          <Flex
            direction="column"
            align="center"
            justify="center"
            className="py-12 px-4 text-center"
          >
            <Flex
              align="center"
              justify="center"
              className="w-10 h-10 rounded-full bg-ui-bg-hover mb-3"
            >
              <Plus className="w-5 h-5 text-ui-text-tertiary" />
            </Flex>
            <Typography variant="small" className="text-ui-text-tertiary mb-1">
              No issues yet
            </Typography>
            {canEdit && onCreateIssue && (
              <Typography variant="small" className="text-ui-text-tertiary">
                Drop issues here or click + to add
              </Typography>
            )}
          </Flex>
        ) : (
          <>
            {stateIssues.map((issue, issueIndex) => (
              <div
                key={issue._id}
                className="animate-scale-in"
                style={{
                  animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2) + issueIndex * ANIMATION.STAGGER_DELAY}ms`,
                }}
              >
                <IssueCard
                  issue={issue}
                  onDragStart={onDragStart}
                  onClick={onIssueClick}
                  selectionMode={selectionMode}
                  isSelected={selectedIssueIds.has(issue._id)}
                  isFocused={issue._id === focusedIssueId}
                  onToggleSelect={onToggleSelect}
                  canEdit={canEdit}
                />
              </div>
            ))}

            {/* Load More Button for done columns with hidden items */}
            {onLoadMore && hiddenCount > 0 && (
              <div className="pt-2">
                <LoadMoreButton
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                  remainingCount={hiddenCount}
                  className="w-full"
                />
              </div>
            )}

            {/* Pagination info when there are hidden items */}
            {hiddenCount > 0 && (
              <PaginationInfo
                loaded={stateIssues.length}
                total={totalCount}
                itemName="issues"
                className="text-center pt-1"
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export const KanbanColumn = memo(KanbanColumnComponent, arePropsEqual);
