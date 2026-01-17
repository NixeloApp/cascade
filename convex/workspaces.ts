/**
 * Workspaces - Department-level organization
 *
 * Workspaces sit above teams in the hierarchy:
 * organization → Workspaces (departments) → Teams → Projects → Issues
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";
import { isOrganizationAdmin } from "./organizations";

/**
 * Create a new workspace (department)
 * Only organization admins can create workspaces
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is organization admin
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, userId);
    if (!isAdmin) throw new Error("Only organization admins can create workspaces");

    // Check if slug is unique within organization
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug),
      )
      .first();

    if (existing) {
      throw new Error("A workspace with this slug already exists");
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      organizationId: args.organizationId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});

/**
 * List all workspaces for a organization
 */
export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return workspaces;
  },
});

/**
 * Get a single workspace by ID
 */
export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    return workspace;
  },
});

/**
 * Get workspace by slug
 */
export const getBySlug = query({
  args: {
    organizationId: v.id("organizations"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug),
      )
      .first();

    if (!workspace) throw new Error("Workspace not found");

    return workspace;
  },
});

/**
 * Update workspace
 */
export const update = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultProjectVisibility: v.optional(v.boolean()),
        allowExternalSharing: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    // Check permissions: Only organization admins can update workspaces
    const isAdmin = await isOrganizationAdmin(ctx, workspace.organizationId, userId);
    if (!isAdmin) {
      throw new Error("Only organization admins can perform this action");
    }

    await ctx.db.patch(args.id, {
      ...Object.fromEntries(
        Object.entries(args).filter(([key, value]) => key !== "id" && value !== undefined),
      ),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete workspace
 * WARNING: This will orphan all teams and projects in this workspace
 */
export const remove = mutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    // Check permissions (workspace admin or organization admin)
    const isCreator = workspace.createdBy === userId;
    const isOrgAdmin = await isOrganizationAdmin(ctx, workspace.organizationId, userId);

    if (!(isCreator || isOrgAdmin)) {
      throw new Error("Only workspace admins or organization admins can delete workspaces");
    }

    // Check if workspace has teams or projects
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .first();

    if (teams) {
      throw new Error("Cannot delete workspace with teams. Please delete or move teams first.");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .filter(notDeleted)
      .first();

    if (projects) {
      throw new Error(
        "Cannot delete workspace with projects. Please delete or move projects first.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Get workspace stats (teams, projects count)
 */
export const getStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter(notDeleted)
      .collect();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter(notDeleted)
      .collect();

    return {
      teamsCount: teams.length,
      projectsCount: projects.length,
    };
  },
});
