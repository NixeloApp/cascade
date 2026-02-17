import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOfflineQueue, useOfflineSyncStatus, useOnlineStatus } from "./useOffline";

// Mock the offline module
vi.mock("../lib/offline", () => ({
  offlineStatus: {
    isOnline: true,
    subscribe: vi.fn((callback) => {
      // Store callback for later use
      mockSubscribeCallback = callback;
      return vi.fn(); // unsubscribe function
    }),
  },
  offlineDB: {
    getPendingMutations: vi.fn(),
    updateMutationStatus: vi.fn(),
    deleteMutation: vi.fn(),
    clearSyncedMutations: vi.fn(),
  },
}));

import { offlineDB, offlineStatus } from "../lib/offline";

let mockSubscribeCallback: ((online: boolean) => void) | null = null;

describe("useOnlineStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribeCallback = null;
    // Reset default online state
    (offlineStatus as { isOnline: boolean }).isOnline = true;
  });

  it("should return initial online state", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it("should return initial offline state", () => {
    (offlineStatus as { isOnline: boolean }).isOnline = false;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it("should subscribe to status changes on mount", () => {
    renderHook(() => useOnlineStatus());

    expect(offlineStatus.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should update when online status changes", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    // Simulate going offline
    act(() => {
      mockSubscribeCallback?.(false);
    });

    expect(result.current).toBe(false);

    // Simulate coming back online
    act(() => {
      mockSubscribeCallback?.(true);
    });

    expect(result.current).toBe(true);
  });

  it("should unsubscribe on unmount", () => {
    const unsubscribe = vi.fn();
    vi.mocked(offlineStatus.subscribe).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe("useOfflineSyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state initially", () => {
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);
    const { result } = renderHook(() => useOfflineSyncStatus());

    expect(result.current.isLoading).toBe(true);
  });

  it("should load pending mutations on mount", async () => {
    const mockMutations = [
      { id: 1, name: "mutation1", args: {}, status: "pending", timestamp: Date.now() },
      { id: 2, name: "mutation2", args: {}, status: "pending", timestamp: Date.now() },
    ];
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue(mockMutations as any);

    const { result } = renderHook(() => useOfflineSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pending).toHaveLength(2);
    expect(result.current.count).toBe(2);
  });

  it("should return empty array when no pending mutations", async () => {
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);

    const { result } = renderHook(() => useOfflineSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pending).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(offlineDB.getPendingMutations).mockRejectedValue(new Error("DB error"));

    const { result } = renderHook(() => useOfflineSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still work, just with empty pending
    expect(result.current.pending).toHaveLength(0);
  });

  it("should poll every 5 seconds", async () => {
    vi.useFakeTimers();
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);

    const { unmount } = renderHook(() => useOfflineSyncStatus());

    // Let the initial call and promises settle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Initial call
    expect(offlineDB.getPendingMutations).toHaveBeenCalledTimes(1);

    // Advance 5 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(offlineDB.getPendingMutations).toHaveBeenCalledTimes(2);

    // Advance another 5 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(offlineDB.getPendingMutations).toHaveBeenCalledTimes(3);

    // Clean up to prevent interval from running after test
    unmount();
    vi.useRealTimers();
  });

  it("should stop polling on unmount", async () => {
    vi.useFakeTimers();
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);

    const { unmount } = renderHook(() => useOfflineSyncStatus());

    // Let the initial call settle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Initial call
    expect(offlineDB.getPendingMutations).toHaveBeenCalledTimes(1);

    unmount();

    // Advance 10 seconds - should not trigger more calls since unmounted
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Should not have been called again after unmount
    expect(offlineDB.getPendingMutations).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe("useOfflineQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to flush pending promises
  const flushPromises = () => act(() => Promise.resolve());

  it("should load queue on mount", async () => {
    const mockMutations = [
      { id: 1, name: "test", args: {}, status: "pending", timestamp: Date.now() },
    ];
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue(mockMutations as any);

    const { result } = renderHook(() => useOfflineQueue());

    // Let the initial async refresh complete
    await flushPromises();

    expect(result.current.queue).toHaveLength(1);
  });

  it("should refresh queue", async () => {
    vi.mocked(offlineDB.getPendingMutations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 1, name: "new", args: {}, status: "pending", timestamp: Date.now() },
      ] as any);

    const { result } = renderHook(() => useOfflineQueue());

    // Wait for initial load to complete
    await flushPromises();

    expect(result.current.queue).toHaveLength(0);

    // Manual refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.queue).toHaveLength(1);
  });

  it("should retry mutation", async () => {
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);
    vi.mocked(offlineDB.updateMutationStatus).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineQueue());

    // Wait for initial refresh
    await flushPromises();

    await act(async () => {
      await result.current.retryMutation(123);
    });

    expect(offlineDB.updateMutationStatus).toHaveBeenCalledWith(123, "pending");
    expect(offlineDB.getPendingMutations).toHaveBeenCalled();
  });

  it("should delete mutation", async () => {
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);
    vi.mocked(offlineDB.deleteMutation).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineQueue());

    // Wait for initial refresh
    await flushPromises();

    await act(async () => {
      await result.current.deleteMutation(456);
    });

    expect(offlineDB.deleteMutation).toHaveBeenCalledWith(456);
    expect(offlineDB.getPendingMutations).toHaveBeenCalled();
  });

  it("should clear synced mutations", async () => {
    vi.mocked(offlineDB.getPendingMutations).mockResolvedValue([]);
    vi.mocked(offlineDB.clearSyncedMutations).mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineQueue());

    // Wait for initial refresh
    await flushPromises();

    await act(async () => {
      await result.current.clearSynced();
    });

    expect(offlineDB.clearSyncedMutations).toHaveBeenCalled();
    expect(offlineDB.getPendingMutations).toHaveBeenCalled();
  });

  it("should handle refresh errors gracefully", async () => {
    vi.mocked(offlineDB.getPendingMutations)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("DB error"));

    const { result } = renderHook(() => useOfflineQueue());

    // Wait for initial refresh
    await flushPromises();

    // Should not throw
    await act(async () => {
      await result.current.refresh();
    });

    // Queue should remain unchanged
    expect(result.current.queue).toHaveLength(0);
  });
});
