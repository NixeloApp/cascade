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
import { areIssuesEqual, IssueCard } from "../IssueCard";
import { Badge } from "../ui/Badge";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { PaginationInfo } from "../ui/PaginationInfo";

// ============================================================================
// Types
// ============================================================================

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
  hiddenCount?: number;
  totalCount?: number;
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
  isCollapsed?: boolean;
  onToggleCollapse?: (stateId: string) => void;
}

interface WipStatus {
  isAtLimit: boolean;
  isOverLimit: boolean;
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Wrapper component for IssueCard with memoized animation style
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
          onClick={onClick}
          selectionMode={selectionMode}
          isSelected={isSelected}
          isFocused={isFocused}
          onToggleSelect={onToggleSelect}
          canEdit={canEdit}
          status={issue.status}
        />
      </div>
    );
  },
  (prev, next) => {
    // Check primitive props and callbacks
    if (
      prev.index !== next.index ||
      prev.columnIndex !== next.columnIndex ||
      prev.isSelected !== next.isSelected ||
      prev.isFocused !== next.isFocused ||
      prev.selectionMode !== next.selectionMode ||
      prev.canEdit !== next.canEdit ||
      prev.onClick !== next.onClick ||
      prev.onToggleSelect !== next.onToggleSelect
    ) {
      return false;
    }

    // Check issue content equality using custom comparator
    return areIssuesEqual(prev.issue, next.issue);
  },
);
KanbanIssueItem.displayName = "KanbanIssueItem";

/**
 * Collapsed column view - vertical orientation with minimal width
 */
function CollapsedColumn({
  columnRef,
  state,
  columnIndex,
  issueCount,
  wipStatus,
  isDraggedOver,
  onToggleCollapse,
}: {
  columnRef: React.RefObject<HTMLElement | null>;
  state: WorkflowState;
  columnIndex: number;
  issueCount: number;
  wipStatus: WipStatus;
  isDraggedOver: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <Flex
      as="section"
      direction="column"
      align="center"
      ref={columnRef as React.RefObject<HTMLDivElement>}
      aria-label={`${state.name} column (collapsed)`}
      data-testid={TEST_IDS.BOARD.COLUMN}
      data-board-column
      className={cn(
        "flex-shrink-0 w-11 bg-ui-bg-soft rounded-container animate-slide-up border border-ui-border border-t-2 transition-default",
        getWorkflowCategoryColor(state.category),
        isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <Tooltip content={`Expand ${state.name}`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover rounded-secondary transition-fast mt-2"
          aria-label={`Expand ${state.name} column`}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </Tooltip>

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

      <Badge
        variant={wipStatus.isOverLimit ? "error" : wipStatus.isAtLimit ? "warning" : "neutral"}
        shape="pill"
        className="mb-3"
      >
        {issueCount}
        {state.wipLimit ? `/${state.wipLimit}` : ""}
      </Badge>
    </Flex>
  );
}

/**
 * Column header with title, count badge, and action buttons
 */
function ColumnHeader({
  state,
  issueCount,
  hiddenCount,
  totalCount,
  wipStatus,
  canEdit,
  columnIndex,
  onToggleCollapse,
  onCreateIssue,
}: {
  state: WorkflowState;
  issueCount: number;
  hiddenCount: number;
  totalCount: number;
  wipStatus: WipStatus;
  canEdit: boolean;
  columnIndex: number;
  onToggleCollapse?: () => void;
  onCreateIssue?: () => void;
}) {
  return (
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
            variant={wipStatus.isOverLimit ? "error" : wipStatus.isAtLimit ? "warning" : "neutral"}
            shape="pill"
            className="shrink-0"
          >
            {hiddenCount > 0 ? `${issueCount}/${totalCount}` : issueCount}
            {state.wipLimit ? `/${state.wipLimit}` : ""}
          </Badge>
          {wipStatus.isOverLimit && (
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
                onClick={onToggleCollapse}
                className="text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover p-2 shrink-0 rounded-secondary transition-fast"
                aria-label={`Collapse ${state.name} column`}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          {canEdit && onCreateIssue && (
            <Tooltip content="Create issue">
              <button
                type="button"
                onClick={onCreateIssue}
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
  );
}

/**
 * Empty state when column has no issues
 */
function EmptyColumnState({
  canEdit,
  hasCreateHandler,
}: {
  canEdit: boolean;
  hasCreateHandler: boolean;
}) {
  return (
    <Flex direction="column" align="center" justify="center" className="py-12 px-4 text-center">
      <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-ui-bg-hover mb-3">
        <Plus className="w-5 h-5 text-ui-text-tertiary" />
      </Flex>
      <Typography variant="small" className="text-ui-text-tertiary mb-1">
        No issues yet
      </Typography>
      {canEdit && hasCreateHandler && (
        <Typography variant="small" className="text-ui-text-tertiary">
          Drop issues here or click + to add
        </Typography>
      )}
    </Flex>
  );
}

// ============================================================================
// Equality Checks for Memoization
// ============================================================================

function areSelectedIssuesEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  if (prev.selectedIssueIds === next.selectedIssueIds) return true;
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

function areIssuesListEqual(
  prevIssues: KanbanColumnProps["issues"],
  nextIssues: KanbanColumnProps["issues"],
) {
  if (prevIssues === nextIssues) return true;
  if (prevIssues.length !== nextIssues.length) return false;

  for (let i = 0; i < prevIssues.length; i++) {
    if (
      !areIssuesEqual(
        prevIssues[i] as Parameters<typeof areIssuesEqual>[0],
        nextIssues[i] as Parameters<typeof areIssuesEqual>[1],
      )
    ) {
      return false;
    }
  }
  return true;
}

export function arePropsEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  const prevKeys = Object.keys(prev) as (keyof KanbanColumnProps)[];
  const nextKeys = Object.keys(next) as (keyof KanbanColumnProps)[];

  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    if (key === "selectedIssueIds" || key === "focusedIssueId") continue;

    if (key === "issues") {
      if (!areIssuesListEqual(prev.issues, next.issues)) return false;
      continue;
    }

    if (prev[key] !== next[key]) return false;
  }

  return areFocusedIssuesEqual(prev, next) && areSelectedIssuesEqual(prev, next);
}

// ============================================================================
// Main Component
// ============================================================================

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
  hiddenCount = 0,
  totalCount = 0,
  onLoadMore,
  isLoadingMore = false,
  onIssueDrop,
  onIssueReorder: _onIssueReorder,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const columnRef = useRef<HTMLElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const stateIssues = useMemo(() => {
    // Optimization: Skip sorting for todo/inprogress columns as they are pre-sorted by the server
    if (state.category === "todo" || state.category === "inprogress") {
      return issues;
    }
    return [...issues].sort((a, b) => a.order - b.order);
  }, [issues, state.category]);

  const wipLimit = state.wipLimit ?? 0;
  const wipStatus: WipStatus = {
    isAtLimit: wipLimit > 0 && stateIssues.length === wipLimit,
    isOverLimit: wipLimit > 0 && stateIssues.length > wipLimit,
  };

  // Set up Pragmatic DnD drop target
  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => createColumnData(state.id, state.id),
      canDrop: ({ source }) => isIssueCardData(source.data as Record<string, unknown>),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        if (isIssueCardData(source.data as Record<string, unknown>)) {
          const data = source.data as IssueCardData;
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

  if (isCollapsed) {
    return (
      <CollapsedColumn
        columnRef={columnRef}
        state={state}
        columnIndex={columnIndex}
        issueCount={stateIssues.length}
        wipStatus={wipStatus}
        isDraggedOver={isDraggedOver}
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
        "flex-shrink-0 w-full lg:w-80 bg-ui-bg-soft rounded-container animate-slide-up border border-ui-border border-t-2 transition-default",
        getWorkflowCategoryColor(state.category),
        isDraggedOver && "ring-2 ring-brand/30 bg-brand/5",
        wipStatus.isOverLimit && "border-status-error/50 bg-status-error/5",
        wipStatus.isAtLimit && !wipStatus.isOverLimit && "border-status-warning/50",
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
    >
      <ColumnHeader
        state={state}
        issueCount={stateIssues.length}
        hiddenCount={hiddenCount}
        totalCount={totalCount}
        wipStatus={wipStatus}
        canEdit={canEdit}
        columnIndex={columnIndex}
        onToggleCollapse={onToggleCollapse ? handleToggleCollapse : undefined}
        onCreateIssue={onCreateIssue ? handleCreateIssue : undefined}
      />

      <div className="p-2 space-y-2 min-h-96 transition-default">
        {stateIssues.length === 0 && hiddenCount === 0 ? (
          <EmptyColumnState canEdit={canEdit} hasCreateHandler={!!onCreateIssue} />
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
