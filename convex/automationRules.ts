import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authenticatedMutation, projectAdminMutation, projectQuery } from "./customFunctions";
import { notFound, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { assertIsProjectAdmin } from "./projectAccess";
import { automationActionTypes, automationActionValue, automationTriggers } from "./validators";

export const list = projectQuery({
  args: {},
  handler: async (ctx) => {
    // projectQuery handles auth + project access check
    return await ctx.db
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .take(MAX_PAGE_SIZE);
  },
});

export const create = projectAdminMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    trigger: automationTriggers,
    triggerValue: v.optional(v.string()),
    actionType: automationActionTypes,
    actionValue: automationActionValue,
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check
    const now = Date.now();
    return await ctx.db.insert("automationRules", {
      projectId: ctx.projectId,
      name: args.name,
      description: args.description,
      isActive: true,
      trigger: args.trigger,
      triggerValue: args.triggerValue,
      actionType: args.actionType,
      actionValue: args.actionValue,
      createdBy: ctx.userId,
      updatedAt: now,
      executionCount: 0,
    });
  },
});

export const update = authenticatedMutation({
  args: {
    id: v.id("automationRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    trigger: v.optional(automationTriggers),
    triggerValue: v.optional(v.string()),
    actionType: v.optional(automationActionTypes),
    actionValue: v.optional(automationActionValue),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw notFound("automationRule", args.id);
    }

    if (!rule.projectId) {
      throw validation("projectId", "Rule has no project");
    }

    await assertIsProjectAdmin(ctx, rule.projectId, ctx.userId);

    const updates: Partial<typeof rule> & { updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.triggerValue !== undefined) updates.triggerValue = args.triggerValue;
    if (args.actionType !== undefined) updates.actionType = args.actionType;
    if (args.actionValue !== undefined) updates.actionValue = args.actionValue;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = authenticatedMutation({
  args: {
    id: v.id("automationRules"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw notFound("automationRule", args.id);
    }

    if (!rule.projectId) {
      throw validation("projectId", "Rule has no project");
    }

    await assertIsProjectAdmin(ctx, rule.projectId, ctx.userId);

    await ctx.db.delete(args.id);
  },
});

/** Executes automation rules for an issue based on trigger events, applying actions like assignee changes or label additions. */
export const executeRules = internalMutation({
  args: {
    projectId: v.id("projects"),
    issueId: v.id("issues"),
    trigger: automationTriggers,
    triggerValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get active rules for this project and trigger
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project_active", (q) => q.eq("projectId", args.projectId).eq("isActive", true))
      .filter((q) => q.eq(q.field("trigger"), args.trigger))
      .take(MAX_PAGE_SIZE);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return;

    for (const rule of rules) {
      // Check if trigger value matches (if specified)
      if (rule.triggerValue && rule.triggerValue !== args.triggerValue) {
        continue;
      }

      // Execute the action - actionValue is now typed!
      try {
        switch (rule.actionValue.type) {
          case "set_assignee":
            await ctx.db.patch(args.issueId, {
              assigneeId: rule.actionValue.assigneeId ?? undefined,
              updatedAt: Date.now(),
            });
            break;

          case "set_priority":
            await ctx.db.patch(args.issueId, {
              priority: rule.actionValue.priority,
              updatedAt: Date.now(),
            });
            break;

          case "add_label": {
            const currentLabels = issue.labels || [];
            if (!currentLabels.includes(rule.actionValue.label)) {
              await ctx.db.patch(args.issueId, {
                labels: [...currentLabels, rule.actionValue.label],
                updatedAt: Date.now(),
              });
            }
            break;
          }

          case "add_comment":
            await ctx.db.insert("issueComments", {
              issueId: args.issueId,
              authorId: rule.createdBy,
              content: rule.actionValue.comment,
              mentions: [],
              updatedAt: Date.now(),
            });
            break;

          case "send_notification":
            // TODO: Implement notification sending
            break;
        }

        // Increment execution count
        await ctx.db.patch(rule._id, {
          executionCount: rule.executionCount + 1,
        });
      } catch (error) {
        // Log error but continue with other rules
        console.error(
          `[automationRules] Rule "${rule.name}" (${rule._id}) failed for issue ${args.issueId}:`,
          error,
        );
      }
    }
  },
});
