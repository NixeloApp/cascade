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
  returns: v.object({ success: v.literal(true), workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    // workspaceAdminMutation handles auth + org admin check
    await ctx.db.patch(ctx.workspaceId, {
      ...Object.fromEntries(Object.entries(args).filter(([_, value]) => value !== undefined)),
      updatedAt: Date.now(),
    });

    return { success: true, workspaceId: ctx.workspaceId } as const;
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
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
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

    return { success: true, deleted: true } as const;
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

/**
 * List backlog issues for a workspace across all projects.
 * Backlog is defined as non-deleted issues that are not assigned to a sprint and not done.
 */
export const getBacklogIssues = workspaceQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rawLimit = args.limit ?? 200;
    const limit = Math.min(Math.max(rawLimit, 1), BOUNDED_LIST_LIMIT * 5);

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(limit);

    return issues
      .filter((issue) => issue.sprintId === undefined && issue.status !== "done")
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * List active sprints for all projects in a workspace.
 */
export const getActiveSprints = workspaceQuery({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    const sprintsWithProject = await Promise.all(
      projects.map(async (project) => {
        const sprints = await ctx.db
          .query("sprints")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .take(BOUNDED_LIST_LIMIT);

        const enriched = await Promise.all(
          sprints.map(async (sprint) => {
            const issueCount = (
              await ctx.db
                .query("issues")
                .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
                .filter(notDeleted)
                .take(BOUNDED_LIST_LIMIT)
            ).length;
            return {
              ...sprint,
              issueCount,
              projectId: project._id,
              projectName: project.name,
              projectKey: project.key,
            };
          }),
        );

        return enriched;
      }),
    );

    return sprintsWithProject
      .flat()
      .sort(
        (a, b) => (a.endDate ?? Number.POSITIVE_INFINITY) - (b.endDate ?? Number.POSITIVE_INFINITY),
      );
  },
});

/**
 * List cross-team blocking dependencies for issues in a workspace.
 */
export const getCrossTeamDependencies = workspaceQuery({
  args: {
    teamId: v.optional(v.id("teams")),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rawLimit = args.limit ?? 200;
    const limit = Math.min(Math.max(rawLimit, 1), BOUNDED_LIST_LIMIT * 5);

    const workspaceIssues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspaceId))
      .filter(notDeleted)
      .take(limit);

    const issueMap = new Map(workspaceIssues.map((issue) => [issue._id, issue]));

    const outgoingLinksArrays = await Promise.all(
      workspaceIssues.map((issue) =>
        ctx.db
          .query("issueLinks")
          .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issue._id))
          .filter((q) => q.eq(q.field("linkType"), "blocks"))
          .take(BOUNDED_LIST_LIMIT),
      ),
    );

    const dependencies = outgoingLinksArrays
      .flat()
      .map((link) => {
        const fromIssue = issueMap.get(link.fromIssueId);
        const toIssue = issueMap.get(link.toIssueId);
        if (!(fromIssue && toIssue)) {
          return null;
        }

        if (!fromIssue.teamId || !toIssue.teamId || fromIssue.teamId === toIssue.teamId) {
          return null;
        }
        const fromTeamId = fromIssue.teamId;
        const toTeamId = toIssue.teamId;

        if (args.teamId && fromTeamId !== args.teamId && toTeamId !== args.teamId) {
          return null;
        }
        if (args.status && fromIssue.status !== args.status && toIssue.status !== args.status) {
          return null;
        }
        if (
          args.priority &&
          fromIssue.priority !== args.priority &&
          toIssue.priority !== args.priority
        ) {
          return null;
        }

        return {
          linkId: link._id,
          fromIssue,
          toIssue,
          fromTeamId,
          toTeamId,
          updatedAt: Math.max(fromIssue.updatedAt, toIssue.updatedAt),
        };
      })
      .filter((dependency): dependency is NonNullable<typeof dependency> => dependency !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);

    const teamIds = [
      ...new Set(
        dependencies.flatMap((dependency) => [dependency.fromTeamId, dependency.toTeamId]),
      ),
    ];
    const teams = await Promise.all(teamIds.map((teamId) => ctx.db.get(teamId)));
    const teamNameById = new Map(
      teams
        .filter((team): team is NonNullable<typeof team> => team !== null)
        .map((team) => [team._id, team.name]),
    );

    return dependencies.map((dependency) => ({
      linkId: dependency.linkId,
      fromIssue: {
        _id: dependency.fromIssue._id,
        key: dependency.fromIssue.key,
        title: dependency.fromIssue.title,
        status: dependency.fromIssue.status,
        priority: dependency.fromIssue.priority,
        teamId: dependency.fromTeamId,
        teamName: teamNameById.get(dependency.fromTeamId) ?? "Unknown Team",
      },
      toIssue: {
        _id: dependency.toIssue._id,
        key: dependency.toIssue.key,
        title: dependency.toIssue.title,
        status: dependency.toIssue.status,
        priority: dependency.toIssue.priority,
        teamId: dependency.toTeamId,
        teamName: teamNameById.get(dependency.toTeamId) ?? "Unknown Team",
      },
      updatedAt: dependency.updatedAt,
    }));
  },
});

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
  returns: v.object({ success: v.literal(true) }),
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

    return { success: true } as const;
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
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
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

    return { success: true, deleted: true } as const;
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
