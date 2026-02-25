import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOUNDED_COUNT_LIMIT,
  BOUNDED_LIST_LIMIT,
  boundedCollect,
  boundedCollectWithFilter,
  boundedCount,
  type CountableQuery,
  collectInBatches,
  efficientCount,
  safeCollect,
  type TakeableQuery,
} from "./boundedQueries";
import { logger } from "./logger";

// Mock logger
vi.mock("./logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Helper to create a mock query that returns items
function createMockQuery<T>(items: T[]): TakeableQuery<T> {
  return {
    take: vi.fn().mockImplementation(async (n: number) => {
      return items.slice(0, n);
    }),
  };
}

describe("boundedQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("boundedCollect", () => {
    it("should return all items and hasMore=false when items < limit", async () => {
      const items = [1, 2, 3];
      const query = createMockQuery(items);
      const result = await boundedCollect(query, { limit: 5 });

      expect(result.items).toEqual(items);
      expect(result.hasMore).toBe(false);
      expect(result.limit).toBe(5);
      expect(query.take).toHaveBeenCalledWith(6); // limit + 1
    });

    it("should return all items and hasMore=false when items == limit", async () => {
      const items = [1, 2, 3, 4, 5];
      const query = createMockQuery(items);
      const result = await boundedCollect(query, { limit: 5 });

      expect(result.items).toEqual(items);
      expect(result.hasMore).toBe(false);
      expect(result.limit).toBe(5);
      expect(query.take).toHaveBeenCalledWith(6);
    });

    it("should return limited items and hasMore=true when items > limit", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const query = createMockQuery(items);
      const result = await boundedCollect(query, { limit: 5 });

      expect(result.items).toEqual([1, 2, 3, 4, 5]);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(5);
      expect(query.take).toHaveBeenCalledWith(6);
    });

    it("should use default limit if not provided", async () => {
      const items = Array.from({ length: BOUNDED_LIST_LIMIT + 1 }, (_, i) => i);
      const query = createMockQuery(items);
      const result = await boundedCollect(query);

      expect(result.items).toHaveLength(BOUNDED_LIST_LIMIT);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(BOUNDED_LIST_LIMIT);
      expect(query.take).toHaveBeenCalledWith(BOUNDED_LIST_LIMIT + 1);
    });
  });

  describe("boundedCount", () => {
    it("should return correct count and isExact=true when items < limit", async () => {
      const items = [1, 2, 3];
      const query = createMockQuery(items);
      const result = await boundedCount(query, { limit: 5 });

      expect(result.count).toBe(3);
      expect(result.isExact).toBe(true);
      expect(result.limit).toBe(5);
      expect(query.take).toHaveBeenCalledWith(5);
    });

    it("should return limit and isExact=false when items >= limit", async () => {
      // Mock query returns exactly limit items
      // boundedCount calls take(limit), so if it returns limit items, it considers it exact=false (capped)
      const items = [1, 2, 3, 4, 5];
      const query = createMockQuery(items);
      const result = await boundedCount(query, { limit: 5 });

      expect(result.count).toBe(5);
      expect(result.isExact).toBe(false);
      expect(result.limit).toBe(5);
      expect(query.take).toHaveBeenCalledWith(5);
    });

    it("should use default limit if not provided", async () => {
      const items = Array.from({ length: BOUNDED_COUNT_LIMIT }, (_, i) => i);
      const query = createMockQuery(items);
      const result = await boundedCount(query);

      expect(result.count).toBe(BOUNDED_COUNT_LIMIT);
      expect(result.isExact).toBe(false);
      expect(result.limit).toBe(BOUNDED_COUNT_LIMIT);
      expect(query.take).toHaveBeenCalledWith(BOUNDED_COUNT_LIMIT);
    });
  });

  describe("boundedCollectWithFilter", () => {
    it("should filter items correctly", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const query = createMockQuery(items);
      const filter = (item: number) => item % 2 === 0;

      const result = await boundedCollectWithFilter(query, {
        filter,
        targetLimit: 2,
        fetchMultiplier: 2,
      });

      // targetLimit=2, multiplier=2 => fetchLimit=4.
      // take(4) returns [1, 2, 3, 4].
      // filtered: [2, 4].
      // hasMore: items.length (4) >= fetchLimit (4) => true.

      expect(result.items).toEqual([2, 4]);
      expect(result.hasMore).toBe(true);
      expect(result.limit).toBe(2);
      expect(query.take).toHaveBeenCalledWith(4);
    });

    it("should respect fetch limit even if target limit not reached", async () => {
      const items = [1, 3, 5, 7];
      const query = createMockQuery(items);
      const filter = (item: number) => item % 2 === 0;

      const result = await boundedCollectWithFilter(query, {
        filter,
        targetLimit: 2,
        fetchMultiplier: 2,
      });

      // fetchLimit = 4. take(4) returns [1, 3, 5, 7].
      // filtered: [].
      // hasMore: 4 >= 4 => true.

      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(true);
      expect(query.take).toHaveBeenCalledWith(4);
    });
  });

  describe("safeCollect", () => {
    it("should return all items if within limit", async () => {
      const items = [1, 2, 3];
      const query = createMockQuery(items);
      const result = await safeCollect(query, 5);

      expect(result).toEqual(items);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should truncate and log warning if items exceed limit", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const query = createMockQuery(items);
      const result = await safeCollect(query, 5, "test-context");

      expect(result).toEqual([1, 2, 3, 4, 5]);
      expect(logger.warn).toHaveBeenCalledWith("Query exceeded limit, results truncated", {
        limit: 5,
        context: "test-context",
      });
    });
  });

  describe("collectInBatches", () => {
    it("should collect all items across multiple batches", async () => {
      const allItems = [1, 2, 3, 4, 5];
      let callCount = 0;

      const paginatedQuery = vi.fn().mockImplementation(async (cursor: string | null) => {
        callCount++;
        if (cursor === null) {
          return { page: [1, 2], continueCursor: "c1", isDone: false };
        }
        if (cursor === "c1") {
          return { page: [3, 4], continueCursor: "c2", isDone: false };
        }
        if (cursor === "c2") {
          return { page: [5], continueCursor: "c3", isDone: true };
        }
        return { page: [], continueCursor: "", isDone: true };
      });

      const result = await collectInBatches(paginatedQuery);

      expect(result).toEqual(allItems);
      expect(paginatedQuery).toHaveBeenCalledTimes(3);
    });

    it("should stop when maxBatches is reached and log warning", async () => {
      const paginatedQuery = vi.fn().mockResolvedValue({
        page: [1],
        continueCursor: "next",
        isDone: false,
      });

      const result = await collectInBatches(paginatedQuery, { maxBatches: 3 });

      expect(result).toHaveLength(3);
      expect(paginatedQuery).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledWith("collectInBatches hit max batches", {
        maxBatches: 3,
        itemsCollected: 3,
      });
    });
  });

  describe("efficientCount", () => {
    it("should use .count() if available", async () => {
      const query: CountableQuery<any> = {
        take: vi.fn(),
        count: vi.fn().mockResolvedValue(42),
      };

      const result = await efficientCount(query);

      expect(result).toBe(42);
      expect(query.count).toHaveBeenCalled();
      expect(query.take).not.toHaveBeenCalled();
    });

    it("should fall back to .take() if .count() is missing", async () => {
      const items = [1, 2, 3];
      const query: CountableQuery<number> = {
        take: vi.fn().mockResolvedValue(items),
      };
      // Simulate count being undefined
      delete query.count;

      const result = await efficientCount(query, 10);

      expect(result).toBe(3);
      expect(query.take).toHaveBeenCalledWith(10);
    });
  });
});
