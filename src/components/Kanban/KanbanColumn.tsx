/**
 * Kanban Column
 *
 * Drop target column for the Kanban board with issue cards.
 * Supports drag-and-drop reordering, collapsing, and WIP limits.
 * Displays workflow state color and issue count badge.
 */

import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Id } from "@convex/_generated/dataModel";
import type { LabelInfo } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { Maximize2, Minimize2, Plus } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import type { CardDisplayOptions } from "@/lib/card-display-utils";
import { ANIMATION } from "@/lib/constants";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getWorkflowCategoryColor } from "@/lib/issue-utils";
import { createColumnData, type IssueCardData, isIssueCardData } from "@/lib/kanban-dnd";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { IssueCard } from "../IssueDetail";
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
  onLoadMore?: () => void;
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
  /** Card display options */
  displayOptions?: CardDisplayOptions;
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
    displayOptions,
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
    displayOptions?: CardDisplayOptions;
  }) => {
    const style = {
      animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2) + index * ANIMATION.STAGGER_DELAY}ms`,
    };

    return (
      <div className="animate-scale-in" style={style}>
        <IssueCard
          issue={issue}
          onClick={onClick}
          selectionMode={selectionMode}
          isSelected={isSelected}
          isFocused={isFocused}
          onToggleSelect={onToggleSelect}
          canEdit={canEdit}
          status={issue.status}
          displayOptions={displayOptions}
        />
      </div>
    );
  },
);
KanbanIssueItem.displayName = "KanbanIssueItem";

/**
 * Collapsed column view - shows vertical name and count badge
 */
const CollapsedColumn = memo(
  ({
    columnRef,
    state,
    columnIndex,
    isDraggedOver,
    stateIssues,
    isOverWipLimit,
    isAtWipLimit,
    onToggleCollapse,
  }: {
    columnRef: React.RefObject<HTMLElement | null>;
    state: WorkflowState;
    columnIndex: number;
    isDraggedOver: boolean;
    stateIssues: Issue[];
    isOverWipLimit: boolean;
    isAtWipLimit: boolean;
    onToggleCollapse: () => void;
  }) => (
    <section
      ref={columnRef}
      aria-label={`${state.name} column (collapsed)`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className={cn(
        "flex flex-shrink-0 snap-start flex-col items-center rounded-container border border-ui-border-secondary/70 border-t-2 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft shadow-soft transition-default animate-slide-up w-11",
        getWorkflowCategoryColor(state.category),
        isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <Tooltip content={`Expand ${state.name}`}>
        <IconButton
          onClick={onToggleCollapse}
          className="mt-2"
          aria-label={`Expand ${state.name} column`}
        >
          <Maximize2 className="w-4 h-4" />
        </IconButton>
      </Tooltip>
      <div
        className="flex-1 flex items-center justify-center py-4"
        style={{ writingMode: "vertical-lr" }}
      >
        <Typography
          variant="h3"
          className="font-medium text-ui-text-secondary tracking-tight text-sm transform rotate-180"
        >
          {state.name}
        </Typography>
      </div>
      <Badge
        variant={isOverWipLimit ? "error" : isAtWipLimit ? "warning" : "neutral"}
        shape="pill"
        className="mb-3"
      >
        {stateIssues.length}
        {state.wipLimit ? `/${state.wipLimit}` : ""}
      </Badge>
    </section>
  ),
);
CollapsedColumn.displayName = "CollapsedColumn";

/**
 * Column header with name, count, and action buttons
 */
const ColumnHeader = memo(
  ({
    state,
    stateIssues,
    hiddenCount,
    totalCount,
    isOverWipLimit,
    isAtWipLimit,
    canEdit,
    columnIndex,
    onToggleCollapse,
    onCreateIssue,
  }: {
    state: WorkflowState;
    stateIssues: Issue[];
    hiddenCount: number;
    totalCount: number;
    isOverWipLimit: boolean;
    isAtWipLimit: boolean;
    canEdit: boolean;
    columnIndex: number;
    onToggleCollapse?: () => void;
    onCreateIssue?: () => void;
  }) => (
    <div
      data-testid={TEST_IDS.BOARD.COLUMN_HEADER}
      className="rounded-t-container border-b border-ui-border-secondary/70 bg-ui-bg-elevated/88 p-1.5 shadow-soft sm:p-4"
    >
      <Flex align="center" justify="between" gap="xs">
        <Flex align="center" gap="xs" className="min-w-0">
          <Typography
            variant="h3"
            className="truncate text-xs font-medium tracking-tight text-ui-text-secondary sm:text-sm"
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
        <Flex align="center" gap="xs" className="shrink-0">
          {onToggleCollapse && (
            <Tooltip content={`Collapse ${state.name}`}>
              <IconButton
                onClick={onToggleCollapse}
                aria-label={`Collapse ${state.name} column`}
                className="h-6 w-6 sm:h-8 sm:w-8"
              >
                <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && onCreateIssue && (
            <Tooltip content="Create issue">
              <IconButton
                onClick={onCreateIssue}
                aria-label={`Add issue to ${state.name}`}
                className="h-6 w-6 sm:h-8 sm:w-8"
                {...(columnIndex === 0 ? { "data-tour": "create-issue" } : {})}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </IconButton>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </div>
  ),
);
ColumnHeader.displayName = "ColumnHeader";

/**
 * Empty column state with icon and message
 */
const EmptyColumnState = memo(
  ({ canEdit, onCreateIssue }: { canEdit: boolean; onCreateIssue?: () => void }) => (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="flex-1 rounded-2xl border border-dashed border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-soft px-5 py-8 text-center shadow-card"
    >
      <div className="mb-4 inline-flex items-center rounded-full border border-ui-border/70 bg-ui-bg-soft px-3 py-1 text-xs font-medium uppercase tracking-wider text-ui-text-tertiary">
        Empty column
      </div>
      <Flex
        align="center"
        justify="center"
        className="mb-4 h-12 w-12 rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated shadow-soft"
      >
        <Plus className="h-5 w-5 text-ui-text-tertiary" />
      </Flex>
      <Typography variant="large" className="mb-1">
        No issues yet
      </Typography>
      <Typography variant="small" color="secondary" className="max-w-48">
        {canEdit && onCreateIssue
          ? "Drop issues here or use the add button to start this stage."
          : "This stage is clear right now."}
      </Typography>
      {canEdit && onCreateIssue ? (
        <Button variant="secondary" size="sm" onClick={onCreateIssue} className="mt-5">
          Add first issue
        </Button>
      ) : null}
    </Flex>
  ),
);
EmptyColumnState.displayName = "EmptyColumnState";

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

function getStateIssues(state: WorkflowState, issues: Issue[]): Issue[] {
  return state.category !== "done" ? issues : [...issues].sort((a, b) => a.order - b.order);
}

function getWipLimitState(wipLimit: number | undefined, issueCount: number) {
  const normalizedLimit = wipLimit ?? 0;
  const hasWipLimit = normalizedLimit > 0;

  return {
    isAtWipLimit: hasWipLimit && issueCount === normalizedLimit,
    isOverWipLimit: hasWipLimit && issueCount > normalizedLimit,
  };
}

function useKanbanColumnDropTarget({
  columnRef,
  stateId,
  onIssueDrop,
  setIsDraggedOver,
}: {
  columnRef: React.RefObject<HTMLElement | null>;
  stateId: string;
  onIssueDrop?: (issueId: Id<"issues">, sourceStatus: string, targetStatus: string) => void;
  setIsDraggedOver: (value: boolean) => void;
}) {
  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => createColumnData(stateId, stateId),
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
          onIssueDrop?.(data.issueId, data.status, stateId);
        }
      },
    });
  }, [columnRef, onIssueDrop, setIsDraggedOver, stateId]);
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
  onIssueReorder: _onIssueReorder,
  isCollapsed = false,
  onToggleCollapse,
  displayOptions,
}: KanbanColumnProps) {
  const columnRef = useRef<HTMLElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  // Issues are now pre-filtered by status from parent.
  // "done" columns are sorted by updatedAt, so we resort them if order-based rendering is needed.
  const stateIssues = getStateIssues(state, issues);
  const { isAtWipLimit, isOverWipLimit } = getWipLimitState(state.wipLimit, stateIssues.length);

  useKanbanColumnDropTarget({
    columnRef,
    stateId: state.id,
    onIssueDrop,
    setIsDraggedOver,
  });

  const handleCreateIssue = () => onCreateIssue?.(state.id);
  const createIssueHandler = onCreateIssue ? handleCreateIssue : undefined;
  const handleLoadMore = () => onLoadMore?.();
  const handleToggleCollapse = () => onToggleCollapse?.(state.id);
  const collapseHandler = onToggleCollapse ? handleToggleCollapse : undefined;
  const showEmptyState = stateIssues.length === 0 && hiddenCount === 0;

  // Render collapsed column view
  if (isCollapsed) {
    return (
      <CollapsedColumn
        columnRef={columnRef}
        state={state}
        columnIndex={columnIndex}
        isDraggedOver={isDraggedOver}
        stateIssues={stateIssues}
        isOverWipLimit={isOverWipLimit}
        isAtWipLimit={isAtWipLimit}
        onToggleCollapse={handleToggleCollapse}
      />
    );
  }

  return (
    <section
      ref={columnRef}
      aria-label={`${state.name} column`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className={cn(
        "w-44 flex-shrink-0 snap-start rounded-container border border-ui-border-secondary/70 border-t-2 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft shadow-soft transition-default animate-slide-up sm:w-72 lg:w-80",
        getWorkflowCategoryColor(state.category),
        isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
        isOverWipLimit && "border-status-error/50 bg-status-error/5",
        isAtWipLimit && !isOverWipLimit && "border-status-warning/50",
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <ColumnHeader
        state={state}
        stateIssues={stateIssues}
        hiddenCount={hiddenCount}
        totalCount={totalCount}
        isOverWipLimit={isOverWipLimit}
        isAtWipLimit={isAtWipLimit}
        canEdit={canEdit}
        columnIndex={columnIndex}
        onToggleCollapse={collapseHandler}
        onCreateIssue={createIssueHandler}
      />

      {/* Issues */}
      <div className="flex min-h-52 flex-col space-y-1 p-0.75 transition-default sm:min-h-56 sm:space-y-1.5 sm:p-2 lg:min-h-96 lg:space-y-2 lg:p-2.5">
        {showEmptyState ? (
          <EmptyColumnState canEdit={canEdit} onCreateIssue={createIssueHandler} />
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
                displayOptions={displayOptions}
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
