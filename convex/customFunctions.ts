/**
 * Custom Convex Functions with convex-helpers
 *
 * Provides authenticated query/mutation builders that:
 * - Automatically inject user context
 * - Check RBAC permissions
 * - Improve code reusability
 *
 * @module customFunctions
 * @see {@link https://www.npmjs.com/package/convex-helpers} convex-helpers documentation
 *
 * ## Architecture
 *
 * All functions use a FLAT architecture (single level) for proper TypeScript inference.
 * Each function extends `query` or `mutation` directly and uses shared helpers.
 *
 * ## Usage
 *
 * ```typescript
 * // For queries/mutations that just need authentication
 * import { authenticatedQuery, authenticatedMutation } from "./customFunctions";
 *
 * // For organization-scoped operations
 * import { organizationQuery, organizationMemberMutation, organizationAdminMutation } from "./customFunctions";
 *
 * // For workspace-scoped operations
 * import { workspaceQuery, workspaceMemberMutation, workspaceEditorMutation, workspaceAdminMutation } from "./customFunctions";
 *
 * // For team-scoped operations
 * import { teamQuery, teamMemberMutation, teamLeadMutation } from "./customFunctions";
 *
 * // For project-scoped operations with RBAC
 * import { projectQuery, projectViewerMutation, projectEditorMutation, projectAdminMutation } from "./customFunctions";
 *
 * // For issue-scoped operations
 * import { issueQuery, issueMutation, issueViewerMutation } from "./customFunctions";
 *
 * // For sprint-scoped operations
 * import { sprintQuery, sprintMutation } from "./customFunctions";
 * ```
 *
 * ## Role Hierarchy
 *
 * - `viewer` (1): Read-only access, can comment
 * - `editor` (2): Can create/edit/delete issues, sprints, documents
 * - `admin` (3): Full control including settings, members, workflow
 */

import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { customAction, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { Id } from "./_generated/dataModel";
import { action, type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { forbidden, notFound, unauthenticated } from "./lib/errors";
import { getOrganizationRole, isOrganizationAdmin } from "./lib/organizationAccess";
import { getTeamRole } from "./lib/teamAccess";
import { DAY } from "./lib/timeUtils";
import { getWorkspaceRole } from "./lib/workspaceAccess";
import { getProjectRole } from "./projectAccess";

// =============================================================================
// Shared Auth Helper
// =============================================================================

/**
 * Require authentication and return the user ID.
 * Use this in all custom functions to avoid chaining.
 */
async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw unauthenticated();
  }

  // Enforce 2FA verification if enabled
  const user = await ctx.db.get(userId);
  if (user?.twoFactorEnabled && user.twoFactorSecret) {
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      // If no session ID (shouldn't happen for authenticated user), force verification
      throw forbidden(undefined, "Two-factor authentication required");
    }

    const sessionVerification = await ctx.db
      .query("twoFactorSessions")
      .withIndex("by_user_session", (q) => q.eq("userId", userId).eq("sessionId", sessionId))
      .first();

    const twentyFourHoursAgo = Date.now() - DAY;
    if (!sessionVerification || sessionVerification.verifiedAt < twentyFourHoursAgo) {
      throw forbidden(undefined, "Two-factor authentication required");
    }
  }

  return userId;
}

// =============================================================================
// Role Checking Helpers
// =============================================================================

import type { OrganizationRole, ProjectRole } from "./validators";

const ROLE_HIERARCHY = { viewer: 1, editor: 2, admin: 3 } as const;

function hasMinimumRole(role: ProjectRole | null, requiredRole: ProjectRole): boolean {
  const userLevel = role ? ROLE_HIERARCHY[role] : 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

function requireMinimumRole(role: ProjectRole | null, requiredRole: ProjectRole): void {
  if (!hasMinimumRole(role, requiredRole)) {
    throw forbidden(requiredRole);
  }
}

function hasMinimumOrgRole(role: OrganizationRole | null, requiredRole: OrganizationRole): boolean {
  const ORG_ROLE_HIERARCHY = { member: 1, admin: 2, owner: 3 } as const;
  const userLevel = role ? ORG_ROLE_HIERARCHY[role] : 0;
  const requiredLevel = ORG_ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

// =============================================================================
// Layer 1: Base Authentication
// =============================================================================

/**
 * Authenticated Query - requires user to be logged in.
 *
 * Use this for any query that needs the current user's ID but no specific
 * organization/project context.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *
 * @example
 * export const getMyProfile = authenticatedQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return await ctx.db.get(ctx.userId);
 *   },
 * });
 */
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const userId = await requireAuth(ctx);
    return { ctx: { ...ctx, userId }, args: {} };
  },
});

/**
 * Authenticated Action - requires user to be logged in.
 *
 * Use this for any action that needs the current user's ID.
 *
 * @param ctx - The action context, augmented with:
 *   - `userId`: The current user's ID.
 *
 * @example
 * export const myAction = authenticatedAction({
 *   args: {},
 *   handler: async (ctx) => {
 *     // ctx.userId is available
 *   },
 * });
 */
export const authenticatedAction = customAction(action, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }
    return { ctx: { ...ctx, userId }, args: {} };
  },
});

/**
 * Authenticated Mutation - requires user to be logged in.
 *
 * Use this for any mutation that needs the current user's ID but no specific
 * organization/project context.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *
 * @example
 * export const updateProfile = authenticatedMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.userId, { name: args.name });
 *   },
 * });
 */
export const authenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const userId = await requireAuth(ctx);
    return { ctx: { ...ctx, userId }, args: {} };
  },
});

// =============================================================================
// Organization-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Organization Query - requires membership in the organization.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `organizationId`: The ID of the organization (from args).
 *   - `organization`: The full organization document.
 *   - `organizationRole`: The user's role in the organization ('owner', 'admin', 'member').
 *
 * @example
 * export const getOrgDetails = organizationQuery({
 *   args: { organizationId: v.id("organizations") },
 *   handler: async (ctx, args) => {
 *     return ctx.organization;
 *   },
 * });
 */
export const organizationQuery = customQuery(query, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to access this resource");
    }

    return {
      ctx: { ...ctx, userId, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

/**
 * Organization Member Mutation - requires membership in the organization.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `organizationId`: The ID of the organization (from args).
 *   - `organization`: The full organization document.
 *   - `organizationRole`: The user's role in the organization ('owner', 'admin', 'member').
 *
 * @example
 * export const updateMemberStatus = organizationMemberMutation({
 *   args: { organizationId: v.id("organizations") },
 *   handler: async (ctx, args) => {
 *     // Logic for organization members
 *   },
 * });
 */
export const organizationMemberMutation = customMutation(mutation, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to perform this action");
    }

    return {
      ctx: { ...ctx, userId, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

/**
 * Organization Admin Mutation - requires admin role in the organization.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `organizationId`: The ID of the organization (from args).
 *   - `organization`: The full organization document.
 *   - `organizationRole`: The user's role in the organization ('owner', 'admin', 'member').
 *
 * @example
 * export const updateOrgSettings = organizationAdminMutation({
 *   args: { organizationId: v.id("organizations"), name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.organizationId, { name: args.name });
 *   },
 * });
 */
export const organizationAdminMutation = customMutation(mutation, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, userId);
    if (!hasMinimumOrgRole(organizationRole, "admin")) {
      throw forbidden("admin", "Only organization admins can perform this action");
    }

    return {
      ctx: { ...ctx, userId, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

// =============================================================================
// Workspace-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Workspace Query - requires membership in the parent organization.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `workspaceId`: The ID of the workspace (from args).
 *   - `workspace`: The full workspace document.
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const getWorkspaceDetails = workspaceQuery({
 *   args: { workspaceId: v.id("workspaces") },
 *   handler: async (ctx, args) => {
 *     return ctx.workspace;
 *   },
 * });
 */
export const workspaceQuery = customQuery(query, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to access this workspace");
    }

    const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, userId);

    if (!(isOrgAdmin || workspaceRole)) {
      throw forbidden("member", "You must be a workspace member to access this workspace");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
      },
      args: {},
    };
  },
});

/**
 * Workspace Admin Mutation - requires admin role in the workspace.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `workspaceId`: The ID of the workspace (from args).
 *   - `workspace`: The full workspace document.
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const deleteWorkspace = workspaceAdminMutation({
 *   args: { workspaceId: v.id("workspaces") },
 *   handler: async (ctx, args) => {
 *     await ctx.db.delete(ctx.workspaceId);
 *   },
 * });
 */
export const workspaceAdminMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, userId);
    const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, userId);

    if (!(isOrgAdmin || workspaceRole === "admin")) {
      throw forbidden("admin", "Only workspace admins can perform this action");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
      },
      args: {},
    };
  },
});

/**
 * Workspace Editor Mutation - requires editor role in the workspace.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `workspaceId`: The ID of the workspace (from args).
 *   - `workspace`: The full workspace document.
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const updateWorkspace = workspaceEditorMutation({
 *   args: { workspaceId: v.id("workspaces"), name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.workspaceId, { name: args.name });
 *   },
 * });
 */
export const workspaceEditorMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, userId);
    const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, userId);

    if (!(isOrgAdmin || workspaceRole === "admin" || workspaceRole === "editor")) {
      throw forbidden("editor", "You need editor access to perform this action");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
      },
      args: {},
    };
  },
});

/**
 * Workspace Member Mutation - requires membership in the workspace.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `workspaceId`: The ID of the workspace (from args).
 *   - `workspace`: The full workspace document.
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const joinWorkspace = workspaceMemberMutation({
 *   args: { workspaceId: v.id("workspaces") },
 *   handler: async (ctx, args) => {
 *     // Join logic
 *   },
 * });
 */
export const workspaceMemberMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, userId);
    const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, userId);

    if (!(isOrgAdmin || workspaceRole)) {
      throw forbidden("member", "You must be a workspace member to perform this action");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
      },
      args: {},
    };
  },
});

// =============================================================================
// Team-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Team Query - requires team membership or org admin.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `teamId`: The ID of the team (from args).
 *   - `team`: The full team document.
 *   - `teamRole`: The user's role in the team ('admin', 'member').
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const getTeamDetails = teamQuery({
 *   args: { teamId: v.id("teams") },
 *   handler: async (ctx, args) => {
 *     return ctx.team;
 *   },
 * });
 */
export const teamQuery = customQuery(query, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(teamRole || isOrgAdmin)) {
      throw forbidden(
        "member",
        "You must be a team member or organization admin to access this team",
      );
    }

    return {
      ctx: {
        ...ctx,
        userId,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
      },
      args: {},
    };
  },
});

/**
 * Team Member Mutation - requires team membership or org admin.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `teamId`: The ID of the team (from args).
 *   - `team`: The full team document.
 *   - `teamRole`: The user's role in the team ('admin', 'member').
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const leaveTeam = teamMemberMutation({
 *   args: { teamId: v.id("teams") },
 *   handler: async (ctx, args) => {
 *     // Leave team logic
 *   },
 * });
 */
export const teamMemberMutation = customMutation(mutation, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(teamRole || isOrgAdmin)) {
      throw forbidden(
        "member",
        "You must be a team member or organization admin to perform this action",
      );
    }

    return {
      ctx: {
        ...ctx,
        userId,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
      },
      args: {},
    };
  },
});

/**
 * Team Lead Mutation - requires team admin role or org admin.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `teamId`: The ID of the team (from args).
 *   - `team`: The full team document.
 *   - `teamRole`: The user's role in the team ('admin', 'member').
 *   - `organizationId`: The ID of the parent organization.
 *
 * @example
 * export const updateTeamSettings = teamLeadMutation({
 *   args: { teamId: v.id("teams"), name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.teamId, { name: args.name });
 *   },
 * });
 */
export const teamLeadMutation = customMutation(mutation, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(teamRole === "admin" || isOrgAdmin)) {
      throw forbidden("admin", "Only team leads or organization admins can perform this action");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
      },
      args: {},
    };
  },
});

// =============================================================================
// Project-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Project Query - requires project access or public project.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the project (from args).
 *   - `project`: The full project document.
 *   - `role`: The user's role in the project ('admin', 'editor', 'viewer').
 *
 * @example
 * export const getProject = projectQuery({
 *   args: { projectId: v.id("projects") },
 *   handler: async (ctx, args) => {
 *     return ctx.project;
 *   },
 * });
 */
export const projectQuery = customQuery(query, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);
    if (!role) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Viewer Mutation - requires at least viewer role.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the project (from args).
 *   - `project`: The full project document.
 *   - `role`: The user's role in the project ('admin', 'editor', 'viewer').
 *
 * @example
 * export const logView = projectViewerMutation({
 *   args: { projectId: v.id("projects") },
 *   handler: async (ctx, args) => {
 *     // Log view logic
 *   },
 * });
 */
export const projectViewerMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);
    requireMinimumRole(role, "viewer");

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Editor Mutation - requires at least editor role.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the project (from args).
 *   - `project`: The full project document.
 *   - `role`: The user's role in the project ('admin', 'editor', 'viewer').
 *
 * @example
 * export const updateProject = projectEditorMutation({
 *   args: { projectId: v.id("projects"), description: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.projectId, { description: args.description });
 *   },
 * });
 */
export const projectEditorMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Admin Mutation - requires admin role.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the project (from args).
 *   - `project`: The full project document.
 *   - `role`: The user's role in the project ('admin', 'editor', 'viewer').
 *
 * @example
 * export const deleteProject = projectAdminMutation({
 *   args: { projectId: v.id("projects") },
 *   handler: async (ctx, args) => {
 *     await ctx.db.delete(ctx.projectId);
 *   },
 * });
 */
export const projectAdminMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);
    requireMinimumRole(role, "admin");

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

// =============================================================================
// Issue-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Issue Mutation - requires editor role on the parent project.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the parent project.
 *   - `role`: The user's role in the project.
 *   - `project`: The full project document.
 *   - `issue`: The full issue document.
 *
 * @example
 * export const updateIssue = issueMutation({
 *   args: { issueId: v.id("issues"), title: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.issue._id, { title: args.title });
 *   },
 * });
 */
export const issueMutation = customMutation(mutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    const role = await getProjectRole(ctx, issue.projectId, userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, userId, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

/**
 * Issue Viewer Mutation - requires viewer role (for comments, watches).
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the parent project.
 *   - `role`: The user's role in the project.
 *   - `project`: The full project document.
 *   - `issue`: The full issue document.
 *
 * @example
 * export const watchIssue = issueViewerMutation({
 *   args: { issueId: v.id("issues") },
 *   handler: async (ctx, args) => {
 *     // Add watch logic
 *   },
 * });
 */
export const issueViewerMutation = customMutation(mutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    const role = await getProjectRole(ctx, issue.projectId, userId);
    requireMinimumRole(role, "viewer");

    return {
      ctx: { ...ctx, userId, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

/**
 * Issue Query - requires project access or public project.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the parent project.
 *   - `role`: The user's role in the project.
 *   - `project`: The full project document.
 *   - `issue`: The full issue document.
 *
 * @example
 * export const getIssue = issueQuery({
 *   args: { issueId: v.id("issues") },
 *   handler: async (ctx, args) => {
 *     return ctx.issue;
 *   },
 * });
 */
export const issueQuery = customQuery(query, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }
    const role = await getProjectRole(ctx, issue.projectId, userId);
    if (!role) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, userId, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

// =============================================================================
// Sprint-Scoped (flat - extends query/mutation directly)
// =============================================================================

/**
 * Sprint Query - requires project access or public project.
 *
 * @param ctx - The query context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the parent project.
 *   - `role`: The user's role in the project.
 *   - `project`: The full project document.
 *   - `sprint`: The full sprint document.
 *
 * @example
 * export const getSprint = sprintQuery({
 *   args: { sprintId: v.id("sprints") },
 *   handler: async (ctx, args) => {
 *     return ctx.sprint;
 *   },
 * });
 */
export const sprintQuery = customQuery(query, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }

    const role = await getProjectRole(ctx, sprint.projectId, userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, userId, projectId: sprint.projectId, role, project, sprint },
      args: {},
    };
  },
});

/**
 * Sprint Mutation - requires editor role on the parent project.
 *
 * @param ctx - The mutation context, augmented with:
 *   - `userId`: The current user's ID.
 *   - `projectId`: The ID of the parent project.
 *   - `role`: The user's role in the project.
 *   - `project`: The full project document.
 *   - `sprint`: The full sprint document.
 *
 * @example
 * export const updateSprint = sprintMutation({
 *   args: { sprintId: v.id("sprints"), name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.sprint._id, { name: args.name });
 *   },
 * });
 */
export const sprintMutation = customMutation(mutation, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }
    const role = await getProjectRole(ctx, sprint.projectId, userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, userId, projectId: sprint.projectId, role, project, sprint },
      args: {},
    };
  },
});
