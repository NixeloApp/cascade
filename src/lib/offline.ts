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
export const MAX_OFFLINE_REPLAY_ATTEMPTS = 3;
const LAST_SUCCESSFUL_OFFLINE_REPLAY_AT_STORAGE_KEY = "nixelo-offline-last-successful-replay-at";

type OfflineMutationArgs = Record<string, unknown>;
export type OfflineReplayHandler = (args: OfflineMutationArgs) => Promise<void>;

interface UpdateMutationStatusOptions {
  error?: string;
  incrementAttempts?: boolean;
  clearError?: boolean;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

function hasRegistrationSync(
  registration: ServiceWorkerRegistration,
): registration is ServiceWorkerRegistrationWithSync {
  return "sync" in registration;
}

export interface OfflineMutation {
  id?: number;
  userId?: string;
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

export class UnsupportedOfflineMutationError extends Error {
  constructor(mutationType: string) {
    super(`Unsupported offline mutation type: ${mutationType}`);
    this.name = "UnsupportedOfflineMutationError";
  }
}

const offlineReplayHandlers = new Map<string, OfflineReplayHandler>();

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function recordLastSuccessfulOfflineReplayAt(timestamp: number): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(LAST_SUCCESSFUL_OFFLINE_REPLAY_AT_STORAGE_KEY, String(timestamp));
  } catch (error) {
    console.info("[offline] Failed to persist last successful replay time", { error });
  }
}

export function getLastSuccessfulOfflineReplayAt(): number | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const storedValue = storage.getItem(LAST_SUCCESSFUL_OFFLINE_REPLAY_AT_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const timestamp = Number(storedValue);
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch (error) {
    console.info("[offline] Failed to read last successful replay time", { error });
    return null;
  }
}

function applyMutationStatusUpdate(
  mutation: OfflineMutation,
  status: OfflineMutation["status"],
  options: UpdateMutationStatusOptions,
): OfflineMutation {
  mutation.status = status;
  if (options.incrementAttempts) {
    mutation.attempts = (mutation.attempts || 0) + 1;
  }
  if (options.clearError) {
    delete mutation.error;
  }
  if (options.error) {
    mutation.error = options.error;
  }
  if (status === "synced") {
    mutation.syncedAt = Date.now();
  }
  return mutation;
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

  async getQueuedMutations(): Promise<OfflineMutation[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readonly");
      const store = transaction.objectStore("mutations");
      const request = store.getAll();

      request.onsuccess = () => {
        const mutations = (request.result as OfflineMutation[])
          .filter((mutation) => mutation.status !== "synced")
          .sort((left, right) => right.timestamp - left.timestamp);
        resolve(mutations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateMutationStatus(
    id: number,
    status: OfflineMutation["status"],
    options: UpdateMutationStatusOptions = {},
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["mutations"], "readwrite");
      const store = transaction.objectStore("mutations");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const mutation = getRequest.result as OfflineMutation;
        if (!mutation) {
          resolve();
          return;
        }

        const updatedMutation = applyMutationStatusUpdate(mutation, status, options);
        const putRequest = store.put(updatedMutation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
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
  private _isOnline = !(typeof navigator !== "undefined" && navigator.onLine === false);

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      // Treat an explicit offline signal as authoritative at startup so hard reloads while offline
      // can recover from persisted local state instead of blocking on network-only bootstrap.
      // We still fall back to true otherwise because navigator.onLine is not perfectly reliable.
    }
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.notifyListeners();

    // Trigger sync when coming back online
    if (this.canScheduleBackgroundSync()) {
      this.scheduleBackgroundSync();
    }
  };

  private scheduleBackgroundSync(): void {
    navigator.serviceWorker.ready
      .then((registration) => this.registerBackgroundSync(registration))
      .catch((error: unknown) => {
        console.info("[offline] Failed waiting for service worker readiness", { error });
      });
  }

  private registerBackgroundSync(registration: ServiceWorkerRegistration): Promise<void> {
    if (!hasRegistrationSync(registration)) {
      return Promise.resolve();
    }

    return registration.sync.register("sync-mutations").catch((error: unknown) => {
      console.info("[offline] Failed to register background sync", { error });
    });
  }

  private hasSyncManager(): boolean {
    return "sync" in ServiceWorkerRegistration.prototype;
  }

  private canScheduleBackgroundSync(): boolean {
    return "serviceWorker" in navigator && this.hasSyncManager();
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
  mutationArgs: OfflineMutationArgs,
  userId?: string,
) {
  const mutation: Omit<OfflineMutation, "id"> = {
    mutationType,
    mutationArgs: JSON.stringify(mutationArgs),
    status: "pending",
    attempts: 0,
    timestamp: Date.now(),
    userId,
  };

  const id = await offlineDB.addMutation(mutation);
  return id;
}

/**
 * Processes pending offline mutations. Attempts to sync each mutation,
 * marking as synced on success or failed after 3 retries.
 */
let isProcessingQueue = false;

export async function processOfflineQueue(userId?: string) {
  if (isProcessingQueue) {
    return;
  }
  isProcessingQueue = true;
  try {
    const pending = await offlineDB.getPendingMutations();
    // Strict scoping: only process items owned by the current user.
    // Items without a userId (legacy) are only processed when no userId filter is given.
    const scoped = userId ? pending.filter((m) => m.userId === userId) : pending;

    for (const mutation of scoped) {
      await processQueuedMutation(mutation);
    }
  } finally {
    isProcessingQueue = false;
  }
}

function getNextFailureStatus(attempts: number): "failed" | "pending" {
  return attempts >= MAX_OFFLINE_REPLAY_ATTEMPTS ? "failed" : "pending";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isOfflineMutationArgs(value: unknown): value is OfflineMutationArgs {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateQueuedMutationArgs(rawArgs: string): OfflineMutationArgs {
  const parsed: unknown = JSON.parse(rawArgs);
  if (!isOfflineMutationArgs(parsed)) {
    throw new Error("Queued mutation args must be a JSON object");
  }
  return parsed;
}

function getOfflineReplayHandler(mutationType: string): OfflineReplayHandler {
  const handler = offlineReplayHandlers.get(mutationType);
  if (!handler) {
    throw new UnsupportedOfflineMutationError(mutationType);
  }
  return handler;
}

export function registerOfflineReplayHandler(
  mutationType: string,
  handler: OfflineReplayHandler,
): () => void {
  offlineReplayHandlers.set(mutationType, handler);
  return () => {
    offlineReplayHandlers.delete(mutationType);
  };
}

async function persistMutationFailureStatus(
  mutation: OfflineMutation,
  nextStatus: "failed" | "pending",
  error: unknown,
): Promise<void> {
  if (!mutation.id) return;

  try {
    await offlineDB.updateMutationStatus(mutation.id, nextStatus, {
      error: getErrorMessage(error),
    });
  } catch (statusError) {
    console.info("[offline] Failed to persist queued mutation failure status", {
      id: mutation.id,
      mutationType: mutation.mutationType,
      statusError,
    });
  }
}

async function processQueuedMutation(mutation: OfflineMutation): Promise<void> {
  if (!mutation.id) {
    console.info("[offline] Skipping queued mutation without id", {
      mutationType: mutation.mutationType,
      timestamp: mutation.timestamp,
    });
    return;
  }

  const nextAttemptCount = mutation.attempts + 1;

  try {
    await offlineDB.updateMutationStatus(mutation.id, "syncing", {
      incrementAttempts: true,
      clearError: true,
    });
    const args = validateQueuedMutationArgs(mutation.mutationArgs);
    const handler = getOfflineReplayHandler(mutation.mutationType);
    await handler(args);
    const completedAt = Date.now();
    await offlineDB.updateMutationStatus(mutation.id, "synced", {
      clearError: true,
    });
    recordLastSuccessfulOfflineReplayAt(completedAt);
  } catch (error) {
    const nextStatus = getNextFailureStatus(mutation.attempts + 1);
    console.info("[offline] Failed to process queued mutation", {
      id: mutation.id,
      mutationType: mutation.mutationType,
      attempts: nextAttemptCount,
      nextStatus,
      error,
    });
    await persistMutationFailureStatus(mutation, nextStatus, error);
  }
}
