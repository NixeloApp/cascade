import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLastSuccessfulOfflineReplayAt,
  MAX_OFFLINE_REPLAY_ATTEMPTS,
  type OfflineMutation,
  offlineDB,
  processOfflineQueue,
  registerOfflineReplayHandler,
  UnsupportedOfflineMutationError,
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

  it("keeps unsupported mutation types pending with an explicit error", async () => {
    const queuedMutation = createQueuedMutation();
    const getPendingSpy = vi
      .spyOn(offlineDB, "getPendingMutations")
      .mockResolvedValue([queuedMutation]);
    const updateSpy = vi.spyOn(offlineDB, "updateMutationStatus").mockResolvedValue();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await processOfflineQueue();

    expect(getPendingSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenNthCalledWith(1, 1, "syncing", {
      incrementAttempts: true,
      clearError: true,
    });
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "pending", {
      error: "Unsupported offline mutation type: issues.create",
    });
    expect(infoSpy).toHaveBeenCalledWith("[offline] Failed to process queued mutation", {
      id: 1,
      mutationType: "issues.create",
      attempts: 1,
      nextStatus: "pending",
      error: expect.any(UnsupportedOfflineMutationError),
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

    vi.spyOn(offlineDB, "getPendingMutations").mockResolvedValue([queuedMutation]);

    try {
      await processOfflineQueue();
    } finally {
      unregisterHandler();
    }

    expect(handler).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenNthCalledWith(2, 1, "pending", {
      error: "Queued mutation args must be a JSON object",
    });
  });
});
