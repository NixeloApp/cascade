import { asyncMap, pruneNull } from "convex-helpers";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { conflict, notFound, validation } from "../lib/errors";
import { notDeleted } from "../lib/softDeleteHelpers";
import { assertCanEditProject, canAccessProject } from "../projectAccess";

export const ROOT_ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;

/**
 * Generates a combined string for full-text search.
 * Concatenates title and description for efficient indexing.
 *
 * @param title - The issue title.
 * @param description - The issue description (optional).
 * @returns A single string containing both fields.
 */
export function getSearchContent(title: string, description?: string) {
  return `${title} ${description || ""}`.trim();
}

/**
 * Validates the parent issue and determines the inherited epic ID.
 *
 * Enforces hierarchy rules:
 * - Epics are root-level and cannot be subtasks.
 * - Subtasks can only be one level deep (cannot be a child of another subtask).
 * - Issues with a parent MUST be of type 'subtask'.
 * - Inherits the epic ID from the parent if not explicitly provided.
 *
 * @param ctx - Mutation context.
 * @param parentId - ID of the parent issue (if any).
 * @param issueType - Type of the issue being created/updated.
 * @param epicId - Explicitly provided epic ID (optional).
 * @returns The resolved epic ID to use for the issue.
 * @throws {ConvexError} "NotFound" if parent issue doesn't exist.
 * @throws {ConvexError} "Validation" if hierarchy rules are violated.
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
 * Generates a unique issue key (e.g., "PROJ-123") with race condition protection.
 *
 * Finds the highest existing key number in the project and increments it.
 * Note: This relies on creation time ordering and keys being sequential.
 *
 * @param ctx - Mutation context.
 * @param projectId - The project ID.
 * @param projectKey - The project key prefix (e.g., "PROJ").
 * @returns The generated key string.
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
 * Checks if an issue key already exists to prevent duplicates.
 *
 * @param ctx - Mutation context.
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
 *
 * Used to detect concurrent edits. If versions don't match, it means another user
 * has modified the issue since it was loaded.
 *
 * @param currentVersion - The current version number from the database.
 * @param expectedVersion - The version number expected by the client.
 * @throws {ConvexError} "Conflict" if versions do not match.
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
 * @returns The next version number.
 */
export function getNextVersion(currentVersion: number | undefined): number {
  return (currentVersion ?? 1) + 1;
}

/**
 * Gets the maximum order value for a specific status column in a project.
 * Used when appending new issues to the end of a column.
 *
 * @param ctx - Mutation context.
 * @param projectId - The project ID.
 * @param status - The workflow status ID.
 * @returns The maximum order value found, or -1 if no issues exist.
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
 * Helper to track if a field has changed, update the record, and record the change for activity logging.
 *
 * @param updates - The updates object to modify.
 * @param changes - Array to append the change record to.
 * @param field - Name of the field being updated.
 * @param oldValue - The original value.
 * @param newValue - The new value (undefined means no change).
 */
export function trackFieldChange<T>(
  updates: Record<string, unknown>,
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  field: string,
  oldValue: T,
  newValue: T | undefined,
): void {
  if (newValue !== undefined && newValue !== oldValue) {
    updates[field] = newValue;
    changes.push({
      field,
      oldValue: oldValue as string | number | null | undefined,
      newValue: newValue as string | number | null | undefined,
    });
  }
}

/**
 * Helper to track updates to nullable fields.
 * Handles the distinction between `undefined` (no change) and `null` (clear value).
 *
 * @param updates - The updates object to modify.
 * @param changes - Array to append the change record to.
 * @param fieldName - Name of the field being updated.
 * @param oldValue - The original value.
 * @param newValue - The new value (undefined = no change, null = clear).
 * @param valueTransform - Optional function to transform values for the activity log.
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
 * Processes a set of updates for an issue, detecting changes and preparing the patch object.
 *
 * @param issue - The current state of the issue.
 * @param args - The requested updates.
 * @param changes - Array to collect change records for activity logging.
 * @returns The patch object containing only the fields that need updating.
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
  trackFieldChange(updates, changes, "title", issue.title, args.title);
  trackFieldChange(updates, changes, "description", issue.description, args.description);
  trackFieldChange(updates, changes, "priority", issue.priority, args.priority);

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
 * Checks if an issue matches a specific assignee filter.
 *
 * Supports special values:
 * - "unassigned": Matches issues with no assignee.
 * - "me": Matches issues assigned to the current user.
 *
 * @param issue - The issue to check.
 * @param assigneeFilter - The filter value (ID, "unassigned", "me", or undefined).
 * @param userId - The current user's ID (for "me" check).
 * @returns True if the issue matches.
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
 * Supports special values:
 * - "backlog" or "none": Matches issues not assigned to any sprint.
 *
 * @param issue - The issue to check.
 * @param sprintFilter - The filter value (ID, "backlog", "none", or undefined).
 * @returns True if the issue matches.
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
 * Supports special values:
 * - "none": Matches issues that do not belong to an epic.
 *
 * @param issue - The issue to check.
 * @param epicFilter - The filter value (ID, "none", or undefined).
 * @returns True if the issue matches.
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
 * Checks if a value matches any of the values in a filter array.
 * If the filter array is empty or undefined, it's considered a match (no filter).
 *
 * @param value - The value to check.
 * @param filterArray - The array of allowed values.
 * @returns True if matched or no filter applied.
 */
export function matchesArrayFilter<T>(value: T, filterArray: T[] | undefined): boolean {
  if (!filterArray || filterArray.length === 0) return true;
  return filterArray.includes(value);
}

/**
 * Checks if an issue's creation time falls within a date range.
 *
 * @param creationTime - The issue's creation timestamp.
 * @param dateFrom - Start of range (inclusive, optional).
 * @param dateTo - End of range (inclusive, optional).
 * @returns True if within range.
 */
export function matchesDateRange(
  creationTime: number,
  dateFrom?: number,
  dateTo?: number,
): boolean {
  if (dateFrom && creationTime < dateFrom) return false;
  if (dateTo && creationTime > dateTo) return false;
  return true;
}

/**
 * Checks if an issue has ALL of the specified labels (AND logic).
 *
 * @param issueLabels - The labels on the issue.
 * @param filterLabels - The labels required by the filter.
 * @returns True if the issue contains all filter labels.
 */
export function matchesLabelsFilter(issueLabels: string[], filterLabels?: string[]): boolean {
  if (!filterLabels || filterLabels.length === 0) return true;
  return filterLabels.every((label) => issueLabels.includes(label));
}

/**
 * Checks if an issue matches a complex set of search filters.
 *
 * Used for in-memory filtering after fetching candidate issues.
 * Supports:
 * - Project and Reporter IDs.
 * - Assignee (including "me", "unassigned").
 * - Arrays of types, statuses, priorities, labels.
 * - Sprint ("backlog", "none") and Epic ("none") special values.
 * - Date ranges.
 *
 * @param issue - The issue to check.
 * @param filters - The filter criteria.
 * @param userId - The current user's ID (for "me" checks).
 * @returns True if the issue matches all active filters.
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

// Activity action types for type safety
export type IssueActivityAction =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "deleted"
  | "commented";

/**
 * Wrapper for `applyBulkUpdate` that fetches issues by ID first.
 *
 * @param ctx - Mutation context.
 * @param issueIds - Array of issue IDs to update.
 * @param getUpdate - Callback to generate the update for each issue.
 * @param checkPermission - Optional permission check function (defaults to assertCanEditProject).
 * @returns Object with the count of updated issues.
 */
export async function performBulkUpdate(
  ctx: MutationCtx & { userId: Id<"users"> },
  issueIds: Id<"issues">[],
  getUpdate: (
    issue: Doc<"issues">,
    now: number,
  ) => Promise<{
    patch: Partial<Doc<"issues">>;
    activity?: {
      action: IssueActivityAction;
      field?: string;
      oldValue?: string;
      newValue?: string;
    };
  } | null>,
  checkPermission: (
    ctx: MutationCtx,
    projectId: Id<"projects">,
    userId: Id<"users">,
  ) => Promise<void> = assertCanEditProject,
) {
  const issues = await asyncMap(issueIds, (id) => ctx.db.get(id));
  return applyBulkUpdate(ctx, issues, getUpdate, checkPermission);
}

/**
 * Applies a bulk update to a list of issues.
 *
 * Handles:
 * - Permission checking per issue.
 * - Skipping deleted or missing issues.
 * - Applying the patch.
 * - Logging activity.
 *
 * @param ctx - Mutation context.
 * @param issues - Array of issue documents (can contain nulls).
 * @param getUpdate - Callback that returns the patch and activity log for an issue (or null to skip).
 * @param checkPermission - Permission check function.
 * @returns Object with the count of updated issues.
 */
export async function applyBulkUpdate(
  ctx: MutationCtx & { userId: Id<"users"> },
  issues: (Doc<"issues"> | null)[],
  getUpdate: (
    issue: Doc<"issues">,
    now: number,
  ) => Promise<{
    patch: Partial<Doc<"issues">>;
    activity?: {
      action: IssueActivityAction;
      field?: string;
      oldValue?: string;
      newValue?: string;
    };
  } | null>,
  checkPermission: (
    ctx: MutationCtx,
    projectId: Id<"projects">,
    userId: Id<"users">,
  ) => Promise<void> = assertCanEditProject,
) {
  const now = Date.now();

  const results = await Promise.all(
    issues.map(async (issue) => {
      if (!issue || issue.isDeleted) return 0;

      try {
        await checkPermission(ctx, issue.projectId as Id<"projects">, ctx.userId);
      } catch {
        return 0;
      }

      const update = await getUpdate(issue, now);
      if (!update) return 0;

      await ctx.db.patch(issue._id, {
        ...update.patch,
        updatedAt: now,
      });

      if (update.activity) {
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          ...update.activity,
        });
      }

      return 1;
    }),
  );

  return { updated: results.reduce((a: number, b) => a + b, 0) };
}

/**
 * Resolves a list of label IDs into their names.
 * Used for storing label names directly on issues (denormalization) or logging.
 *
 * @param ctx - Mutation context.
 * @param labelIds - Array of label IDs.
 * @returns Array of label names.
 */
export async function resolveLabelNames(
  ctx: MutationCtx,
  labelIds: Id<"labels">[] | undefined,
): Promise<string[]> {
  if (!labelIds || labelIds.length === 0) {
    return [];
  }
  const labels = await asyncMap(labelIds, (id) => ctx.db.get(id));
  return pruneNull(labels).map((l) => l.name);
}

/**
 * Helper to fetch issues and their associated projects in an optimized way.
 * Used for bulk operations that need to validate against project configuration.
 *
 * @param ctx - Mutation context.
 * @param issueIds - Array of issue IDs to fetch.
 * @returns Object containing the filtered issues and a map of projects.
 */
export async function fetchIssuesWithProjects(ctx: MutationCtx, issueIds: Id<"issues">[]) {
  const allIssues = await asyncMap(issueIds, (id) => ctx.db.get(id));
  const issues = allIssues.filter((i): i is NonNullable<typeof i> => i !== null);
  const uniqueProjectIds = [...new Set(issues.map((i) => i.projectId))] as Id<"projects">[];
  const projectDocs = await asyncMap(uniqueProjectIds, (id) => ctx.db.get(id));
  const validProjects = projectDocs.filter((p): p is NonNullable<typeof p> => p !== null);
  const projectMap = new Map(validProjects.map((p) => [p._id.toString(), p]));

  return { issues, projectMap };
}

/**
 * Handles notifications for issue comments (mentions and reporter notifications).
 *
 * @param ctx - Mutation context.
 * @param args - Arguments including issue, project, content, mentions, etc.
 */
export async function notifyCommentParticipants(
  ctx: MutationCtx,
  args: {
    issueId: Id<"issues">;
    issueKey: string;
    projectId: Id<"projects">;
    content: string;
    mentions: Id<"users">[];
    actorId: Id<"users">;
    reporterId: Id<"users">;
    issue: Doc<"issues">;
    project: Doc<"projects">;
  },
) {
  const author = await ctx.db.get(args.actorId);
  const actorName = author?.name;

  // Dynamic import to avoid cycles
  const { sendEmailNotification } = await import("../email/helpers");

  // Notify mentioned users in parallel
  const mentionedOthers = args.mentions.filter((id) => id !== args.actorId);

  // Filter mentions by project access to prevent leaks
  const validMentions = (
    await Promise.all(
      mentionedOthers.map(async (userId) => {
        const hasAccess = await canAccessProject(ctx, args.projectId, userId);
        return hasAccess ? userId : null;
      }),
    )
  ).filter((id): id is Id<"users"> => id !== null);

  await Promise.all(
    validMentions.flatMap((mentionedUserId) => [
      ctx.db.insert("notifications", {
        userId: mentionedUserId,
        type: "issue_mentioned",
        title: "You were mentioned",
        message: `${author?.name || "Someone"} mentioned you in ${args.issueKey}`,
        issueId: args.issueId,
        projectId: args.projectId,
        isRead: false,
        isDeleted: false,
      }),
      sendEmailNotification(ctx, {
        userId: mentionedUserId,
        type: "mention",
        issueId: args.issueId,
        actorId: args.actorId,
        commentText: args.content,
        issue: args.issue,
        project: args.project,
        actorName,
      }),
    ]),
  );

  if (args.reporterId !== args.actorId) {
    const reporterHasAccess = await canAccessProject(ctx, args.projectId, args.reporterId);

    if (reporterHasAccess) {
      await ctx.db.insert("notifications", {
        userId: args.reporterId,
        type: "issue_comment",
        title: "New comment",
        message: `${author?.name || "Someone"} commented on ${args.issueKey}`,
        issueId: args.issueId,
        projectId: args.projectId,
        isRead: false,
        isDeleted: false,
      });

      await sendEmailNotification(ctx, {
        userId: args.reporterId,
        type: "comment",
        issueId: args.issueId,
        actorId: args.actorId,
        commentText: args.content,
        issue: args.issue,
        project: args.project,
        actorName,
      });
    }
  }
}

/**
 * Helper to perform a simple bulk update on a single field.
 * Handles value normalization (null -> undefined for patch) and activity logging.
 *
 * @param ctx - Mutation context.
 * @param issueIds - Array of issue IDs to update.
 * @param field - The field to update.
 * @param newValue - The new value (null to unset/clear).
 * @param fieldNameInActivity - Optional custom field name for activity log (e.g. "sprint" instead of "sprintId").
 */
export async function performSimpleBulkUpdate<K extends keyof Doc<"issues">>(
  ctx: MutationCtx & { userId: Id<"users"> },
  issueIds: Id<"issues">[],
  field: K,
  newValue: Doc<"issues">[K] | null,
  fieldNameInActivity?: string,
) {
  const activityField = fieldNameInActivity ?? String(field);

  return performBulkUpdate(ctx, issueIds, async (issue) => {
    const currentValue = issue[field];

    // Determine patch value: null means "unset" (undefined in DB)
    // We cast to undefined because optional fields in Doc<T> include undefined
    const patchValue = (newValue === null ? undefined : newValue) as Doc<"issues">[K] | undefined;

    // Check if value actually changed
    // We treat undefined and null as equivalent for "unset"
    const isCurrentUnset = currentValue === undefined || currentValue === null;
    const isNewUnset = patchValue === undefined;

    if (isCurrentUnset && isNewUnset) return null;
    if (!isCurrentUnset && !isNewUnset && currentValue === patchValue) return null;

    return {
      patch: { [field]: patchValue },
      activity: {
        action: "updated",
        field: activityField,
        oldValue: currentValue !== undefined && currentValue !== null ? String(currentValue) : "",
        newValue: patchValue !== undefined ? String(patchValue) : "",
      },
    };
  });
}

/**
 * Applies a status update to an issue, handling versioning, ordering, and activity logging.
 *
 * @param ctx - Mutation context.
 * @param issue - The issue document to update.
 * @param newStatus - The new status ID.
 * @param newOrder - The new order for the issue.
 * @param now - Optional timestamp (defaults to Date.now()).
 */
export async function applyStatusUpdate(
  ctx: MutationCtx & { userId: Id<"users"> },
  issue: Doc<"issues">,
  newStatus: string,
  newOrder: number,
  now: number = Date.now(),
) {
  const oldStatus = issue.status;

  await ctx.db.patch(issue._id, {
    status: newStatus,
    order: newOrder,
    updatedAt: now,
    version: getNextVersion(issue.version),
  });

  if (oldStatus !== newStatus) {
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "updated",
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }
}
