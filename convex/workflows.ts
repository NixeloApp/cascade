/**
 * Workflow Automation - Email/SMS reminders and notifications
 *
 * Inspired by Cal.com's workflow automation system.
 * Supports triggers like booking_created, event_reminder, issue_assigned.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authenticatedMutation, authenticatedQuery, projectQuery } from "./customFunctions";
import { workflowActionTypes, workflowTriggers } from "./validators";

/**
 * Create a new workflow
 */
export const create = authenticatedMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    bookingPageId: v.optional(v.id("bookingPages")),
    trigger: workflowTriggers,
    triggerOffset: v.optional(v.number()),
    actions: v.array(
      v.object({
        type: workflowActionTypes,
        template: v.optional(v.string()),
        subject: v.optional(v.string()),
        webhookUrl: v.optional(v.string()),
        includeIcs: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      userId: ctx.userId,
      projectId: args.projectId,
      bookingPageId: args.bookingPageId,
      trigger: args.trigger,
      triggerOffset: args.triggerOffset,
      actions: args.actions,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    });
  },
});

/**
 * List workflows for current user
 */
export const listMine = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
    bookingPageId: v.optional(v.id("bookingPages")),
  },
  handler: async (ctx, args) => {
    let workflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    // Filter by project/booking page if specified
    if (args.projectId) {
      workflows = workflows.filter((w) => w.projectId === args.projectId);
    }
    if (args.bookingPageId) {
      workflows = workflows.filter((w) => w.bookingPageId === args.bookingPageId);
    }

    return workflows;
  },
});

/**
 * List workflows for a project
 */
export const listByProject = projectQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .collect();
  },
});

/**
 * Get a single workflow
 */
export const get = authenticatedQuery({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== ctx.userId) {
      return null;
    }
    return workflow;
  },
});

/**
 * Update a workflow
 */
export const update = authenticatedMutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    trigger: v.optional(workflowTriggers),
    triggerOffset: v.optional(v.union(v.number(), v.null())),
    actions: v.optional(
      v.array(
        v.object({
          type: workflowActionTypes,
          template: v.optional(v.string()),
          subject: v.optional(v.string()),
          webhookUrl: v.optional(v.string()),
          includeIcs: v.optional(v.boolean()),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== ctx.userId) {
      throw new Error("Workflow not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.triggerOffset !== undefined) {
      updates.triggerOffset = args.triggerOffset ?? undefined;
    }
    if (args.actions !== undefined) updates.actions = args.actions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.workflowId, updates);
  },
});

/**
 * Delete a workflow
 */
export const remove = authenticatedMutation({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== ctx.userId) {
      throw new Error("Workflow not found");
    }

    // Cancel any pending reminders
    const pendingReminders = await ctx.db
      .query("workflowReminders")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    await Promise.all(pendingReminders.map((r) => ctx.db.patch(r._id, { status: "skipped" })));

    await ctx.db.delete(args.workflowId);
  },
});

/**
 * Toggle workflow active status
 */
export const toggleActive = authenticatedMutation({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== ctx.userId) {
      throw new Error("Workflow not found");
    }

    await ctx.db.patch(args.workflowId, {
      isActive: !workflow.isActive,
      updatedAt: Date.now(),
    });

    return { isActive: !workflow.isActive };
  },
});

/**
 * Duplicate a workflow
 */
export const duplicate = authenticatedMutation({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== ctx.userId) {
      throw new Error("Workflow not found");
    }

    const now = Date.now();
    return await ctx.db.insert("workflows", {
      name: `${workflow.name} (copy)`,
      description: workflow.description,
      userId: ctx.userId,
      projectId: workflow.projectId,
      bookingPageId: workflow.bookingPageId,
      trigger: workflow.trigger,
      triggerOffset: workflow.triggerOffset,
      actions: workflow.actions,
      isActive: false, // Start inactive
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    });
  },
});

// =============================================================================
// Workflow Execution (Internal)
// =============================================================================

import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Get active workflows for a trigger
 */
export const getActiveWorkflowsForTrigger = internalQuery({
  args: {
    trigger: workflowTriggers,
    projectId: v.optional(v.id("projects")),
    bookingPageId: v.optional(v.id("bookingPages")),
  },
  handler: async (ctx, args) => {
    let workflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("trigger", args.trigger))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by scope
    if (args.projectId) {
      workflows = workflows.filter((w) => w.projectId === args.projectId || !w.projectId);
    }
    if (args.bookingPageId) {
      workflows = workflows.filter(
        (w) => w.bookingPageId === args.bookingPageId || !w.bookingPageId,
      );
    }

    return workflows;
  },
});

/**
 * Schedule a workflow reminder
 */
export const scheduleReminder = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    bookingId: v.optional(v.id("bookings")),
    calendarEventId: v.optional(v.id("calendarEvents")),
    issueId: v.optional(v.id("issues")),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    recipientUserId: v.optional(v.id("users")),
    scheduledFor: v.number(),
    actionIndex: v.number(),
    contextData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflowReminders", {
      workflowId: args.workflowId,
      bookingId: args.bookingId,
      calendarEventId: args.calendarEventId,
      issueId: args.issueId,
      recipientEmail: args.recipientEmail,
      recipientPhone: args.recipientPhone,
      recipientUserId: args.recipientUserId,
      scheduledFor: args.scheduledFor,
      status: "pending",
      actionIndex: args.actionIndex,
      attempts: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get pending reminders due for execution
 */
export const getPendingReminders = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("workflowReminders")
      .withIndex("by_status_scheduled", (q) => q.eq("status", "pending").lte("scheduledFor", now))
      .take(args.limit);
  },
});

/**
 * Mark reminder as sent
 */
export const markReminderSent = internalMutation({
  args: {
    reminderId: v.id("workflowReminders"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reminderId, {
      status: "sent",
      sentAt: Date.now(),
    });

    // Update workflow execution count
    const reminder = await ctx.db.get(args.reminderId);
    if (reminder) {
      const workflow = await ctx.db.get(reminder.workflowId);
      if (workflow) {
        await ctx.db.patch(reminder.workflowId, {
          executionCount: (workflow.executionCount || 0) + 1,
          lastExecutedAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Mark reminder as failed
 */
export const markReminderFailed = internalMutation({
  args: {
    reminderId: v.id("workflowReminders"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) return;

    const newAttempts = reminder.attempts + 1;
    const maxAttempts = 3;

    await ctx.db.patch(args.reminderId, {
      status: newAttempts >= maxAttempts ? "failed" : "pending",
      attempts: newAttempts,
      lastAttemptAt: Date.now(),
      error: args.error,
    });
  },
});

/**
 * Cancel pending reminders for an entity
 */
export const cancelReminders = internalMutation({
  args: {
    bookingId: v.optional(v.id("bookings")),
    calendarEventId: v.optional(v.id("calendarEvents")),
    issueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    let reminders: Array<{ _id: Id<"workflowReminders"> }> = [];

    if (args.bookingId) {
      reminders = await ctx.db
        .query("workflowReminders")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
    } else if (args.calendarEventId) {
      reminders = await ctx.db
        .query("workflowReminders")
        .withIndex("by_event", (q) => q.eq("calendarEventId", args.calendarEventId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
    } else if (args.issueId) {
      reminders = await ctx.db
        .query("workflowReminders")
        .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
    }

    await Promise.all(reminders.map((r) => ctx.db.patch(r._id, { status: "skipped" })));

    return { cancelled: reminders.length };
  },
});
