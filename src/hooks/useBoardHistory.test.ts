import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { DISPLAY_LIMITS } from "@/lib/constants";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { act, fireEvent, renderHook, waitFor } from "@/test/custom-render";
import type { BoardAction } from "./useBoardHistory";
import { useBoardHistory } from "./useBoardHistory";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showInfo: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowInfo = vi.mocked(showInfo);
const mockShowSuccess = vi.mocked(showSuccess);

const updateIssueStatus = vi.fn();

const FIRST_ORDER = 1;
const SECOND_ORDER = 2;
const THIRD_ORDER = 3;
const HISTORY_OVERFLOW_COUNT = DISPLAY_LIMITS.MAX_HISTORY_SIZE + 1;

type MutationProcedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof updateIssueStatus,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<MutationProcedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

function createAction(index: number, overrides: Partial<BoardAction> = {}): BoardAction {
  return {
    issueId: `issue_${index}` as Id<"issues">,
    oldStatus: "todo",
    newStatus: "done",
    oldOrder: index,
    newOrder: index + FIRST_ORDER,
    issueTitle: `Issue ${index}`,
    ...overrides,
  };
}

describe("useBoardHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(updateIssueStatus),
      canAct: true,
      isAuthLoading: false,
    });
    updateIssueStatus.mockResolvedValue(undefined);
  });

  it("caps history size and clears redo entries when a new action is pushed", async () => {
    const { result } = renderHook(() => useBoardHistory());

    act(() => {
      for (let actionIndex = FIRST_ORDER; actionIndex <= HISTORY_OVERFLOW_COUNT; actionIndex += 1) {
        result.current.pushAction(createAction(actionIndex));
      }
    });

    expect(result.current.historyStack).toHaveLength(DISPLAY_LIMITS.MAX_HISTORY_SIZE);
    expect(result.current.historyStack[0]?.issueTitle).toBe("Issue 2");
    expect(result.current.redoStack).toHaveLength(0);

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(result.current.historyStack).toHaveLength(DISPLAY_LIMITS.MAX_HISTORY_SIZE - FIRST_ORDER);
    expect(result.current.redoStack).toHaveLength(FIRST_ORDER);

    act(() => {
      result.current.pushAction(
        createAction(HISTORY_OVERFLOW_COUNT + FIRST_ORDER, { issueTitle: "Newest issue" }),
      );
    });

    expect(result.current.historyStack).toHaveLength(DISPLAY_LIMITS.MAX_HISTORY_SIZE);
    expect(
      result.current.historyStack[result.current.historyStack.length - FIRST_ORDER]?.issueTitle,
    ).toBe("Newest issue");
    expect(result.current.redoStack).toHaveLength(0);
  });

  it("undos directly and redoes through the keyboard shortcut", async () => {
    const action = createAction(FIRST_ORDER, {
      oldStatus: "backlog",
      newStatus: "inprogress",
      oldOrder: FIRST_ORDER,
      newOrder: THIRD_ORDER,
      issueTitle: "Triage incident",
    });

    const { result } = renderHook(() => useBoardHistory());

    act(() => {
      result.current.pushAction(action);
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(updateIssueStatus).toHaveBeenCalledWith({
      issueId: action.issueId,
      newStatus: "backlog",
      newOrder: FIRST_ORDER,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith('Undid move of "Triage incident"');
    expect(result.current.historyStack).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(FIRST_ORDER);

    act(() => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    });

    await waitFor(() => {
      expect(updateIssueStatus).toHaveBeenNthCalledWith(SECOND_ORDER, {
        issueId: action.issueId,
        newStatus: "inprogress",
        newOrder: THIRD_ORDER,
      });
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Redid move of "Triage incident"');
      expect(result.current.historyStack).toHaveLength(FIRST_ORDER);
      expect(result.current.redoStack).toHaveLength(0);
    });
  });

  it("shows informational toasts when undo or redo is unavailable", async () => {
    const { result } = renderHook(() => useBoardHistory());

    await act(async () => {
      await result.current.handleUndo();
      await result.current.handleRedo();
    });

    expect(mockShowInfo).toHaveBeenNthCalledWith(FIRST_ORDER, "Nothing to undo");
    expect(mockShowInfo).toHaveBeenNthCalledWith(SECOND_ORDER, "Nothing to redo");
    expect(updateIssueStatus).not.toHaveBeenCalled();
  });

  it("rejects team-mode undo and reports backend failures", async () => {
    const { result, rerender } = renderHook(() => useBoardHistory());

    act(() => {
      result.current.pushAction(
        createAction(FIRST_ORDER, { isTeamMode: true, issueTitle: "Team row" }),
      );
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(mockShowError).toHaveBeenCalledWith("team-mode", "Undo not supported in Team View yet");
    expect(updateIssueStatus).not.toHaveBeenCalled();

    const failure = new Error("history failed");
    updateIssueStatus.mockRejectedValueOnce(failure);

    rerender();

    act(() => {
      result.current.pushAction(
        createAction(SECOND_ORDER, { isTeamMode: false, issueTitle: "Bugfix" }),
      );
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(mockShowError).toHaveBeenCalledWith(failure, "Failed to undo");
  });
});
