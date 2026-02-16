import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Maximize2, Minimize2, Plus } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ANIMATION } from "@/lib/constants";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getWorkflowCategoryColor } from "@/lib/issue-utils";
import { createColumnData, type IssueCardData, isIssueCardData } from "@/lib/kanban-dnd";
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
  updatedAt: number;
}

export interface KanbanColumnProps {
  state: WorkflowState;
  issues: Issue[];
  columnIndex: number;
  selectionMode: boolean;
  selectedIssueIds: Set<Id<"issues">>;
  canEdit: boolean;
  onCreateIssue?: (stateId: string) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onToggleSelect: (issueId: Id<"issues">) => void;
  focusedIssueId?: Id<"issues"> | null;
  // Pagination props (optional - for done columns)
  hiddenCount?: number;
  totalCount?: number;
  onLoadMore?: (statusId: string) => void;
  isLoadingMore?: boolean;
  /** Callback when an issue is dropped on this column (column-level drop) */
  onIssueDrop?: (issueId: Id<"issues">, sourceStatus: string, targetStatus: string) => void;
  /** Callback when an issue is dropped on another issue (for reordering) */
  onIssueReorder?: (
    draggedIssueId: Id<"issues">,
    sourceStatus: string,
    targetIssueId: Id<"issues">,
    targetStatus: string,
    edge: "top" | "bottom",
  ) => void;
  /** Whether this column is collapsed */
  isCollapsed?: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse?: (stateId: string) => void;
}

/**
 * Wrapper component for IssueCard to memoize the wrapper div and animation style.
 * This prevents the wrapper div from re-rendering when parent renders but issue props are stable.
 */
const KanbanIssueItem = memo(
  ({
    issue,
    columnIndex,
    index,
    onClick,
    selectionMode,
    isSelected,
    isFocused,
    onToggleSelect,
    canEdit,
  }: {
    issue: Issue;
    columnIndex: number;
    index: number;
    onClick: (issueId: Id<"issues">) => void;
    selectionMode: boolean;
    isSelected: boolean;
    isFocused: boolean;
    onToggleSelect: (issueId: Id<"issues">) => void;
    canEdit: boolean;
  }) => {
    const style = useMemo(
      () => ({
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2) + index * ANIMATION.STAGGER_DELAY}ms`,
      }),
      [columnIndex, index],
    );

    return (
      <div className="animate-scale-in" style={style}>
        <IssueCard
          issue={issue}
          status={issue.status}
          onClick={onClick}
          selectionMode={selectionMode}
          isSelected={isSelected}
          isFocused={isFocused}
          onToggleSelect={onToggleSelect}
          canEdit={canEdit}
        />
      </div>
    );
  },
);
KanbanIssueItem.displayName = "KanbanIssueItem";

function areSelectedIssuesEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  if (prev.selectedIssueIds === next.selectedIssueIds) {
    return true;
  }
  for (const issue of next.issues) {
    if (prev.selectedIssueIds.has(issue._id) !== next.selectedIssueIds.has(issue._id)) {
      return false;
    }
  }
  return true;
}

function areFocusedIssuesEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  if (prev.focusedIssueId === next.focusedIssueId) return true;

  const wasFocusedInColumn =
    prev.focusedIssueId && prev.issues.some((i) => i._id === prev.focusedIssueId);
  const isFocusedInColumn =
    next.focusedIssueId && next.issues.some((i) => i._id === next.focusedIssueId);

  return !(wasFocusedInColumn || isFocusedInColumn);
}

/**
 * Custom equality check for KanbanColumn props
 * Optimizes performance by checking if selectedIssueIds actually affects this column
 */
export function arePropsEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  // Check shallow equality for all props except selectedIssueIds
  const prevKeys = Object.keys(prev) as (keyof KanbanColumnProps)[];
  const nextKeys = Object.keys(next) as (keyof KanbanColumnProps)[];

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (key === "selectedIssueIds" || key === "focusedIssueId") continue;
    if (prev[key] !== next[key]) return false;
  }

  if (!areFocusedIssuesEqual(prev, next)) return false;
  if (!areSelectedIssuesEqual(prev, next)) return false;

  return true;
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
  onCreateIssue,
  onIssueClick,
  onToggleSelect,
  // Pagination props
  hiddenCount = 0,
  totalCount = 0,
  onLoadMore,
  isLoadingMore = false,
  onIssueDrop,
  onIssueReorder,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const columnRef = useRef<HTMLElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  // Issues are now pre-filtered by status from parent - memoize sorting
  const stateIssues = useMemo(() => {
    return [...issues].sort((a, b) => a.order - b.order);
  }, [issues]);

  // WIP limit checks
  const wipLimit = state.wipLimit ?? 0;
  const hasWipLimit = wipLimit > 0;
  const isAtWipLimit = hasWipLimit && stateIssues.length === wipLimit;
  const isOverWipLimit = hasWipLimit && stateIssues.length > wipLimit;

  // Set up Pragmatic DnD drop target
  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => createColumnData(state.id, state.id),
      canDrop: ({ source }) => {
        // Only accept issue cards
        return isIssueCardData(source.data as Record<string, unknown>);
      },
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const data = source.data as IssueCardData;
        if (isIssueCardData(source.data as Record<string, unknown>)) {
          onIssueDrop?.(data.issueId, data.status, state.id);
        }
      },
    });
  }, [state.id, onIssueDrop]);

  const handleCreateIssue = useCallback(() => onCreateIssue?.(state.id), [onCreateIssue, state.id]);

  const handleLoadMore = useCallback(() => onLoadMore?.(state.id), [onLoadMore, state.id]);

  const handleToggleCollapse = useCallback(
    () => onToggleCollapse?.(state.id),
    [onToggleCollapse, state.id],
  );

  // Render collapsed column view
  if (isCollapsed) {
    return (
      <section
        ref={columnRef}
        aria-label={`${state.name} column (collapsed)`}
        data-testid={TEST_IDS.BOARD.COLUMN}
        data-board-column
        className={cn(
          "flex-shrink-0 w-11 bg-ui-bg-soft rounded-container animate-slide-up border border-ui-border border-t-2 transition-default flex flex-col items-center",
          getWorkflowCategoryColor(state.category),
          isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
        )}
        style={{
          animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
        }}
      >
        {/* Collapse toggle button */}
        <Tooltip content={`Expand ${state.name}`}>
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="p-2 text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover rounded-secondary transition-fast mt-2"
            aria-label={`Expand ${state.name} column`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Vertical column name */}
        <FlexItem
          flex="1"
          className="flex items-center justify-center py-4"
          style={{ writingMode: "vertical-lr" }}
        >
          <Typography
            variant="h3"
            className="font-medium text-ui-text-secondary tracking-tight text-sm transform rotate-180"
          >
            {state.name}
          </Typography>
        </FlexItem>

        {/* Issue count badge */}
        <Badge
          variant={isOverWipLimit ? "error" : isAtWipLimit ? "warning" : "neutral"}
          shape="pill"
          className="mb-3"
        >
          {stateIssues.length}
          {state.wipLimit ? `/${state.wipLimit}` : ""}
        </Badge>
      </section>
    );
  }

  return (
    <section
      ref={columnRef}
      aria-label={`${state.name} column`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className={cn(
        "flex-shrink-0 w-full lg:w-80 bg-ui-bg-soft rounded-container animate-slide-up border border-ui-border border-t-2 transition-default",
        getWorkflowCategoryColor(state.category),
        isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
        isOverWipLimit && "border-status-error/50 bg-status-error/5",
        isAtWipLimit && !isOverWipLimit && "border-status-warning/50",
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
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
              variant={isOverWipLimit ? "error" : isAtWipLimit ? "warning" : "neutral"}
              shape="pill"
              className="shrink-0"
            >
              {hiddenCount > 0 ? `${stateIssues.length}/${totalCount}` : stateIssues.length}
              {state.wipLimit ? `/${state.wipLimit}` : ""}
            </Badge>
            {isOverWipLimit && (
              <Tooltip content={`WIP limit exceeded (max ${state.wipLimit})`}>
                <Badge variant="error" size="sm">
                  Over limit
                </Badge>
              </Tooltip>
            )}
          </Flex>
          <Flex align="center" gap="xs">
            {onToggleCollapse && (
              <Tooltip content={`Collapse ${state.name}`}>
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover p-2 shrink-0 rounded-secondary transition-fast"
                  aria-label={`Collapse ${state.name} column`}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
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
              <KanbanIssueItem
                key={issue._id}
                issue={issue}
                columnIndex={columnIndex}
                index={issueIndex}
                onClick={onIssueClick}
                selectionMode={selectionMode}
                isSelected={selectedIssueIds.has(issue._id)}
                isFocused={issue._id === focusedIssueId}
                onToggleSelect={onToggleSelect}
                canEdit={canEdit}
              />
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
