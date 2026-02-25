/**
 * Query Helpers
 *
 * Utilities for advanced query patterns, specifically around pagination
 * and filtering that requires bypassing some of Convex's strict type checks
 * for generic reusable functions.
 */

import type {
  FilterBuilder,
  GenericDocument,
  GenericTableInfo,
  PaginationOptions,
  PaginationResult,
} from "convex/server";
import type { QueryCtx } from "../_generated/server";

// Helper to wrap T into a TableInfo structure for FilterBuilder
type TableInfoFor = GenericTableInfo;

/**
 * Executes a paginated query with a mandatory soft-delete filter.
 *
 * This helper wraps any arbitrary query builder chain (e.g., `.withIndex()`) and applies
 * a standard `isDeleted != true` filter before executing pagination. This ensures that
 * soft-deleted items are consistently excluded from all paginated lists.
 *
 * ### Why Type Casting?
 * Convex's `Query` and `FilterBuilder` types are strictly typed to specific tables (e.g., `Query<"issues">`).
 * To create a reusable helper that works for ANY table, we must cast the query builder to `unknown`
 * and then to a generic interface. This bypasses TypeScript's strict table checks while still
 * enforcing that the result items match the generic type `T`.
 *
 * ### Soft Delete Logic
 * The filter uses `q.neq(q.field("isDeleted"), true)` which handles two cases:
 * 1. `isDeleted` is explicitly `false` (active)
 * 2. `isDeleted` is `undefined` (legacy active items)
 *
 * @param ctx - The query context containing the database reader.
 * @param opts - Configuration options.
 * @param opts.paginationOpts - Convex pagination options (`numItems`, `cursor`).
 * @param opts.query - A callback function that receives `db` and must return a query builder chain.
 *                     The chain should be ready for `.paginate()` (i.e., indexes applied).
 *
 * @returns A promise resolving to the standard `PaginationResult<T>`.
 *
 * @example
 * ```typescript
 * // Fetch paginated issues for a project, excluding soft-deleted ones
 * const result = await fetchPaginatedQuery<Doc<"issues">>(ctx, {
 *   paginationOpts: args.paginationOpts,
 *   query: (db) => db
 *     .query("issues")
 *     .withIndex("by_project", q => q.eq("projectId", args.projectId))
 *     .order("desc")
 * });
 * ```
 */
export async function fetchPaginatedQuery<T extends GenericDocument>(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;

    query: (db: QueryCtx["db"]) => unknown;
  },
): Promise<PaginationResult<T>> {
  // Cast through unknown as the query builder types are complex and generic.
  // We need to access the .filter() method which is present on Query but hard to type
  // generically without losing the specific TableInfo.
  const queryResult = opts.query(ctx.db) as unknown as {
    filter: (fn: (q: FilterBuilder<TableInfoFor>) => unknown) => unknown;
  };
  return await (
    queryResult
      // Always filter out soft-deleted items.
      // We check isDeleted != true to handle both explicit false and undefined (legacy data).
      .filter((q: FilterBuilder<TableInfoFor>) => q.neq(q.field("isDeleted"), true)) as unknown as {
      paginate: (opts: PaginationOptions) => Promise<PaginationResult<T>>;
    }
  ).paginate(opts.paginationOpts);
}
