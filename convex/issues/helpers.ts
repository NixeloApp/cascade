import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { conflict, notFound, validation } from "../lib/errors";
import { notDeleted } from "../lib/softDeleteHelpers";
import { canAccessProject } from "../projectAccess";

export const ROOT_ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;

/**
 * Validates that the assignee has access to the project.
 *
 * @param ctx - The mutation context.
 * @param projectId - The ID of the project.
 * @param assigneeId - The ID of the assignee to validate.
 * @throws {ConvexError} If the assignee does not have access to the project.
 */
export async function validateAssignee(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  assigneeId: Id<"users"> | null | undefined,
): Promise<void> {
  if (!assigneeId) return;

  const hasAccess = await canAccessProject(ctx, projectId, assigneeId);
  if (!hasAccess) {
    throw validation("assigneeId", "Assignee must be a member of the project or organization");
  }
}

/**
 * Combines title and description into a single string for search indexing.
 *
 * @param title - The issue title.
 * @param description - The issue description (optional).
 * @returns A string containing both title and description, trimmed.
 */
export function getSearchContent(title: string, description?: string) {
  return `${title} ${description || ""}`.trim();
}

/**
 * Validates the parent issue and determines the correct epic ID for inheritance.
 * Enforces rules:
 * 1. Epics cannot be subtasks.
 * 2. Subtasks can only be one level deep (cannot nest subtasks).
 * 3. Issues with a parent must be of type 'subtask'.
 *
 * @param ctx - The mutation context.
 * @param parentId - The ID of the parent issue (if any).
 * @param issueType - The type of the issue being created/updated.
 * @param epicId - The explicitly provided epic ID (if any).
 * @returns The resolved epic ID (inherited from parent if not provided).
 * @throws {ConvexError} If the parent issue is not found (NOT_FOUND).
 * @throws {ConvexError} If validation rules are violated (VALIDATION).
 */
export async function validateParentIssue(
  ctx: MutationCtx,
  parentId: Id<"issues"> | undefined,
  issueType: string,
  epicId: Id<"issues"> | undefined,
) {
  if (!parentId) {
    // No parent - epics are root-level issues and can't be subtasks
    if (issueType === "epic") {
      return epicId; // Epics don't have parents or epicId
    }
    return epicId;
  }

  const parentIssue = await ctx.db.get(parentId);
  if (!parentIssue) {
    throw notFound("issue", parentId);
  }

  // Prevent sub-tasks of sub-tasks (only 1 level deep)
  if (parentIssue.parentId) {
    throw validation(
      "parentId",
      "Cannot create sub-task of a sub-task. Sub-tasks can only be one level deep.",
    );
  }

  // Sub-tasks must be of type "subtask"
  if (issueType !== "subtask") {
    throw validation("type", "Issues with a parent must be of type 'subtask'");
  }

  // Inherit epicId from parent if not explicitly provided
  return epicId || parentIssue.epicId;
}

/**
 * Generates a sequential issue key (e.g., "PROJ-123") with race condition protection.
 * It finds the latest issue in the project and increments its number.
 *
 * @param ctx - The mutation context.
 * @param projectId - The project ID.
 * @param projectKey - The project key prefix (e.g., "PROJ").
 * @returns A unique issue key string.
 */
export async function generateIssueKey(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  projectKey: string,
): Promise<string> {
  // Get the most recent issue by creation time to find the highest key number
  // We order desc and take the first - this works because keys are sequential
  const latestIssue = await ctx.db
    .query("issues")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .first();

  let maxNumber = 0;
  if (latestIssue) {
    const match = latestIssue.key.match(/-(\d+)$/);
    if (match) {
      maxNumber = parseInt(match[1], 10);
    }
  }

  return `${projectKey}-${maxNumber + 1}`;
}

/**
 * Checks if an issue key already exists in the database.
 * Used for duplicate detection during key generation or migration.
 *
 * @param ctx - The mutation context.
 * @param key - The issue key to check (e.g., "PROJ-123").
 * @returns True if the key exists, false otherwise.
 */
export async function issueKeyExists(ctx: MutationCtx, key: string): Promise<boolean> {
  const existing = await ctx.db
    .query("issues")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  return existing !== null;
}

/**
 * Verifies that the current version matches the expected version for optimistic locking.
 * This prevents lost updates when multiple users edit the same issue simultaneously.
 *
 * @param currentVersion - The current version number from the database.
 * @param expectedVersion - The version number the client expects (from its last read).
 * @throws {ConvexError} If versions do not match (CONFLICT).
 */
export function assertVersionMatch(
  currentVersion: number | undefined,
  expectedVersion: number | undefined,
): void {
  // If no expected version provided, skip check (backwards compatibility)
  if (expectedVersion === undefined) return;

  // Current version defaults to 1 if not set
  const current = currentVersion ?? 1;

  if (current !== expectedVersion) {
    throw conflict("Issue was modified by another user. Please refresh and try again.");
  }
}

/**
 * Calculates the next version number for an issue update.
 *
 * @param currentVersion - The current version number.
 * @returns The next version number (incremented by 1).
 */
export function getNextVersion(currentVersion: number | undefined): number {
  return (currentVersion ?? 1) + 1;
}

/**
 * Finds the maximum `order` value for issues in a specific project status.
 * Used when moving an issue to a new column to place it at the end.
 *
 * @param ctx - The mutation context.
 * @param projectId - The project ID.
 * @param status - The status column identifier.
 * @returns The highest order number found, or -1 if no issues exist.
 */
export async function getMaxOrderForStatus(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  status: string,
) {
  // Use index to find max order efficiently
  // The index `by_project_status` is sorted by `isDeleted` then `order`
  // We scan in descending order, so we see deleted items (isDeleted=true) first,
  // then active items (isDeleted=false/undefined).
  // We skip deleted items and take the first active item, which has the max order.
  const latestIssue = await ctx.db
    .query("issues")
    .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", status))
    .order("desc")
    .filter(notDeleted)
    .first();

  return latestIssue?.order ?? -1;
}

/**
 * Tracks a change for a non-nullable field and adds it to the changes array if modified.
 *
 * @param changes - The array to push change records into.
 * @param field - The name of the field being updated.
 * @param oldValue - The current value of the field.
 * @param newValue - The new value of the field.
 * @returns True if the field was changed, false otherwise.
 */
export function trackFieldChange<T>(
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  field: string,
  oldValue: T,
  newValue: T | undefined,
): boolean {
  if (newValue !== undefined && newValue !== oldValue) {
    changes.push({
      field,
      oldValue: oldValue as string | number | null | undefined,
      newValue: newValue as string | number | null | undefined,
    });
    return true;
  }
  return false;
}

/**
 * Tracks and updates a nullable field.
 * Handles the distinction between `undefined` (no change) and `null` (clear value).
 *
 * @param updates - The accumulator object for database updates.
 * @param changes - The array to push change records into.
 * @param fieldName - The name of the field.
 * @param oldValue - The current value.
 * @param newValue - The new value (or null to clear, or undefined to skip).
 * @param valueTransform - Optional function to transform values for the change record (e.g. for logging IDs).
 */
export function trackNullableFieldUpdate<T>(
  updates: Record<string, unknown>,
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  fieldName: string,
  oldValue: T | undefined,
  newValue: T | null | undefined,
  valueTransform?: (val: T | null | undefined) => string | number | null | undefined,
): void {
  if (newValue !== undefined && newValue !== oldValue) {
    updates[fieldName] = newValue ?? undefined;
    changes.push({
      field: fieldName,
      oldValue: valueTransform
        ? valueTransform(oldValue)
        : (oldValue as string | number | undefined),
      newValue: valueTransform
        ? valueTransform(newValue)
        : (newValue as string | number | null | undefined),
    });
  }
}

/**
 * Processes a batch of issue updates, calculating what fields changed.
 * Updates the `changes` array in place and returns the object to be passed to `db.patch`.
 *
 * @param issue - The current issue document.
 * @param args - The updates requested by the client.
 * @param changes - An empty array to populate with change records.
 * @returns An object containing the fields to update in the database.
 *
 * @example
 * const changes = [];
 * const updates = processIssueUpdates(currentIssue, { title: "New Title" }, changes);
 * await ctx.db.patch(issueId, updates);
 * // changes now contains [{ field: "title", oldValue: "Old", newValue: "New Title" }]
 */
export function processIssueUpdates(
  issue: {
    title: string;
    description?: string;
    priority: string;
    assigneeId?: Id<"users">;
    labels: string[];
    dueDate?: number;
    estimatedHours?: number;
    storyPoints?: number;
  },
  args: {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: Id<"users"> | null;
    labels?: string[];
    dueDate?: number | null;
    estimatedHours?: number | null;
    storyPoints?: number | null;
  },
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
) {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  // Track simple field changes
  if (trackFieldChange(changes, "title", issue.title, args.title)) {
    updates.title = args.title;
  }
  if (trackFieldChange(changes, "description", issue.description, args.description)) {
    updates.description = args.description;
  }
  if (trackFieldChange(changes, "priority", issue.priority, args.priority)) {
    updates.priority = args.priority;
  }

  // Update search content if title or description changed
  if (args.title !== undefined || args.description !== undefined) {
    const newTitle = args.title ?? issue.title;
    const newDescription = args.description !== undefined ? args.description : issue.description;
    updates.searchContent = getSearchContent(newTitle, newDescription);
  }

  // Track nullable field changes
  trackNullableFieldUpdate(updates, changes, "assigneeId", issue.assigneeId, args.assigneeId);
  trackNullableFieldUpdate(updates, changes, "dueDate", issue.dueDate, args.dueDate);
  trackNullableFieldUpdate(
    updates,
    changes,
    "estimatedHours",
    issue.estimatedHours,
    args.estimatedHours,
  );
  trackNullableFieldUpdate(updates, changes, "storyPoints", issue.storyPoints, args.storyPoints);

  // Handle labels specially (array to string transform)
  if (args.labels !== undefined) {
    updates.labels = args.labels;
    changes.push({
      field: "labels",
      oldValue: issue.labels.join(", "),
      newValue: args.labels.join(", "),
    });
  }

  return updates;
}

/**
 * Checks if an issue matches an assignee filter.
 *
 * @param issue - The issue object (must contain assigneeId).
 * @param assigneeFilter - The filter value: a specific userId, "unassigned", "me", or undefined.
 * @param userId - The current user's ID (for "me" filter).
 * @returns True if the issue matches the filter.
 */
export function matchesAssigneeFilter(
  issue: { assigneeId?: Id<"users"> },
  assigneeFilter: Id<"users"> | "unassigned" | "me" | undefined,
  userId: Id<"users">,
): boolean {
  if (!assigneeFilter) return true;

  if (assigneeFilter === "unassigned") {
    return !issue.assigneeId;
  }
  if (assigneeFilter === "me") {
    return issue.assigneeId === userId;
  }
  return issue.assigneeId === assigneeFilter;
}

/**
 * Checks if an issue matches a sprint filter.
 *
 * @param issue - The issue object.
 * @param sprintFilter - The filter value: sprintId, "backlog" (no sprint), "none", or undefined.
 * @returns True if the issue matches the filter.
 */
export function matchesSprintFilter(
  issue: { sprintId?: Id<"sprints"> },
  sprintFilter: Id<"sprints"> | "backlog" | "none" | undefined,
): boolean {
  if (!sprintFilter) return true;

  if (sprintFilter === "backlog" || sprintFilter === "none") {
    return !issue.sprintId;
  }
  return issue.sprintId === sprintFilter;
}

/**
 * Checks if an issue matches an epic filter.
 *
 * @param issue - The issue object.
 * @param epicFilter - The filter value: epicId, "none" (no epic), or undefined.
 * @returns True if the issue matches the filter.
 */
export function matchesEpicFilter(
  issue: { epicId?: Id<"issues"> },
  epicFilter: Id<"issues"> | "none" | undefined,
): boolean {
  if (!epicFilter) return true;

  if (epicFilter === "none") {
    return !issue.epicId;
  }
  return issue.epicId === epicFilter;
}

/**
 * Checks if a value is present in an array filter.
 *
 * @param value - The value to check.
 * @param filterArray - The array of allowed values. If empty/undefined, all values match.
 * @returns True if the filter is empty or the value is in the array.
 */
export function matchesArrayFilter<T>(value: T, filterArray: T[] | undefined): boolean {
  if (!filterArray || filterArray.length === 0) return true;
  return filterArray.includes(value);
}

/**
 * Checks if an issue's creation time falls within a date range.
 *
 * @param creationTime - The issue's creation timestamp.
 * @param dateFrom - Start of range (inclusive).
 * @param dateTo - End of range (inclusive).
 * @returns True if the issue is within the range (or boundaries are undefined).
 */
export function matchesDateRange(
  creationTime: number,
  dateFrom?: number,
  dateTo?: number,
): boolean {
  if (dateFrom !== undefined && creationTime < dateFrom) return false;
  if (dateTo !== undefined && creationTime > dateTo) return false;
  return true;
}

/**
 * Checks if an issue has all of the required labels (AND logic).
 *
 * @param issueLabels - The labels present on the issue.
 * @param filterLabels - The labels required by the filter.
 * @returns True if the issue contains all filterLabels.
 */
export function matchesLabelsFilter(issueLabels: string[], filterLabels?: string[]): boolean {
  if (!filterLabels || filterLabels.length === 0) return true;
  return filterLabels.every((label) => issueLabels.includes(label));
}

/**
 * Evaluates whether an issue matches a comprehensive set of search filters.
 * Used for in-memory filtering after fetching candidate issues.
 *
 * @param issue - The issue document.
 * @param filters - An object containing all active filters.
 * @param userId - The current user's ID (needed for "me" assignee filter).
 * @returns True if the issue satisfies ALL provided filters.
 *
 * @example
 * const isMatch = matchesSearchFilters(issue, {
 *   status: ["todo", "in_progress"],
 *   assigneeId: "me"
 * }, currentUserId);
 */
export function matchesSearchFilters(
  issue: {
    projectId: Id<"projects">;
    assigneeId?: Id<"users">;
    reporterId: Id<"users">;
    type: string;
    status: string;
    priority: string;
    labels: string[];
    sprintId?: Id<"sprints">;
    epicId?: Id<"issues">;
    _creationTime: number;
  },
  filters: {
    projectId?: Id<"projects">;
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
    type?: string[];
    status?: string[];
    priority?: string[];
    labels?: string[];
    sprintId?: Id<"sprints"> | "backlog" | "none";
    epicId?: Id<"issues"> | "none";
    dateFrom?: number;
    dateTo?: number;
  },
  userId: Id<"users">,
): boolean {
  // Simple ID filters
  if (filters.projectId && (issue.projectId as Id<"projects">) !== filters.projectId) return false;
  if (filters.reporterId && issue.reporterId !== filters.reporterId) return false;

  // Complex filters using helpers
  if (!matchesAssigneeFilter(issue, filters.assigneeId, userId)) return false;
  if (!matchesArrayFilter(issue.type, filters.type)) return false;
  if (!matchesArrayFilter(issue.status, filters.status)) return false;
  if (!matchesArrayFilter(issue.priority, filters.priority)) return false;
  if (!matchesLabelsFilter(issue.labels, filters.labels)) return false;
  if (!matchesSprintFilter(issue, filters.sprintId)) return false;
  if (!matchesEpicFilter(issue, filters.epicId)) return false;
  if (!matchesDateRange(issue._creationTime, filters.dateFrom, filters.dateTo)) return false;

  return true;
}
