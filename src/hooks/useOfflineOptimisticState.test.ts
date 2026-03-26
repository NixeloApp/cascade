import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@/test/custom-render";
import { useOfflineQueue } from "./useOffline";
import {
  useQueuedOfflineIssueComments,
  useQueuedOfflineIssueStatus,
  useQueuedOfflineNotificationReadIds,
} from "./useOfflineOptimisticState";

vi.mock("./useOffline", () => ({
  useOfflineQueue: vi.fn(),
}));

const mockUseOfflineQueue = vi.mocked(useOfflineQueue);

describe("useOfflineOptimisticState", () => {
  it("returns queued issue comments for the current issue in timestamp order", () => {
    mockUseOfflineQueue.mockReturnValue({
      queue: [
        {
          id: 2,
          userId: "user-1",
          mutationType: "issues.addComment",
          mutationArgs: JSON.stringify({
            issueId: "issue-1",
            content: "Newest queued comment",
            clientRequestId: "comment-2",
          }),
          status: "pending",
          attempts: 0,
          timestamp: 20,
        },
        {
          id: 1,
          userId: "user-1",
          mutationType: "issues.addComment",
          mutationArgs: JSON.stringify({
            issueId: "issue-1",
            content: "Oldest queued comment",
            clientRequestId: "comment-1",
          }),
          status: "syncing",
          attempts: 1,
          timestamp: 10,
        },
        {
          id: 3,
          userId: "user-1",
          mutationType: "issues.addComment",
          mutationArgs: JSON.stringify({
            issueId: "issue-2",
            content: "Wrong issue",
          }),
          status: "pending",
          attempts: 0,
          timestamp: 30,
        },
        {
          id: 4,
          userId: "user-1",
          mutationType: "issues.addComment",
          mutationArgs: "not-json",
          status: "pending",
          attempts: 0,
          timestamp: 40,
        },
        {
          id: 5,
          userId: "user-1",
          mutationType: "issues.addComment",
          mutationArgs: JSON.stringify({
            issueId: "issue-1",
            content: "Already failed",
          }),
          status: "failed",
          attempts: 3,
          timestamp: 50,
        },
      ],
      count: 0,
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
      lastSuccessfulReplayAt: null,
      isLoading: false,
      refresh: vi.fn(),
      processNow: vi.fn(),
      retryMutation: vi.fn(),
      deleteMutation: vi.fn(),
      clearSynced: vi.fn(),
    });

    const { result } = renderHook(() =>
      useQueuedOfflineIssueComments("issue-1" as Id<"issues">, "user-1" as Id<"users">),
    );

    expect(result.current).toEqual([
      {
        content: "Oldest queued comment",
        issueId: "issue-1",
        key: "comment-1",
        mentions: undefined,
        timestamp: 10,
      },
      {
        content: "Newest queued comment",
        issueId: "issue-1",
        key: "comment-2",
        mentions: undefined,
        timestamp: 20,
      },
    ]);
  });

  it("returns queued notification read ids as a unique set", () => {
    mockUseOfflineQueue.mockReturnValue({
      queue: [
        {
          id: 1,
          userId: "user-1",
          mutationType: "notifications.markAsRead",
          mutationArgs: JSON.stringify({ id: "notif-1" }),
          status: "pending",
          attempts: 0,
          timestamp: 10,
        },
        {
          id: 2,
          userId: "user-1",
          mutationType: "notifications.markAsRead",
          mutationArgs: JSON.stringify({ id: "notif-1" }),
          status: "syncing",
          attempts: 1,
          timestamp: 11,
        },
        {
          id: 3,
          userId: "user-1",
          mutationType: "notifications.markAsRead",
          mutationArgs: JSON.stringify({ id: "notif-2" }),
          status: "pending",
          attempts: 0,
          timestamp: 12,
        },
      ],
      count: 0,
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
      lastSuccessfulReplayAt: null,
      isLoading: false,
      refresh: vi.fn(),
      processNow: vi.fn(),
      retryMutation: vi.fn(),
      deleteMutation: vi.fn(),
      clearSynced: vi.fn(),
    });

    const { result } = renderHook(() =>
      useQueuedOfflineNotificationReadIds("user-1" as Id<"users">),
    );

    expect([...result.current]).toEqual(["notif-1", "notif-2"]);
  });

  it("returns the latest queued status for the issue", () => {
    mockUseOfflineQueue.mockReturnValue({
      queue: [
        {
          id: 1,
          userId: "user-1",
          mutationType: "issues.updateStatus",
          mutationArgs: JSON.stringify({
            issueId: "issue-1",
            newStatus: "in_progress",
            newOrder: 0,
          }),
          status: "pending",
          attempts: 0,
          timestamp: 10,
        },
        {
          id: 2,
          userId: "user-1",
          mutationType: "issues.updateStatus",
          mutationArgs: JSON.stringify({
            issueId: "issue-1",
            newStatus: "done",
            newOrder: 0,
          }),
          status: "syncing",
          attempts: 1,
          timestamp: 20,
        },
        {
          id: 3,
          userId: "user-1",
          mutationType: "issues.updateStatus",
          mutationArgs: JSON.stringify({
            issueId: "issue-2",
            newStatus: "backlog",
            newOrder: 0,
          }),
          status: "pending",
          attempts: 0,
          timestamp: 30,
        },
      ],
      count: 0,
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
      lastSuccessfulReplayAt: null,
      isLoading: false,
      refresh: vi.fn(),
      processNow: vi.fn(),
      retryMutation: vi.fn(),
      deleteMutation: vi.fn(),
      clearSynced: vi.fn(),
    });

    const { result } = renderHook(() =>
      useQueuedOfflineIssueStatus("issue-1" as Id<"issues">, "user-1" as Id<"users">),
    );

    expect(result.current).toBe("done");
  });
});
