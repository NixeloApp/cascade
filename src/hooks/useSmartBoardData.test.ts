import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { act, renderHook, waitFor } from "@/test/custom-render";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";
import type { SmartBoardData } from "./useSmartBoardData";
import { mergeIssuesByStatus, useSmartBoardData } from "./useSmartBoardData";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

function createIssue(id: string, status: string, updatedAt: number): EnrichedIssue {
  return {
    _id: id as Id<"issues">,
    _creationTime: 0,
    title: `${status}-${id}`,
    description: "",
    status,
    order: 0,
    priority: "medium",
    type: "task",
    labels: [],
    assignee: null,
    reporter: null,
    epic: null,
    key: `ISSUE-${id}`,
    reporterId: "user_1" as Id<"users">,
    assigneeId: undefined,
    teamId: "team_1" as Id<"teams">,
    organizationId: "org_1" as Id<"organizations">,
    workspaceId: "workspace_1" as Id<"workspaces">,
    projectId: "project_1" as Id<"projects">,
    sprintId: "sprint_1" as Id<"sprints">,
    updatedAt,
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

const recentTodo = createIssue("issue_todo", "todo", 300);
const recentDone = createIssue("issue_done_recent", "done", 200);
const olderDone = createIssue("issue_done_older", "done", 100);
const replacementDone = createIssue("issue_done_new_project", "done", 250);

interface SmartDataFixture {
  issuesByStatus: Record<string, EnrichedIssue[]>;
  workflowStates: {
    id: string;
    name: string;
    category: "todo" | "inprogress" | "done";
    order: number;
  }[];
}

interface CountsFixture {
  byStatus: {
    total: Record<string, number>;
    visible: Record<string, number>;
    hidden: Record<string, number>;
  };
}

interface ProjectBoardProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

describe("useSmartBoardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges additional issues by status and deduplicates ids", () => {
    const merged = mergeIssuesByStatus(
      {
        todo: [recentTodo],
        done: [recentDone],
      },
      [recentDone, olderDone],
    );

    expect(merged.todo).toEqual([recentTodo]);
    expect(merged.done).toEqual([recentDone, olderDone]);
  });

  it("loads project-mode board data, paginates older done issues, and resets when the board key changes", async () => {
    let smartData: SmartDataFixture = {
      issuesByStatus: {
        todo: [recentTodo],
        done: [recentDone],
      },
      workflowStates: [
        { id: "todo", name: "Todo", category: "todo" as const, order: 0 },
        { id: "done", name: "Done", category: "done" as const, order: 1 },
      ],
    };
    let countsData: CountsFixture = {
      byStatus: {
        total: { todo: 1, done: 3 },
        visible: { todo: 1, done: 1 },
        hidden: { todo: 0, done: 2 },
      },
    };
    let moreDoneData: EnrichedIssue[] | undefined;

    mockUseAuthenticatedQuery.mockImplementation((_reference, _args) => {
      const callPosition = mockUseAuthenticatedQuery.mock.calls.length % 3;
      if (callPosition === 1) {
        return smartData;
      }
      if (callPosition === 2) {
        return countsData;
      }
      return moreDoneData;
    });

    const { result, rerender } = renderHook<SmartBoardData, ProjectBoardProps>(
      ({ projectId, sprintId }: ProjectBoardProps) => useSmartBoardData({ projectId, sprintId }),
      {
        initialProps: {
          projectId: "project_1" as Id<"projects">,
          sprintId: "sprint_1" as Id<"sprints">,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.issuesByStatus).toEqual({
        todo: [recentTodo],
        done: [recentDone],
      });
      expect(result.current.statusCounts).toEqual({
        todo: { total: 1, loaded: 1, hidden: 0 },
        done: { total: 3, loaded: 1, hidden: 2 },
      });
      expect(result.current.doneStatusesWithMore).toEqual(["done"]);
      expect(result.current.hiddenDoneCount).toBe(2);
      expect(result.current.workflowStates).toEqual(smartData.workflowStates);
      expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContainEqual({
        projectId: "project_1",
        sprintId: "sprint_1",
        doneColumnDays: 14,
      });
    });

    act(() => {
      result.current.loadMoreDone();
    });

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(true);
      expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContainEqual({
        projectId: "project_1",
        sprintId: "sprint_1",
        beforeTimestamp: 200,
        beforeId: "issue_done_recent",
        limit: 50,
      });
    });

    moreDoneData = [olderDone];

    act(() => {
      rerender({
        projectId: "project_1" as Id<"projects">,
        sprintId: "sprint_1" as Id<"sprints">,
      });
    });

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.issuesByStatus.done).toEqual([recentDone, olderDone]);
      expect(result.current.statusCounts.done).toEqual({
        total: 3,
        loaded: 2,
        hidden: 1,
      });
      expect(result.current.hiddenDoneCount).toBe(1);
    });

    smartData = {
      issuesByStatus: {
        done: [replacementDone],
      },
      workflowStates: [{ id: "done", name: "Done", category: "done" as const, order: 0 }],
    };
    countsData = {
      byStatus: {
        total: { done: 1 },
        visible: { done: 1 },
        hidden: { done: 0 },
      },
    };
    moreDoneData = undefined;

    act(() => {
      rerender({
        projectId: "project_2" as Id<"projects">,
      });
    });

    await waitFor(() => {
      expect(result.current.issuesByStatus).toEqual({
        done: [replacementDone],
      });
      expect(result.current.statusCounts).toEqual({
        done: { total: 1, loaded: 1, hidden: 0 },
      });
      expect(result.current.hiddenDoneCount).toBe(0);
      expect(result.current.doneStatusesWithMore).toEqual([]);
    });
  });

  it("uses the team-mode queries and reports loading before data arrives", () => {
    mockUseAuthenticatedQuery.mockImplementation(() => {
      return undefined;
    });

    const { result } = renderHook(() =>
      useSmartBoardData({
        teamId: "team_1" as Id<"teams">,
        doneColumnDays: 7,
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.issuesByStatus).toEqual({});
    expect(result.current.statusCounts).toEqual({});
    expect(result.current.doneStatusesWithMore).toEqual([]);
    expect(result.current.hiddenDoneCount).toBe(0);
    expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContainEqual({
      teamId: "team_1",
      doneColumnDays: 7,
    });
    expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContain("skip");
  });
});
