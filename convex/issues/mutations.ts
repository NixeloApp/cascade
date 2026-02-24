import { type Infer, v } from "convex/values";
import { asyncMap } from "convex-helpers";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  authenticatedMutation,
  issueMutation,
  issueViewerMutation,
  projectEditorMutation,
} from "../customFunctions";
import { validate } from "../lib/constrainedValidators";
import { conflict, validation } from "../lib/errors";
import { softDeleteFields } from "../lib/softDeleteHelpers";
import { assertIsProjectAdmin, canAccessProject } from "../projectAccess";
import { enforceRateLimit } from "../rateLimits";
import { issueTypesWithSubtask, workflowCategories } from "../validators";
import {
  applyBulkUpdate,
  assertVersionMatch,
  generateIssueKey,
  getMaxOrderForStatus,
  getNextVersion,
  getSearchContent,
  type IssueActivityAction,
  issueKeyExists,
  performBulkUpdate,
  processIssueUpdates,
  resolveLabelNames,
  validateParentIssue,
} from "./helpers";

const createIssueArgs = {
  title: v.string(),
  description: v.optional(v.string()),
  type: v.union(
    v.literal("task"),
    v.literal("bug"),
    v.literal("story"),
    v.literal("epic"),
    v.literal("subtask"),
  ),
  priority: v.union(
    v.literal("lowest"),
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("highest"),
  ),
  assigneeId: v.optional(v.id("users")),
  sprintId: v.optional(v.id("sprints")),
  epicId: v.optional(v.id("issues")),
  parentId: v.optional(v.id("issues")),
  labels: v.optional(v.array(v.id("labels"))),
  estimatedHours: v.optional(v.number()),
  dueDate: v.optional(v.number()),
  storyPoints: v.optional(v.number()),
};

type CreateIssueArgs = Infer<typeof createIssueArgsObject>;
// Helper to infer type from the object definition wrapped in v.object
const createIssueArgsObject = v.object(createIssueArgs);

/**
 * Prepares data for creating an issue by validating inputs and resolving defaults.
 *
 * Separates business logic (validation, key generation) from persistence.
 */
async function prepareCreateIssue(
  ctx: MutationCtx & {
    userId: Id<"users">;
    projectId: Id<"projects">;
    project: Doc<"projects">;
  },
  args: CreateIssueArgs,
) {
  // Validate input constraints
  validate.title(args.title);
  validate.description(args.description);
  if (args.labels) {
    validate.tags(args.labels, "labels");
  }

  // Validate parent/epic constraints
  const inheritedEpicId = await validateParentIssue(ctx, args.parentId, args.type, args.epicId);

  // Generate issue key with duplicate detection
  let issueKey = await generateIssueKey(ctx, ctx.projectId, ctx.project.key);

  if (await issueKeyExists(ctx, issueKey)) {
    const suffix = Date.now() % 10000;
    issueKey = `${issueKey}-${suffix}`;
  }

  const defaultStatus = ctx.project.workflowStates[0]?.id || "todo";
  const maxOrder = await getMaxOrderForStatus(ctx, ctx.projectId, defaultStatus);

  const labelNames = await resolveLabelNames(ctx, args.labels);

  return {
    issueKey,
    inheritedEpicId,
    defaultStatus,
    maxOrder,
    labelNames,
  };
}

/**
 * Shared implementation for creating an issue.
 */
async function createIssueImpl(
  ctx: MutationCtx & {
    userId: Id<"users">;
    projectId: Id<"projects">;
    project: Doc<"projects">;
  },
  args: CreateIssueArgs,
) {
  // Rate limit: 60 issues per minute per user with burst capacity of 15
  await enforceRateLimit(ctx, "createIssue", ctx.userId);

  const { issueKey, inheritedEpicId, defaultStatus, maxOrder, labelNames } =
    await prepareCreateIssue(ctx, args);

  const now = Date.now();
  const issueId = await ctx.db.insert("issues", {
    projectId: ctx.projectId,
    organizationId: ctx.project.organizationId,
    workspaceId: ctx.project.workspaceId,
    teamId: ctx.project.teamId,
    key: issueKey,
    title: args.title,
    description: args.description,
    type: args.type,
    status: defaultStatus,
    priority: args.priority,
    assigneeId: args.assigneeId,
    reporterId: ctx.userId,
    updatedAt: now,
    labels: labelNames,
    sprintId: args.sprintId,
    epicId: inheritedEpicId,
    parentId: args.parentId,
    linkedDocuments: [],
    attachments: [],
    estimatedHours: args.estimatedHours,
    dueDate: args.dueDate,
    storyPoints: args.storyPoints,
    searchContent: getSearchContent(args.title, args.description),
    loggedHours: 0,
    order: maxOrder + 1,
    version: 1,
  });

  await ctx.db.insert("issueActivity", {
    issueId,
    userId: ctx.userId,
    action: "created",
  });

  return { issueId, key: issueKey };
}

/**
 * Create a new issue in the project.
 *
 * This mutation handles:
 * - Rate limiting (to prevent spam).
 * - Validation of inputs (title, description, module ownership).
 * - Unique key generation (e.g., "PROJ-123") with race condition handling.
 * - Parent/Child validation (e.g., subtasks cannot have subtasks).
 * - Activity logging.
 *
 * @returns Object containing the ID and key of the created issue.
 * @throws {ConvexError} "Validation" if inputs are invalid.
 */
export const createIssue = projectEditorMutation({
  args: createIssueArgs,
  returns: v.object({ issueId: v.id("issues"), key: v.string() }),
  handler: async (ctx, args) => {
    return await createIssueImpl(ctx, args);
  },
});

/**
 * @deprecated Use `createIssue` instead. This mutation returns just the ID, while `createIssue` returns `{ issueId, key }`.
 */
export const create = projectEditorMutation({
  args: createIssueArgs,
  handler: async (ctx, args) => {
    const result = await createIssueImpl(ctx, args);
    return result.issueId;
  },
});

export const updateStatus = issueMutation({
  args: {
    newStatus: v.string(),
    newOrder: v.number(),
    expectedVersion: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    // Verify optimistic lock
    assertVersionMatch(ctx.issue.version, args.expectedVersion);

    const oldStatus = ctx.issue.status;
    const now = Date.now();

    await ctx.db.patch(ctx.issue._id, {
      status: args.newStatus,
      order: args.newOrder,
      updatedAt: now,
      version: getNextVersion(ctx.issue.version),
    });

    if (oldStatus !== args.newStatus) {
      await ctx.db.insert("issueActivity", {
        issueId: ctx.issue._id,
        userId: ctx.userId,
        action: "updated",
        field: "status",
        oldValue: oldStatus,
        newValue: args.newStatus,
      });
    }

    return { success: true } as const;
  },
});

export const updateStatusByCategory = issueMutation({
  args: {
    category: workflowCategories,
    newOrder: v.number(),
    expectedVersion: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    // Verify optimistic lock
    assertVersionMatch(ctx.issue.version, args.expectedVersion);

    const workflowStates = ctx.project?.workflowStates || [];
    const targetState = [...workflowStates]
      .sort((a, b) => a.order - b.order)
      .find((s) => s.category === args.category);

    if (!targetState) {
      throw validation(
        "category",
        `No workflow state found for category ${args.category}${ctx.project ? ` in project ${ctx.project.name}` : ""}`,
      );
    }

    const oldStatus = ctx.issue.status;
    const now = Date.now();

    await ctx.db.patch(ctx.issue._id, {
      status: targetState.id,
      order: args.newOrder,
      updatedAt: now,
      version: getNextVersion(ctx.issue.version),
    });

    if (oldStatus !== targetState.id) {
      await ctx.db.insert("issueActivity", {
        issueId: ctx.issue._id,
        userId: ctx.userId,
        action: "updated",
        field: "status",
        oldValue: oldStatus,
        newValue: targetState.id,
      });
    }

    return { success: true } as const;
  },
});

export const update = issueMutation({
  args: {
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("lowest"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("highest"),
      ),
    ),
    assigneeId: v.optional(v.union(v.id("users"), v.null())),
    labels: v.optional(v.array(v.string())),
    type: v.optional(issueTypesWithSubtask),
    startDate: v.optional(v.union(v.number(), v.null())),
    dueDate: v.optional(v.union(v.number(), v.null())),
    estimatedHours: v.optional(v.union(v.number(), v.null())),
    storyPoints: v.optional(v.union(v.number(), v.null())),
    // Optimistic locking: pass current version to detect concurrent edits
    expectedVersion: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    // Verify optimistic lock - throws conflict error if version mismatch
    assertVersionMatch(ctx.issue.version, args.expectedVersion);

    const _now = Date.now();
    const changes: Array<{
      field: string;
      oldValue: string | number | null | undefined;
      newValue: string | number | null | undefined;
    }> = [];

    const updates = processIssueUpdates(ctx.issue, args, changes);

    // Always increment version on update
    updates.version = getNextVersion(ctx.issue.version);

    if (
      args.assigneeId !== undefined &&
      args.assigneeId !== ctx.issue.assigneeId &&
      args.assigneeId &&
      args.assigneeId !== ctx.userId
    ) {
      const assigneeHasAccess = await canAccessProject(ctx, ctx.issue.projectId, args.assigneeId);

      if (assigneeHasAccess) {
        const actor = await ctx.db.get(ctx.userId);
        // Dynamic import to avoid cycles
        const { sendEmailNotification } = await import("../email/helpers");
        await sendEmailNotification(ctx, {
          userId: args.assigneeId,
          type: "assigned",
          issueId: ctx.issue._id,
          actorId: ctx.userId,
          issue: ctx.issue,
          project: ctx.project,
          actorName: actor?.name,
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(ctx.issue._id, updates);

      // Log all changes in parallel
      await Promise.all(
        changes.map((change) =>
          ctx.db.insert("issueActivity", {
            issueId: ctx.issue._id,
            userId: ctx.userId,
            action: "updated",
            field: change.field,
            oldValue: String(change.oldValue || ""),
            newValue: String(change.newValue || ""),
          }),
        ),
      );
    }

    return { success: true } as const;
  },
});

/**
 * Add a comment to an issue.
 *
 * Handles mentions, notifications (email and in-app), and activity logging.
 * Rate limited to prevent spam.
 *
 * @param content - The comment text (Markdown supported).
 * @param mentions - List of user IDs mentioned in the comment.
 * @returns Object containing the ID of the created comment.
 */
export const addComment = issueViewerMutation({
  args: {
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  returns: v.object({ commentId: v.id("issueComments") }),
  handler: async (ctx, args) => {
    // Rate limit: 120 comments per minute per user with burst of 20
    const now = Date.now();
    const mentions = args.mentions || [];

    const commentId = await ctx.db.insert("issueComments", {
      issueId: ctx.issue._id,
      authorId: ctx.userId,
      content: args.content,
      mentions,
      updatedAt: now,
    });

    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "commented",
    });

    const author = await ctx.db.get(ctx.userId);
    const actorName = author?.name;

    // Dynamic import to avoid cycles
    const { sendEmailNotification } = await import("../email/helpers");

    // Notify mentioned users in parallel
    const mentionedOthers = mentions.filter((id) => id !== ctx.userId);

    // Filter mentions by project access to prevent leaks
    const validMentions = (
      await Promise.all(
        mentionedOthers.map(async (userId) => {
          const hasAccess = await canAccessProject(ctx, ctx.projectId, userId);
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
          message: `${author?.name || "Someone"} mentioned you in ${ctx.issue.key}`,
          issueId: ctx.issue._id,
          projectId: ctx.projectId,
          isRead: false,
        }),
        sendEmailNotification(ctx, {
          userId: mentionedUserId,
          type: "mention",
          issueId: ctx.issue._id,
          actorId: ctx.userId,
          commentText: args.content,
          issue: ctx.issue,
          project: ctx.project,
          actorName,
        }),
      ]),
    );

    if (ctx.issue.reporterId !== ctx.userId) {
      const reporterHasAccess = await canAccessProject(ctx, ctx.projectId, ctx.issue.reporterId);

      if (reporterHasAccess) {
        await ctx.db.insert("notifications", {
          userId: ctx.issue.reporterId,
          type: "issue_comment",
          title: "New comment",
          message: `${author?.name || "Someone"} commented on ${ctx.issue.key}`,
          issueId: ctx.issue._id,
          projectId: ctx.projectId,
          isRead: false,
        });

        await sendEmailNotification(ctx, {
          userId: ctx.issue.reporterId,
          type: "comment",
          issueId: ctx.issue._id,
          actorId: ctx.userId,
          commentText: args.content,
          issue: ctx.issue,
          project: ctx.project,
          actorName,
        });
      }
    }

    return { commentId };
  },
});

/**
 * Bulk update the status of multiple issues.
 *
 * - Validates that the new status exists in the project's workflow.
 * - Updates the status of each issue.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param newStatus - The ID of the new status (workflow state).
 * @returns Object containing the number of updated issues.
 */
export const bulkUpdateStatus = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    newStatus: v.string(),
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    // Pre-fetch all issues to build project map (avoids N+1 reads)
    // Using asyncMap instead of Promise.all to ensure proper parallelism control if needed,
    // though performBulkUpdate used ctx.db.get inside map which is similar.
    const allIssues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const validIssues = allIssues.filter((i): i is NonNullable<typeof i> => i !== null);
    const uniqueProjectIds = [...new Set(validIssues.map((i) => i.projectId))] as Id<"projects">[];

    // Fetch all related projects in one batch
    const projectDocs = await asyncMap(uniqueProjectIds, (id) => ctx.db.get(id));
    const validProjects = projectDocs.filter((p): p is NonNullable<typeof p> => p !== null);
    const projectMap = new Map(validProjects.map((p) => [p._id.toString(), p]));

    return applyBulkUpdate(ctx, validIssues, async (issue) => {
      // Fetch project to validate status from cache
      const project = projectMap.get(issue.projectId.toString());
      if (!project) return null;

      const isValidStatus = project.workflowStates.some((s) => s.id === args.newStatus);
      if (!isValidStatus) return null;

      const oldStatus = issue.status;

      // Strict behavior preservation: update even if status is unchanged, but only log if changed.
      let activity:
        | undefined
        | { action: IssueActivityAction; field: string; oldValue: string; newValue: string };

      if (oldStatus !== args.newStatus) {
        activity = {
          action: "updated",
          field: "status",
          oldValue: oldStatus,
          newValue: args.newStatus,
        };
      }

      return {
        patch: { status: args.newStatus },
        activity,
      };
    });
  },
});

/**
 * Bulk update the priority of multiple issues.
 *
 * - Updates the priority of each issue.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param priority - The new priority level.
 * @returns Object containing the number of updated issues.
 */
export const bulkUpdatePriority = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    priority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue, _now) => {
      return {
        patch: { priority: args.priority },
        activity: {
          action: "updated",
          field: "priority",
          oldValue: issue.priority,
          newValue: args.priority,
        },
      };
    });
  },
});

/**
 * Bulk assign multiple issues to a user.
 *
 * - Updates the assignee of each issue.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param assigneeId - The user ID to assign, or null to unassign.
 * @returns Object containing the number of updated issues.
 */
export const bulkAssign = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    assigneeId: v.union(v.id("users"), v.null()),
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue, _now) => {
      return {
        patch: { assigneeId: args.assigneeId ?? undefined },
        activity: {
          action: "updated",
          field: "assignee",
          oldValue: issue.assigneeId ? String(issue.assigneeId) : "",
          newValue: args.assigneeId ? String(args.assigneeId) : "",
        },
      };
    });
  },
});

/**
 * Bulk add labels to multiple issues.
 *
 * - Adds the specified labels to the existing labels of each issue (no duplicates).
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param labels - Array of label names to add.
 * @returns Object containing the number of updated issues.
 */
export const bulkAddLabels = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    labels: v.array(v.string()),
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue) => {
      const updatedLabels = Array.from(new Set([...issue.labels, ...args.labels]));
      return {
        patch: { labels: updatedLabels },
        activity: {
          action: "updated",
          field: "labels",
          oldValue: issue.labels.join(", "),
          newValue: updatedLabels.join(", "),
        },
      };
    });
  },
});

/**
 * Bulk move multiple issues to a sprint.
 *
 * - Updates the sprint ID of each issue.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param sprintId - The sprint ID to move to, or null to remove from sprint.
 * @returns Object containing the number of updated issues.
 */
export const bulkMoveToSprint = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    sprintId: v.union(v.id("sprints"), v.null()),
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue) => {
      return {
        patch: { sprintId: args.sprintId ?? undefined },
        activity: {
          action: "updated",
          field: "sprint",
          oldValue: issue.sprintId ? String(issue.sprintId) : "",
          newValue: args.sprintId ? String(args.sprintId) : "",
        },
      };
    });
  },
});

/**
 * Bulk soft-delete multiple issues.
 *
 * - Marks issues as deleted (soft delete).
 * - Logs activity for each issue.
 * - Requires project admin permissions for each issue.
 *
 * @param issueIds - Array of issue IDs to delete.
 * @returns Object containing the number of deleted issues.
 */
export const bulkDelete = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertIsProjectAdmin(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Soft delete issue
        await ctx.db.patch(issue._id, softDeleteFields(ctx.userId));

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "deleted",
        });

        return 1;
      }),
    );

    return { deleted: results.reduce((a: number, b) => a + b, 0) };
  },
});

// =============================================================================
// ARCHIVE OPERATIONS (Plane parity)
// =============================================================================

/**
 * Archive a single issue.
 *
 * - Marks the issue as archived.
 * - Logs activity.
 *
 * @returns Object with success status.
 * @throws {ConvexError} "Conflict" if the issue is already archived.
 * @throws {ConvexError} "Validation" if the issue is not in the "done" workflow category.
 */
export const archive = issueMutation({
  args: {},
  returns: v.object({ success: v.boolean(), archived: v.boolean() }),
  handler: async (ctx) => {
    const issue = ctx.issue;

    // Already archived
    if (issue.archivedAt) {
      throw conflict("Issue is already archived");
    }

    // Check if issue is in "done" category
    const state = ctx.project.workflowStates.find((s) => s.id === issue.status);
    if (!state || state.category !== "done") {
      throw validation("status", "Only completed issues can be archived");
    }

    // Archive the issue
    await ctx.db.patch(issue._id, {
      archivedAt: Date.now(),
      archivedBy: ctx.userId,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "archived",
    });

    return { success: true, archived: true };
  },
});

/**
 * Restore (unarchive) a single issue.
 *
 * - Removes the archived status.
 * - Logs activity.
 *
 * @returns Object with success status.
 * @throws {ConvexError} "Conflict" if the issue is not archived.
 */
export const restore = issueMutation({
  args: {},
  returns: v.object({ success: v.boolean(), restored: v.boolean() }),
  handler: async (ctx) => {
    const issue = ctx.issue;

    // Not archived
    if (!issue.archivedAt) {
      throw conflict("Issue is not archived");
    }

    // Restore the issue
    await ctx.db.patch(issue._id, {
      archivedAt: undefined,
      archivedBy: undefined,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "restored",
    });

    return { success: true, restored: true };
  },
});

/**
 * Bulk archive multiple issues.
 *
 * - Only archives issues that are in the "done" workflow category.
 * - Skips issues that are already archived or not in "done" state.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to archive.
 * @returns Object containing the number of archived issues.
 */
export const bulkArchive = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  returns: v.object({ archived: v.number() }),
  handler: async (ctx, args) => {
    // Pre-fetch all issues to build project map (avoids N+1 reads)
    const allIssues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const validIssues = allIssues.filter((i): i is NonNullable<typeof i> => i !== null);
    const uniqueProjectIds = [...new Set(validIssues.map((i) => i.projectId))] as Id<"projects">[];
    const projectDocs = await asyncMap(uniqueProjectIds, (id) => ctx.db.get(id));
    const validProjects = projectDocs.filter((p): p is NonNullable<typeof p> => p !== null);
    const projectMap = new Map(validProjects.map((p) => [p._id.toString(), p]));

    const result = await applyBulkUpdate(ctx, validIssues, async (issue, now) => {
      // Already archived?
      if (issue.archivedAt) return null;

      // Check if issue is in "done" category using cached project
      const project = projectMap.get(issue.projectId.toString());
      if (!project) return null;

      const state = project.workflowStates.find((s) => s.id === issue.status);
      if (!state || state.category !== "done") return null;

      return {
        patch: {
          archivedAt: now,
          archivedBy: ctx.userId,
        },
        activity: {
          action: "archived",
        },
      };
    });

    return { archived: result.updated };
  },
});

/**
 * Bulk restore (unarchive) multiple issues.
 *
 * - Restores archived issues to their previous state.
 * - Skips issues that are not archived.
 * - Logs activity for each issue.
 * - Skips issues that the user does not have permission to edit.
 *
 * @param issueIds - Array of issue IDs to restore.
 * @returns Object containing the number of restored issues.
 */
export const bulkRestore = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  returns: v.object({ restored: v.number() }),
  handler: async (ctx, args) => {
    const result = await performBulkUpdate(ctx, args.issueIds, async (issue, _now) => {
      if (!issue.archivedAt) return null;

      return {
        patch: {
          archivedAt: undefined,
          archivedBy: undefined,
        },
        activity: {
          action: "restored",
        },
      };
    });

    return { restored: result.updated };
  },
});

/**
 * Bulk update the due date for multiple issues.
 *
 * - Validates that the due date is not before the start date.
 * - Logs activity for each issue.
 * - Skips issues where the date validation fails or permission is denied.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param dueDate - The new due date timestamp, or null to clear.
 * @returns Object containing the number of updated issues.
 */
export const bulkUpdateDueDate = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    dueDate: v.union(v.number(), v.null()), // null to clear
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue, _now) => {
      // Validate: due date should not be before start date
      if (args.dueDate !== null && issue.startDate && args.dueDate < issue.startDate) {
        return null; // Skip issues where due date would be before start date
      }

      return {
        patch: {
          dueDate: args.dueDate ?? undefined,
          version: (issue.version ?? 1) + 1,
        },
        activity: {
          action: "updated",
          field: "dueDate",
          oldValue: issue.dueDate ? new Date(issue.dueDate).toISOString() : undefined,
          newValue: args.dueDate ? new Date(args.dueDate).toISOString() : undefined,
        },
      };
    });
  },
});

/**
 * Bulk update the start date for multiple issues.
 *
 * - Validates that the start date is not after the due date.
 * - Logs activity for each issue.
 * - Skips issues where the date validation fails or permission is denied.
 *
 * @param issueIds - Array of issue IDs to update.
 * @param startDate - The new start date timestamp, or null to clear.
 * @returns Object containing the number of updated issues.
 */
export const bulkUpdateStartDate = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    startDate: v.union(v.number(), v.null()), // null to clear
  },
  returns: v.object({ updated: v.number() }),
  handler: async (ctx, args) => {
    return performBulkUpdate(ctx, args.issueIds, async (issue, _now) => {
      // Validate: start date should not be after due date
      if (args.startDate !== null && issue.dueDate && args.startDate > issue.dueDate) {
        return null; // Skip issues where start date would be after due date
      }

      return {
        patch: {
          startDate: args.startDate ?? undefined,
          version: (issue.version ?? 1) + 1,
        },
        activity: {
          action: "updated",
          field: "startDate",
          oldValue: issue.startDate ? new Date(issue.startDate).toISOString() : undefined,
          newValue: args.startDate ? new Date(args.startDate).toISOString() : undefined,
        },
      };
    });
  },
});
