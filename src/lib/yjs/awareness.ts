/**
 * Y.js Awareness Utilities
 *
 * Handles cursor positions and user presence for collaborative editing.
 * Integrates with Convex backend for cross-client synchronization.
 *
 * NOTE: This is a stub implementation. Full awareness sync requires:
 * 1. Convex backend endpoints for awareness updates
 * 2. Real-time subscription to other users' cursor positions
 */

import type { Id } from "@convex/_generated/dataModel";
import { YJS_CURSOR_COLORS } from "@convex/shared/colors";

// Types for cursor/selection state
export interface CursorPosition {
  anchor: {
    path: number[];
    offset: number;
  };
  focus: {
    path: number[];
    offset: number;
  };
}

export interface UserState {
  name: string;
  color: string;
  image?: string;
}

export interface AwarenessUser {
  userId: string;
  clientId: number;
  cursor?: CursorPosition;
  user?: UserState;
  isCurrentUser: boolean;
}

/**
 * Get a deterministic color for a user based on their ID
 */
export function getUserColor(userId: string): { main: string; light: string } {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return YJS_CURSOR_COLORS[Math.abs(hash) % YJS_CURSOR_COLORS.length];
}

/**
 * Parse awareness data from Convex backend
 */
export function parseAwarenessData(
  data: string,
): { cursor?: CursorPosition; user?: UserState } | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * AwarenessManager - Manages cursor positions and presence
 *
 * Handles periodic updates of local cursor position and
 * subscribes to remote cursor updates.
 */
export class AwarenessManager {
  private documentId: Id<"documents">;
  private clientId: number;
  private localState: { cursor?: CursorPosition; user?: UserState } = {};
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void) | null = null;
  private listeners: Set<(users: AwarenessUser[]) => void> = new Set();
  private connected = false;

  constructor(documentId: Id<"documents">, user?: { name: string; image?: string }) {
    this.documentId = documentId;
    this.clientId = Math.floor(Math.random() * 2147483647);

    // Set initial user state with color
    if (user) {
      const color = getUserColor(user.name);
      this.localState.user = {
        name: user.name,
        color: color.main,
        image: user.image,
      };
    }
  }

  /**
   * Start awareness sync
   */
  connect(): void {
    if (this.connected) {
      return;
    }

    this.connected = true;

    // Start periodic updates
    this.updateInterval = setInterval(() => this.broadcastState(), 1000);

    // Subscribe to remote awareness
    this.subscribeToAwareness();

    // Initial broadcast
    this.broadcastState();
  }

  /**
   * Stop awareness sync
   */
  disconnect(): void {
    if (!this.connected) {
      return;
    }

    this.connected = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove awareness from server
    this.removeAwareness();
  }

  /**
   * Update local cursor position
   */
  setCursor(cursor: CursorPosition | null): void {
    if (cursor) {
      this.localState.cursor = cursor;
    } else {
      delete this.localState.cursor;
    }
  }

  /**
   * Update user info
   */
  setUser(user: { name: string; image?: string }): void {
    const color = getUserColor(user.name);
    this.localState.user = {
      name: user.name,
      color: color.main,
      image: user.image,
    };
  }

  /**
   * Listen for remote awareness changes
   */
  onUpdate(callback: (users: AwarenessUser[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Broadcast local state to server
   *
   * NOTE: Stub implementation - full awareness requires backend integration
   */
  private async broadcastState(): Promise<void> {
    if (!this.connected) {
      return;
    }

    console.debug("[AwarenessManager] Broadcasting state (stub)", {
      documentId: this.documentId,
      clientId: this.clientId,
    });
  }

  /**
   * Subscribe to remote awareness updates
   *
   * NOTE: Stub implementation - full awareness requires backend integration
   */
  private subscribeToAwareness(): void {
    // Stub: Would set up Convex subscription
    console.debug("[AwarenessManager] Subscribed to awareness (stub)", {
      documentId: this.documentId,
    });
  }

  /**
   * Remove awareness from server on disconnect
   *
   * NOTE: Stub implementation - full awareness requires backend integration
   */
  private async removeAwareness(): Promise<void> {
    console.debug("[AwarenessManager] Removing awareness (stub)", {
      documentId: this.documentId,
    });
  }
}

/**
 * Hook-friendly awareness manager factory
 */
export function createAwarenessManager(
  documentId: Id<"documents">,
  user?: { name: string; image?: string },
): AwarenessManager {
  return new AwarenessManager(documentId, user);
}
