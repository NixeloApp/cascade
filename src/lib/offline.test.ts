import { SECOND } from "@convex/lib/timeUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFailureReason,
  getLastSuccessfulOfflineReplayAt,
  isPermanentFailure,
  MAX_OFFLINE_REPLAY_ATTEMPTS,
  type OfflineMutation,
  offlineDB,
  processOfflineQueue,
  queueOfflineMutation,
  RETRY_BACKOFF_MS,
  registerOfflineReplayHandler,
  subscribeOfflineQueueChanges,
} from "./offline";

function createQueuedMutation(overrides: Partial<OfflineMutation> = {}): OfflineMutation {
  return {
    id: 1,
    mutationType: "issues.create",
    mutationArgs: JSON.stringify({ title: "Offline issue" }),
    status: "pending",
    attempts: 0,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

describe("offline replay queue", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  // requeueStaleSyncingMutations runs at the start of every processOfflineQueue call.
  // Mock it globally so tests focus on the replay logic, not the recovery step.
  beforeEach(() => {
    vi.spyOn(offlineDB, "requeueStaleSyncingMutations").mockResolvedValue(0);
  });

  it("immediately fails unsupported mutation types as permanent errors", async () => {
    const queuedMutation = createQueuedMutation();
    const getPendingSpy = vi
      .spyOn(offlineDB, "getPendingMutations")
      .mockResolvedValue([queuedMutation]);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(console, "info").mockImplementation(() => {});

    await processOfflineQueue();

    expect(getPendingSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenNthCalledWith(1, 1, "syncing", {
      incrementAttempts: true,
      clearError: true,
    });
    // Unsupported mutation is a permanent failure — goes straight to "failed"
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "failed", {
      error: "This action type is not supported for offline replay",
      nextRetryAfter: undefined,
    });
  });

  it("replays supported mutation types through a registered handler", async () => {
    const completedAt = 1_700_000_999_000;
    const queuedMutation = createQueuedMutation({
      mutationType: "issues.updateTitle",
      mutationArgs: JSON.stringify({ id: "issue-1", title: "Renamed" }),
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    const unregisterHandler = registerOfflineReplayHandler("issues.updateTitle", handler);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(Date, "now").mockReturnValue(completedAt);

    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    expect(handler).toHaveBeenCalledWith({
      id: "issue-1",
      title: "Renamed",
    });
    expect(updateSpy).toHaveBeenNthCalledWith(1, 1, "syncing", {
      incrementAttempts: true,
      clearError: true,
    });
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "synced", {
      clearError: true,
    });
    expect(getLastSuccessfulOfflineReplayAt()).toBe(completedAt);
  });

  it("marks a mutation failed once it reaches the maximum replay attempts", async () => {
    const queuedMutation = createQueuedMutation({
      attempts: MAX_OFFLINE_REPLAY_ATTEMPTS - 1,
      mutationType: "issues.failAfterRetry",
    });
    const handler = vi.fn().mockRejectedValue(new Error("server rejected replay"));
    const unregisterHandler = registerOfflineReplayHandler("issues.failAfterRetry", handler);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();

    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    expect(updateSpy).toHaveBeenNthCalledWith(1, 1, "syncing", {
      incrementAttempts: true,
      clearError: true,
    });
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "failed", {
      error: "server rejected replay",
      nextRetryAfter: undefined,
    });
  });

  it("treats corrupt queued payloads as replay failures without calling a handler", async () => {
    const queuedMutation = createQueuedMutation({
      mutationType: "issues.corruptPayload",
      mutationArgs: "[]",
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    const unregisterHandler = registerOfflineReplayHandler("issues.corruptPayload", handler);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(console, "info").mockImplementation(() => {});

    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    expect(handler).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "pending", {
      error: "Queued mutation args must be a JSON object",
      nextRetryAfter: expect.any(Number),
    });
  });

  it("immediately fails permanent errors without retrying", async () => {
    const queuedMutation = createQueuedMutation({
      attempts: 0,
      mutationType: "issues.permanent",
    });
    const handler = vi.fn().mockRejectedValue(new Error("Issue not found"));
    const unregisterHandler = registerOfflineReplayHandler("issues.permanent", handler);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);
    vi.spyOn(console, "info").mockImplementation(() => {});

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    // Should go to "failed" immediately — not "pending" for retry
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "failed", {
      error: "The item was deleted or no longer exists",
      nextRetryAfter: undefined,
    });
  });

  it("skips mutations still in backoff window", async () => {
    const futureTime = Date.now() + 60_000; // 1 minute from now
    const queuedMutation = createQueuedMutation({
      attempts: 1,
      nextRetryAfter: futureTime,
    });
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    await processOfflineQueue();

    // Should not attempt to process — still in backoff
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("processes mutations whose backoff has elapsed", async () => {
    const pastTime = Date.now() - SECOND;
    const queuedMutation = createQueuedMutation({
      attempts: 1,
      nextRetryAfter: pastTime,
      mutationType: "issues.retryEligible",
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    const unregisterHandler = registerOfflineReplayHandler("issues.retryEligible", handler);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    expect(handler).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "synced", { clearError: true });
  });

  it("does not reject queue writes when an offline queue subscriber throws", async () => {
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const addMutationSpy = vi.spyOn(offlineDB, "addMutation").mockResolvedValue(99);
    const unsubscribe = subscribeOfflineQueueChanges(() => {
      throw new Error("listener exploded");
    });

    try {
      await expect(
        queueOfflineMutation(
          "issues.addComment",
          { issueId: "issue-1", content: "Offline comment" },
          "user-1",
        ),
      ).resolves.toBe(99);

      expect(addMutationSpy).toHaveBeenCalledTimes(1);

      await vi.waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith("[offline] Offline queue listener failed", {
          error: expect.any(Error),
        });
      });
    } finally {
      unsubscribe();
    }
  });
});

describe("isPermanentFailure", () => {
  it("classifies not-found as permanent", () => {
    expect(isPermanentFailure(new Error("Issue not found"))).toBe(true);
    expect(isPermanentFailure(new Error("Document does not exist"))).toBe(true);
    expect(isPermanentFailure(new Error("Project has been deleted"))).toBe(true);
  });

  it("classifies auth errors as permanent", () => {
    expect(isPermanentFailure(new Error("Not authenticated"))).toBe(true);
    expect(isPermanentFailure(new Error("Unauthorized"))).toBe(true);
    expect(isPermanentFailure(new Error("Forbidden"))).toBe(true);
  });

  it("classifies validation as permanent", () => {
    expect(isPermanentFailure(new Error("Validation failed: title required"))).toBe(true);
  });

  it("classifies network errors as transient", () => {
    expect(isPermanentFailure(new Error("Failed to fetch"))).toBe(false);
    expect(isPermanentFailure(new Error("Network request failed"))).toBe(false);
    expect(isPermanentFailure(new Error("server rejected replay"))).toBe(false);
    expect(isPermanentFailure(new Error("timeout"))).toBe(false);
  });
});

describe("getFailureReason", () => {
  it("returns human-readable reasons for permanent errors", () => {
    expect(getFailureReason(new Error("Issue not found"))).toBe(
      "The item was deleted or no longer exists",
    );
    expect(getFailureReason(new Error("Not authenticated"))).toBe(
      "Authentication expired — sign in again",
    );
    expect(getFailureReason(new Error("Forbidden"))).toBe(
      "You no longer have permission for this action",
    );
  });

  it("passes through transient error messages as-is", () => {
    expect(getFailureReason(new Error("Failed to fetch"))).toBe("Failed to fetch");
  });
});

describe("RETRY_BACKOFF_MS", () => {
  it("has escalating intervals", () => {
    expect(RETRY_BACKOFF_MS[0]).toBeLessThan(RETRY_BACKOFF_MS[1]);
    expect(RETRY_BACKOFF_MS[1]).toBeLessThan(RETRY_BACKOFF_MS[2]);
  });

  it("has 3 entries matching MAX_OFFLINE_REPLAY_ATTEMPTS", () => {
    expect(RETRY_BACKOFF_MS.length).toBe(MAX_OFFLINE_REPLAY_ATTEMPTS);
  });
});
