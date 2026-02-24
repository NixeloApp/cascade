import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { authenticatedMutation, projectAdminMutation, projectQuery } from "./customFunctions";
import { notFound, validation } from "./lib/errors";
import { logger } from "./lib/logger";
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
  returns: v.object({ ruleId: v.id("automationRules") }),
  handler: async (ctx, args) => {
    // Enforce actionType matches actionValue.type to prevent divergence
    if (args.actionType !== args.actionValue.type) {
      throw validation(
        "actionType",
        `actionType "${args.actionType}" does not match actionValue.type "${args.actionValue.type}"`,
      );
    }

    // adminMutation handles auth + admin check
    const now = Date.now();
    const ruleId = await ctx.db.insert("automationRules", {
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
    return { ruleId };
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
  returns: v.object({ success: v.literal(true), ruleId: v.id("automationRules") }),
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw notFound("automationRule", args.id);
    }

    if (!rule.projectId) {
      throw validation("projectId", "Rule has no project");
    }

    await assertIsProjectAdmin(ctx, rule.projectId, ctx.userId);

    // Enforce actionType matches actionValue.type to prevent divergence
    const newActionType = args.actionType ?? rule.actionType;
    const newActionValue = args.actionValue ?? rule.actionValue;
    if (newActionType !== newActionValue.type) {
      throw validation(
        "actionType",
        `actionType "${newActionType}" does not match actionValue.type "${newActionValue.type}"`,
      );
    }

    const updates: Partial<typeof rule> & { updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.triggerValue !== undefined) updates.triggerValue = args.triggerValue;
    if (args.actionType !== undefined) updates.actionType = args.actionType;
    if (args.actionValue !== undefined) updates.actionValue = args.actionValue;

    await ctx.db.patch(args.id, updates);

    return { success: true, ruleId: args.id } as const;
  },
});

export const remove = authenticatedMutation({
  args: {
    id: v.id("automationRules"),
  },
  returns: v.object({ success: v.literal(true) }),
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

    return { success: true } as const;
  },
});

async function executeAutomationAction(
  ctx: MutationCtx,
  rule: Doc<"automationRules">,
  issueId: Id<"issues">,
  issueLabels: string[],
) {
  let executed = true;

  switch (rule.actionValue.type) {
    case "set_assignee":
      await ctx.db.patch(issueId, {
        assigneeId: rule.actionValue.assigneeId ?? undefined,
        updatedAt: Date.now(),
      });
      break;

    case "set_priority":
      await ctx.db.patch(issueId, {
        priority: rule.actionValue.priority,
        updatedAt: Date.now(),
      });
      break;

    case "add_label": {
      if (!issueLabels.includes(rule.actionValue.label)) {
        await ctx.db.patch(issueId, {
          labels: [...issueLabels, rule.actionValue.label],
          updatedAt: Date.now(),
        });
      }
      break;
    }

    case "add_comment":
      await ctx.db.insert("issueComments", {
        issueId: issueId,
        authorId: rule.createdBy,
        content: rule.actionValue.comment,
        mentions: [],
        updatedAt: Date.now(),
      });
      break;

    case "send_notification":
      // TODO: Implement notification sending - skip execution count until implemented
      executed = false;
      break;
  }

  return executed;
}

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

    // Filter matching rules first
    const matchingRules = rules.filter((rule) => {
      // Check if trigger value matches (if specified)
      return !rule.triggerValue || rule.triggerValue === args.triggerValue;
    });

    // Execute matching rules in parallel
    await Promise.all(
      matchingRules.map(async (rule) => {
        try {
          const executed = await executeAutomationAction(
            ctx,
            rule,
            args.issueId,
            issue.labels || [],
          );

          // Only increment execution count if action was actually performed
          if (executed) {
            await ctx.db.patch(rule._id, {
              executionCount: rule.executionCount + 1,
            });
          }
        } catch (error) {
          // Log error but continue with other rules
          logger.error(
            `[automationRules] Rule "${rule.name}" (${rule._id}) failed for issue ${args.issueId}:`,
            { error },
          );
        }
      }),
    );
  },
});
