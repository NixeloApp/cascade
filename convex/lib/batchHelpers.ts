/**
 * Batch Fetch Helpers
 *
 * Utilities for batch-fetching related data to avoid N+1 query patterns.
 * Use these instead of fetching inside loops or Promise.all maps.
 *
 * @example
 * // ❌ BAD: N+1 pattern
 * const enriched = await Promise.all(items.map(async (item) => {
 *   const user = await ctx.db.get(item.userId);
 *   return { ...item, userName: user?.name };
 * }));
 *
 * // ✅ GOOD: Batch pattern
 * const userMap = await batchFetchUsers(ctx, items.map(i => i.userId));
 * const enriched = items.map(item => {
 *   const user = userMap.get(item.userId);
 *   return {
 *     ...item,
 *     userName: user?.name ?? "Unknown"
 *   };
 * });
 */

import { asyncMap, pruneNull } from "convex-helpers";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// ============================================================================
// GENERIC BATCH FETCH
// ============================================================================

/**
 * Generic batch fetch function for any table.
 * Fetches multiple documents by ID in parallel and returns a Map for O(1) lookups.
 *
 * @param ctx - Query context
 * @param _table - Table name (used for type inference only)
 * @param ids - Array of IDs to fetch (can include undefined)
 * @returns Map of ID to document
 *
 * @example
 * const userMap = await batchFetch(ctx, "users", userIds);
 * const projectMap = await batchFetch(ctx, "projects", projectIds);
 */
export async function batchFetch<T extends TableNames>(
  ctx: QueryCtx,
  _table: T,
  ids: (Id<T> | undefined)[],
): Promise<Map<Id<T>, Doc<T>>> {
  const uniqueIds = [...new Set(ids.filter((id): id is Id<T> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const items = await asyncMap(uniqueIds, (id) => ctx.db.get(id));
  return new Map(pruneNull(items).map((item) => [item._id as Id<T>, item as Doc<T>]));
}

// ============================================================================
// TYPED CONVENIENCE WRAPPERS
// These provide better ergonomics and IDE autocomplete for common tables.
// They all delegate to the generic batchFetch function.
// ============================================================================

/** Batch fetch users by ID */
export const batchFetchUsers = (ctx: QueryCtx, ids: (Id<"users"> | undefined)[]) =>
  batchFetch(ctx, "users", ids);

/** Batch fetch issues by ID */
export const batchFetchIssues = (ctx: QueryCtx, ids: (Id<"issues"> | undefined)[]) =>
  batchFetch(ctx, "issues", ids);

/** Batch fetch projects by ID */
export const batchFetchProjects = (ctx: QueryCtx, ids: (Id<"projects"> | undefined)[]) =>
  batchFetch(ctx, "projects", ids);

/** Batch fetch calendar events by ID */
export const batchFetchCalendarEvents = (
  ctx: QueryCtx,
  ids: (Id<"calendarEvents"> | undefined)[],
) => batchFetch(ctx, "calendarEvents", ids);

/** Batch fetch teams by ID */
export const batchFetchTeams = (ctx: QueryCtx, ids: (Id<"teams"> | undefined)[]) =>
  batchFetch(ctx, "teams", ids);

/** Batch fetch organizations by ID */
export const batchFetchOrganizations = (ctx: QueryCtx, ids: (Id<"organizations"> | undefined)[]) =>
  batchFetch(ctx, "organizations", ids);

/** Batch fetch sprints by ID */
export const batchFetchSprints = (ctx: QueryCtx, ids: (Id<"sprints"> | undefined)[]) =>
  batchFetch(ctx, "sprints", ids);

/** Batch fetch booking pages by ID */
export const batchFetchBookingPages = (ctx: QueryCtx, ids: (Id<"bookingPages"> | undefined)[]) =>
  batchFetch(ctx, "bookingPages", ids);

/** Batch fetch documents by ID */
export const batchFetchDocuments = (ctx: QueryCtx, ids: (Id<"documents"> | undefined)[]) =>
  batchFetch(ctx, "documents", ids);

/** Batch fetch custom fields by ID */
export const batchFetchCustomFields = (ctx: QueryCtx, ids: (Id<"customFields"> | undefined)[]) =>
  batchFetch(ctx, "customFields", ids);

/** Batch fetch recordings by ID */
export const batchFetchRecordings = (ctx: QueryCtx, ids: (Id<"meetingRecordings"> | undefined)[]) =>
  batchFetch(ctx, "meetingRecordings", ids);

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format user for API response
 */
export function formatUser(user: Doc<"users"> | undefined | null) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || user.email || "Unknown",
    email: user.email,
    image: user.image,
  };
}

/**
 * Get user name with fallback
 */
export function getUserName(user: Doc<"users"> | undefined | null): string {
  return user?.name || user?.email || "Unknown";
}

/**
 * Format project/project for API response
 */
export function formatProject(project: Doc<"projects"> | undefined | null) {
  if (!project) return null;
  return {
    _id: project._id,
    name: project.name,
    key: project.key,
  };
}

/**
 * Format issue for API response (minimal)
 */
export function formatIssueMinimal(issue: Doc<"issues"> | undefined | null) {
  if (!issue) return null;
  return {
    _id: issue._id,
    key: issue.key,
    title: issue.title,
  };
}
