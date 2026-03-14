import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError } from "@/lib/toast";
import { act, renderHook } from "@/test/custom-render";
import { optimisticBoardUpdate } from "./boardOptimisticUpdates";
import { useBoardDragAndDrop } from "./useBoardDragAndDrop";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

vi.mock("./boardOptimisticUpdates", () => ({
  optimisticBoardUpdate: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockOptimisticBoardUpdate = vi.mocked(optimisticBoardUpdate);
const mockShowError = vi.mocked(showError);

const pushHistoryAction = vi.fn();
const updateIssueStatus = vi.fn();
const updateStatusByCategory = vi.fn();
const optimisticUpdateToken = vi.fn();

const boardOptions = {
  projectId: "project_1" as Id<"projects">,
  sprintId: "sprint_1" as Id<"sprints">,
  doneColumnDays: 14,
};

type MutationProcedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof updateIssueStatus | typeof updateStatusByCategory,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<MutationProcedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

function createIssue(id: string, title: string, status: string, order: number): EnrichedIssue {
  return {
    _id: id as Id<"issues">,
    _creationTime: 0,
    title,
    description: "",
    status,
    order,
    priority: "medium",
    type: "task",
    labels: [],
    assignee: null,
    reporter: null,
    epic: null,
    key: `${title.toUpperCase().replace(/\s+/g, "-")}-1`,
    reporterId: "user_1" as Id<"users">,
    assigneeId: undefined,
    teamId: "team_1" as Id<"teams">,
    organizationId: "org_1" as Id<"organizations">,
    workspaceId: "workspace_1" as Id<"workspaces">,
    projectId: boardOptions.projectId,
    sprintId: boardOptions.sprintId,
    updatedAt: 0,
    createdBy: "user_1" as Id<"users">,
    parentId: undefined,
    epicId: undefined,
    dueDate: undefined,
    storyPoints: undefined,
    completedAt: undefined,
    attachments: [],
    reactionSummary: undefined,
    commentsCount: undefined,
    watchers: undefined,
    watchersCount: undefined,
    linkedIssues: undefined,
    linkedDocuments: [],
    customFields: undefined,
  } as EnrichedIssue;
}

describe("useBoardDragAndDrop", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const updateIssueStatusMutation = createMutationMock(updateIssueStatus);
    const rawUpdateStatus = createMutationMock(updateIssueStatus);
    rawUpdateStatus.withOptimisticUpdate = vi.fn(() => updateIssueStatusMutation);
    const updateStatusByCategoryMutation = createMutationMock(updateStatusByCategory);

    mockOptimisticBoardUpdate.mockReturnValue(optimisticUpdateToken);

    let mutationIndex = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationIndex += 1;
      return mutationIndex % 2 === 1
        ? { mutate: rawUpdateStatus, canAct: true, isAuthLoading: false }
        : { mutate: updateStatusByCategoryMutation, canAct: true, isAuthLoading: false };
    });

    updateIssueStatus.mockResolvedValue(undefined);
    updateStatusByCategory.mockResolvedValue(undefined);
  });

  it("tracks drag state and updates column moves with history in project mode", async () => {
    const draggedIssue = createIssue("issue_1", "Refine backlog", "todo", 2);
    const doneIssue = createIssue("issue_2", "Ship billing", "done", 5);

    const { result } = renderHook(() =>
      useBoardDragAndDrop({
        allIssues: [draggedIssue, doneIssue],
        issuesByStatus: {
          todo: [draggedIssue],
          done: [doneIssue],
        },
        isTeamMode: false,
        pushHistoryAction,
        boardOptions,
      }),
    );

    expect(mockOptimisticBoardUpdate).toHaveBeenCalledWith(boardOptions, false);

    act(() => {
      result.current.handleDragStateChange(true);
    });
    expect(result.current.isDragging).toBe(true);

    await act(async () => {
      await result.current.handleIssueDrop(draggedIssue._id, "todo", "todo");
    });
    expect(updateIssueStatus).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleIssueDrop(draggedIssue._id, "todo", "done");
    });

    expect(updateIssueStatus).toHaveBeenCalledWith({
      issueId: draggedIssue._id,
      newStatus: "done",
      newOrder: 6,
    });
    expect(pushHistoryAction).toHaveBeenCalledWith({
      issueId: draggedIssue._id,
      oldStatus: "todo",
      newStatus: "done",
      oldOrder: 2,
      newOrder: 6,
      issueTitle: "Refine backlog",
      isTeamMode: false,
    });
    expect(updateStatusByCategory).not.toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("reorders issues through category updates in team mode without pushing history", async () => {
    const draggedIssue = createIssue("issue_1", "Refine backlog", "todo", 4);
    const targetIssue = createIssue("issue_2", "Ship billing", "done", 1);
    const laterIssue = createIssue("issue_3", "Close sprint", "done", 3);

    const { result } = renderHook(() =>
      useBoardDragAndDrop({
        allIssues: [draggedIssue, targetIssue, laterIssue],
        issuesByStatus: {
          todo: [draggedIssue],
          done: [targetIssue, laterIssue],
        },
        isTeamMode: true,
        pushHistoryAction,
        boardOptions,
      }),
    );

    await act(async () => {
      await result.current.handleIssueReorder(
        draggedIssue._id,
        "todo",
        targetIssue._id,
        "done",
        "bottom",
      );
    });

    expect(updateStatusByCategory).toHaveBeenCalledWith({
      issueId: draggedIssue._id,
      category: "done",
      newOrder: 2,
    });
    expect(updateIssueStatus).not.toHaveBeenCalled();
    expect(pushHistoryAction).not.toHaveBeenCalled();
  });

  it("surfaces reorder failures in project mode and does not push history", async () => {
    const draggedIssue = createIssue("issue_1", "Refine backlog", "todo", 4);
    const targetIssue = createIssue("issue_2", "Ship billing", "done", 1);
    const error = new Error("reorder failed");

    updateIssueStatus.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useBoardDragAndDrop({
        allIssues: [draggedIssue, targetIssue],
        issuesByStatus: {
          todo: [draggedIssue],
          done: [targetIssue],
        },
        isTeamMode: false,
        pushHistoryAction,
        boardOptions,
      }),
    );

    await act(async () => {
      await result.current.handleIssueReorder(
        draggedIssue._id,
        "todo",
        targetIssue._id,
        "done",
        "top",
      );
    });

    expect(updateIssueStatus).toHaveBeenCalledWith({
      issueId: draggedIssue._id,
      newStatus: "done",
      newOrder: 0,
    });
    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to reorder issue");
    expect(pushHistoryAction).not.toHaveBeenCalled();
  });
});
