import { v } from "convex/values";
import { authenticatedMutation, projectQuery, projectViewerMutation } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { getUserName } from "./lib/userUtils";
import { issuePriorities, issueTypes } from "./validators";

const filtersValidator = v.object({
  type: v.optional(v.array(issueTypes)),
  status: v.optional(v.array(v.string())),
  priority: v.optional(v.array(issuePriorities)),
  assigneeId: v.optional(v.array(v.id("users"))),
  labels: v.optional(v.array(v.string())),
  sprintId: v.optional(v.id("sprints")),
  epicId: v.optional(v.id("issues")),
});

/**
 * Create a saved filter
 * Requires viewer access to project
 */
export const create = projectViewerMutation({
  args: {
    name: v.string(),
    filters: filtersValidator,
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("savedFilters", {
      projectId: ctx.projectId,
      userId: ctx.userId,
      name: args.name,
      filters: args.filters,
      isPublic: args.isPublic,
      updatedAt: now,
    });
  },
});

/**
 * List saved filters for a project
 * Returns user's own filters + public filters from others
 * Requires viewer access to project
 */
export const list = projectQuery({
  args: {},
  handler: async (ctx) => {
    // Get user's own filters
    const myFilters = await ctx.db
      .query("savedFilters")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter((q) => q.eq(q.field("projectId"), ctx.projectId))
      .take(BOUNDED_LIST_LIMIT);

    // Get public filters from other users
    const publicFilters = await ctx.db
      .query("savedFilters")
      .withIndex("by_project_public", (q) => q.eq("projectId", ctx.projectId).eq("isPublic", true))
      .filter((q) => q.neq(q.field("userId"), ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    // Combine and batch fetch creators to avoid N+1 queries
    const all = [...myFilters, ...publicFilters];
    const creatorIds = all.map((f) => f.userId);
    const creatorMap = await batchFetchUsers(ctx, creatorIds);

    // Enrich with pre-fetched data (no N+1)
    return all.map((filter) => ({
      ...filter,
      createdAt: filter._creationTime,
      creatorName: getUserName(creatorMap.get(filter.userId)),
      isOwner: filter.userId === ctx.userId,
    }));
  },
});

/**
 * Update a saved filter
 * Only the owner can update their filter
 */
export const update = authenticatedMutation({
  args: {
    id: v.id("savedFilters"),
    name: v.optional(v.string()),
    filters: v.optional(filtersValidator),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const filter = await ctx.db.get(args.id);
    if (!filter) {
      throw notFound("filter", args.id);
    }

    if (filter.userId !== ctx.userId) {
      throw forbidden();
    }

    const updates: Partial<typeof filter> & { updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.filters !== undefined) updates.filters = args.filters;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * Delete a saved filter
 * Only the owner can delete their filter
 */
export const remove = authenticatedMutation({
  args: {
    id: v.id("savedFilters"),
  },
  handler: async (ctx, args) => {
    const filter = await ctx.db.get(args.id);
    if (!filter) {
      throw notFound("filter", args.id);
    }

    if (filter.userId !== ctx.userId) {
      throw forbidden();
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
