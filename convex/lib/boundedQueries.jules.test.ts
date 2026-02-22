import { describe, expect, it, vi } from "vitest";
import type { CountableQuery, TakeableQuery } from "./boundedQueries";
import {
  boundedCollect,
  boundedCollectWithFilter,
  boundedCount,
  efficientCount,
  safeCollect,
} from "./boundedQueries";
import { logger } from "./logger";

// Mock Query implementation
class TestQuery<T> implements TakeableQuery<T> {
  constructor(protected data: T[]) {}

  async take(n: number): Promise<T[]> {
    return this.data.slice(0, n);
  }
}

// Mock Countable Query implementation
class TestCountableQuery<T> extends TestQuery<T> implements CountableQuery<T> {
  async count(): Promise<number> {
    return this.data.length;
  }
}

describe("boundedQueries", () => {
  describe("boundedCollect", () => {
    it("should collect all items when count < limit", async () => {
      const data = [1, 2, 3];
      const query = new TestQuery(data);
      const result = await boundedCollect(query, { limit: 10 });
      expect(result.items).toEqual(data);
      expect(result.hasMore).toBe(false);
      expect(result.limit).toBe(10);
    });

    it("should collect exact limit items when count > limit", async () => {
      const data = [1, 2, 3, 4, 5];
      const query = new TestQuery(data);
      const result = await boundedCollect(query, { limit: 3 });
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(3);
    });

    it("should handle empty result", async () => {
      const query = new TestQuery([]);
      const result = await boundedCollect(query, { limit: 10 });
      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it("should respect default limit", async () => {
      // BOUNDED_LIST_LIMIT is 100
      const data = Array.from({ length: 101 }, (_, i) => i);
      const query = new TestQuery(data);
      const result = await boundedCollect(query);
      expect(result.items.length).toBe(100);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(100);
    });
  });

  describe("boundedCount", () => {
    it("should return exact count when count < limit", async () => {
      const data = [1, 2, 3];
      const query = new TestQuery(data);
      const result = await boundedCount(query, { limit: 10 });
      expect(result.count).toBe(3);
      expect(result.isExact).toBe(true);
    });

    it("should cap count when count >= limit", async () => {
      // Note: boundedCount takes limit items. If it gets limit items, it considers it exact if length < limit.
      // So if we have 5 items and limit is 5. take(5) returns 5 items.
      // isExact is 5 < 5 which is false.

      const data = [1, 2, 3, 4, 5];
      const query = new TestQuery(data);
      const result = await boundedCount(query, { limit: 5 });
      expect(result.count).toBe(5);
      expect(result.isExact).toBe(false);
    });

    it("should handle limit correctly when more items exist", async () => {
      const data = [1, 2, 3, 4, 5, 6];
      const query = new TestQuery(data);
      const result = await boundedCount(query, { limit: 5 });
      expect(result.count).toBe(5);
      expect(result.isExact).toBe(false);
    });
  });

  describe("boundedCollectWithFilter", () => {
    it("should filter items correctly", async () => {
      const data = [1, 2, 3, 4, 5];
      const query = new TestQuery(data);
      const result = await boundedCollectWithFilter(query, {
        filter: (n) => n % 2 === 0,
        targetLimit: 10,
      });
      expect(result.items).toEqual([2, 4]);
      expect(result.hasMore).toBe(false);
    });

    it("should respect targetLimit", async () => {
      const data = [1, 2, 3, 4, 5, 6]; // evens: 2, 4, 6
      const query = new TestQuery(data);
      const result = await boundedCollectWithFilter(query, {
        filter: (n) => n % 2 === 0,
        targetLimit: 2,
      });
      expect(result.items).toEqual([2, 4]);
      // fetchLimit = min(2 * 3, 100) = 6. take(6) returns all 6.
      // filtered = [2, 4, 6]. length 3.
      // slice(0, 2) -> [2, 4].
      // hasMore calculation: items.length (6) >= fetchLimit (6). So true.
      expect(result.hasMore).toBe(true);
    });
  });

  describe("safeCollect", () => {
    it("should return all items if count <= limit", async () => {
      const data = [1, 2, 3];
      const query = new TestQuery(data);
      const result = await safeCollect(query, 10);
      expect(result).toEqual(data);
    });

    it("should truncate and log warning if count > limit", async () => {
      const data = [1, 2, 3, 4, 5];
      const query = new TestQuery(data);
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      const result = await safeCollect(query, 3, "test-context");

      expect(result).toEqual([1, 2, 3]);
      expect(warnSpy).toHaveBeenCalledWith("Query exceeded limit, results truncated", {
        limit: 3,
        context: "test-context",
      });

      warnSpy.mockRestore();
    });
  });

  describe("efficientCount", () => {
    it("should use .count() if available", async () => {
      const data = [1, 2, 3];
      const query = new TestCountableQuery(data);
      const spy = vi.spyOn(query, "count");

      const count = await efficientCount(query);

      expect(count).toBe(3);
      expect(spy).toHaveBeenCalled();
    });

    it("should fallback to .take() if .count() is missing", async () => {
      const data = [1, 2, 3];
      // We need an object that looks like CountableQuery but count is undefined.

      const fallbackQuery = {
        take: async (n: number) => data.slice(0, n),
        // explicitly undefined count
        count: undefined as any,
      };

      const count = await efficientCount(fallbackQuery);
      expect(count).toBe(3);
    });
  });
});
