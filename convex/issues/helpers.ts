import { asyncMap } from "convex-helpers";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { conflict, notFound, validation } from "../lib/errors";

export const ROOT_ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;

// Helper: Combined searchable content for issues
export function getSearchContent(title: string, description?: string) {
  return `${title} ${description || ""}`.trim();
}

// Helper: Validate parent issue and get inherited epic
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

// Helper: Generate issue key with race condition protection
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

// Helper: Check if an issue key already exists (for duplicate detection)
export async function issueKeyExists(ctx: MutationCtx, key: string): Promise<boolean> {
  const existing = await ctx.db
    .query("issues")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  return existing !== null;
}

// Helper: Verify optimistic lock version matches
// Throws conflict error if version mismatch (stale update)
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

// Helper: Get next version number for an issue update
export function getNextVersion(currentVersion: number | undefined): number {
  return (currentVersion ?? 1) + 1;
}

// Helper: Get max order for status column
export async function getMaxOrderForStatus(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  status: string,
) {
  // Limit to 1000 issues per status - reasonable cap for any Kanban column
  const MAX_ISSUES_PER_STATUS = 1000;
  const issuesInStatus = await ctx.db
    .query("issues")
    .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", status))
    .take(MAX_ISSUES_PER_STATUS);

  // Handle empty array case - return -1 if no issues
  if (issuesInStatus.length === 0) return -1;
  return Math.max(...issuesInStatus.map((i) => i.order));
}

// Helper: Track field change and add to changes array
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

// Helper: Track and update a nullable field
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

// Helper: Process issue update fields and track changes
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

// Helper: Check if issue matches assignee filter
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

// Helper: Check if issue matches sprint filter
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

// Helper: Check if issue matches epic filter
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

// Helper: Check if value matches array filter
export function matchesArrayFilter<T>(value: T, filterArray: T[] | undefined): boolean {
  if (!filterArray || filterArray.length === 0) return true;
  return filterArray.includes(value);
}

// Helper: Check if issue matches date range
export function matchesDateRange(
  creationTime: number,
  dateFrom?: number,
  dateTo?: number,
): boolean {
  if (dateFrom && creationTime < dateFrom) return false;
  if (dateTo && creationTime > dateTo) return false;
  return true;
}

// Helper: Check if issue matches labels filter (all labels must be present)
export function matchesLabelsFilter(issueLabels: string[], filterLabels?: string[]): boolean {
  if (!filterLabels || filterLabels.length === 0) return true;
  return filterLabels.every((label) => issueLabels.includes(label));
}

// Helper: Check if issue matches all search filters
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

// Helper: Run bulk mutation on issues
export async function runBulkMutation(
  ctx: MutationCtx & { userId: Id<"users"> },
  issueIds: Id<"issues">[],
  permissionCheck: (
    ctx: MutationCtx,
    projectId: Id<"projects">,
    userId: Id<"users">,
  ) => Promise<void>,
  process: (
    ctx: MutationCtx & { userId: Id<"users"> },
    issue: Doc<"issues">,
    project: Doc<"projects"> | null,
    // biome-ignore lint/suspicious/noConfusingVoidType: allow void return
  ) => Promise<void | number | undefined>,
) {
  const issues = await asyncMap(issueIds, (id) => ctx.db.get(id));

  // Pre-fetch projects to minimize DB calls and allow project access in callbacks
  const projectIds = new Set<Id<"projects">>();
  for (const issue of issues) {
    if (issue && !issue.isDeleted && issue.projectId) {
      projectIds.add(issue.projectId);
    }
  }
  const projects = await asyncMap([...projectIds], (id) => ctx.db.get(id));
  const projectMap = new Map(projects.map((p) => [p?._id.toString(), p]));

  const results = await Promise.all(
    issues.map(async (issue) => {
      if (!issue || issue.isDeleted) return 0;

      const projectId = issue.projectId as Id<"projects">;
      const project = projectMap.get(projectId.toString()) ?? null;

      try {
        await permissionCheck(ctx, projectId, ctx.userId);
      } catch {
        return 0;
      }

      // Allow callback to return explicit 0 for failure (e.g. validation), or void/undefined for success (count as 1)
      const result = await process(ctx, issue, project);
      return typeof result === "number" ? result : 1;
    }),
  );

  return results.reduce((a: number, b) => a + b, 0);
}
