import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@/test/custom-render";
import { useOfflineQueue, useOfflineSyncStatus } from "./useOffline";

const { mockGetQueuedMutations, mockProcessOfflineQueue } = vi.hoisted(() => ({
  mockGetQueuedMutations: vi.fn(),
  mockProcessOfflineQueue: vi.fn(),
}));

vi.mock("../lib/offline", () => ({
  offlineDB: {
    getQueuedMutations: mockGetQueuedMutations,
    updateMutationStatus: vi.fn(),
    deleteMutation: vi.fn(),
    clearSyncedMutations: vi.fn(),
  },
  offlineStatus: {
    isOnline: true,
    subscribe: vi.fn(() => () => {}),
  },
  processOfflineQueue: mockProcessOfflineQueue,
}));

/** Expected count when offline queue is empty or fetch fails */
const EMPTY_QUEUE_COUNT = 0;

describe("useOffline reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs warning and keeps queue stable when refresh fails", async () => {
    const warnSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockGetQueuedMutations.mockRejectedValueOnce(new Error("indexeddb down"));

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.queue).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith("[offline] refresh queue failed", {
      error: expect.any(Error),
    });
  });

  it("logs warning and exits loading state when sync status fetch fails", async () => {
    const warnSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockGetQueuedMutations.mockRejectedValueOnce(new Error("db blocked"));

    const { result } = renderHook(() => useOfflineSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(EMPTY_QUEUE_COUNT);
    expect(warnSpy).toHaveBeenCalledWith("[offline] refresh queue failed", {
      error: expect.any(Error),
    });
  });

  it("processes the queue and refreshes queued mutations", async () => {
    mockGetQueuedMutations.mockResolvedValueOnce([{ id: 1, status: "pending" }]);
    mockGetQueuedMutations.mockResolvedValueOnce([]);
    mockProcessOfflineQueue.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.processNow();
    });

    expect(mockProcessOfflineQueue).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.queue).toEqual([]);
    });
  });
});
