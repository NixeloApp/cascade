import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { OptimisticLocalStore, OptimisticUpdate } from "convex/browser";
import type { FunctionArgs } from "convex/server";

function updateSingleIssue(
  localStore: OptimisticLocalStore,
  issueId: Id<"issues">,
  newStatus: string,
  newOrder: number,
  now: number,
) {
  const existingIssue = localStore.getQuery(api.issues.getIssue, { id: issueId });
  if (existingIssue) {
    localStore.setQuery(
      api.issues.getIssue,
      { id: issueId },
      { ...existingIssue, status: newStatus, order: newOrder, updatedAt: now },
    );
  }
}

function updateBoardList(
  localStore: OptimisticLocalStore,
  boardOptions: {
    projectId?: Id<"projects">;
    sprintId?: Id<"sprints">;
    doneColumnDays?: number;
  },
  issueId: Id<"issues">,
  newStatus: string,
  newOrder: number,
  now: number,
) {
  const queryArgs =
    boardOptions.projectId && boardOptions.sprintId
      ? {
          projectId: boardOptions.projectId,
          sprintId: boardOptions.sprintId,
          doneColumnDays: boardOptions.doneColumnDays || 14,
        }
      : "skip";

  if (queryArgs === "skip") return;

  const currentBoard = localStore.getQuery(api.issues.listByProjectSmart, queryArgs);
  if (!currentBoard) return;

  const newIssuesByStatus = { ...currentBoard.issuesByStatus };
  let issueToMove: EnrichedIssue | undefined;

  // Remove from old status
  for (const status in newIssuesByStatus) {
    const issues = newIssuesByStatus[status];
    const idx = issues.findIndex((i: EnrichedIssue) => i._id === issueId);
    if (idx !== -1) {
      issueToMove = {
        ...issues[idx],
        status: newStatus,
        order: newOrder,
        updatedAt: now,
      };
      newIssuesByStatus[status] = [...issues.slice(0, idx), ...issues.slice(idx + 1)];
      break;
    }
  }

  // Add to new status
  if (issueToMove) {
    const targetIssues = newIssuesByStatus[newStatus] || [];
    // Sort by order to insert correctly
    const updatedTargetIssues = [...targetIssues, issueToMove].sort((a, b) => a.order - b.order);
    newIssuesByStatus[newStatus] = updatedTargetIssues;

    localStore.setQuery(api.issues.listByProjectSmart, queryArgs, {
      ...currentBoard,
      issuesByStatus: newIssuesByStatus,
    });
  }
}

export const optimisticBoardUpdate =
  (
    boardOptions?: {
      projectId?: Id<"projects">;
      sprintId?: Id<"sprints">;
      doneColumnDays?: number;
    },
    isTeamMode = false,
  ): OptimisticUpdate<FunctionArgs<typeof api.issues.updateStatus>> =>
  (localStore, args) => {
    const { issueId, newStatus, newOrder } = args;
    const now = Date.now();

    updateSingleIssue(localStore, issueId, newStatus, newOrder, now);

    if (boardOptions && !isTeamMode) {
      updateBoardList(localStore, boardOptions, issueId, newStatus, newOrder, now);
    }
  };
