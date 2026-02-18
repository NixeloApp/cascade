/**
 * Pagination utilities for Convex queries
 *
 * Provides helpers for cursor-based pagination and smart loading strategies.
 */

import type { WorkflowCategory } from "../validators";
import { validation } from "./errors";
import { DAY } from "./timeUtils";

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 50;
export const DONE_COLUMN_DAYS = 14;

/**
 * Encode a cursor from timestamp and ID
 * Format: base64(timestamp:id)
 */
export function encodeCursor(timestamp: number, id: string): string {
  return btoa(`${timestamp}:${id}`);
}

/**
 * Decode a cursor to timestamp and ID
 * Includes validation and error handling
 */
export function decodeCursor(cursor: string): { timestamp: number; id: string } {
  try {
    const decoded = atob(cursor);
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
      throw validation("cursor", "Invalid cursor format");
    }
    const timestampStr = decoded.slice(0, colonIndex);
    const id = decoded.slice(colonIndex + 1);
    if (!(timestampStr && id)) {
      throw validation("cursor", "Invalid cursor format");
    }
    const timestamp = Number.parseInt(timestampStr, 10);
    if (Number.isNaN(timestamp)) {
      throw validation("cursor", "Invalid timestamp in cursor");
    }
    return { timestamp, id };
  } catch (error) {
    throw validation(
      "cursor",
      `Invalid pagination cursor: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Calculate the threshold date for "done" column items
 * Returns timestamp for (now - days)
 *
 * @param now - Current timestamp (required - pass from client)
 * @param days - Number of days to look back
 */
export function getDoneColumnThreshold(now: number, days: number = DONE_COLUMN_DAYS): number {
  return now - days * DAY;
}

/**
 * Determine loading strategy based on workflow category
 */
export function getLoadingStrategy(category: WorkflowCategory): "all" | "recent" {
  return category === "done" ? "recent" : "all";
}

/**
 * Pagination result type
 */
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Build a paginated result from items
 */
export function buildPaginatedResult<
  T extends { _id: { toString(): string }; updatedAt?: number; createdAt?: number },
>(items: T[], pageSize: number, totalCount?: number): PaginatedResult<T> {
  const hasMore = items.length > pageSize;
  const resultItems = hasMore ? items.slice(0, pageSize) : items;

  let nextCursor: string | null = null;
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1];
    const timestamp = lastItem.updatedAt ?? lastItem.createdAt;
    if (timestamp === undefined) {
      throw validation(
        "cursor",
        "Cannot build pagination cursor: item missing both updatedAt and createdAt",
      );
    }
    nextCursor = encodeCursor(timestamp, lastItem._id.toString());
  }

  return {
    items: resultItems,
    nextCursor,
    hasMore,
    totalCount,
  };
}
