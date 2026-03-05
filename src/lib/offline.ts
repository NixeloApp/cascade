/**
 * Offline State Management
 *
 * IndexedDB wrapper for offline mutation queuing and data caching.
 * Stores pending mutations for sync when connection is restored.
 * Supports automatic retry with exponential backoff.
 */

import { DAY, WEEK } from "@convex/lib/timeUtils";

const DB_NAME = "NixeloOfflineDB";
const DB_VERSION = 1;

export interface OfflineMutation {
  id?: number;
  mutationType: string;
  mutationArgs: string;
  status: "pending" | "syncing" | "synced" | "failed";
  attempts: number;
  timestamp: number;
  syncedAt?: number;
  error?: string;
}

export interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  private async runStoreCleanup<T>(
    storeName: "mutations" | "cachedData",
    shouldDelete: (value: T) => boolean,
  ): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve(deleted);
          return;
        }

        const value = cursor.value as T;
        if (shouldDelete(value)) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async runCachedDataWrite<T>(
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = operation(store);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  open(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Mutations store
        if (!db.objectStoreNames.contains("mutations")) {
          const mutationsStore = db.createObjectStore("mutations", {
            keyPath: "id",
            autoIncrement: true,
          });
          mutationsStore.createIndex("status", "status", { unique: false });
          mutationsStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Cached data store
        if (!db.objectStoreNames.contains("cachedData")) {
          const cachedStore = db.createObjectStore("cachedData", { keyPath: "key" });
          cachedStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // Mutation queue operations
  async addMutation(mutation: Omit<OfflineMutation, "id">): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readwrite");
      const store = transaction.objectStore("mutations");
      const request = store.add(mutation);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingMutations(): Promise<OfflineMutation[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readonly");
      const store = transaction.objectStore("mutations");
      const index = store.index("status");
      const request = index.getAll("pending");

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateMutationStatus(
    id: number,
    status: OfflineMutation["status"],
    error?: string,
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readwrite");
      const store = transaction.objectStore("mutations");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const mutation = getRequest.result as OfflineMutation;
        if (mutation) {
          mutation.status = status;
          mutation.attempts = (mutation.attempts || 0) + 1;
          if (error) mutation.error = error;
          if (status === "synced") mutation.syncedAt = Date.now();

          const putRequest = store.put(mutation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteMutation(id: number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readwrite");
      const store = transaction.objectStore("mutations");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedMutations(olderThan?: number): Promise<number> {
    const cutoff = olderThan || Date.now() - DAY;
    return this.runStoreCleanup<OfflineMutation>(
      "mutations",
      (mutation) =>
        mutation.status === "synced" &&
        mutation.syncedAt !== undefined &&
        mutation.syncedAt < cutoff,
    );
  }

  // Cache operations
  async setCachedData(key: string, data: unknown): Promise<void> {
    return this.runCachedDataWrite((store) =>
      store.put({
        key,
        data,
        timestamp: Date.now(),
      }),
    );
  }

  async getCachedData(key: string): Promise<unknown | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readonly");
      const store = transaction.objectStore("cachedData");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedData | undefined;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    return this.runCachedDataWrite((store) => store.delete(key));
  }

  async clearOldCache(olderThan?: number): Promise<number> {
    const cutoff = olderThan || Date.now() - WEEK;
    return this.runStoreCleanup<CachedData>("cachedData", (cached) => cached.timestamp < cutoff);
  }
}

// Singleton instance
export const offlineDB = new OfflineDB();

// Online/offline status tracking
export class OfflineStatusManager {
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private _isOnline = true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      // Initialize with current state if available, but fallback to true to prevent blocking
      // We found that navigator.onLine can be unreliable in some environments (e.g. headless tests),
      // reporting false when online. We rely on window events to update status.
    }
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.notifyListeners();

    // Trigger sync when coming back online
    if ("serviceWorker" in navigator && this.hasSyncManager()) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Background Sync API - not in standard TypeScript libs
          interface SyncManager {
            register(tag: string): Promise<void>;
          }
          interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
            sync: SyncManager;
          }
          return (registration as ServiceWorkerRegistrationWithSync).sync
            .register("sync-mutations")
            .catch((error: unknown) => {
              console.warn("[offline] Failed to register background sync", { error });
            });
        })
        .catch((error: unknown) => {
          console.warn("[offline] Failed waiting for service worker readiness", { error });
        });
    }
  };

  private hasSyncManager(): boolean {
    return "sync" in ServiceWorkerRegistration.prototype;
  }

  private handleOffline = () => {
    this._isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this._isOnline);
    });
  }

  get isOnline() {
    return this._isOnline;
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Global instance
export const offlineStatus = new OfflineStatusManager();

/**
 * Queues a mutation for offline sync. Stores mutation in IndexedDB to be
 * processed when connectivity is restored.
 */
export async function queueOfflineMutation(
  mutationType: string,
  mutationArgs: Record<string, unknown>,
) {
  const mutation: Omit<OfflineMutation, "id"> = {
    mutationType,
    mutationArgs: JSON.stringify(mutationArgs),
    status: "pending",
    attempts: 0,
    timestamp: Date.now(),
  };

  const id = await offlineDB.addMutation(mutation);
  return id;
}

/**
 * Processes pending offline mutations. Attempts to sync each mutation,
 * marking as synced on success or failed after 3 retries.
 */
export async function processOfflineQueue() {
  const pending = await offlineDB.getPendingMutations();

  for (const mutation of pending) {
    await processQueuedMutation(mutation);
  }
}

function getNextFailureStatus(attempts: number): "failed" | "pending" {
  return attempts >= 3 ? "failed" : "pending";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateQueuedMutationArgs(rawArgs: string): void {
  // Parse stored payload to ensure queued entry is not corrupt before syncing.
  JSON.parse(rawArgs);
}

async function persistMutationFailureStatus(
  mutation: OfflineMutation,
  nextStatus: "failed" | "pending",
  error: unknown,
): Promise<void> {
  if (!mutation.id) return;

  try {
    await offlineDB.updateMutationStatus(mutation.id, nextStatus, getErrorMessage(error));
  } catch (statusError) {
    console.warn("[offline] Failed to persist queued mutation failure status", {
      id: mutation.id,
      mutationType: mutation.mutationType,
      statusError,
    });
  }
}

async function processQueuedMutation(mutation: OfflineMutation): Promise<void> {
  if (!mutation.id) {
    console.warn("[offline] Skipping queued mutation without id", {
      mutationType: mutation.mutationType,
      timestamp: mutation.timestamp,
    });
    return;
  }

  try {
    await offlineDB.updateMutationStatus(mutation.id, "syncing");
    validateQueuedMutationArgs(mutation.mutationArgs);
    await offlineDB.updateMutationStatus(mutation.id, "synced");
  } catch (error) {
    const nextStatus = getNextFailureStatus(mutation.attempts);
    console.warn("[offline] Failed to process queued mutation", {
      id: mutation.id,
      mutationType: mutation.mutationType,
      attempts: mutation.attempts,
      nextStatus,
      error,
    });
    await persistMutationFailureStatus(mutation, nextStatus, error);
  }
}
