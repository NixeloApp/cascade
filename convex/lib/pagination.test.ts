import { describe, expect, it } from "vitest";
import {
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
  DONE_COLUMN_DAYS,
  decodeCursor,
  encodeCursor,
  getDoneColumnThreshold,
  getLoadingStrategy,
} from "./pagination";
import { DAY } from "./timeUtils";

describe("pagination utilities", () => {
  describe("constants", () => {
    it("should have correct default page size", () => {
      expect(DEFAULT_PAGE_SIZE).toBe(50);
    });

    it("should have correct done column days", () => {
      expect(DONE_COLUMN_DAYS).toBe(14);
    });
  });

  describe("encodeCursor", () => {
    it("should encode timestamp and id", () => {
      const cursor = encodeCursor(1705312345000, "item123");
      expect(cursor).toBe(btoa("1705312345000:item123"));
    });

    it("should handle different timestamp values", () => {
      const cursor1 = encodeCursor(0, "id1");
      const cursor2 = encodeCursor(Date.now(), "id2");

      expect(cursor1).toBeTruthy();
      expect(cursor2).toBeTruthy();
      expect(cursor1).not.toBe(cursor2);
    });

    it("should handle ids with special characters", () => {
      const cursor = encodeCursor(1000, "id_with-special.chars");
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe("id_with-special.chars");
    });
  });

  describe("decodeCursor", () => {
    it("should decode cursor to timestamp and id", () => {
      const cursor = encodeCursor(1705312345000, "item123");
      const decoded = decodeCursor(cursor);

      expect(decoded.timestamp).toBe(1705312345000);
      expect(decoded.id).toBe("item123");
    });

    it("should roundtrip encode/decode", () => {
      const timestamp = Date.now();
      const id = "test-id-abc123";
      const cursor = encodeCursor(timestamp, id);
      const decoded = decodeCursor(cursor);

      expect(decoded.timestamp).toBe(timestamp);
      expect(decoded.id).toBe(id);
    });

    it("should throw for invalid cursor format - no colon", () => {
      const badCursor = btoa("invalidformat");
      expect(() => decodeCursor(badCursor)).toThrow("Invalid cursor format");
    });

    it("should throw for invalid cursor format - empty parts", () => {
      const badCursor = btoa(":id");
      expect(() => decodeCursor(badCursor)).toThrow("Invalid cursor format");
    });

    it("should throw for invalid timestamp", () => {
      const badCursor = btoa("notanumber:id123");
      expect(() => decodeCursor(badCursor)).toThrow("Invalid timestamp in cursor");
    });

    it("should throw for non-base64 cursor", () => {
      expect(() => decodeCursor("!!!notbase64!!!")).toThrow("Invalid pagination cursor");
    });
  });

  describe("getDoneColumnThreshold", () => {
    it("should return threshold with default days", () => {
      const now = Date.now();
      const threshold = getDoneColumnThreshold(now);
      expect(threshold).toBe(now - DONE_COLUMN_DAYS * DAY);
    });

    it("should return threshold with custom days", () => {
      const now = Date.now();
      const threshold = getDoneColumnThreshold(now, 7);
      expect(threshold).toBe(now - 7 * DAY);
    });

    it("should handle zero days", () => {
      const now = Date.now();
      const threshold = getDoneColumnThreshold(now, 0);
      expect(threshold).toBe(now);
    });
  });

  describe("getLoadingStrategy", () => {
    it("should return 'all' for todo category", () => {
      expect(getLoadingStrategy("todo")).toBe("all");
    });

    it("should return 'all' for inprogress category", () => {
      expect(getLoadingStrategy("inprogress")).toBe("all");
    });

    it("should return 'recent' for done category", () => {
      expect(getLoadingStrategy("done")).toBe("recent");
    });
  });

  describe("buildPaginatedResult", () => {
    const createItem = (id: string, updatedAt: number) => ({
      _id: { toString: () => id },
      updatedAt,
      name: `Item ${id}`,
    });

    it("should return all items when less than page size", () => {
      const items = [createItem("1", 1000), createItem("2", 2000), createItem("3", 3000)];

      const result = buildPaginatedResult(items, 10);

      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should return page size items when exactly page size", () => {
      const items = [createItem("1", 1000), createItem("2", 2000)];

      const result = buildPaginatedResult(items, 2);

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should indicate hasMore when items exceed page size", () => {
      const items = [
        createItem("1", 1000),
        createItem("2", 2000),
        createItem("3", 3000),
        createItem("4", 4000), // Extra item beyond page size
      ];

      const result = buildPaginatedResult(items, 3);

      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });

    it("should build correct cursor from last item", () => {
      const items = [createItem("1", 1000), createItem("2", 2000), createItem("3", 3000)];

      const result = buildPaginatedResult(items, 2);

      expect(result.nextCursor).not.toBeNull();
      if (result.nextCursor === null) throw new Error("nextCursor is null");
      const decoded = decodeCursor(result.nextCursor);
      expect(decoded.timestamp).toBe(2000);
      expect(decoded.id).toBe("2");
    });

    it("should include total count when provided", () => {
      const items = [createItem("1", 1000)];

      const result = buildPaginatedResult(items, 10, 100);

      expect(result.totalCount).toBe(100);
    });

    it("should handle empty items array", () => {
      const result = buildPaginatedResult([], 10);

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should use createdAt when updatedAt is missing", () => {
      const items = [
        { _id: { toString: () => "1" }, createdAt: 1000 },
        { _id: { toString: () => "2" }, createdAt: 2000 },
        { _id: { toString: () => "3" }, createdAt: 3000 },
      ];

      const result = buildPaginatedResult(items, 2);

      expect(result.nextCursor).not.toBeNull();
      if (result.nextCursor === null) throw new Error("nextCursor is null");
      const decoded = decodeCursor(result.nextCursor);
      expect(decoded.timestamp).toBe(2000);
    });

    it("should throw when item missing both timestamps", () => {
      const items = [
        { _id: { toString: () => "1" } },
        { _id: { toString: () => "2" } },
        { _id: { toString: () => "3" } },
      ];

      expect(() => buildPaginatedResult(items, 2)).toThrow(
        "Cannot build pagination cursor: item missing both updatedAt and createdAt",
      );
    });
  });
});
