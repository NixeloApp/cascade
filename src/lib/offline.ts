// Offline state management and IndexedDB wrapper

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
    const db = await this.open();
    const cutoff = olderThan || Date.now() - DAY;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readwrite");
      const store = transaction.objectStore("mutations");
      const request = store.openCursor();
      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const mutation = cursor.value as OfflineMutation;
          if (mutation.status === "synced" && mutation.syncedAt && mutation.syncedAt < cutoff) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache operations
  async setCachedData(key: string, data: unknown): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldCache(olderThan?: number): Promise<number> {
    const db = await this.open();
    const cutoff = olderThan || Date.now() - WEEK;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = store.openCursor();
      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cached = cursor.value as CachedData;
          if (cached.timestamp < cutoff) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
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
      navigator.serviceWorker.ready.then((registration) => {
        // Background Sync API - not in standard TypeScript libs
        interface SyncManager {
          register(tag: string): Promise<void>;
        }
        interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
          sync: SyncManager;
        }
        return (registration as ServiceWorkerRegistrationWithSync).sync.register("sync-mutations");
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

// Queue a mutation for offline sync
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

// Process offline queue
export async function processOfflineQueue() {
  const pending = await offlineDB.getPendingMutations();

  for (const mutation of pending) {
    if (!mutation.id) continue;

    try {
      await offlineDB.updateMutationStatus(mutation.id, "syncing");

      // Parse mutation args
      const _args = JSON.parse(mutation.mutationArgs);

      // Mark as synced
      await offlineDB.updateMutationStatus(mutation.id, "synced");
    } catch (error) {
      await offlineDB.updateMutationStatus(
        mutation.id,
        mutation.attempts >= 3 ? "failed" : "pending",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
