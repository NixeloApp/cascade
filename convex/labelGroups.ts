import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { authenticatedMutation, projectEditorMutation, projectQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, notFound, validation } from "./lib/errors";
import { assertCanEditProject } from "./projectAccess";

// Shared implementation
async function createLabelGroupImpl(
  ctx: MutationCtx & { userId: Id<"users">; projectId: Id<"projects"> },
  args: {
    name: string;
    description?: string;
  },
) {
  // Check if group with same name already exists in project
  const existing = await ctx.db
    .query("labelGroups")
    .withIndex("by_project_name", (q) => q.eq("projectId", ctx.projectId).eq("name", args.name))
    .first();

  if (existing) {
    throw conflict("Label group with this name already exists");
  }

  // Get max display order for groups in this project
  const groups = await ctx.db
    .query("labelGroups")
    .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
    .take(BOUNDED_LIST_LIMIT);
  const maxOrder = groups.reduce((max, g) => Math.max(max, g.displayOrder), 0);

  const groupId = await ctx.db.insert("labelGroups", {
    projectId: ctx.projectId,
    name: args.name,
    description: args.description,
    displayOrder: maxOrder + 1,
    createdBy: ctx.userId,
  });

  return { labelGroupId: groupId };
}

/**
 * @deprecated Use `createLabelGroup` instead.
 */
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { labelGroupId } = await createLabelGroupImpl(ctx, args);
    return labelGroupId;
  },
});

export const createLabelGroup = projectEditorMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    labelGroupId: v.id("labelGroups"),
  }),
  handler: async (ctx, args) => {
    return await createLabelGroupImpl(ctx, args);
  },
});

/**
 * List all label groups for a project with their labels
 * Requires viewer access to project
 */
export const list = projectQuery({
  args: {},
  handler: async (ctx) => {
    // Get all groups sorted by display order
    const groups = await ctx.db
      .query("labelGroups")
      .withIndex("by_project_order", (q) => q.eq("projectId", ctx.projectId))
      .take(BOUNDED_LIST_LIMIT);

    // Get all labels for this project
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .take(BOUNDED_LIST_LIMIT);

    // Group labels by groupId
    const labelsByGroup = new Map<string | undefined, Doc<"labels">[]>();

    for (const label of labels) {
      const key = label.groupId ?? undefined;
      if (!labelsByGroup.has(key)) {
        labelsByGroup.set(key, []);
      }
      labelsByGroup.get(key)?.push(label);
    }

    // Sort labels within each group by displayOrder
    for (const [, groupLabels] of labelsByGroup) {
      groupLabels.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // Build result with groups and their labels
    const result = groups.map((group) => ({
      ...group,
      labels: labelsByGroup.get(group._id) ?? [],
    }));

    // Add ungrouped labels at the end
    const ungroupedLabels = labelsByGroup.get(undefined) ?? [];
    if (ungroupedLabels.length > 0) {
      result.push({
        _id: null as unknown as Doc<"labelGroups">["_id"],
        _creationTime: 0,
        projectId: ctx.projectId,
        name: "Ungrouped",
        description: undefined,
        displayOrder: Number.MAX_SAFE_INTEGER,
        createdBy: ctx.userId,
        labels: ungroupedLabels,
      });
    }

    return result;
  },
});

/**
 * Update a label group
 * Requires editor role on group's project
 */
export const update = authenticatedMutation({
  args: {
    id: v.id("labelGroups"),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) throw notFound("labelGroup", args.id);

    // Check if user can edit project
    await assertCanEditProject(ctx, group.projectId, ctx.userId);

    // If name is changing, check for duplicates
    const newName = args.name;
    if (newName && newName !== group.name) {
      const existing = await ctx.db
        .query("labelGroups")
        .withIndex("by_project_name", (q) => q.eq("projectId", group.projectId).eq("name", newName))
        .first();

      if (existing) {
        throw conflict("Label group with this name already exists");
      }
    }

    const updates: Partial<typeof group> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description ?? undefined;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * Delete a label group
 * Labels in the group become ungrouped
 * Requires editor role on group's project
 */
export const remove = authenticatedMutation({
  args: { id: v.id("labelGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) throw notFound("labelGroup", args.id);

    // Check if user can edit project
    await assertCanEditProject(ctx, group.projectId, ctx.userId);

    // Remove groupId from all labels in this group
    const labelsInGroup = await ctx.db
      .query("labels")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(
      labelsInGroup.map((label) => ctx.db.patch(label._id, { groupId: undefined })),
    );

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Reorder label groups
 * Requires editor role on project
 */
export const reorder = projectEditorMutation({
  args: {
    groupIds: v.array(v.id("labelGroups")),
  },
  handler: async (ctx, args) => {
    // Verify all groups belong to this project
    const groups = await Promise.all(args.groupIds.map((id) => ctx.db.get(id)));

    for (const group of groups) {
      if (!group) {
        throw validation("groupIds", "One or more groups not found");
      }
      if (group.projectId !== ctx.projectId) {
        throw validation("groupIds", "One or more groups belong to a different project");
      }
    }

    // Update display order for each group
    await Promise.all(
      args.groupIds.map((id, index) => ctx.db.patch(id, { displayOrder: index + 1 })),
    );

    return { success: true };
  },
});

/**
 * Move a label to a different group
 * Requires editor role on project
 */
export const moveLabel = projectEditorMutation({
  args: {
    labelId: v.id("labels"),
    groupId: v.union(v.id("labelGroups"), v.null()),
  },
  handler: async (ctx, args) => {
    const label = await ctx.db.get(args.labelId);
    if (!label) throw notFound("label", args.labelId);

    if (label.projectId !== ctx.projectId) {
      throw validation("labelId", "Label belongs to a different project");
    }

    // Convert null to undefined (Convex stores undefined for missing optional fields)
    const targetGroupId = args.groupId ?? undefined;

    // If moving to a group, verify it exists and belongs to same project
    if (targetGroupId) {
      const group = await ctx.db.get(targetGroupId);
      if (!group || group.projectId !== ctx.projectId) {
        throw validation("groupId", "Label group not found or belongs to a different project");
      }
    }

    // Get max display order in target group
    const labelsInTargetGroup = await ctx.db
      .query("labels")
      .withIndex("by_group", (q) => q.eq("groupId", targetGroupId))
      .take(BOUNDED_LIST_LIMIT);
    const maxOrder = labelsInTargetGroup.reduce((max, l) => Math.max(max, l.displayOrder ?? 0), 0);

    await ctx.db.patch(args.labelId, {
      groupId: targetGroupId,
      displayOrder: maxOrder + 1,
    });

    return { success: true };
  },
});

/**
 * Reorder labels within a group
 * Requires editor role on project
 */
export const reorderLabels = projectEditorMutation({
  args: {
    groupId: v.union(v.id("labelGroups"), v.null()),
    labelIds: v.array(v.id("labels")),
  },
  handler: async (ctx, args) => {
    // Verify all labels belong to this project and the specified group
    const labels = await Promise.all(args.labelIds.map((id) => ctx.db.get(id)));

    for (const label of labels) {
      if (!label) {
        throw validation("labelIds", "One or more labels not found");
      }
      if (label.projectId !== ctx.projectId) {
        throw validation("labelIds", "One or more labels belong to a different project");
      }
      const expectedGroupId = args.groupId ?? undefined;
      if (label.groupId !== expectedGroupId) {
        throw validation("labelIds", "One or more labels belong to a different group");
      }
    }

    // Update display order for each label
    await Promise.all(
      args.labelIds.map((id, index) => ctx.db.patch(id, { displayOrder: index + 1 })),
    );

    return { success: true };
  },
});
