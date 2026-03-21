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

interface PaginatedSoftDeleteQuery<T extends GenericDocument> {
  filter: (fn: (q: FilterBuilder<TableInfoFor>) => unknown) => PaginatedQueryResult<T>;
}

interface PaginatedQueryResult<T extends GenericDocument> {
  paginate: (opts: PaginationOptions) => Promise<PaginationResult<T>>;
}

/**
 * Executes a paginated query with a mandatory soft-delete filter.
 *
 * This helper is designed to wrap any arbitrary query builder chain with a standard
 * `isDeleted != true` filter before executing pagination. It uses explicit type casting
 * to work around Convex's strict query builder types, allowing it to function generically
 * across different tables.
 *
 * @param ctx - The query context.
 * @param opts - Options object.
 * @param opts.paginationOpts - Standard Convex pagination options (cursor, numItems).
 * @param opts.query - A callback that receives the database reader and returns a query builder.
 *                     The query builder should be "paginate-ready" (i.e., `.collect()` or `.paginate()` could be called on it).
 *
 * @returns A promise resolving to the paginated result.
 *
 * @example
 * const result = await fetchPaginatedQuery(ctx, {
 *   paginationOpts: { numItems: 10, cursor: args.cursor },
 *   buildQuery: (db) =>
 *     db.query("issues").withIndex("by_project", q => q.eq("projectId", args.projectId))
 * });
 */
export async function fetchPaginatedQuery<T extends GenericDocument>(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;
    buildQuery: (db: QueryCtx["db"]) => unknown;
  },
): Promise<PaginationResult<T>> {
  const query = (opts.buildQuery(ctx.db) as PaginatedSoftDeleteQuery<T>)
    // Always filter out soft-deleted items.
    // We check isDeleted != true to handle both explicit false and undefined (legacy data).
    .filter((q: FilterBuilder<TableInfoFor>) => q.neq(q.field("isDeleted"), true));

  try {
    return await query.paginate(opts.paginationOpts);
  } catch (error) {
    // When a cursor becomes stale (e.g. after a schema migration or index change),
    // Convex throws an InvalidCursor error. Recover by restarting from the first page.
    if (isInvalidCursorError(error)) {
      console.warn("[queryHelpers] Stale cursor detected, restarting pagination from first page");
      return await query.paginate({
        ...opts.paginationOpts,
        cursor: null,
      });
    }
    throw error;
  }
}

export function isInvalidCursorError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("InvalidCursor");
  }
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data: unknown }).data;
    return typeof data === "string" && data.includes("InvalidCursor");
  }
  return false;
}
