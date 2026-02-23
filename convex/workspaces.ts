/**
 * Workspaces - Department-level organization
 *
 * Workspaces sit above teams in the hierarchy:
 * organization → Workspaces (departments) → Teams → Projects → Issues
 */

import { v } from "convex/values";
import {
  authenticatedMutation,
  authenticatedQuery,
  organizationAdminMutation,
  organizationQuery,
  workspaceAdminMutation,
  workspaceQuery,
} from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, forbidden, notFound } from "./lib/errors";
import { isOrganizationAdmin } from "./lib/organizationAccess";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { workspaceRoles } from "./validators";

/**
 * Create a new workspace (department)
 * Only organization admins can create workspaces
 */
export const createWorkspace = organizationAdminMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  returns: v.object({ workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    // Check if slug is unique within organization
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("slug", args.slug),
      )
      .first();

    if (existing) {
      throw conflict("A workspace with this slug already exists");
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      organizationId: ctx.organizationId,
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });

    return { workspaceId };
  },
});

/** @deprecated Use createWorkspace instead */
export const create = createWorkspace;

/**
 * List all workspaces for a organization
 */
export const listWorkspaces = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
      .take(MAX_PAGE_SIZE);

    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
          .filter(notDeleted)
          .take(BOUNDED_LIST_LIMIT);

        const projects = await ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
          .filter(notDeleted)
          .take(BOUNDED_LIST_LIMIT);

        return {
          ...ws,
          teamCount: teams.length,
          projectCount: projects.length,
        };
      }),
    );

    return enriched;
  },
});

/** @deprecated Use listWorkspaces instead */
export const list = listWorkspaces;

/**
 * Get a single workspace by ID
 * @deprecated Use `getWorkspace` instead which returns null if not found
 */
export const get = authenticatedQuery({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw notFound("workspace", args.id);

    return workspace;
  },
});

/**
 * Get a single workspace by ID
 * Returns null if not found (consistent with other APIs)
 */
export const getWorkspace = authenticatedQuery({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) return null;

    return workspace;
  },
});

/**
 * Get workspace by slug
 * @deprecated Use `getWorkspaceBySlug` instead which returns null if not found
 */
export const getBySlug = organizationQuery({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("slug", args.slug),
      )
      .first();

    if (!workspace) throw notFound("workspace");

    return workspace;
  },
});

/**
 * Get workspace by slug
 * Returns null if not found (consistent with other APIs)
 */
export const getWorkspaceBySlug = organizationQuery({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("slug", args.slug),
      )
      .first();

    if (!workspace) return null;

    return workspace;
  },
});

/**
 * Update workspace
 * Only organization admins can update workspaces
 */
export const updateWorkspace = workspaceAdminMutation({
  args: {
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
  returns: v.object({ workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    // workspaceAdminMutation handles auth + org admin check
    await ctx.db.patch(ctx.workspaceId, {
      ...Object.fromEntries(Object.entries(args).filter(([_, value]) => value !== undefined)),
      updatedAt: Date.now(),
    });

    return { workspaceId: ctx.workspaceId };
  },
});

/** @deprecated Use updateWorkspace instead */
export const update = updateWorkspace;

/**
 * Delete workspace
 * Only organization admins or the workspace creator can delete workspaces
 * WARNING: This will orphan all teams and projects in this workspace
 */
export const deleteWorkspace = authenticatedMutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw notFound("workspace", args.id);

    // Check permissions (workspace creator or organization admin)
    const isCreator = workspace.createdBy === ctx.userId;
    const isOrgAdmin = await isOrganizationAdmin(ctx, workspace.organizationId, ctx.userId);

    if (!(isCreator || isOrgAdmin)) {
      throw forbidden(
        "admin",
        "Only organization admins or the workspace creator can delete workspaces",
      );
    }

    // Check if workspace has teams or projects
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .first();

    if (teams) {
      throw conflict("Cannot delete workspace with teams");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .filter(notDeleted)
      .first();

    if (projects) {
      throw conflict("Cannot delete workspace with projects");
    }

    await ctx.db.delete(args.id);
  },
});

/** @deprecated Use deleteWorkspace instead */
export const remove = deleteWorkspace;

/**
 * Get workspace stats (teams, projects count)
 */
export const getWorkspaceStats = workspaceQuery({
  args: {},
  handler: async (ctx) => {
    // workspaceQuery handles auth + org membership check
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    return {
      teamsCount: teams.length,
      projectsCount: projects.length,
    };
  },
});

/** @deprecated Use getWorkspaceStats instead */
export const getStats = getWorkspaceStats;

// =============================================================================
// Workspace Members
// =============================================================================

/**
 * Add member to workspace
 * Workspace admin or organization admin only
 */
export const addWorkspaceMember = workspaceAdminMutation({
  args: {
    userId: v.id("users"),
    role: workspaceRoles,
  },
  returns: v.object({ memberId: v.id("workspaceMembers") }),
  handler: async (ctx, args) => {
    // Check if user is already a member
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", ctx.workspaceId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw conflict("User is already a member of this workspace");
    }

    // Verify user is organization member
    const orgMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!orgMembership) {
      throw forbidden(undefined, "User must be an organization member to join this workspace");
    }

    const memberId = await ctx.db.insert("workspaceMembers", {
      workspaceId: ctx.workspaceId,
      userId: args.userId,
      role: args.role,
      addedBy: ctx.userId,
    });

    return { memberId };
  },
});

/** @deprecated Use addWorkspaceMember instead */
export const addMember = addWorkspaceMember;

/**
 * Update workspace member role
 * Workspace admin or organization admin only
 */
export const updateWorkspaceMemberRole = workspaceAdminMutation({
  args: {
    userId: v.id("users"),
    role: workspaceRoles,
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", ctx.workspaceId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw notFound("membership");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    return { success: true };
  },
});

/** @deprecated Use updateWorkspaceMemberRole instead */
export const updateMemberRole = updateWorkspaceMemberRole;

/**
 * Remove member from workspace
 * Workspace admin or organization admin only
 */
export const removeWorkspaceMember = workspaceAdminMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", ctx.workspaceId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw notFound("membership");
    }

    // Soft delete the membership
    await ctx.db.patch(membership._id, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: ctx.userId,
    });

    return { success: true };
  },
});

/** @deprecated Use removeWorkspaceMember instead */
export const removeMember = removeWorkspaceMember;

/**
 * Get workspace members
 * Any workspace member can view
 */
export const getWorkspaceMembers = workspaceQuery({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    // Fetch user details for each membership
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          ...membership,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }),
    );

    return members;
  },
});

/** @deprecated Use getWorkspaceMembers instead */
export const getMembers = getWorkspaceMembers;
