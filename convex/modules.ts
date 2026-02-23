import { v } from "convex/values";
import { projectEditorMutation, projectQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT, efficientCount } from "./lib/boundedQueries";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { moduleStatuses } from "./validators";

/**
 * Create a new module
 * Requires editor role on project
 */
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const moduleId = await ctx.db.insert("modules", {
      projectId: ctx.projectId,
      name: args.name,
      description: args.description,
      status: "backlog",
      leadId: args.leadId,
      startDate: args.startDate,
      targetDate: args.targetDate,
      createdBy: ctx.userId,
      updatedAt: now,
    });
    return { moduleId };
  },
});

/**
 * List modules for a project with issue counts
 * Requires viewer access to project
 */
export const listByProject = projectQuery({
  args: {
    status: v.optional(moduleStatuses),
  },
  handler: async (ctx, args) => {
    const MAX_MODULES = 100;

    const query = ctx.db
      .query("modules")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter(notDeleted);

    const modules = await query.take(MAX_MODULES);

    // Filter by status if specified
    const filteredModules = args.status ? modules.filter((m) => m.status === args.status) : modules;

    if (filteredModules.length === 0) {
      return [];
    }

    // Get project workflow states to correctly identify "done" statuses
    const project = await ctx.db.get(ctx.projectId);
    const doneStatusIds =
      project?.workflowStates.filter((s) => s.category === "done").map((s) => s.id) || [];

    // Fetch issue stats per module
    const moduleIds = filteredModules.map((m) => m._id);
    const issueStatsPromises = moduleIds.map(async (moduleId) => {
      const totalPromise = efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_module", (q) => q.eq("moduleId", moduleId).lt("isDeleted", true)),
        MAX_PAGE_SIZE,
      );

      // Count completed issues (skip query if no done statuses defined)
      const completedPromise =
        doneStatusIds.length > 0
          ? efficientCount(
              ctx.db
                .query("issues")
                .withIndex("by_module", (q) => q.eq("moduleId", moduleId).lt("isDeleted", true))
                .filter((q) =>
                  q.or(...doneStatusIds.map((status) => q.eq(q.field("status"), status))),
                ),
              MAX_PAGE_SIZE,
            )
          : Promise.resolve(0);

      const [count, completedCount] = await Promise.all([totalPromise, completedPromise]);
      return { moduleId, count, completedCount };
    });

    const issueStats = await Promise.all(issueStatsPromises);
    const issueStatsByModule = new Map(
      issueStats.map(({ moduleId, count, completedCount }) => [
        moduleId.toString(),
        { count, completedCount },
      ]),
    );

    // Enrich modules with lead info and stats
    const enrichedModules = await Promise.all(
      filteredModules.map(async (module) => {
        const lead = module.leadId ? await ctx.db.get(module.leadId) : null;
        const stats = issueStatsByModule.get(module._id.toString()) ?? {
          count: 0,
          completedCount: 0,
        };

        return {
          ...module,
          lead: lead
            ? {
                _id: lead._id,
                name: lead.name,
                email: lead.email,
                image: lead.image,
              }
            : null,
          issueCount: stats.count,
          completedCount: stats.completedCount,
          progress: stats.count > 0 ? Math.round((stats.completedCount / stats.count) * 100) : 0,
        };
      }),
    );

    return enrichedModules;
  },
});

/**
 * Get a single module by ID
 * Requires viewer access to project
 */
export const get = projectQuery({
  args: {
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module || module.isDeleted || module.projectId !== ctx.projectId) {
      return null;
    }

    const lead = module.leadId ? await ctx.db.get(module.leadId) : null;

    // Get issue stats
    const project = await ctx.db.get(ctx.projectId);
    const doneStatusIds =
      project?.workflowStates.filter((s) => s.category === "done").map((s) => s.id) || [];

    // Use efficientCount to avoid undercounting with large issue sets
    const issueCount = await efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId).lt("isDeleted", true)),
      MAX_PAGE_SIZE,
    );

    const completedCount =
      doneStatusIds.length > 0
        ? await efficientCount(
            ctx.db
              .query("issues")
              .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId).lt("isDeleted", true))
              .filter((q) =>
                q.or(...doneStatusIds.map((status) => q.eq(q.field("status"), status))),
              ),
            MAX_PAGE_SIZE,
          )
        : 0;

    return {
      ...module,
      lead: lead
        ? {
            _id: lead._id,
            name: lead.name,
            email: lead.email,
            image: lead.image,
          }
        : null,
      issueCount,
      completedCount,
      progress: issueCount > 0 ? Math.round((completedCount / issueCount) * 100) : 0,
    };
  },
});

/** Build update object for module patch */
function buildModuleUpdates(
  args: {
    name?: string;
    description?: string;
    status?: string;
    leadId?: string | null;
    startDate?: number | null;
    targetDate?: number | null;
  },
  currentStatus: string,
  now: number,
): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: now };

  if (args.name !== undefined) updates.name = args.name;
  if (args.description !== undefined) updates.description = args.description;
  if (args.leadId !== undefined) updates.leadId = args.leadId ?? undefined;
  if (args.startDate !== undefined) updates.startDate = args.startDate ?? undefined;
  if (args.targetDate !== undefined) updates.targetDate = args.targetDate ?? undefined;

  if (args.status !== undefined) {
    updates.status = args.status;
    // Track completion time
    const isNewlyCompleted = args.status === "completed" && currentStatus !== "completed";
    updates.completedAt = isNewlyCompleted ? now : undefined;
  }

  return updates;
}

/**
 * Update a module
 * Requires editor role on project
 */
export const update = projectEditorMutation({
  args: {
    moduleId: v.id("modules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(moduleStatuses),
    leadId: v.optional(v.union(v.id("users"), v.null())),
    startDate: v.optional(v.union(v.number(), v.null())),
    targetDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module || module.isDeleted || module.projectId !== ctx.projectId) {
      throw new Error("Module not found");
    }

    const updates = buildModuleUpdates(args, module.status, Date.now());
    await ctx.db.patch(args.moduleId, updates);
  },
});

/**
 * Delete a module (soft delete)
 * Requires editor role on project
 */
export const remove = projectEditorMutation({
  args: {
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module || module.isDeleted || module.projectId !== ctx.projectId) {
      throw new Error("Module not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.moduleId, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: ctx.userId,
      updatedAt: now,
    });

    // Unlink issues from this module
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId).lt("isDeleted", true))
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(
      issues.map((issue) =>
        ctx.db.patch(issue._id, {
          moduleId: undefined,
          updatedAt: now,
        }),
      ),
    );
  },
});

/**
 * Add issues to a module
 * Requires editor role on project
 */
export const addIssues = projectEditorMutation({
  args: {
    moduleId: v.id("modules"),
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module || module.isDeleted || module.projectId !== ctx.projectId) {
      throw new Error("Module not found");
    }

    const now = Date.now();
    await Promise.all(
      args.issueIds.map(async (issueId) => {
        const issue = await ctx.db.get(issueId);
        if (issue && !issue.isDeleted && issue.projectId === ctx.projectId) {
          await ctx.db.patch(issueId, {
            moduleId: args.moduleId,
            updatedAt: now,
          });
        }
      }),
    );
  },
});

/**
 * Remove issues from a module
 * Requires editor role on project
 */
export const removeIssues = projectEditorMutation({
  args: {
    moduleId: v.id("modules"),
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module || module.isDeleted || module.projectId !== ctx.projectId) {
      throw new Error("Module not found");
    }

    const now = Date.now();
    await Promise.all(
      args.issueIds.map(async (issueId) => {
        const issue = await ctx.db.get(issueId);
        if (issue && !issue.isDeleted && issue.moduleId === args.moduleId) {
          await ctx.db.patch(issueId, {
            moduleId: undefined,
            updatedAt: now,
          });
        }
      }),
    );
  },
});
