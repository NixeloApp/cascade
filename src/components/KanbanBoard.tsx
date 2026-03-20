/**
 * Kanban Board
 *
 * Main Kanban board component with workflow columns and drag-and-drop.
 * Supports swimlanes, issue grouping, keyboard navigation, and filtering.
 * Integrates with board history for undo/redo functionality.
 */

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { useEffect, useRef, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useListNavigation } from "@/hooks/useListNavigation";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import { matchesBoardQuery, parseBoardQuery } from "@/lib/board-query-language";
import { type CardDisplayOptions, DEFAULT_CARD_DISPLAY } from "@/lib/card-display-utils";
import type { IssueType } from "@/lib/issue-utils";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import {
  type CollapsedSwimlanes,
  getSwimlanConfigs,
  groupIssuesBySwimlane,
} from "@/lib/swimlane-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { BulkOperationsBar } from "./BulkOperationsBar";
import type { BoardFilters, DateRangeFilter } from "./FilterBar";
import { CreateIssueModal } from "./IssueDetail";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { BoardToolbar } from "./Kanban/BoardToolbar";
import { KanbanColumn } from "./Kanban/KanbanColumn";
import { SwimlanRow } from "./Kanban/SwimlanRow";
import { Card, getCardRecipeClassName } from "./ui/Card";
import { SkeletonKanbanCard, SkeletonText } from "./ui/Skeleton";

interface KanbanBoardProps {
  projectId?: Id<"projects">;
  teamId?: Id<"teams">;
  sprintId?: Id<"sprints">;
  filters?: BoardFilters;
  mobileActions?: React.ReactNode;
}

/** Check if issue matches type filter */
function matchesTypeFilter(issue: EnrichedIssue, types?: BoardFilters["type"]): boolean {
  if (!types?.length) return true;
  return types.includes(issue.type as Exclude<IssueType, "subtask">);
}

/** Check if issue matches priority filter */
function matchesPriorityFilter(
  issue: EnrichedIssue,
  priorities?: BoardFilters["priority"],
): boolean {
  if (!priorities?.length) return true;
  return priorities.includes(issue.priority);
}

/** Check if issue matches assignee filter */
function matchesAssigneeFilter(
  issue: EnrichedIssue,
  assigneeIds?: BoardFilters["assigneeId"],
): boolean {
  if (!assigneeIds?.length) return true;
  return !!issue.assigneeId && assigneeIds.includes(issue.assigneeId);
}

/** Check if issue matches labels filter (issue must have at least one of the selected labels) */
function matchesLabelsFilter(issue: EnrichedIssue, labelNames?: BoardFilters["labels"]): boolean {
  if (!labelNames?.length) return true;
  return issue.labels?.some((label) => labelNames.includes(label.name)) ?? false;
}

/** Convert ISO date string to start-of-day timestamp */
function dateStringToTimestamp(dateStr: string, endOfDay = false): number {
  // Parse date parts manually to avoid timezone issues with new Date("YYYY-MM-DD")
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.getTime();
}

interface DateRangeBounds {
  from?: number;
  to?: number;
}

function normalizeDateRangeBounds(range?: DateRangeFilter): DateRangeBounds | undefined {
  if (!range?.from && !range?.to) return undefined;
  return {
    from: range.from ? dateStringToTimestamp(range.from) : undefined,
    to: range.to ? dateStringToTimestamp(range.to, true) : undefined,
  };
}

/** Check if a timestamp falls within a date range */
function matchesDateRange(timestamp: number | undefined, range?: DateRangeBounds): boolean {
  if (!range?.from && !range?.to) return true;
  if (timestamp === undefined) return false;

  if (range.from !== undefined && timestamp < range.from) {
    return false;
  }

  if (range.to !== undefined && timestamp > range.to) {
    return false;
  }

  return true;
}

/** Apply client-side filters to issues */
function applyFilters(
  issues: EnrichedIssue[],
  filters: BoardFilters | undefined,
  parsedQuery: ReturnType<typeof parseBoardQuery>,
  dateRanges: {
    dueDate?: DateRangeBounds;
    startDate?: DateRangeBounds;
    createdAt?: DateRangeBounds;
  },
): EnrichedIssue[] {
  if (!filters) return issues;

  return issues.filter(
    (issue) =>
      matchesBoardQuery(issue, parsedQuery) &&
      matchesTypeFilter(issue, filters.type) &&
      matchesPriorityFilter(issue, filters.priority) &&
      matchesAssigneeFilter(issue, filters.assigneeId) &&
      matchesLabelsFilter(issue, filters.labels) &&
      matchesDateRange(issue.dueDate, dateRanges.dueDate) &&
      matchesDateRange(issue.startDate, dateRanges.startDate) &&
      matchesDateRange(issue._creationTime, dateRanges.createdAt),
  );
}

/** Toggle an item in a Set, returning new Set */
function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}

/** Build swimlane configuration from issues */
function buildSwimlaneMeta(allIssues: EnrichedIssue[], swimlaneGroupBy: SwimlanGroupBy) {
  const assigneesMap = new Map<Id<"users">, { name?: string; image?: string }>();
  const labelsMap = new Map<string, { name: string; color: string }>();

  for (const issue of allIssues) {
    if (issue.assignee) {
      assigneesMap.set(issue.assignee._id, {
        name: issue.assignee.name,
        image: issue.assignee.image,
      });
    }
    for (const label of issue.labels) {
      if (!labelsMap.has(label.name)) {
        labelsMap.set(label.name, { name: label.name, color: label.color });
      }
    }
  }

  return getSwimlanConfigs(
    swimlaneGroupBy,
    allIssues,
    assigneesMap,
    Array.from(labelsMap.values()),
  );
}

/** Resolve workflow states from project or smart data */
function resolveWorkflowStates(
  isProjectMode: boolean,
  project: { workflowStates: WorkflowState[] } | null | undefined,
  isTeamMode: boolean,
  smartWorkflowStates:
    | Array<{ id: string; name: string; category: "todo" | "inprogress" | "done"; order: number }>
    | undefined,
): WorkflowState[] {
  if (isProjectMode && project) {
    return [...project.workflowStates].sort((a, b) => a.order - b.order);
  }
  if (isTeamMode && smartWorkflowStates) {
    return smartWorkflowStates.map((s) => ({ ...s, description: "" }));
  }
  return [];
}

/** Drag-and-drop Kanban board with swimlanes, filters, and bulk selection. */
export function KanbanBoard({
  projectId,
  teamId,
  sprintId,
  filters,
  mobileActions,
}: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());
  const [swimlaneGroupBy, setSwimlanGroupBy] = useState<SwimlanGroupBy>("none");
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<CollapsedSwimlanes>(new Set());
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(DEFAULT_CARD_DISPLAY);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const isTeamMode = !!teamId;
  const isProjectMode = !!projectId;

  // Set up auto-scroll for the board container during drag
  useEffect(() => {
    const element = boardContainerRef.current;
    if (!element) return;

    return autoScrollForElements({
      element,
      // Scroll faster when dragging near edges
      getConfiguration: () => ({
        maxScrollSpeed: "fast",
      }),
    });
  }, []);

  const project = useAuthenticatedQuery(
    api.projects.getProject,
    isProjectMode && projectId ? { id: projectId } : "skip",
  );

  // Custom Hooks
  const {
    issuesByStatus,
    statusCounts,
    isLoading: isLoadingIssues,
    loadMoreDone,
    isLoadingMore,
    workflowStates: smartWorkflowStates,
  } = useSmartBoardData({ projectId, teamId, sprintId });

  const { historyStack, redoStack, handleUndo, handleRedo, pushAction } = useBoardHistory();

  // Apply filters to issues
  const parsedQuery = parseBoardQuery(filters?.query);
  const dateRanges = {
    dueDate: normalizeDateRangeBounds(filters?.dueDate),
    startDate: normalizeDateRangeBounds(filters?.startDate),
    createdAt: normalizeDateRangeBounds(filters?.createdAt),
  };
  const filteredIssuesByStatus: Record<string, EnrichedIssue[]> = {};
  for (const [status, issues] of Object.entries(issuesByStatus)) {
    filteredIssuesByStatus[status] = applyFilters(issues, filters, parsedQuery, dateRanges);
  }

  const allIssues = Object.values(filteredIssuesByStatus).flat();

  // Keyboard Navigation
  const { selectedIndex } = useListNavigation({
    items: allIssues,
    onSelect: (issue) => setSelectedIssue(issue._id),
  });
  const focusedIssueId = allIssues[selectedIndex]?._id;

  const boardOptions = {
    projectId,
    teamId,
    sprintId,
    doneColumnDays: 14,
  };

  const { handleIssueDrop, handleIssueReorder } = useBoardDragAndDrop({
    allIssues,
    issuesByStatus,
    isTeamMode,
    pushHistoryAction: pushAction,
    boardOptions,
  });

  // Handlers
  const handleCreateIssue = () => {
    setShowCreateIssue(true);
  };

  const handleToggleSelect = (issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => toggleSetItem(prev, issueId));
  };

  const handleClearSelection = () => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (!prev) setSelectedIssueIds(new Set());
      return !prev;
    });
  };

  const handleToggleSwimlanCollapse = (swimlanId: string) => {
    setCollapsedSwimlanes((prev) => toggleSetItem(prev, swimlanId));
  };

  const handleToggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns((prev) => toggleSetItem(prev, columnId));
  };

  // Swimlane grouping
  const swimlaneIssues = groupIssuesBySwimlane(filteredIssuesByStatus, swimlaneGroupBy);
  const swimlaneConfigs = buildSwimlaneMeta(allIssues, swimlaneGroupBy);
  const workflowStates = resolveWorkflowStates(
    isProjectMode,
    project,
    isTeamMode,
    smartWorkflowStates,
  );

  // Loading State
  const isLoading = isLoadingIssues || (isProjectMode && !project);

  if (isLoading) {
    return (
      <FlexItem flex="1" className="overflow-x-auto">
        <Flex align="center" justify="between">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </Flex>
        <Card variant="ghost" recipe="kanbanBoardRail" ref={boardContainerRef}>
          <Flex gap="sm" align="start">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={getCardRecipeClassName("kanbanLoadingColumn")}>
                <div className={cn(getCardRecipeClassName("kanbanLoadingColumnHeader"), "p-3")}>
                  <SkeletonText lines={1} className="w-24" />
                </div>
                <div className="min-h-96">
                  <SkeletonKanbanCard />
                  <SkeletonKanbanCard />
                  <SkeletonKanbanCard />
                </div>
              </div>
            ))}
          </Flex>
        </Card>
      </FlexItem>
    );
  }

  const canEdit = isProjectMode ? project?.userRole !== "viewer" : true;

  return (
    <FlexItem flex="1" className="relative overflow-x-auto" data-testid={TEST_IDS.BOARD.ROOT}>
      <BoardToolbar
        sprintId={sprintId}
        selectionMode={selectionMode}
        historyStack={historyStack}
        redoStack={redoStack}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleSelectionMode={handleToggleSelectionMode}
        showControls={!isTeamMode}
        swimlaneGroupBy={swimlaneGroupBy}
        onSwimlanGroupByChange={isTeamMode ? undefined : setSwimlanGroupBy}
        displayOptions={displayOptions}
        onDisplayOptionsChange={setDisplayOptions}
        mobileActions={mobileActions}
      />

      {swimlaneGroupBy === "none" ? (
        /* Standard board view without swimlanes */
        <Card ref={boardContainerRef} variant="ghost" recipe="kanbanBoardRail">
          <Flex align="start" gap="sm">
            {workflowStates.map((state, columnIndex: number) => {
              const counts = statusCounts[state.id] || {
                total: 0,
                loaded: 0,
                hidden: 0,
              };
              return (
                <KanbanColumn
                  key={state.id}
                  state={state}
                  issues={filteredIssuesByStatus[state.id] || []}
                  columnIndex={columnIndex}
                  selectionMode={selectionMode}
                  selectedIssueIds={selectedIssueIds}
                  focusedIssueId={focusedIssueId}
                  canEdit={canEdit}
                  onCreateIssue={isTeamMode || !canEdit ? undefined : handleCreateIssue}
                  onIssueClick={setSelectedIssue}
                  onToggleSelect={handleToggleSelect}
                  hiddenCount={counts.hidden}
                  totalCount={counts.total}
                  onLoadMore={loadMoreDone}
                  isLoadingMore={isLoadingMore}
                  onIssueDrop={handleIssueDrop}
                  onIssueReorder={handleIssueReorder}
                  isCollapsed={collapsedColumns.has(state.id)}
                  onToggleCollapse={handleToggleColumnCollapse}
                  displayOptions={displayOptions}
                />
              );
            })}
          </Flex>
        </Card>
      ) : (
        /* Swimlane view */
        <Card ref={boardContainerRef} variant="ghost" recipe="kanbanSwimlaneWrapper">
          {swimlaneConfigs.map((config) => (
            <SwimlanRow
              key={config.id}
              config={config}
              issuesByStatus={swimlaneIssues[config.id] || {}}
              workflowStates={workflowStates}
              isCollapsed={collapsedSwimlanes.has(config.id)}
              onToggleCollapse={handleToggleSwimlanCollapse}
              selectionMode={selectionMode}
              selectedIssueIds={selectedIssueIds}
              focusedIssueId={focusedIssueId}
              canEdit={canEdit}
              onCreateIssue={isTeamMode || !canEdit ? undefined : handleCreateIssue}
              onIssueClick={setSelectedIssue}
              onToggleSelect={handleToggleSelect}
              statusCounts={statusCounts}
              onLoadMore={loadMoreDone}
              isLoadingMore={isLoadingMore}
              onIssueDrop={handleIssueDrop}
              onIssueReorder={handleIssueReorder}
            />
          ))}
        </Card>
      )}

      {isProjectMode && (
        <CreateIssueModal
          projectId={projectId}
          sprintId={sprintId}
          open={showCreateIssue}
          onOpenChange={setShowCreateIssue}
        />
      )}

      {selectedIssue && (
        <IssueDetailViewer
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIssue(null);
            }
          }}
          canEdit={canEdit}
        />
      )}

      {selectionMode && isProjectMode && projectId && (
        <BulkOperationsBar
          projectId={projectId}
          selectedIssueIds={selectedIssueIds}
          onClearSelection={handleClearSelection}
          workflowStates={workflowStates}
        />
      )}
    </FlexItem>
  );
}
