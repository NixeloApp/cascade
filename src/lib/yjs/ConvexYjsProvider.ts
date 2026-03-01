/**
 * Convex Y.js Provider
 *
 * Bridges Y.js documents with Convex backend for real-time collaboration.
 * Handles document state sync, conflict resolution, and awareness (cursors).
 *
 * NOTE: This is a stub implementation. Full Y.js sync requires:
 * 1. Convex backend endpoints for Y.js updates (convex/yjs.ts)
 * 2. WebSocket or polling-based real-time sync
 * 3. Proper conflict resolution
 */

import type { Id } from "@convex/_generated/dataModel";
import type { ConvexReactClient } from "convex/react";
import { Observable } from "lib0/observable";
import type * as Y from "yjs";

// Types
export interface ConvexYjsProviderOptions {
  documentId: Id<"documents">;
  client: ConvexReactClient;
  syncInterval?: number;
  compactThreshold?: number;
}

export interface AwarenessState {
  cursor?: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  user?: {
    name: string;
    color: string;
    image?: string;
  };
}

// User colors for collaboration
const USER_COLORS = [
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#673AB7", // Deep Purple
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#4CAF50", // Green
  "#FF9800", // Orange
];

/**
 * ConvexYjsProvider - Y.js Provider backed by Convex
 *
 * Usage:
 * ```typescript
 * const provider = new ConvexYjsProvider({
 *   documentId: doc._id,
 *   client: convexClient,
 * });
 * provider.connect(ydoc);
 *
 * // On cleanup
 * provider.disconnect();
 * ```
 */
export class ConvexYjsProvider extends Observable<string> {
  private documentId: Id<"documents">;
  private client: ConvexReactClient;
  private ydoc: Y.Doc | null = null;
  private syncInterval: number;
  private compactThreshold: number;
  private localVersion = 0;
  private pendingUpdates: string[] = [];
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private awarenessTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void) | null = null;
  private connected = false;
  private synced = false;
  private clientId: number;
  private awarenessState: AwarenessState = {};

  constructor(options: ConvexYjsProviderOptions) {
    super();
    this.documentId = options.documentId;
    this.client = options.client;
    this.syncInterval = options.syncInterval ?? 500;
    this.compactThreshold = options.compactThreshold ?? 50;
    this.clientId = Math.floor(Math.random() * 2147483647);
  }

  /**
   * Connect provider to a Y.Doc instance
   */
  connect(ydoc: Y.Doc): void {
    if (this.connected) {
      return;
    }

    this.ydoc = ydoc;
    this.connected = true;

    // Listen for local updates
    ydoc.on("update", this.handleLocalUpdate);

    // Start initial sync
    this.initialSync();

    // Subscribe to remote changes
    this.subscribeToChanges();

    // Start periodic sync for pending updates
    this.syncTimer = setInterval(() => this.flushUpdates(), this.syncInterval);

    // Start awareness updates
    this.awarenessTimer = setInterval(() => this.broadcastAwareness(), 1000);

    this.emit("status", [{ status: "connecting" }]);
  }

  /**
   * Disconnect provider from Y.Doc
   */
  disconnect(): void {
    if (!this.connected) {
      return;
    }

    this.connected = false;

    // Stop timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.awarenessTimer) {
      clearInterval(this.awarenessTimer);
      this.awarenessTimer = null;
    }

    // Unsubscribe from Convex
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove document listeners
    if (this.ydoc) {
      this.ydoc.off("update", this.handleLocalUpdate);
      this.ydoc = null;
    }

    // Clear awareness
    this.removeAwareness();

    this.synced = false;
    this.emit("status", [{ status: "disconnected" }]);
  }

  /**
   * Check if provider is connected
   */
  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if initial sync is complete
   */
  get isSynced(): boolean {
    return this.synced;
  }

  /**
   * Get current version
   */
  get version(): number {
    return this.localVersion;
  }

  /**
   * Set user awareness state (cursor, name, etc.)
   */
  setAwarenessState(state: AwarenessState): void {
    this.awarenessState = { ...this.awarenessState, ...state };
    this.broadcastAwareness();
  }

  /**
   * Handle local Y.Doc updates
   */
  private handleLocalUpdate = (update: Uint8Array, origin: unknown): void => {
    // Ignore updates from remote (we applied them)
    if (origin === this) {
      return;
    }

    // Queue update for batching
    const encoded = this.encodeUpdate(update);
    this.pendingUpdates.push(encoded);
  };

  /**
   * Initial sync - fetch server state and apply
   *
   * NOTE: Stub implementation - full sync requires backend integration
   */
  private async initialSync(): Promise<void> {
    if (!this.ydoc) {
      return;
    }

    // Mark as synced immediately for now (stub)
    // Full implementation would fetch state from Convex backend
    this.synced = true;
    this.emit("synced", [{ synced: true }]);
    this.emit("status", [{ status: "connected" }]);

    console.debug("[ConvexYjsProvider] Initial sync completed (stub)", {
      documentId: this.documentId,
    });
  }

  /**
   * Subscribe to Convex for remote changes
   *
   * NOTE: Stub implementation - full sync requires backend integration
   */
  private subscribeToChanges(): void {
    // Stub: Full implementation would use Convex subscriptions
    console.debug("[ConvexYjsProvider] Subscribed to changes (stub)", {
      documentId: this.documentId,
    });
  }

  /**
   * Flush pending local updates to server
   *
   * NOTE: Stub implementation - full sync requires backend integration
   */
  private async flushUpdates(): Promise<void> {
    if (this.pendingUpdates.length === 0 || !this.connected) {
      return;
    }

    // Clear pending updates (stub - would send to backend)
    const updateCount = this.pendingUpdates.length;
    this.pendingUpdates = [];

    console.debug("[ConvexYjsProvider] Flushed updates (stub)", {
      documentId: this.documentId,
      updateCount,
    });
  }

  /**
   * Broadcast awareness state to server
   *
   * NOTE: Stub implementation - full sync requires backend integration
   */
  private async broadcastAwareness(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Stub: Would send to backend
    console.debug("[ConvexYjsProvider] Broadcasting awareness (stub)", {
      documentId: this.documentId,
      clientId: this.clientId,
    });
  }

  /**
   * Remove awareness on disconnect
   *
   * NOTE: Stub implementation - full sync requires backend integration
   */
  private async removeAwareness(): Promise<void> {
    console.debug("[ConvexYjsProvider] Removing awareness (stub)", {
      documentId: this.documentId,
    });
  }

  /**
   * Encode Y.js update to base64 string
   */
  private encodeUpdate(update: Uint8Array): string {
    return btoa(String.fromCharCode(...update));
  }

  /**
   * Get a deterministic color for a user based on their ID
   */
  static getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }
}

// Re-export types
export type { Id };
