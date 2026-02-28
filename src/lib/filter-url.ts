import type { Id } from "@convex/_generated/dataModel";
import type { BoardFilters, DateRangeFilter } from "@/components/FilterBar";

/**
 * Search params interface for board URL
 * Arrays are comma-separated strings, dates are "from,to" format
 */
export interface BoardSearchFilters {
  type?: string;
  priority?: string;
  assigneeId?: string;
  labels?: string;
  dueDate?: string;
  startDate?: string;
  createdAt?: string;
}

/** Serialize a date range to URL string format "from,to" */
function serializeDateRange(range: DateRangeFilter | undefined): string | undefined {
  if (!range?.from && !range?.to) return undefined;
  return `${range.from || ""},${range.to || ""}`;
}

/** Deserialize a URL string "from,to" to DateRangeFilter */
function deserializeDateRange(str: string | undefined): DateRangeFilter | undefined {
  if (!str) return undefined;
  const [from, to] = str.split(",");
  if (!from && !to) return undefined;
  return { from: from || undefined, to: to || undefined };
}

/**
 * Convert BoardFilters state to URL search params
 * Returns only defined values to keep URLs clean
 */
export function filtersToSearchParams(filters: BoardFilters): BoardSearchFilters {
  const params: BoardSearchFilters = {};

  if (filters.type?.length) {
    params.type = filters.type.join(",");
  }
  if (filters.priority?.length) {
    params.priority = filters.priority.join(",");
  }
  if (filters.assigneeId?.length) {
    params.assigneeId = filters.assigneeId.join(",");
  }
  if (filters.labels?.length) {
    params.labels = filters.labels.join(",");
  }

  const dueDate = serializeDateRange(filters.dueDate);
  if (dueDate) params.dueDate = dueDate;

  const startDate = serializeDateRange(filters.startDate);
  if (startDate) params.startDate = startDate;

  const createdAt = serializeDateRange(filters.createdAt);
  if (createdAt) params.createdAt = createdAt;

  return params;
}

/**
 * Convert URL search params to BoardFilters state
 * Validates and parses each filter type safely
 */
export function searchParamsToFilters(search: BoardSearchFilters): BoardFilters {
  const filters: BoardFilters = {};

  if (search.type) {
    filters.type = search.type.split(",").filter(Boolean) as BoardFilters["type"];
  }
  if (search.priority) {
    filters.priority = search.priority.split(",").filter(Boolean) as BoardFilters["priority"];
  }
  if (search.assigneeId) {
    filters.assigneeId = search.assigneeId.split(",").filter(Boolean) as Id<"users">[];
  }
  if (search.labels) {
    filters.labels = search.labels.split(",").filter(Boolean);
  }

  const dueDate = deserializeDateRange(search.dueDate);
  if (dueDate) filters.dueDate = dueDate;

  const startDate = deserializeDateRange(search.startDate);
  if (startDate) filters.startDate = startDate;

  const createdAt = deserializeDateRange(search.createdAt);
  if (createdAt) filters.createdAt = createdAt;

  return filters;
}

/**
 * Validate search params from URL
 * Used by TanStack Router's validateSearch
 */
export function validateBoardSearchFilters(search: Record<string, unknown>): BoardSearchFilters {
  return {
    type: typeof search.type === "string" ? search.type : undefined,
    priority: typeof search.priority === "string" ? search.priority : undefined,
    assigneeId: typeof search.assigneeId === "string" ? search.assigneeId : undefined,
    labels: typeof search.labels === "string" ? search.labels : undefined,
    dueDate: typeof search.dueDate === "string" ? search.dueDate : undefined,
    startDate: typeof search.startDate === "string" ? search.startDate : undefined,
    createdAt: typeof search.createdAt === "string" ? search.createdAt : undefined,
  };
}

/**
 * Check if any filters are active in search params
 */
export function hasActiveSearchFilters(search: BoardSearchFilters): boolean {
  return !!(
    search.type ||
    search.priority ||
    search.assigneeId ||
    search.labels ||
    search.dueDate ||
    search.startDate ||
    search.createdAt
  );
}
