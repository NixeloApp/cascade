import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useListNavigation } from "@/hooks/useListNavigation";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import type { IssueType } from "@/lib/issue-utils";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import {
  type CollapsedSwimlanes,
  getSwimlanConfigs,
  groupIssuesBySwimlane,
} from "@/lib/swimlane-utils";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { CreateIssueModal } from "./CreateIssueModal";
import type { BoardFilters } from "./FilterBar";
import { IssueDetailModal } from "./IssueDetailModal";
import { BoardToolbar } from "./Kanban/BoardToolbar";
import { KanbanColumn } from "./Kanban/KanbanColumn";
import { SwimlanRow } from "./Kanban/SwimlanRow";
import { SkeletonKanbanCard, SkeletonText } from "./ui/Skeleton";

interface KanbanBoardProps {
  projectId?: Id<"projects">;
  teamId?: Id<"teams">;
  sprintId?: Id<"sprints">;
  filters?: BoardFilters;
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

/** Apply client-side filters to issues */
function applyFilters(issues: EnrichedIssue[], filters?: BoardFilters): EnrichedIssue[] {
  if (!filters) return issues;

  return issues.filter(
    (issue) =>
      matchesTypeFilter(issue, filters.type) &&
      matchesPriorityFilter(issue, filters.priority) &&
      matchesAssigneeFilter(issue, filters.assigneeId) &&
      matchesLabelsFilter(issue, filters.labels),
  );
}

export function KanbanBoard({ projectId, teamId, sprintId, filters }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());
  const [swimlaneGroupBy, setSwimlanGroupBy] = useState<SwimlanGroupBy>("none");
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<CollapsedSwimlanes>(new Set());
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
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

  const project = useQuery(
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
  const filteredIssuesByStatus = useMemo(() => {
    const result: Record<string, EnrichedIssue[]> = {};
    for (const [status, issues] of Object.entries(issuesByStatus)) {
      result[status] = applyFilters(issues, filters);
    }
    return result;
  }, [issuesByStatus, filters]);

  const allIssues = useMemo(() => {
    return Object.values(filteredIssuesByStatus).flat();
  }, [filteredIssuesByStatus]);

  // Keyboard Navigation
  const { selectedIndex } = useListNavigation({
    items: allIssues,
    onSelect: (issue) => setSelectedIssue(issue._id),
  });
  const focusedIssueId = allIssues[selectedIndex]?._id;

  const boardOptions = useMemo(
    () => ({
      projectId,
      teamId,
      sprintId,
      doneColumnDays: 14,
    }),
    [projectId, teamId, sprintId],
  );

  const { handleIssueDrop, handleIssueReorder } = useBoardDragAndDrop({
    allIssues,
    issuesByStatus,
    isTeamMode,
    pushHistoryAction: pushAction,
    boardOptions,
  });

  // Handlers
  const handleCreateIssue = useCallback((_status: string) => {
    setShowCreateIssue(true);
  }, []);

  const handleToggleSelect = useCallback((issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (!prev) setSelectedIssueIds(new Set());
      return !prev;
    });
  }, []);

  const handleToggleSwimlanCollapse = useCallback((swimlanId: string) => {
    setCollapsedSwimlanes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(swimlanId)) {
        newSet.delete(swimlanId);
      } else {
        newSet.add(swimlanId);
      }
      return newSet;
    });
  }, []);

  const handleToggleColumnCollapse = useCallback((columnId: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  // Swimlane grouping
  const swimlaneIssues = useMemo(() => {
    return groupIssuesBySwimlane(filteredIssuesByStatus, swimlaneGroupBy);
  }, [filteredIssuesByStatus, swimlaneGroupBy]);

  const swimlaneConfigs = useMemo(() => {
    return getSwimlanConfigs(swimlaneGroupBy, allIssues);
  }, [swimlaneGroupBy, allIssues]);

  // Loading State
  const isLoading = isLoadingIssues || (isProjectMode && !project);

  if (isLoading) {
    return (
      <FlexItem flex="1" className="overflow-x-auto">
        <Flex align="center" justify="between">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </Flex>
        <Flex gap="md" className="overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <FlexItem
              key={i}
              shrink={false}
              className="w-72 sm:w-80 bg-ui-bg-soft rounded-container border border-ui-border"
            >
              <div className="border-b border-ui-border/50 bg-transparent rounded-t-container">
                <SkeletonText lines={1} className="w-24" />
              </div>
              <div className="min-h-96">
                <SkeletonKanbanCard />
                <SkeletonKanbanCard />
                <SkeletonKanbanCard />
              </div>
            </FlexItem>
          ))}
        </Flex>
      </FlexItem>
    );
  }

  // Determine Workflow States
  let workflowStates: WorkflowState[] = [];

  if (isProjectMode && project) {
    workflowStates = project.workflowStates.sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order,
    );
  } else if (isTeamMode && smartWorkflowStates) {
    workflowStates = smartWorkflowStates.map((s) => ({
      ...s,
      description: "",
      order: s.order,
    }));
  }

  const canEdit = isProjectMode ? project?.userRole !== "viewer" : true;

  return (
    <FlexItem flex="1" className="overflow-x-auto" data-tour="kanban-board">
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
      />

      {swimlaneGroupBy === "none" ? (
        /* Standard board view without swimlanes */
        <Flex
          ref={boardContainerRef}
          direction="column"
          className="lg:flex-row lg:overflow-x-auto -webkit-overflow-scrolling-touch"
        >
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
              />
            );
          })}
        </Flex>
      ) : (
        /* Swimlane view */
        <div ref={boardContainerRef} className="px-4 lg:px-6 pb-6">
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
        </div>
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
        <IssueDetailModal
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
