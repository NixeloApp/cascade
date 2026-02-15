/**
 * Unit tests for ConvexYjsProvider utilities
 */

import type { ConvexReactClient } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import type { Id } from "../../../convex/_generated/dataModel";
import { ConvexYjsProvider } from "./ConvexYjsProvider";

describe("ConvexYjsProvider", () => {
  describe("getUserColor", () => {
    it("returns a consistent color for the same user ID", () => {
      const color1 = ConvexYjsProvider.getUserColor("user-123");
      const color2 = ConvexYjsProvider.getUserColor("user-123");
      expect(color1).toBe(color2);
    });

    it("returns different colors for different user IDs", () => {
      const color1 = ConvexYjsProvider.getUserColor("user-123");
      const color2 = ConvexYjsProvider.getUserColor("user-456");
      // Note: could theoretically be the same due to hash collision, but unlikely
      expect(color1).not.toBe(color2);
    });

    it("returns a valid hex color", () => {
      const color = ConvexYjsProvider.getUserColor("test-user");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("handles empty string", () => {
      const color = ConvexYjsProvider.getUserColor("");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("handles special characters", () => {
      const color = ConvexYjsProvider.getUserColor("user@example.com");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe("Lifecycle and Sync", () => {
    let provider: ConvexYjsProvider;
    let mockClient: ConvexReactClient;
    let ydoc: Y.Doc;
    const docId = "doc-123" as Id<"documents">;

    beforeEach(() => {
      // Mock ConvexReactClient
      mockClient = {} as unknown as ConvexReactClient;

      ydoc = new Y.Doc();

      provider = new ConvexYjsProvider({
        documentId: docId,
        client: mockClient,
        syncInterval: 100, // Fast interval for testing
      });
    });

    afterEach(() => {
      provider.disconnect();
      ydoc.destroy();
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("should initialize in disconnected state", () => {
      expect(provider.isConnected).toBe(false);
      expect(provider.isSynced).toBe(false);
    });

    it("should connect and sync", () => {
      provider.connect(ydoc);
      expect(provider.isConnected).toBe(true);
      // In the stub, it syncs immediately
      expect(provider.isSynced).toBe(true);
    });

    it("should disconnect correctly", () => {
      provider.connect(ydoc);
      provider.disconnect();
      expect(provider.isConnected).toBe(false);
      expect(provider.isSynced).toBe(false);
    });

    it("should process local updates", async () => {
      const consoleSpy = vi.spyOn(console, "debug");
      vi.useFakeTimers();

      provider.connect(ydoc);

      // Make a change to the doc
      ydoc.getText("content").insert(0, "Hello World");

      // Fast-forward time to trigger sync
      vi.advanceTimersByTime(150);

      // Check if flushUpdates logged the update
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Flushed updates"),
        expect.objectContaining({
          documentId: docId,
          updateCount: 1,
        }),
      );
    });

    it("should broadcast awareness updates", () => {
      const consoleSpy = vi.spyOn(console, "debug");
      provider.connect(ydoc);

      provider.setAwarenessState({
        user: { name: "Test User", color: "#000000" },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Broadcasting awareness"),
        expect.any(Object),
      );
    });
  });
});
