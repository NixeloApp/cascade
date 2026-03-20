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
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import type { CardDisplayOptions } from "@/lib/card-display-utils";
import { ANIMATION } from "@/lib/constants";
import type { UserSummary } from "@/lib/entitySummaries";
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
  assignee?: UserSummary | null;
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
 * Wrapper component for IssueCard with animation delay.
 */
function KanbanIssueItem({
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
}) {
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
}

/**
 * Collapsed column view - shows vertical name and count badge
 */
function CollapsedColumn({
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
}) {
  return (
    <section
      ref={columnRef}
      aria-label={`${state.name} column (collapsed)`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className="w-11 shrink-0 snap-start animate-slide-up"
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <Card
        recipe="kanbanColumnCollapsedShell"
        className={cn(
          getWorkflowCategoryColor(state.category),
          isDraggedOver && "bg-brand/5 ring-2 ring-brand/30",
        )}
      >
        <Flex direction="column" align="center" gap="sm" className="h-full">
          <Tooltip content={`Expand ${state.name}`}>
            <IconButton
              onClick={onToggleCollapse}
              size="xs"
              aria-label={`Expand ${state.name} column`}
            >
              <Maximize2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Flex flex="1" align="center" justify="center" style={{ writingMode: "vertical-lr" }}>
            <Typography
              variant="h3"
              className="text-sm font-medium tracking-tight text-ui-text-secondary"
              style={{ transform: "rotate(180deg)" }}
            >
              {state.name}
            </Typography>
          </Flex>
          <Badge
            variant={isOverWipLimit ? "error" : isAtWipLimit ? "warning" : "neutral"}
            shape="pill"
          >
            {stateIssues.length}
            {state.wipLimit ? `/${state.wipLimit}` : ""}
          </Badge>
        </Flex>
      </Card>
    </section>
  );
}

/**
 * Column header with name, count, and action buttons
 */
function ColumnHeader({
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
}) {
  return (
    <div
      data-testid={TEST_IDS.BOARD.COLUMN_HEADER}
      className={getCardRecipeClassName("kanbanColumnHeader")}
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
                size="xs"
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
                size="xs"
                {...(columnIndex === 0 ? { "data-tour": "create-issue" } : {})}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </IconButton>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </div>
  );
}

/**
 * Empty column state with icon and message
 */
function EmptyColumnState({
  canEdit,
  onCreateIssue,
}: {
  canEdit: boolean;
  onCreateIssue?: () => void;
}) {
  return (
    <EmptyState
      icon={Plus}
      title="No issues yet"
      description={
        canEdit && onCreateIssue
          ? "Drop issues here or use the add button to start this stage."
          : "This stage is clear right now."
      }
      action={
        canEdit && onCreateIssue ? { label: "Add first issue", onClick: onCreateIssue } : undefined
      }
    />
  );
}

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
      className="w-72 shrink-0 snap-start animate-slide-up lg:w-80"
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <Card
        recipe="kanbanColumnShell"
        className={cn(
          "h-full",
          getWorkflowCategoryColor(state.category),
          isDraggedOver && "bg-brand/5 ring-2 ring-brand/30",
          isOverWipLimit && "border-status-error/50 bg-status-error/5",
          isAtWipLimit && !isOverWipLimit && "border-status-warning/50",
        )}
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

        <div className={getCardRecipeClassName("kanbanColumnBody")}>
          {showEmptyState ? (
            <Flex flex="1">
              <EmptyColumnState canEdit={canEdit} onCreateIssue={createIssueHandler} />
            </Flex>
          ) : (
            <Stack gap="sm">
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

              {onLoadMore && hiddenCount > 0 && (
                <LoadMoreButton
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                  remainingCount={hiddenCount}
                  className="w-full"
                />
              )}

              {hiddenCount > 0 && (
                <PaginationInfo loaded={stateIssues.length} total={totalCount} itemName="issues" />
              )}
            </Stack>
          )}
        </div>
      </Card>
    </section>
  );
};

export const KanbanColumn = memo(KanbanColumnComponent, arePropsEqual);
