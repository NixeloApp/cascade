import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { OptimisticLocalStore } from "convex/browser";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { optimisticBoardUpdate } from "./boardOptimisticUpdates";

// Mock the api module
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: {
      get: "api.issues.get",
      listByProjectSmart: "api.issues.listByProjectSmart",
    },
  },
}));

// Type for our mock store with proper mock types
interface MockLocalStore {
  getQuery: Mock;
  setQuery: Mock;
  getAllQueries: Mock;
  _setInitialQuery: (queryFn: string, args: unknown, value: unknown) => void;
}

// Board data type for tests
interface BoardData {
  issuesByStatus: Record<string, EnrichedIssue[]>;
  totalCount: number;
  someOtherField?: string;
}

function createMockLocalStore(): MockLocalStore {
  const queries = new Map<string, unknown>();

  const getQueryMock = vi.fn((queryFn: string, args: unknown) => {
    const key = `${String(queryFn)}:${JSON.stringify(args)}`;
    return queries.get(key);
  });

  const setQueryMock = vi.fn((queryFn: string, args: unknown, value: unknown) => {
    const key = `${String(queryFn)}:${JSON.stringify(args)}`;
    queries.set(key, value);
  });

  return {
    getQuery: getQueryMock,
    setQuery: setQueryMock,
    getAllQueries: vi.fn(() => []),
    _setInitialQuery: (queryFn: string, args: unknown, value: unknown) => {
      const key = `${String(queryFn)}:${JSON.stringify(args)}`;
      queries.set(key, value);
    },
  };
}

function createMockIssue(overrides: Partial<EnrichedIssue> = {}): EnrichedIssue {
  return {
    _id: "issue-1" as Id<"issues">,
    _creationTime: Date.now(),
    projectId: "project-1" as Id<"projects">,
    key: "TEST-1",
    title: "Test Issue",
    status: "todo",
    priority: "medium",
    order: 1000,
    createdBy: "user-1" as Id<"users">,
    updatedAt: Date.now() - 10000,
    ...overrides,
  } as EnrichedIssue;
}

describe("boardOptimisticUpdates", () => {
  let mockStore: ReturnType<typeof createMockLocalStore>;

  beforeEach(() => {
    mockStore = createMockLocalStore();
    vi.clearAllMocks();
  });

  describe("optimisticBoardUpdate", () => {
    describe("single issue update", () => {
      it("should update single issue status and order", () => {
        const issueId = "issue-1" as Id<"issues">;
        const existingIssue = createMockIssue({
          _id: issueId,
          status: "todo",
          order: 1000,
        });

        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const update = optimisticBoardUpdate();
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        expect(mockStore.setQuery).toHaveBeenCalledWith(
          "api.issues.get",
          { id: issueId },
          expect.objectContaining({
            _id: issueId,
            status: "in_progress",
            order: 2000,
          }),
        );
      });

      it("should update the issue updatedAt timestamp", () => {
        const issueId = "issue-1" as Id<"issues">;
        const oldTime = Date.now() - 100000;
        const existingIssue = createMockIssue({
          _id: issueId,
          updatedAt: oldTime,
        });

        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const beforeUpdate = Date.now();
        const update = optimisticBoardUpdate();
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        const setQueryCall = mockStore.setQuery.mock.calls[0];
        const updatedIssue = setQueryCall[2] as EnrichedIssue;
        expect(updatedIssue.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
      });

      it("should not update if issue is not in cache", () => {
        const issueId = "issue-nonexistent" as Id<"issues">;

        const update = optimisticBoardUpdate();
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // setQuery should not be called for the single issue
        expect(mockStore.setQuery).not.toHaveBeenCalled();
      });
    });

    describe("board list update", () => {
      it("should move issue between columns in board view", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({
          _id: issueId,
          status: "todo",
          order: 1000,
        });

        // Set up single issue cache
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        // Set up board cache
        const boardData = {
          issuesByStatus: {
            todo: [existingIssue],
            in_progress: [],
            done: [],
          },
          totalCount: 1,
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Check board was updated
        const boardUpdateCall = mockStore.setQuery.mock.calls.find(
          (call: unknown[]) => call[0] === "api.issues.listByProjectSmart",
        );
        if (!boardUpdateCall) throw new Error("Expected boardUpdateCall to be defined");

        const updatedBoard = boardUpdateCall[2] as BoardData;
        expect(updatedBoard.issuesByStatus.todo).toHaveLength(0);
        expect(updatedBoard.issuesByStatus.in_progress).toHaveLength(1);
        expect(updatedBoard.issuesByStatus.in_progress[0].status).toBe("in_progress");
      });

      it("should sort issues by order in target column", () => {
        const issueId1 = "issue-1" as Id<"issues">;
        const issueId2 = "issue-2" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const issue1 = createMockIssue({
          _id: issueId1,
          status: "todo",
          order: 3000, // Will be moved with order 1000
        });
        const issue2 = createMockIssue({
          _id: issueId2,
          status: "in_progress",
          order: 2000,
        });

        mockStore._setInitialQuery("api.issues.get", { id: issueId1 }, issue1);

        const boardData = {
          issuesByStatus: {
            todo: [issue1],
            in_progress: [issue2],
            done: [],
          },
          totalCount: 2,
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId: issueId1,
          newStatus: "in_progress",
          newOrder: 1000, // Lower order, should come first
        });

        const boardUpdateCall = mockStore.setQuery.mock.calls.find(
          (call: unknown[]) => call[0] === "api.issues.listByProjectSmart",
        );
        if (!boardUpdateCall) throw new Error("Expected boardUpdateCall to be defined");
        const updatedBoard = boardUpdateCall[2] as BoardData;

        // Issue1 (order 1000) should be before issue2 (order 2000)
        expect(updatedBoard.issuesByStatus.in_progress[0]._id).toBe(issueId1);
        expect(updatedBoard.issuesByStatus.in_progress[1]._id).toBe(issueId2);
      });

      it("should not update board list if projectId is missing", () => {
        const issueId = "issue-1" as Id<"issues">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const update = optimisticBoardUpdate({ sprintId }); // Missing projectId
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Only single issue update, no board update
        expect(mockStore.setQuery).toHaveBeenCalledTimes(1);
        expect(mockStore.setQuery).toHaveBeenCalledWith(
          "api.issues.get",
          expect.anything(),
          expect.anything(),
        );
      });

      it("should not update board list if sprintId is missing", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const update = optimisticBoardUpdate({ projectId }); // Missing sprintId
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Only single issue update, no board update
        expect(mockStore.setQuery).toHaveBeenCalledTimes(1);
      });

      it("should not update board list if board data is not in cache", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);
        // Don't set up board data

        const update = optimisticBoardUpdate({ projectId, sprintId });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Only single issue update
        expect(mockStore.setQuery).toHaveBeenCalledTimes(1);
      });

      it("should not update board list if issue not found in any column", () => {
        const issueId = "issue-1" as Id<"issues">;
        const issueIdOther = "issue-other" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const otherIssue = createMockIssue({ _id: issueIdOther });
        const boardData = {
          issuesByStatus: {
            todo: [otherIssue], // Different issue
            in_progress: [],
            done: [],
          },
          totalCount: 1,
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId, // This issue is not in the board
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Board setQuery should not be called because issue wasn't found
        const boardUpdateCall = mockStore.setQuery.mock.calls.find(
          (call: unknown[]) => call[0] === "api.issues.listByProjectSmart",
        );
        expect(boardUpdateCall).toBeUndefined();
      });

      it("should use default doneColumnDays when not specified", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId, status: "todo" });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const boardData = {
          issuesByStatus: {
            todo: [existingIssue],
            in_progress: [],
            done: [],
          },
          totalCount: 1,
        };
        // Board was cached with doneColumnDays: 14 (default)
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        // Don't specify doneColumnDays
        const update = optimisticBoardUpdate({ projectId, sprintId });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Should still find the board with default doneColumnDays: 14
        expect(mockStore.getQuery).toHaveBeenCalledWith("api.issues.listByProjectSmart", {
          projectId,
          sprintId,
          doneColumnDays: 14,
        });
      });
    });

    describe("team mode", () => {
      it("should skip board list update in team mode", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const boardData = {
          issuesByStatus: {
            todo: [existingIssue],
            in_progress: [],
          },
          totalCount: 1,
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        // Enable team mode
        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 }, true);
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Only single issue update, no board update
        expect(mockStore.setQuery).toHaveBeenCalledTimes(1);
        expect(mockStore.setQuery).toHaveBeenCalledWith(
          "api.issues.get",
          expect.anything(),
          expect.anything(),
        );
      });
    });

    describe("edge cases", () => {
      it("should handle moving to empty column", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId, status: "todo" });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const boardData = {
          issuesByStatus: {
            todo: [existingIssue],
            // in_progress doesn't exist in the object
          },
          totalCount: 1,
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 1000,
        });

        const boardUpdateCall = mockStore.setQuery.mock.calls.find(
          (call: unknown[]) => call[0] === "api.issues.listByProjectSmart",
        );
        if (!boardUpdateCall) throw new Error("Expected boardUpdateCall to be defined");
        const updatedBoard = boardUpdateCall[2] as BoardData;

        expect(updatedBoard.issuesByStatus.todo).toHaveLength(0);
        expect(updatedBoard.issuesByStatus.in_progress).toHaveLength(1);
      });

      it("should preserve other board data when updating", () => {
        const issueId = "issue-1" as Id<"issues">;
        const projectId = "project-1" as Id<"projects">;
        const sprintId = "sprint-1" as Id<"sprints">;

        const existingIssue = createMockIssue({ _id: issueId, status: "todo" });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const boardData = {
          issuesByStatus: {
            todo: [existingIssue],
            in_progress: [],
          },
          totalCount: 1,
          someOtherField: "preserved",
        };
        mockStore._setInitialQuery(
          "api.issues.listByProjectSmart",
          { projectId, sprintId, doneColumnDays: 14 },
          boardData,
        );

        const update = optimisticBoardUpdate({ projectId, sprintId, doneColumnDays: 14 });
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 1000,
        });

        const boardUpdateCall = mockStore.setQuery.mock.calls.find(
          (call: unknown[]) => call[0] === "api.issues.listByProjectSmart",
        );
        if (!boardUpdateCall) throw new Error("Expected boardUpdateCall to be defined");
        const updatedBoard = boardUpdateCall[2] as BoardData;

        expect(updatedBoard.totalCount).toBe(1);
        expect(updatedBoard.someOtherField).toBe("preserved");
      });

      it("should handle no boardOptions provided", () => {
        const issueId = "issue-1" as Id<"issues">;

        const existingIssue = createMockIssue({ _id: issueId });
        mockStore._setInitialQuery("api.issues.get", { id: issueId }, existingIssue);

        const update = optimisticBoardUpdate(); // No options
        update(mockStore as unknown as OptimisticLocalStore, {
          issueId,
          newStatus: "in_progress",
          newOrder: 2000,
        });

        // Only single issue update
        expect(mockStore.setQuery).toHaveBeenCalledTimes(1);
      });
    });
  });
});
