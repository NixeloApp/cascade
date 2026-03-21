import { useEffect, useState } from "react";
import {
  getLastSuccessfulOfflineReplayAt,
  type OfflineMutation,
  offlineDB,
  offlineStatus,
  processOfflineQueue,
} from "../lib/offline";

function logOfflineError(operation: string, error: unknown) {
  console.info(`[offline] ${operation}`, { error });
}

function getOfflineQueueCounts(queue: OfflineMutation[]) {
  return queue.reduce(
    (counts, mutation) => {
      if (mutation.status === "pending") {
        counts.pendingCount += 1;
      } else if (mutation.status === "syncing") {
        counts.syncingCount += 1;
      } else if (mutation.status === "failed") {
        counts.failedCount += 1;
      }
      return counts;
    },
    {
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
    },
  );
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineStatus.isOnline);

  useEffect(() => {
    const unsubscribe = offlineStatus.subscribe(setIsOnline);
    return () => {
      unsubscribe();
    };
  }, []);

  return isOnline;
}

/**
 * Hook to track offline sync queue status
 */
export function useOfflineSyncStatus() {
  const { queue, isLoading, lastSuccessfulReplayAt, refresh } = useOfflineQueue();
  const pending = queue.filter((mutation) => mutation.status === "pending");
  const syncing = queue.filter((mutation) => mutation.status === "syncing");
  const failed = queue.filter((mutation) => mutation.status === "failed");
  const counts = getOfflineQueueCounts(queue);

  return {
    items: queue,
    pending,
    syncing,
    failed,
    count: queue.length,
    pendingCount: counts.pendingCount,
    syncingCount: counts.syncingCount,
    failedCount: counts.failedCount,
    lastSuccessfulReplayAt,
    isLoading,
    refresh,
  };
}

/**
 * Hook to manage offline mutations
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineMutation[]>([]);
  const [lastSuccessfulReplayAt, setLastSuccessfulReplayAt] = useState<number | null>(() =>
    getLastSuccessfulOfflineReplayAt(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const mutations = await offlineDB.getQueuedMutations();
      setQueue(mutations);
      setLastSuccessfulReplayAt(getLastSuccessfulOfflineReplayAt());
    } catch (error) {
      logOfflineError("refresh queue failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const retryMutation = async (id: number) => {
    await offlineDB.updateMutationStatus(id, "pending", {
      clearError: true,
    });
    await refresh();
  };

  const deleteMutation = async (id: number) => {
    await offlineDB.deleteMutation(id);
    await refresh();
  };

  const clearSynced = async () => {
    await offlineDB.clearSyncedMutations();
    await refresh();
  };

  const processNow = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await processOfflineQueue();
      const mutations = await offlineDB.getQueuedMutations();
      setQueue(mutations);
      setLastSuccessfulReplayAt(getLastSuccessfulOfflineReplayAt());
    } catch (error) {
      logOfflineError("process queue failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const mutations = await offlineDB.getQueuedMutations();
        if (mounted) {
          setQueue(mutations);
          setLastSuccessfulReplayAt(getLastSuccessfulOfflineReplayAt());
        }
      } catch (error) {
        logOfflineError("refresh queue failed", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    const interval = setInterval(loadInitial, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const counts = getOfflineQueueCounts(queue);

  return {
    queue,
    count: queue.length,
    pendingCount: counts.pendingCount,
    syncingCount: counts.syncingCount,
    failedCount: counts.failedCount,
    lastSuccessfulReplayAt,
    isLoading,
    refresh,
    processNow,
    retryMutation,
    deleteMutation,
    clearSynced,
  };
}
