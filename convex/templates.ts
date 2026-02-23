import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  authenticatedMutation,
  authenticatedQuery,
  projectEditorMutation,
  projectQuery,
} from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { assertCanAccessProject, assertCanEditProject } from "./projectAccess";
import { issuePriorities, issueTypes } from "./validators";

// Create an issue template
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    type: issueTypes,
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: issuePriorities,
    defaultLabels: v.array(v.string()),
    // New fields for Plane parity
    defaultAssigneeId: v.optional(v.id("users")),
    defaultStatus: v.optional(v.string()),
    defaultStoryPoints: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.object({ templateId: v.id("issueTemplates") }),
  handler: async (ctx, args) => {
    // If setting as default, clear any existing default
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project_default", (q) =>
          q.eq("projectId", ctx.projectId).eq("isDefault", true),
        )
        .take(BOUNDED_LIST_LIMIT);
      for (const template of existingDefaults) {
        await ctx.db.patch(template._id, { isDefault: false });
      }
    }

    const templateId = await ctx.db.insert("issueTemplates", {
      projectId: ctx.projectId,
      name: args.name,
      type: args.type,
      titleTemplate: args.titleTemplate,
      descriptionTemplate: args.descriptionTemplate,
      defaultPriority: args.defaultPriority,
      defaultLabels: args.defaultLabels,
      defaultAssigneeId: args.defaultAssigneeId,
      defaultStatus: args.defaultStatus,
      defaultStoryPoints: args.defaultStoryPoints,
      isDefault: args.isDefault,
      createdBy: ctx.userId,
    });

    return { templateId };
  },
});

// List templates for a project
export const listByProject = projectQuery({
  args: {
    type: v.optional(issueTypes),
  },
  handler: async (ctx, args) => {
    // projectQuery handles auth + project access check
    let templates: Array<Doc<"issueTemplates">>;
    if (args.type) {
      const templateType = args.type; // Store in variable for type narrowing
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", ctx.projectId).eq("type", templateType),
        )
        .take(BOUNDED_LIST_LIMIT);
    } else {
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
        .take(BOUNDED_LIST_LIMIT);
    }

    return templates;
  },
});

// Get the default template for a project
export const getDefault = projectQuery({
  args: {},
  handler: async (ctx) => {
    const template = await ctx.db
      .query("issueTemplates")
      .withIndex("by_project_default", (q) =>
        q.eq("projectId", ctx.projectId).eq("isDefault", true),
      )
      .first();

    return template;
  },
});

// Get a single template
export const get = authenticatedQuery({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) return null;

    // Check if user has access to project
    if (template.projectId) {
      await assertCanAccessProject(ctx, template.projectId, ctx.userId);
    }

    return template;
  },
});

/** Build template update object from args */
function buildTemplateUpdates(args: {
  name?: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
  defaultPriority?: "lowest" | "low" | "medium" | "high" | "highest";
  defaultLabels?: string[];
  defaultAssigneeId?: string | null;
  defaultStatus?: string | null;
  defaultStoryPoints?: number | null;
  isDefault?: boolean;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (args.name !== undefined) updates.name = args.name;
  if (args.titleTemplate !== undefined) updates.titleTemplate = args.titleTemplate;
  if (args.descriptionTemplate !== undefined)
    updates.descriptionTemplate = args.descriptionTemplate;
  if (args.defaultPriority !== undefined) updates.defaultPriority = args.defaultPriority;
  if (args.defaultLabels !== undefined) updates.defaultLabels = args.defaultLabels;
  if (args.defaultAssigneeId !== undefined)
    updates.defaultAssigneeId = args.defaultAssigneeId ?? undefined;
  if (args.defaultStatus !== undefined) updates.defaultStatus = args.defaultStatus ?? undefined;
  if (args.defaultStoryPoints !== undefined)
    updates.defaultStoryPoints = args.defaultStoryPoints ?? undefined;
  if (args.isDefault !== undefined) updates.isDefault = args.isDefault;
  return updates;
}

// Update a template
export const update = authenticatedMutation({
  args: {
    id: v.id("issueTemplates"),
    name: v.optional(v.string()),
    titleTemplate: v.optional(v.string()),
    descriptionTemplate: v.optional(v.string()),
    defaultPriority: v.optional(issuePriorities),
    defaultLabels: v.optional(v.array(v.string())),
    defaultAssigneeId: v.optional(v.union(v.id("users"), v.null())),
    defaultStatus: v.optional(v.union(v.string(), v.null())),
    defaultStoryPoints: v.optional(v.union(v.number(), v.null())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw notFound("template", args.id);

    if (!template.projectId) throw forbidden("edit global templates");
    await assertCanEditProject(ctx, template.projectId, ctx.userId);

    // Clear existing default if setting this one as default
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project_default", (q) =>
          q.eq("projectId", template.projectId).eq("isDefault", true),
        )
        .take(BOUNDED_LIST_LIMIT);
      for (const existing of existingDefaults) {
        if (existing._id !== args.id) {
          await ctx.db.patch(existing._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(args.id, buildTemplateUpdates(args));
  },
});

// Delete a template
export const remove = authenticatedMutation({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw notFound("template", args.id);

    // Check if user can edit project
    if (template.projectId) {
      await assertCanEditProject(ctx, template.projectId, ctx.userId);
    } else {
      throw forbidden("delete global templates");
    }

    await ctx.db.delete(args.id);
  },
});
