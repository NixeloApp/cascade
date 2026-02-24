import { logger } from "./logger";

/**
 * Bounded Query Helpers
 *
 * Prevents unbounded .collect() calls that could exceed memory limits.
 * All queries have explicit limits to ensure predictable performance.
 *
 * @example
 * // ❌ BAD: Unbounded collect - could load 100k+ docs
 * const issues = await ctx.db.query("issues").withIndex(...).collect();
 *
 * // ✅ GOOD: Bounded collect with limit
 * const { items, hasMore } = await boundedCollect(
 *   ctx.db.query("issues").withIndex(...).filter(notDeleted),
 *   { limit: 500 }
 * );
 *
 * // ✅ GOOD: Bounded count
 * const { count, isExact } = await boundedCount(
 *   ctx.db.query("issues").withIndex(...).filter(notDeleted),
 *   { limit: 2000 }
 * );
 */

// =============================================================================
// DEFAULT LIMITS (import and use these for consistency)
// =============================================================================
// Industry standards: Linear=50, Notion=100, Jira=50, GitHub=30
// We use slightly higher defaults but rely on pagination for large datasets

/** Max items for general list queries (e.g., all issues in a project) */
export const BOUNDED_LIST_LIMIT = 100;

/** Max items for relationship queries (e.g., comments per issue) */
export const BOUNDED_RELATION_LIMIT = 100;

/** Max items for search results */
export const BOUNDED_SEARCH_LIMIT = 50;

/** Max items for batch delete operations per call */
export const BOUNDED_DELETE_BATCH = 100;

/** Max items for count operations (returns capped count) */
export const BOUNDED_COUNT_LIMIT = 500;

/** Max items for "select/dropdown" queries (e.g., issue picker) */
export const BOUNDED_SELECT_LIMIT = 50;

// =============================================================================
// TYPES
// =============================================================================

/** Result of bounded collect */
export interface BoundedCollectResult<T> {
  /** The collected items (up to limit) */
  items: T[];
  /** True if there are more items beyond the limit */
  hasMore: boolean;
  /** The limit that was used */
  limit: number;
}

/** Result of bounded count */
export interface BoundedCountResult {
  /** The count (capped at limit) */
  count: number;
  /**
   * True if count is exact (less than limit), false if capped.
   * If false, the actual count is `>= limit`.
   */
  isExact: boolean;
  /** The limit that was used */
  limit: number;
}

/** Options for bounded collect */
export interface BoundedCollectOptions {
  /** Maximum items to collect (default: BOUNDED_LIST_LIMIT) */
  limit?: number;
}

/** Options for bounded count */
export interface BoundedCountOptions {
  /** Maximum items to count (default: BOUNDED_COUNT_LIMIT) */
  limit?: number;
}

/** Options for bounded collect with filter */
export interface BoundedFilterOptions<T> {
  /** Filter function to apply */
  filter: (item: T) => boolean;
  /** Desired number of results after filtering */
  targetLimit: number;
  /** Multiplier for fetch size (default: 3) */
  fetchMultiplier?: number;
}

// =============================================================================
// QUERY INTERFACE (matches Convex query builder)
// =============================================================================

/** Minimal query interface for bounded helpers */
export interface TakeableQuery<T> {
  take(n: number): Promise<T[]>;
}

/** Minimal query interface for count (to handle both library and test environments) */
export interface CountableQuery<T> extends TakeableQuery<T> {
  count?: () => Promise<number>;
}

/** Minimal query interface for collect (to help migration) */

// =============================================================================
// BOUNDED QUERY FUNCTIONS
// =============================================================================

/**
 * Bounded collect - replaces .collect() with explicit limit
 *
 * @example
 * // Instead of:
 * const issues = await ctx.db.query("issues").withIndex(...).collect();
 *
 * // Use:
 * const { items: issues, hasMore } = await boundedCollect(
 *   ctx.db.query("issues").withIndex(...).filter(notDeleted),
 *   { limit: 500 }
 * );
 *
 * if (hasMore) {
 *   console.warn("Results truncated, consider pagination");
 * }
 */
export async function boundedCollect<T>(
  query: TakeableQuery<T>,
  options: BoundedCollectOptions = {},
): Promise<BoundedCollectResult<T>> {
  const limit = options.limit ?? BOUNDED_LIST_LIMIT;

  // Fetch one extra to detect if there are more
  const items = await query.take(limit + 1);
  const hasMore = items.length > limit;

  return {
    items: hasMore ? items.slice(0, limit) : items,
    hasMore,
    limit,
  };
}

/**
 * Bounded count - counts items up to a limit
 *
 * This function is optimized for UI counters that need a cap (e.g. "99+").
 * It halts the database scan once the limit is reached, unlike `q.count()` which
 * scans all matching records. Use this when the exact total is irrelevant for large counts.
 *
 * @param query - The query to execute
 * @param options.limit - The maximum count to return (default: 500)
 * @returns {BoundedCountResult} Result object containing the capped count
 *
 * @example
 * const { count, isExact } = await boundedCount(
 *   ctx.db.query("issues").withIndex("by_project", q => q.eq("projectId", projectId)),
 *   { limit: 2000 }
 * );
 *
 * // Display: "1,234 issues" or "2,000+ issues"
 * // Note: isExact is false if count >= limit
 * const display = isExact ? `${count} issues` : `${count}+ issues`;
 */
export async function boundedCount<T>(
  query: TakeableQuery<T>,
  options: BoundedCountOptions = {},
): Promise<BoundedCountResult> {
  const limit = options.limit ?? BOUNDED_COUNT_LIMIT;
  const items = await query.take(limit);

  return {
    count: items.length,
    isExact: items.length < limit,
    limit,
  };
}

/**
 * Bounded collect with in-memory filter
 *
 * Fetches extra items (targetLimit * fetchMultiplier) to account for filtering.
 *
 * ⚠️ WARNING: This is a "best effort" collection.
 * It applies the filter AFTER fetching a limited batch of items. Therefore:
 * 1. It may return fewer than `targetLimit` items even if more matching items exist in the DB.
 * 2. `hasMore` indicates if the fetch limit was reached, not necessarily that there are more *matching* items.
 *
 * Use this only when filtering cannot be done via index or `q.filter()`.
 *
 * @example
 * // Get up to 50 high-priority issues
 * const { items, hasMore } = await boundedCollectWithFilter(
 *   ctx.db.query("issues").withIndex("by_project", q => q.eq("projectId", projectId)),
 *   {
 *     filter: (issue) => issue.priority === "high" || issue.priority === "highest",
 *     targetLimit: 50,
 *   }
 * );
 */
export async function boundedCollectWithFilter<T>(
  query: TakeableQuery<T>,
  options: BoundedFilterOptions<T>,
): Promise<BoundedCollectResult<T>> {
  const { filter, targetLimit, fetchMultiplier = 3 } = options;
  const fetchLimit = Math.min(targetLimit * fetchMultiplier, BOUNDED_LIST_LIMIT);

  const items = await query.take(fetchLimit);
  const filtered = items.filter(filter);
  const hasMore = items.length >= fetchLimit;

  return {
    items: filtered.slice(0, targetLimit),
    hasMore,
    limit: targetLimit,
  };
}

/**
 * Collects up to `limit` items from a takeable query and truncates results if more exist.
 *
 * Logs a warning when the query returns more than `limit` items; the optional `context`
 * string is included in that warning to help locate the source of the query.
 *
 * @param query - Query implementing `take(n)` used to fetch items
 * @param limit - Maximum number of items to return; defaults to BOUNDED_LIST_LIMIT
 * @param context - Optional context string included in the warning when results are truncated
 * @returns An array of at most `limit` items; truncated to `limit` if more items existed
 */
export async function safeCollect<T>(
  query: TakeableQuery<T>,
  limit: number = BOUNDED_LIST_LIMIT,
  context?: string,
): Promise<T[]> {
  const items = await query.take(limit + 1);

  if (items.length > limit) {
    logger.warn("Query exceeded limit, results truncated", { limit, context });
    return items.slice(0, limit);
  }

  return items;
}

/**
 * Collect all items in batches (for operations that truly need all items)
 *
 * Use sparingly! This is for administrative operations like cleanup.
 * Each batch is a separate query, so this is slower but safer.
 *
 * @example
 * // Delete all comments for an issue (administrative cleanup)
 * const allComments = await collectInBatches(
 *   (cursor) => ctx.db.query("issueComments")
 *     .withIndex("by_issue", q => q.eq("issueId", issueId))
 *     .paginate({ numItems: 100, cursor }),
 *   { maxBatches: 10 } // Safety limit: max 1000 items
 * );
 */
export async function collectInBatches<T>(
  paginatedQuery: (cursor: string | null) => Promise<{
    page: T[];
    continueCursor: string;
    isDone: boolean;
  }>,
  options: { maxBatches?: number; batchSize?: number } = {},
): Promise<T[]> {
  const { maxBatches = 10 } = options;
  const allItems: T[] = [];
  let cursor: string | null = null;
  let batchCount = 0;

  while (batchCount < maxBatches) {
    const result = await paginatedQuery(cursor);
    allItems.push(...result.page);
    batchCount++;

    if (result.isDone) break;
    cursor = result.continueCursor;
  }

  if (batchCount >= maxBatches) {
    logger.warn("collectInBatches hit max batches", {
      maxBatches,
      itemsCollected: allItems.length,
    });
  }

  return allItems;
}

/**
 * Efficiently counts items in a query.
 * Uses .count() if available (Convex 1.13+), otherwise falls back to taking a limit.
 *
 * NOTE: When .count() is available, this will scan ALL matching records to get the exact count.
 * For very large datasets where you only need to know if the count exceeds a threshold (e.g. for "99+"),
 * consider using `boundedCount` instead, as it halts scanning once the limit is reached.
 *
 * This helper is essential for maintaining compatibility with test environments
 * (e.g. convex-test) that may not fully implement the Query interface, while
 * leveraging the performance of .count() in production.
 *
 * @param query - The Convex query to count items for
 * @param limit - Fallback limit if .count() is not available (default: 2000)
 * @returns A promise that resolves to the count of items
 */
export async function efficientCount<T>(query: CountableQuery<T>, limit = 2000): Promise<number> {
  if (typeof query.count === "function") {
    return await query.count();
  }

  // Fallback for environments where count() is missing (e.g. tests)
  const items = await query.take(limit);
  return items.length;
}

// =============================================================================
// USAGE GUIDELINES
// =============================================================================

/**
 * MIGRATION GUIDE
 * ===============
 *
 * 1. SIMPLE REPLACEMENT (when you just need items):
 *    Before: const items = await query.collect();
 *    After:  const items = await safeCollect(query, 1000);
 *
 * 2. WITH hasMore INDICATOR (for UI "load more"):
 *    const { items, hasMore } = await boundedCollect(query, { limit: 100 });
 *    // Show "Load more" button if hasMore
 *
 * 3. FOR COUNTING (when you need a count):
 *    Before: const count = (await query.collect()).length;
 *    After:  const { count, isExact } = await boundedCount(query);
 *            // Display: isExact ? count : `${count}+`
 *
 * 4. WITH IN-MEMORY FILTER:
 *    Before: const items = (await query.collect()).filter(fn);
 *    After:  const { items } = await boundedCollectWithFilter(query, {
 *              filter: fn,
 *              targetLimit: 50,
 *            });
 *
 * 5. FOR ADMINISTRATIVE OPS (delete cascades, etc.):
 *    Use collectInBatches() with pagination
 *
 * WHICH LIMIT TO USE:
 * - BOUNDED_LIST_LIMIT (100) - General lists
 * - BOUNDED_RELATION_LIMIT (100) - Per-parent relations
 * - BOUNDED_SEARCH_LIMIT (50) - Search results
 * - BOUNDED_SELECT_LIMIT (50) - Dropdowns/pickers
 * - BOUNDED_COUNT_LIMIT (500) - Counting operations
 */
