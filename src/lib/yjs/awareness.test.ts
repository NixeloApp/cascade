/**
 * Unit tests for Y.js awareness utilities
 */

import { describe, expect, it } from "vitest";
import { getUserColor, parseAwarenessData } from "./awareness";

describe("Awareness Utilities", () => {
  describe("getUserColor", () => {
    it("returns consistent colors for the same user", () => {
      const color1 = getUserColor("user-123");
      const color2 = getUserColor("user-123");
      expect(color1).toEqual(color2);
    });

    it("returns different colors for different users", () => {
      const color1 = getUserColor("user-123");
      const color2 = getUserColor("user-456");
      // Could theoretically collide, but very unlikely
      expect(color1).not.toEqual(color2);
    });

    it("returns main and light color variants", () => {
      const color = getUserColor("test-user");
      expect(color.main).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color.light).toMatch(/^rgba\(/);
    });

    it("handles empty string", () => {
      const color = getUserColor("");
      expect(color.main).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color.light).toMatch(/^rgba\(/);
    });

    it("handles special characters", () => {
      const color = getUserColor("test@example.com");
      expect(color.main).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe("parseAwarenessData", () => {
    it("parses valid cursor data", () => {
      const data = JSON.stringify({
        cursor: {
          anchor: { path: [0, 0], offset: 5 },
          focus: { path: [0, 0], offset: 10 },
        },
      });

      const result = parseAwarenessData(data);

      expect(result).not.toBeNull();
      expect(result?.cursor?.anchor.path).toEqual([0, 0]);
      expect(result?.cursor?.anchor.offset).toBe(5);
      expect(result?.cursor?.focus.offset).toBe(10);
    });

    it("parses valid user data", () => {
      const data = JSON.stringify({
        user: {
          name: "Test User",
          color: "#F44336",
          image: "https://example.com/avatar.png",
        },
      });

      const result = parseAwarenessData(data);

      expect(result).not.toBeNull();
      expect(result?.user?.name).toBe("Test User");
      expect(result?.user?.color).toBe("#F44336");
      expect(result?.user?.image).toBe("https://example.com/avatar.png");
    });

    it("parses combined cursor and user data", () => {
      const data = JSON.stringify({
        cursor: {
          anchor: { path: [0], offset: 0 },
          focus: { path: [0], offset: 0 },
        },
        user: {
          name: "Alice",
          color: "#2196F3",
        },
      });

      const result = parseAwarenessData(data);

      expect(result).not.toBeNull();
      expect(result?.cursor).not.toBeUndefined();
      expect(result?.cursor?.anchor.path).toEqual([0]);
      expect(result?.cursor?.anchor.offset).toBe(0);
      expect(result?.user?.name).toBe("Alice");
      expect(result?.user?.color).toBe("#2196F3");
    });

    it("returns null for invalid JSON", () => {
      const result = parseAwarenessData("not valid json");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parseAwarenessData("");
      expect(result).toBeNull();
    });

    it("parses empty object", () => {
      const result = parseAwarenessData("{}");
      expect(result).toEqual({});
    });

    it("handles missing optional fields", () => {
      const data = JSON.stringify({
        user: { name: "Test", color: "#000" },
      });

      const result = parseAwarenessData(data);

      expect(result?.user?.image).toBeUndefined();
      expect(result?.cursor).toBeUndefined();
    });
  });
});
