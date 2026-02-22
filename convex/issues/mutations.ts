import { MINUTE } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import { asyncMap, pruneNull } from "convex-helpers";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  authenticatedMutation,
  issueMutation,
  issueViewerMutation,
  projectEditorMutation,
} from "../customFunctions";
import { validate } from "../lib/constrainedValidators";
import { rateLimited, validation } from "../lib/errors";
import { softDeleteFields } from "../lib/softDeleteHelpers";
import { assertCanEditProject, assertIsProjectAdmin } from "../projectAccess";
import { issueTypesWithSubtask, workflowCategories } from "../validators";
import {
  assertVersionMatch,
  generateIssueKey,
  getMaxOrderForStatus,
  getNextVersion,
  getSearchContent,
  issueKeyExists,
  processIssueUpdates,
  validateParentIssue,
} from "./helpers";

export const create = projectEditorMutation({
  args: {
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
    moduleId: v.optional(v.id("modules")),
    epicId: v.optional(v.id("issues")),
    parentId: v.optional(v.id("issues")),
    labels: v.optional(v.array(v.id("labels"))),
    estimatedHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Rate limit: 60 issues per minute per user with burst capacity of 15
    // Skip in test environment (convex-test doesn't support components)
    if (!process.env.IS_TEST_ENV) {
      const rateLimitResult = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
        name: `createIssue:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 60,
          period: MINUTE,
          capacity: 15,
        },
      });
      if (!rateLimitResult.ok) {
        throw rateLimited(rateLimitResult.retryAfter);
      }

      // Consume the rate limit token
      await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
        name: `createIssue:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 60,
          period: MINUTE,
          capacity: 15,
        },
      });
    }

    // Validate input constraints
    validate.title(args.title);
    validate.description(args.description);
    if (args.labels) {
      validate.tags(args.labels, "labels");
    }

    // Validate parent/epic constraints
    const inheritedEpicId = await validateParentIssue(ctx, args.parentId, args.type, args.epicId);

    // Validate module belongs to the same project
    if (args.moduleId) {
      const module = await ctx.db.get(args.moduleId);
      if (!module || module.projectId !== ctx.projectId) {
        throw validation("moduleId", "Module does not belong to this project");
      }
    }

    // Generate issue key with duplicate detection
    // In rare concurrent scenarios, we verify the key doesn't exist before using
    let issueKey = await generateIssueKey(ctx, ctx.projectId, ctx.project.key);

    // Double-check for duplicates (handles race conditions)
    if (await issueKeyExists(ctx, issueKey)) {
      // Regenerate with timestamp suffix to guarantee uniqueness
      const suffix = Date.now() % 10000;
      issueKey = `${issueKey}-${suffix}`;
    }

    // Get the first workflow state as default status
    const defaultStatus = ctx.project.workflowStates[0]?.id || "todo";

    // Get max order for the status column
    const maxOrder = await getMaxOrderForStatus(ctx, ctx.projectId, defaultStatus);

    // Get label names from IDs
    let labelNames: string[] = [];
    if (args.labels && args.labels.length > 0) {
      const labels = await asyncMap(args.labels, (id) => ctx.db.get(id));
      labelNames = pruneNull(labels).map((l) => l.name);
    }

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      projectId: ctx.projectId,
      organizationId: ctx.project.organizationId, // Cache from project
      workspaceId: ctx.project.workspaceId, // Always present since projects require workspaceId
      teamId: ctx.project.teamId, // Cached from project (can be undefined for workspace-level projects)
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
      moduleId: args.moduleId,
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
      version: 1, // Initial version for optimistic locking
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId,
      userId: ctx.userId,
      action: "created",
    });

    return issueId;
  },
});

export const updateStatus = issueMutation({
  args: {
    newStatus: v.string(),
    newOrder: v.number(),
    expectedVersion: v.optional(v.number()),
  },
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

    return { success: true };
  },
});

export const updateStatusByCategory = issueMutation({
  args: {
    category: workflowCategories,
    newOrder: v.number(),
    expectedVersion: v.optional(v.number()),
  },
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

    return { success: true };
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
      // Dynamic import to avoid cycles
      const { sendEmailNotification } = await import("../email/helpers");
      await sendEmailNotification(ctx, {
        userId: args.assigneeId,
        type: "assigned",
        issueId: ctx.issue._id,
        actorId: ctx.userId,
      });
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

    return { success: true };
  },
});

export const addComment = issueViewerMutation({
  args: {
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Rate limit: 120 comments per minute per user with burst of 20
    // Skip in test environment (convex-test doesn't support components)
    if (!process.env.IS_TEST_ENV) {
      const rateLimitResult = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
        name: `addComment:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 120,
          period: MINUTE,
          capacity: 20,
        },
      });
      if (!rateLimitResult.ok) {
        throw rateLimited(rateLimitResult.retryAfter);
      }

      await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
        name: `addComment:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 120,
          period: MINUTE,
          capacity: 20,
        },
      });
    }

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
    // Dynamic import to avoid cycles
    const { sendEmailNotification } = await import("../email/helpers");

    // Notify mentioned users in parallel
    const mentionedOthers = mentions.filter((id) => id !== ctx.userId);
    await Promise.all(
      mentionedOthers.flatMap((mentionedUserId) => [
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
        }),
      ]),
    );

    if (ctx.issue.reporterId !== ctx.userId) {
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
      });
    }

    return commentId;
  },
});

export const bulkUpdateStatus = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const now = Date.now();

    // Collect unique project IDs to fetch projects in batch
    const projectIds = new Set<Id<"projects">>();
    for (const issue of issues) {
      if (issue && !issue.isDeleted && issue.projectId) {
        projectIds.add(issue.projectId);
      }
    }

    // Fetch all relevant projects once
    const projects = await asyncMap([...projectIds], (id) => ctx.db.get(id));
    const projectMap = new Map(projects.map((p) => [p?._id.toString(), p]));

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        const projectId = issue.projectId as Id<"projects">;
        const project = projectMap.get(projectId);
        if (!project) return 0;

        try {
          // Verify permissions using cached project (or re-check if needed, but permissions usually need DB)
          // Since assertCanEditProject hits DB, we might want to optimize this too, but for now let's keep permission check robust
          // Actually, assertCanEditProject does a get(), so we could optimize it by passing project, but the helper might not support it.
          // Let's assume permission check is fast enough or cached at convex level.
          await assertCanEditProject(ctx, projectId, ctx.userId);
        } catch {
          return 0;
        }

        const isValidStatus = project.workflowStates.some((s) => s.id === args.newStatus);
        if (!isValidStatus) return 0;

        const oldStatus = issue.status;

        await ctx.db.patch(issue._id, {
          status: args.newStatus,
          updatedAt: now,
        });

        if (oldStatus !== args.newStatus) {
          await ctx.db.insert("issueActivity", {
            issueId: issue._id,
            userId: ctx.userId,
            action: "updated",
            field: "status",
            oldValue: oldStatus,
            newValue: args.newStatus,
          });
        }

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

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
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        const oldPriority = issue.priority;

        await ctx.db.patch(issue._id, {
          priority: args.priority,
          updatedAt: now,
        });

        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "priority",
          oldValue: oldPriority,
          newValue: args.priority,
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

export const bulkAssign = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    assigneeId: v.union(v.id("users"), v.null()),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        const oldAssignee = issue.assigneeId;

        await ctx.db.patch(issue._id, {
          assigneeId: args.assigneeId ?? undefined,
          updatedAt: now,
        });

        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "assignee",
          oldValue: oldAssignee ? String(oldAssignee) : "",
          newValue: args.assigneeId ? String(args.assigneeId) : "",
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

export const bulkAddLabels = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    labels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        const updatedLabels = Array.from(new Set([...issue.labels, ...args.labels]));

        await ctx.db.patch(issue._id, {
          labels: updatedLabels,
          updatedAt: now,
        });

        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "labels",
          oldValue: issue.labels.join(", "),
          newValue: updatedLabels.join(", "),
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

export const bulkMoveToSprint = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    sprintId: v.union(v.id("sprints"), v.null()),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));

    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        const oldSprint = issue.sprintId;

        await ctx.db.patch(issue._id, {
          sprintId: args.sprintId ?? undefined,
          updatedAt: now,
        });

        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "sprint",
          oldValue: oldSprint ? String(oldSprint) : "",
          newValue: args.sprintId ? String(args.sprintId) : "",
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

export const bulkMoveToModule = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    moduleId: v.union(v.id("modules"), v.null()),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const now = Date.now();

    // Pre-validate module if provided (reject if moduleId given but module doesn't exist)
    const targetModule = args.moduleId ? await ctx.db.get(args.moduleId) : null;
    if (args.moduleId && !targetModule) {
      return { updated: 0 }; // Module was deleted or invalid
    }

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Skip if module doesn't belong to this project
        if (targetModule && targetModule.projectId !== issue.projectId) return 0;

        const oldModule = issue.moduleId;
        await ctx.db.patch(issue._id, { moduleId: args.moduleId ?? undefined, updatedAt: now });
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "module",
          oldValue: oldModule ? String(oldModule) : "",
          newValue: args.moduleId ? String(args.moduleId) : "",
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

export const bulkDelete = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
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
 * Archive a single issue
 * Only issues in "done" category can be archived
 */
export const archive = issueMutation({
  args: {},
  handler: async (ctx) => {
    const issue = ctx.issue;

    // Already archived
    if (issue.archivedAt) {
      return { success: false, error: "Issue is already archived" };
    }

    // Check if issue is in "done" category
    const state = ctx.project.workflowStates.find((s) => s.id === issue.status);
    if (!state || state.category !== "done") {
      return { success: false, error: "Only completed issues can be archived" };
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

    return { success: true };
  },
});

/**
 * Restore (unarchive) a single issue
 */
export const restore = issueMutation({
  args: {},
  handler: async (ctx) => {
    const issue = ctx.issue;

    // Not archived
    if (!issue.archivedAt) {
      return { success: false, error: "Issue is not archived" };
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

    return { success: true };
  },
});

/**
 * Bulk archive issues
 * Only issues in "done" category can be archived
 */
export const bulkArchive = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted || issue.archivedAt) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Check if issue is in "done" category
        const project = await ctx.db.get(issue.projectId);
        if (!project) return 0;

        const state = project.workflowStates.find((s) => s.id === issue.status);
        if (!state || state.category !== "done") return 0;

        // Archive the issue
        await ctx.db.patch(issue._id, {
          archivedAt: now,
          archivedBy: ctx.userId,
          updatedAt: now,
        });

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "archived",
        });

        return 1;
      }),
    );

    return { archived: results.reduce((a: number, b) => a + b, 0) };
  },
});

/**
 * Bulk restore (unarchive) issues
 */
export const bulkRestore = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted || !issue.archivedAt) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Restore the issue
        await ctx.db.patch(issue._id, {
          archivedAt: undefined,
          archivedBy: undefined,
          updatedAt: now,
        });

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "restored",
        });

        return 1;
      }),
    );

    return { restored: results.reduce((a: number, b) => a + b, 0) };
  },
});

/**
 * Bulk update due date for multiple issues
 * Validates date is not before start date if both are set
 */
export const bulkUpdateDueDate = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    dueDate: v.union(v.number(), v.null()), // null to clear
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Validate: due date should not be before start date
        if (args.dueDate !== null && issue.startDate && args.dueDate < issue.startDate) {
          return 0; // Skip issues where due date would be before start date
        }

        await ctx.db.patch(issue._id, {
          dueDate: args.dueDate ?? undefined,
          updatedAt: now,
          version: (issue.version ?? 1) + 1,
        });

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "dueDate",
          oldValue: issue.dueDate ? new Date(issue.dueDate).toISOString() : undefined,
          newValue: args.dueDate ? new Date(args.dueDate).toISOString() : undefined,
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});

/**
 * Bulk update start date for multiple issues
 * Validates date is not after due date if both are set
 */
export const bulkUpdateStartDate = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    startDate: v.union(v.number(), v.null()), // null to clear
  },
  handler: async (ctx, args) => {
    const issues = await asyncMap(args.issueIds, (id) => ctx.db.get(id));
    const now = Date.now();

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        // Validate: start date should not be after due date
        if (args.startDate !== null && issue.dueDate && args.startDate > issue.dueDate) {
          return 0; // Skip issues where start date would be after due date
        }

        await ctx.db.patch(issue._id, {
          startDate: args.startDate ?? undefined,
          updatedAt: now,
          version: (issue.version ?? 1) + 1,
        });

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId: issue._id,
          userId: ctx.userId,
          action: "updated",
          field: "startDate",
          oldValue: issue.startDate ? new Date(issue.startDate).toISOString() : undefined,
          newValue: args.startDate ? new Date(args.startDate).toISOString() : undefined,
        });

        return 1;
      }),
    );

    return { updated: results.reduce((a: number, b) => a + b, 0) };
  },
});
