import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";
import { isOrganizationAdmin } from "./organizations";
import { getTeamRole } from "./teams";

// ============================================================================
// Project Access Control Helpers
// ============================================================================

/**
 * Check organization-level access permissions
 */
async function checkOrganizationAccess(
  ctx: QueryCtx | MutationCtx,
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const organizationId = project.organizationId;
  if (!organizationId) return false;

  // 1. organization admin has full access
  const isAdmin = await isOrganizationAdmin(ctx, organizationId, userId);
  if (isAdmin) return true;

  // 2. organization-visible project (isPublic=true) + user is organization member
  if (project.isPublic) {
    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId),
      )
      .first();

    if (organizationMembership) return true;
  }

  return false;
}

/**
 * Check team-level access permissions
 */
async function checkTeamAccess(
  ctx: QueryCtx | MutationCtx,
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User is member of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole) return true;
  }

  // 2. User is member of shared team
  if (project.sharedWithTeamIds) {
    for (const sharedTeamId of project.sharedWithTeamIds) {
      const teamRole = await getTeamRole(ctx, sharedTeamId, userId);
      if (teamRole) return true;
    }
  }

  return false;
}

/**
 * Check direct user access (Owner, Creator, Collaborator)
 */
async function checkDirectAccess(
  ctx: QueryCtx | MutationCtx,
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User owns the project
  if (project.ownerId === userId) return true;

  // 2. Legacy: creator has access
  if (project.createdBy === userId) return true;

  // 3. User is individual collaborator (projectMembers)
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", project._id).eq("userId", userId))
    .filter(notDeleted)
    .first();

  if (projectMembership) {
    return true;
  }

  return false;
}

/**
 * Check if user can access a project (read access)
 *
 * Access is granted if ANY of the following are true:
 * 1. User is organization admin
 * 2. Project is organization-visible (isPublic=true) AND user is organization member
 * 3. User owns the project (ownerId)
 * 4. User is member of team that owns the project (teamId)
 * 5. User is in projectMembers (individual collaborator)
 * 6. User is member of a team in sharedWithTeamIds
 */
export async function canAccessProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) {
    return false;
  }

  const result = await (async () => {
    if (await checkDirectAccess(ctx, project, userId)) return true;
    if (await checkTeamAccess(ctx, project, userId)) return true;
    if (await checkOrganizationAccess(ctx, project, userId)) return true;
    return false;
  })();

  return result;
}

/**
 * Check if user can edit a project (write access)
 *
 * Edit access is granted if ANY of the following are true:
 * 1. User is organization admin
 * 2. User owns the project (ownerId)
 * 3. User is member of team that owns the project (teamId)
 * 4. User is admin or editor in projectMembers
 */
export async function canEditProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // 1. organization admin has full access (if project belongs to organization)
  if (project.organizationId) {
    const isAdmin = await isOrganizationAdmin(ctx, project.organizationId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the project
  if (project.ownerId === userId) return true;

  // Legacy: creator has edit access
  if (project.createdBy === userId) return true;

  // 3. User is member of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole) return true;
  }

  // 4. User is admin or editor in projectMembers
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .filter(notDeleted)
    .first();

  if (
    projectMembership &&
    (projectMembership.role === "admin" || projectMembership.role === "editor")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user is project admin (can manage settings, members, delete)
 *
 * Admin access is granted if ANY of the following are true:
 * 1. User is organization admin
 * 2. User owns the project (ownerId)
 * 3. User is team lead of owning team (teamId)
 * 4. User is admin in projectMembers
 */
export async function isProjectAdmin(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // 1. organization admin has full access (if project belongs to organization)
  if (project.organizationId) {
    const isAdmin = await isOrganizationAdmin(ctx, project.organizationId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the project
  if (project.ownerId === userId) return true;

  // 3. Legacy: creator has admin access (backward compatibility)
  if (project.createdBy === userId) return true;

  // 4. User is team lead of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole === "lead") return true;
  }

  // 5. User is admin in projectMembers
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .filter(notDeleted)
    .first();

  if (projectMembership && projectMembership.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Assert user can access project
 */
export async function assertCanAccessProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const canAccess = await canAccessProject(ctx, projectId, userId);
  if (!canAccess) {
    throw new Error("You don't have permission to access this project");
  }
}

/**
 * Assert user can edit project
 */
export async function assertCanEditProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const canEdit = await canEditProject(ctx, projectId, userId);
  if (!canEdit) {
    throw new Error("You don't have permission to edit this project");
  }
}

/**
 * Assert user is project admin
 */
export async function assertIsProjectAdmin(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isProjectAdmin(ctx, projectId, userId);
  if (!isAdmin) {
    throw new Error("Only project admins can perform this action");
  }
}

/**
 * Get user's effective role in a project
 * Returns the highest privilege level
 */
export async function getProjectRole(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<"admin" | "editor" | "viewer" | null> {
  const project = await ctx.db.get(projectId);
  if (!project) return null;

  // Check if can access at all
  const canAccess = await canAccessProject(ctx, projectId, userId);
  if (!canAccess) return null;

  // Check admin level
  const isAdmin = await isProjectAdmin(ctx, projectId, userId);
  if (isAdmin) return "admin";

  // Check editor level
  const canEdit = await canEditProject(ctx, projectId, userId);
  if (canEdit) return "editor";

  // Has read-only access
  return "viewer";
}
