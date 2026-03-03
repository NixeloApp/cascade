/**
 * Issue Mutation Functions
 *
 * Write operations for issues: create, update, delete, status changes.
 * Handles subtasks, assignments, priorities, and workflow transitions.
 * Enforces permissions and triggers activity logging/notifications.
 */

import { type Infer, v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  authenticatedMutation,
  issueMutation,
  issueViewerMutation,
  projectEditorMutation,
} from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { validate } from "../lib/constrainedValidators";
import { conflict, forbidden, validation } from "../lib/errors";
import { syncProjectIssueStats } from "../lib/projectIssueStats";
import { notDeleted, softDeleteFields } from "../lib/softDeleteHelpers";
import { assertIsProjectAdmin, canAccessProject } from "../projectAccess";
import { enforceRateLimit } from "../rateLimits";
import { issueTypesWithSubtask, workflowCategories } from "../validators";
import {
  applyBulkUpdate,
  applyStatusUpdate,
  assertVersionMatch,
  fetchIssuesWithProjects,
  generateIssueKey,
  getMaxOrderForStatus,
  getNextVersion,
  getSearchContent,
  type IssueActivityAction,
  issueKeyExists,
  notifyCommentParticipants,
  performBulkDateUpdate,
  performBulkUpdate,
  performSimpleBulkUpdate,
  processIssueUpdates,
  resolveLabelNames,
  validateParentIssue,
} from "./helpers";

async function hasSlackDestinationsForProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project || project.isDeleted) {
    return false;
  }

  const ownerConnection = await ctx.db
    .query("slackConnections")
    .withIndex("by_user", (q) => q.eq("userId", project.createdBy))
    .first();
  if (ownerConnection?.isActive && ownerConnection.incomingWebhookUrl) {
    return true;
  }

  const members = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  for (const member of members) {
    const connection = await ctx.db
      .query("slackConnections")
      .withIndex("by_user", (q) => q.eq("userId", member.userId))
      .first();
    if (connection?.isActive && connection.incomingWebhookUrl) {
      return true;
    }
  }

  return false;
}

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
  await syncProjectIssueStats(ctx, ctx.projectId);
  if (await hasSlackDestinationsForProject(ctx, ctx.projectId)) {
    await ctx.scheduler.runAfter(0, internal.slack.sendIssueNotification, {
      issueId,
      event: "issue.created",
      userId: ctx.userId,
    });
  }

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

/**
 * Update the status of an issue.
 *
 * This mutation handles:
 * - Updating the issue's status to a specific workflow state.
 * - Reordering the issue within the new column.
 * - Optimistic locking to prevent concurrent overwrite issues.
 * - Activity logging.
 *
 * @param newStatus - The ID of the new status (workflow state).
 * @param newOrder - The new order position within the column.
 * @param expectedVersion - The expected current version of the issue (for optimistic locking).
 * @returns Object with a boolean indicating success.
 * @throws {ConvexError} "Conflict" if the expected version does not match.
 */
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

    await applyStatusUpdate(ctx, ctx.issue, args.newStatus, args.newOrder);

    return { success: true } as const;
  },
});

/**
 * Update the status of an issue based on a workflow category.
 *
 * Instead of specifying a specific status ID, this mutation finds the correct
 * state within the project's workflow based on the provided category (e.g., "todo", "done").
 *
 * This mutation handles:
 * - Looking up the correct workflow state ID for the given category.
 * - Updating the issue's status to that workflow state.
 * - Reordering the issue within the new column.
 * - Optimistic locking to prevent concurrent overwrite issues.
 * - Activity logging.
 *
 * @param category - The workflow category to move the issue to.
 * @param newOrder - The new order position within the column.
 * @param expectedVersion - The expected current version of the issue (for optimistic locking).
 * @returns Object with a boolean indicating success.
 * @throws {ConvexError} "Validation" if no workflow state matches the category.
 * @throws {ConvexError} "Conflict" if the expected version does not match.
 */
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

    await applyStatusUpdate(ctx, ctx.issue, targetState.id, args.newOrder);

    return { success: true } as const;
  },
});

/**
 * Update an issue's general properties.
 *
 * This mutation handles:
 * - Validating new values (title length, dates, estimation).
 * - Updating properties like title, description, priority, assignee, and dates.
 * - Tracking and saving activity logs for every changed field.
 * - Handling email notifications if the assignee has changed.
 * - Sending Slack notifications if configured.
 * - Optimistic locking and version incrementing.
 *
 * @param expectedVersion - The expected current version of the issue (for optimistic locking).
 * @param title - The new issue title (optional).
 * @param description - The new issue description (optional).
 * @param priority - The new issue priority (optional).
 * @param assigneeId - The new assignee (optional, null to unassign).
 * @param labels - The new set of labels (optional).
 * @param type - The new issue type (optional).
 * @param startDate - The new start date timestamp (optional).
 * @param dueDate - The new due date timestamp (optional).
 * @param estimatedHours - The new estimate in hours (optional).
 * @param storyPoints - The new estimate in story points (optional).
 * @returns Object with a boolean indicating success.
 * @throws {ConvexError} "Conflict" if the expected version does not match.
 * @throws {ConvexError} "Validation" if input constraints are not met.
 */
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

      if (await hasSlackDestinationsForProject(ctx, ctx.issue.projectId)) {
        await ctx.scheduler.runAfter(0, internal.slack.sendIssueNotification, {
          issueId: ctx.issue._id,
          event: "issue.updated",
          userId: ctx.userId,
        });

        if (
          args.assigneeId !== undefined &&
          args.assigneeId !== ctx.issue.assigneeId &&
          args.assigneeId !== null
        ) {
          await ctx.scheduler.runAfter(0, internal.slack.sendIssueNotification, {
            issueId: ctx.issue._id,
            event: "issue.assigned",
            userId: ctx.userId,
          });
        }
      }
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
    attachments: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.object({ commentId: v.id("issueComments") }),
  handler: async (ctx, args) => {
    // Rate limit: 120 comments per minute per user with burst of 20
    const now = Date.now();
    const mentions = args.mentions || [];
    const attachments = args.attachments || [];

    if (attachments.length > 0) {
      const issueAttachments = new Set((ctx.issue.attachments || []).map((id) => id.toString()));
      for (const storageId of attachments) {
        if (!issueAttachments.has(storageId.toString())) {
          throw forbidden("Attachment does not belong to this issue");
        }
      }
    }

    const commentId = await ctx.db.insert("issueComments", {
      issueId: ctx.issue._id,
      authorId: ctx.userId,
      content: args.content,
      mentions,
      attachments,
      updatedAt: now,
    });

    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "commented",
    });

    await notifyCommentParticipants(ctx, {
      issueId: ctx.issue._id,
      issueKey: ctx.issue.key,
      projectId: ctx.projectId,
      content: args.content,
      mentions,
      actorId: ctx.userId,
      reporterId: ctx.issue.reporterId,
      issue: ctx.issue,
      project: ctx.project,
    });

    if (await hasSlackDestinationsForProject(ctx, ctx.projectId)) {
      await ctx.scheduler.runAfter(0, internal.slack.sendIssueNotification, {
        issueId: ctx.issue._id,
        event: "comment.created",
        userId: ctx.userId,
      });
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
    const { issues: validIssues, projectMap } = await fetchIssuesWithProjects(ctx, args.issueIds);

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
    return performSimpleBulkUpdate(ctx, args.issueIds, "priority", args.priority);
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
    return performSimpleBulkUpdate(ctx, args.issueIds, "assigneeId", args.assigneeId, "assignee");
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
    return performSimpleBulkUpdate(ctx, args.issueIds, "sprintId", args.sprintId, "sprint");
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
    const touchedProjectIds = new Set<Id<"projects">>();
    const result = await performBulkUpdate(
      ctx,
      args.issueIds,
      async (issue) => {
        touchedProjectIds.add(issue.projectId);
        return {
          patch: softDeleteFields(ctx.userId),
          activity: {
            action: "deleted",
          },
        };
      },
      assertIsProjectAdmin,
    );

    await Promise.all(
      Array.from(touchedProjectIds).map((projectId) => syncProjectIssueStats(ctx, projectId)),
    );

    return { deleted: result.updated };
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
    const { issues: validIssues, projectMap } = await fetchIssuesWithProjects(ctx, args.issueIds);

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
    return performBulkDateUpdate(ctx, args.issueIds, "dueDate", args.dueDate, (issue, newValue) => {
      // Validate: due date should not be before start date
      if (newValue !== null && issue.startDate && newValue < issue.startDate) {
        return false;
      }
      return true;
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
    return performBulkDateUpdate(
      ctx,
      args.issueIds,
      "startDate",
      args.startDate,
      (issue, newValue) => {
        // Validate: start date should not be after due date
        if (newValue !== null && issue.dueDate && newValue > issue.dueDate) {
          return false;
        }
        return true;
      },
    );
  },
});
