import { describe, expect, it, vi } from "vitest";
import {
  BOUNDED_COUNT_LIMIT,
  BOUNDED_DELETE_BATCH,
  BOUNDED_LIST_LIMIT,
  BOUNDED_RELATION_LIMIT,
  BOUNDED_SEARCH_LIMIT,
  BOUNDED_SELECT_LIMIT,
  boundedCollect,
  boundedCollectWithFilter,
  boundedCount,
  safeCollect,
  type TakeableQuery,
} from "./boundedQueries";

// Mock query helper
function mockQuery<T>(items: T[]): TakeableQuery<T> {
  return {
    take: vi.fn((n: number) => Promise.resolve(items.slice(0, n))),
  };
}

describe("boundedQueries", () => {
  describe("Constants", () => {
    it("should define reasonable default limits", () => {
      expect(BOUNDED_LIST_LIMIT).toBe(100);
      expect(BOUNDED_RELATION_LIMIT).toBe(100);
      expect(BOUNDED_SEARCH_LIMIT).toBe(100);
      expect(BOUNDED_DELETE_BATCH).toBe(100);
      expect(BOUNDED_COUNT_LIMIT).toBe(500);
      expect(BOUNDED_SELECT_LIMIT).toBe(50);
    });
  });

  describe("boundedCollect", () => {
    it("should return all items when under limit", async () => {
      const items = [1, 2, 3, 4, 5];
      const query = mockQuery(items);

      const result = await boundedCollect(query, { limit: 10 });

      expect(result.items).toEqual(items);
      expect(result.hasMore).toBe(false);
      expect(result.limit).toBe(10);
    });

    it("should indicate hasMore when items exceed limit", async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const query = mockQuery(items);

      const result = await boundedCollect(query, { limit: 10 });

      expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("should use default limit when not specified", async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await boundedCollect(query);

      expect(result.limit).toBe(BOUNDED_LIST_LIMIT);
      expect(result.hasMore).toBe(false);
    });

    it("should request limit + 1 to check for more items", async () => {
      const items = [1, 2, 3];
      const query = mockQuery(items);

      await boundedCollect(query, { limit: 5 });

      expect(query.take).toHaveBeenCalledWith(6); // limit + 1
    });
  });

  describe("boundedCount", () => {
    it("should return exact count when under limit", async () => {
      const items = [1, 2, 3, 4, 5];
      const query = mockQuery(items);

      const result = await boundedCount(query, { limit: 10 });

      expect(result.count).toBe(5);
      expect(result.isExact).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("should return capped count when at limit", async () => {
      const items = Array.from({ length: 15 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await boundedCount(query, { limit: 10 });

      expect(result.count).toBe(10);
      expect(result.isExact).toBe(false);
      expect(result.limit).toBe(10);
    });

    it("should use default limit when not specified", async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await boundedCount(query);

      expect(result.limit).toBe(BOUNDED_COUNT_LIMIT);
    });

    it("should return zero for empty query", async () => {
      const query = mockQuery([]);

      const result = await boundedCount(query, { limit: 10 });

      expect(result.count).toBe(0);
      expect(result.isExact).toBe(true);
    });
  });

  describe("boundedCollectWithFilter", () => {
    it("should filter items and respect target limit", async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const query = mockQuery(items);

      const result = await boundedCollectWithFilter(query, {
        filter: (n) => n % 2 === 0, // Even numbers only
        targetLimit: 3,
      });

      expect(result.items).toEqual([2, 4, 6]);
      expect(result.limit).toBe(3);
    });

    it("should indicate hasMore when fetch limit reached", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await boundedCollectWithFilter(query, {
        filter: () => true,
        targetLimit: 10,
      });

      expect(result.hasMore).toBe(true);
    });

    it("should not indicate hasMore when fetch limit not reached", async () => {
      const items = [1, 2, 3];
      const query = mockQuery(items);

      const result = await boundedCollectWithFilter(query, {
        filter: () => true,
        targetLimit: 10,
      });

      expect(result.hasMore).toBe(false);
    });

    it("should use fetchMultiplier to fetch extra items", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const query = mockQuery(items);

      await boundedCollectWithFilter(query, {
        filter: () => true,
        targetLimit: 10,
        fetchMultiplier: 2,
      });

      expect(query.take).toHaveBeenCalledWith(20); // 10 * 2
    });

    it("should default to fetchMultiplier of 3", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const query = mockQuery(items);

      await boundedCollectWithFilter(query, {
        filter: () => true,
        targetLimit: 10,
      });

      expect(query.take).toHaveBeenCalledWith(30); // 10 * 3
    });
  });

  describe("safeCollect", () => {
    it("should return all items when under limit", async () => {
      const items = [1, 2, 3, 4, 5];
      const query = mockQuery(items);

      const result = await safeCollect(query, 10);

      expect(result).toEqual(items);
    });

    it("should truncate items when over limit", async () => {
      const items = Array.from({ length: 15 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await safeCollect(query, 10);

      expect(result).toHaveLength(10);
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("should use default limit when not specified", async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const query = mockQuery(items);

      const result = await safeCollect(query);

      expect(result).toHaveLength(50);
    });
  });
});
