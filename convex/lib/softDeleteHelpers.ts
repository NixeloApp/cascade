/**
 * Soft Delete Helper Utilities
 *
 * Provides reusable filter functions for querying soft-deleted records.
 * Use these helpers to ensure consistent soft delete behavior across all queries.
 *
 * IMPORTANT: In Convex, .filter() must come AFTER .withIndex()
 *
 * Usage:
 *   .filter(notDeleted)           // Exclude deleted items (most common)
 *   .filter(onlyDeleted)          // Only show deleted items (trash view)
 *
 * Example:
 *   const issues = await ctx.db
 *     .query("issues")
 *     .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *     .filter(notDeleted)  // ← Add this to exclude deleted
 *     .take(BOUNDED_LIST_LIMIT);
 */

import type { ExpressionOrValue, FilterBuilder, GenericTableInfo } from "convex/server";
import type { Id } from "../_generated/dataModel";
import { MONTH } from "./timeUtils";

// Loose type for dynamic table access

// Loose type for dynamic table access
type AnyTableInfo = GenericTableInfo;

export interface SoftDeletable {
  isDeleted?: boolean;
  deletedAt?: number;
  deletedBy?: Id<"users">;
}

/**
 * Filter to exclude soft-deleted items
 * Use this in all normal queries to hide deleted records
 *
 * @example
 * const issues = await ctx.db
 *   .query("issues")
 *   .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *   .filter(notDeleted)
 *   .take(BOUNDED_LIST_LIMIT);
 */
export function notDeleted(q: FilterBuilder<AnyTableInfo>): ExpressionOrValue<boolean> {
  return q.neq(q.field("isDeleted"), true);
}

/**
 * Filter to show ONLY soft-deleted items
 * Use this for "trash" views where users can restore deleted items
 *
 * @example
 * const deletedIssues = await ctx.db
 *   .query("issues")
 *   .withIndex("by_deleted", (q) => q.eq("isDeleted", true))
 *   .take(BOUNDED_LIST_LIMIT);
 *
 * // Or with additional filters
 * const projectTrash = await ctx.db
 *   .query("issues")
 *   .filter((q) => q.and(
 *     q.eq(q.field("projectId"), projectId),
 *     onlyDeleted(q)
 *   ))
 *   .take(BOUNDED_LIST_LIMIT);
 */
export function onlyDeleted(q: FilterBuilder<AnyTableInfo>): ExpressionOrValue<boolean> {
  return q.eq(q.field("isDeleted"), true);
}

/**
 * No filter - shows all items regardless of delete status
 * Useful for admin views or analytics that need complete data
 *
 * Note: This is the default behavior without any filter.
 * This function exists for explicit documentation in code.
 *
 * @example
 * const allIssues = await ctx.db
 *   .query("issues")
 *   .take(BOUNDED_LIST_LIMIT); // Already includes deleted - no filter needed
 */
export function includeDeleted(): boolean {
  return true; // No filter applied
}

/**
 * Mark a record as soft deleted
 * Sets isDeleted, deletedAt, and deletedBy fields
 *
 * @param userId - User ID who is performing the deletion
 * @returns Object with soft delete fields to patch
 *
 * @example
 * await ctx.db.patch(issueId, softDeleteFields(userId));
 */
export function softDeleteFields(userId: Id<"users">) {
  return {
    isDeleted: true,
    deletedAt: Date.now(),
    deletedBy: userId,
  };
}

/**
 * Restore a soft deleted record
 * Removes isDeleted, deletedAt, and deletedBy fields
 *
 * @returns Object with fields to clear for restoration
 *
 * @example
 * await ctx.db.patch(issueId, restoreFields());
 */
export function restoreFields() {
  return {
    isDeleted: undefined,
    deletedAt: undefined,
    deletedBy: undefined,
  };
}

/**
 * Check if a record is soft deleted
 *
 * @param record - Any database record
 * @returns true if the record is soft deleted
 *
 * @example
 * const issue = await ctx.db.get(issueId);
 * if (issue && isSoftDeleted(issue)) {
 *   throw new Error("Cannot modify deleted issue");
 * }
 */
export function isSoftDeleted(record: Partial<SoftDeletable>): boolean {
  return record.isDeleted === true;
}

/**
 * Get time since deletion in milliseconds
 * Returns null if not deleted
 *
 * @param record - Any database record with deletedAt field
 * @returns Milliseconds since deletion, or null if not deleted
 *
 * @example
 * const timeSinceDeletion = getTimeSinceDeletion(issue);
 * if (timeSinceDeletion && timeSinceDeletion > THIRTY_DAYS) {
 *   // Eligible for permanent deletion
 * }
 */
export function getTimeSinceDeletion(record: Partial<SoftDeletable>): number | null {
  if (!(record.isDeleted && record.deletedAt)) {
    return null;
  }
  return Date.now() - record.deletedAt;
}

/**
 * Check if a soft deleted record is eligible for permanent deletion
 * Default threshold is 30 days
 *
 * @param record - Any database record
 * @param thresholdMs - Milliseconds threshold (default: 30 days)
 * @returns true if record should be permanently deleted
 *
 * @example
 * if (isEligibleForPermanentDeletion(issue, MONTH)) {
 *   await hardDelete(issue._id);
 * }
 */
export function isEligibleForPermanentDeletion(
  record: Partial<SoftDeletable>,
  thresholdMs: number = MONTH,
): boolean {
  const timeSince = getTimeSinceDeletion(record);
  return timeSince !== null && timeSince > thresholdMs;
}
