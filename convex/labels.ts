import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { authenticatedMutation, projectEditorMutation, projectQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, notFound, validation } from "./lib/errors";
import { assertCanEditProject } from "./projectAccess";

// Shared implementation
async function createLabelImpl(
  ctx: MutationCtx & { userId: Id<"users">; projectId: Id<"projects"> },
  args: {
    name: string;
    color: string;
    groupId?: Id<"labelGroups">;
  },
) {
  // Check if label with same name already exists in project
  const existing = await ctx.db
    .query("labels")
    .withIndex("by_project_name", (q) => q.eq("projectId", ctx.projectId).eq("name", args.name))
    .first();

  if (existing) {
    throw conflict("Label with this name already exists");
  }

  // If groupId is provided, verify it belongs to the same project
  if (args.groupId) {
    const group = await ctx.db.get(args.groupId);
    if (!group || group.projectId !== ctx.projectId) {
      throw validation("groupId", "Label group not found or belongs to a different project");
    }
  }

  // Get max display order for labels in this group (or ungrouped)
  const labelsInGroup = await ctx.db
    .query("labels")
    .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
    .take(BOUNDED_LIST_LIMIT);
  const maxOrder = labelsInGroup.reduce((max, l) => Math.max(max, l.displayOrder ?? 0), 0);

  const labelId = await ctx.db.insert("labels", {
    projectId: ctx.projectId,
    name: args.name,
    color: args.color,
    groupId: args.groupId,
    displayOrder: maxOrder + 1,
    createdBy: ctx.userId,
  });

  return { labelId };
}

/**
 * @deprecated Use `createLabel` instead.
 */
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    color: v.string(),
    groupId: v.optional(v.id("labelGroups")),
  },
  returns: v.object({ labelId: v.id("labels") }),
  handler: async (ctx, args) => {
    return await createLabelImpl(ctx, args);
  },
});

export const createLabel = projectEditorMutation({
  args: {
    name: v.string(),
    color: v.string(),
    groupId: v.optional(v.id("labelGroups")),
  },
  returns: v.object({
    labelId: v.id("labels"),
  }),
  handler: async (ctx, args) => {
    return await createLabelImpl(ctx, args);
  },
});

/**
 * List all labels for a project
 * Requires viewer access to project
 */
export const list = projectQuery({
  args: {},
  handler: async (ctx) => {
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .take(BOUNDED_LIST_LIMIT);

    return labels;
  },
});

/**
 * Update a label
 * Requires editor role on label's project
 */
export const update = authenticatedMutation({
  args: {
    id: v.id("labels"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    groupId: v.optional(v.union(v.id("labelGroups"), v.null())),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const label = await ctx.db.get(args.id);
    if (!label) throw notFound("label", args.id);

    if (!label.projectId) {
      throw validation("projectId", "Label has no project");
    }

    // Check if user can edit project
    await assertCanEditProject(ctx, label.projectId, ctx.userId);

    // If name is changing, check for duplicates
    if (args.name && args.name !== label.name) {
      const newName = args.name;
      const existing = await ctx.db
        .query("labels")
        .withIndex("by_project_name", (q) => q.eq("projectId", label.projectId).eq("name", newName))
        .first();

      if (existing) {
        throw conflict("Label with this name already exists");
      }
    }

    // If groupId is provided (not undefined), verify it belongs to the same project
    if (args.groupId !== undefined && args.groupId !== null) {
      const group = await ctx.db.get(args.groupId);
      if (!group || group.projectId !== label.projectId) {
        throw validation("groupId", "Label group not found or belongs to a different project");
      }
    }

    const updates: Partial<typeof label> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.color !== undefined) updates.color = args.color;
    if (args.groupId !== undefined) updates.groupId = args.groupId ?? undefined;

    await ctx.db.patch(args.id, updates);

    return { success: true } as const;
  },
});

/**
 * Delete a label
 * Requires editor role on label's project
 */
export const remove = authenticatedMutation({
  args: { id: v.id("labels") },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const label = await ctx.db.get(args.id);
    if (!label) throw notFound("label", args.id);

    if (!label.projectId) {
      throw validation("projectId", "Label has no project");
    }

    // Check if user can edit project
    await assertCanEditProject(ctx, label.projectId, ctx.userId);

    // Remove label from all issues (with reasonable limit)
    const MAX_ISSUES_TO_UPDATE = 5000;
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", label.projectId))
      .take(MAX_ISSUES_TO_UPDATE);

    // Filter to issues that have this label, then batch update in parallel
    const issuesToUpdate = issues.filter((issue) => issue.labels.includes(label.name));
    await Promise.all(
      issuesToUpdate.map((issue) =>
        ctx.db.patch(issue._id, {
          labels: issue.labels.filter((l) => l !== label.name),
        }),
      ),
    );

    await ctx.db.delete(args.id);

    return { success: true, deleted: true } as const;
  },
});
