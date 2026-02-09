import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useListNavigation } from "@/hooks/useListNavigation";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import type { IssueType } from "@/lib/issue-utils";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { CreateIssueModal } from "./CreateIssueModal";
import type { BoardFilters } from "./FilterBar";
import { IssueDetailModal } from "./IssueDetailModal";
import { BoardToolbar } from "./Kanban/BoardToolbar";
import { KanbanColumn } from "./Kanban/KanbanColumn";
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

  const isTeamMode = !!teamId;
  const isProjectMode = !!projectId;

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

  const { handleDragStart, handleDragOver, handleDrop } = useBoardDragAndDrop({
    allIssues,
    issuesByStatus,
    isTeamMode,
    pushHistoryAction: pushAction,
    boardOptions: { projectId, teamId, sprintId, doneColumnDays: 14 },
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

  // Loading State
  const isLoading = isLoadingIssues || (isProjectMode && !project);

  if (isLoading) {
    return (
      <FlexItem flex="1" className="overflow-x-auto">
        <Flex align="center" justify="between" className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </Flex>
        <Flex className="space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <FlexItem
              key={i}
              shrink={false}
              className="w-72 sm:w-80 bg-ui-bg-soft rounded-container border border-ui-border"
            >
              <div className="p-3 sm:p-4 border-b border-ui-border/50 bg-transparent rounded-t-container">
                <SkeletonText lines={1} className="w-24" />
              </div>
              <div className="p-2 space-y-2 min-h-96">
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
      />

      <Flex
        direction="column"
        className="lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 px-4 lg:px-6 pb-6 lg:overflow-x-auto -webkit-overflow-scrolling-touch"
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
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onCreateIssue={isTeamMode || !canEdit ? undefined : handleCreateIssue}
              onIssueClick={setSelectedIssue}
              onToggleSelect={handleToggleSelect}
              hiddenCount={counts.hidden}
              totalCount={counts.total}
              onLoadMore={loadMoreDone}
              isLoadingMore={isLoadingMore}
            />
          );
        })}
      </Flex>

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
