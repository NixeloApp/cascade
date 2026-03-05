import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/test/custom-render";
import { useOfflineQueue, useOfflineSyncStatus } from "./useOffline";

const { mockGetPendingMutations } = vi.hoisted(() => ({
  mockGetPendingMutations: vi.fn(),
}));

vi.mock("../lib/offline", () => ({
  offlineDB: {
    getPendingMutations: mockGetPendingMutations,
  },
  offlineStatus: {
    isOnline: true,
    subscribe: vi.fn(() => () => {}),
  },
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
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetPendingMutations.mockRejectedValueOnce(new Error("indexeddb down"));

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
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetPendingMutations.mockRejectedValueOnce(new Error("db blocked"));

    const { result } = renderHook(() => useOfflineSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(EMPTY_QUEUE_COUNT);
    expect(warnSpy).toHaveBeenCalledWith("[offline] load pending sync mutations failed", {
      error: expect.any(Error),
    });
  });
});
