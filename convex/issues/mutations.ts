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
import { workflowCategories } from "../validators";
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

    const results = await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.isDeleted) return 0;

        try {
          await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
        } catch {
          return 0;
        }

        const oldStatus = issue.status;

        // Validate that the new status exists in the project's workflow
        const project = await ctx.db.get(issue.projectId);
        if (!project) return 0;

        const isValidStatus = project.workflowStates.some((s) => s.id === args.newStatus);
        if (!isValidStatus) return 0;

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
