import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden } from "./lib/errors";
import { getOrganizationRole, isOrganizationAdmin } from "./lib/organizationAccess";
import { notDeleted } from "./lib/softDeleteHelpers";

// ============================================================================
// Project Access Control Helpers
// ============================================================================

// Cache for project access checks within a single request context
const projectAccessCache = new WeakMap<object, Map<string, Promise<ProjectAccessResult>>>();

/**
 * Access level enum for comparison
 */
type AccessLevel = "admin" | "editor" | "viewer" | null;

/**
 * Computed project access result - single pass computation
 */
interface ProjectAccessResult {
  canAccess: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  role: AccessLevel;
  reason: string;
}

/**
 * Batch check if user is member of any of the given teams
 * Returns the highest role found, or null if not a member of any team
 */
async function batchGetTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamIds: Id<"teams">[],
  userId: Id<"users">,
): Promise<{ role: "admin" | "member" | null; teamId: Id<"teams"> | null }> {
  if (teamIds.length === 0) {
    return { role: null, teamId: null };
  }

  // Query all team memberships for this user in one query
  // Bounded - users shouldn't be in more teams than this
  const memberships = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(BOUNDED_LIST_LIMIT);

  // Filter to only the teams we care about
  const relevantTeamIds = new Set(teamIds.map((id) => id.toString()));
  let highestRole: "admin" | "member" | null = null;
  let matchedTeamId: Id<"teams"> | null = null;

  for (const membership of memberships) {
    if (relevantTeamIds.has(membership.teamId.toString())) {
      if (membership.role === "admin") {
        return { role: "admin", teamId: membership.teamId };
      }
      if (highestRole === null) {
        highestRole = "member";
        matchedTeamId = membership.teamId;
      }
    }
  }

  return { role: highestRole, teamId: matchedTeamId };
}

/**
 * Build the result object for access checks
 */
function buildAccessResult(
  canAccess: boolean,
  canEdit: boolean,
  isAdmin: boolean,
  role: AccessLevel,
  reason: string,
): ProjectAccessResult {
  return { canAccess, canEdit, isAdmin, role, reason };
}

/**
 * Check team-based access for a project
 */
async function checkTeamBasedAccess(
  ctx: QueryCtx | MutationCtx,
  projectTeamId: Id<"teams"> | undefined,
  sharedWithTeamIds: Id<"teams">[] | undefined,
  userId: Id<"users">,
): Promise<ProjectAccessResult | null> {
  const teamIds: Id<"teams">[] = [];
  if (projectTeamId) {
    teamIds.push(projectTeamId);
  }
  if (sharedWithTeamIds) {
    teamIds.push(...sharedWithTeamIds);
  }

  if (teamIds.length === 0) {
    return null;
  }

  const { role: teamRole, teamId: matchedTeamId } = await batchGetTeamRole(ctx, teamIds, userId);
  if (!teamRole) {
    return null;
  }

  const isOwningTeam = matchedTeamId?.toString() === projectTeamId?.toString();
  if (isOwningTeam) {
    return buildAccessResult(
      true,
      true,
      teamRole === "admin",
      teamRole === "admin" ? "admin" : "editor",
      "owning_team_member",
    );
  }

  return buildAccessResult(true, false, false, "viewer", "shared_team_member");
}

/**
 * Check organization public project access
 */
async function checkOrgPublicAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<ProjectAccessResult | null> {
  const orgMembership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  if (orgMembership) {
    return buildAccessResult(true, false, false, "viewer", "organization_public_project");
  }

  return null;
}

/**
 * Compute all access levels for a user on a project in a single pass
 *
 * This consolidates all access checks to avoid N+1 queries and duplicated logic.
 * Call this once and use the result for any access decisions.
 */
export async function computeProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<ProjectAccessResult> {
  // Check cache first
  let requestCache = projectAccessCache.get(ctx);
  if (!requestCache) {
    requestCache = new Map();
    projectAccessCache.set(ctx, requestCache);
  }

  const cacheKey = `${projectId}_${userId}`;
  const cachedPromise = requestCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = computeProjectAccessImpl(ctx, projectId, userId);
  requestCache.set(cacheKey, promise);
  return promise;
}

/**
 * Check direct ownership of a project
 */
async function checkDirectOwnership(
  ctx: QueryCtx | MutationCtx,
  project: {
    ownerId?: Id<"users">;
    createdBy?: Id<"users">;
    organizationId: Id<"organizations">;
  },
  userId: Id<"users">,
): Promise<ProjectAccessResult | null> {
  // 1. Check direct ownership
  if (project.ownerId === userId || project.createdBy === userId) {
    if (project.organizationId) {
      // SECURITY FIX: Even if user owns the project, they must be a member of the organization
      const orgRole = await getOrganizationRole(ctx, project.organizationId, userId);
      if (orgRole) {
        return buildAccessResult(true, true, true, "admin", "owner");
      }
      // If not a member, likely no access unless other checks pass (unlikely for owner but safe to fall through)
    } else {
      return buildAccessResult(true, true, true, "admin", "owner");
    }
  }
  return null;
}

/**
 * Check organization admin access
 */
async function checkOrgAdminAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<ProjectAccessResult | null> {
  // 2. Check organization admin
  if (organizationId) {
    const isOrgAdmin = await isOrganizationAdmin(ctx, organizationId, userId);
    if (isOrgAdmin) {
      return buildAccessResult(true, true, true, "admin", "organization_admin");
    }
  }
  return null;
}

/**
 * Check direct project membership
 */
async function checkProjectMembership(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<ProjectAccessResult | null> {
  // 3. Check direct project membership
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .filter(notDeleted)
    .first();

  if (projectMembership) {
    const memberRole = projectMembership.role;
    return buildAccessResult(
      true,
      memberRole === "admin" || memberRole === "editor",
      memberRole === "admin",
      memberRole,
      "project_member",
    );
  }
  return null;
}

/**
 * Implementation of project access computation
 */
async function computeProjectAccessImpl(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<ProjectAccessResult> {
  const noAccess = buildAccessResult(false, false, false, null, "no_access");

  const project = await ctx.db.get(projectId);
  if (!project) {
    return buildAccessResult(false, false, false, null, "project_not_found");
  }

  // 1. Check direct ownership
  const directOwnership = await checkDirectOwnership(ctx, project, userId);
  if (directOwnership) return directOwnership;

  // 2. Check organization admin
  const orgAdminAccess = await checkOrgAdminAccess(ctx, project.organizationId, userId);
  if (orgAdminAccess) return orgAdminAccess;

  // 3. Check direct project membership
  const membershipAccess = await checkProjectMembership(ctx, projectId, userId);
  if (membershipAccess) return membershipAccess;

  // 4. Check team access (batched)
  const teamAccess = await checkTeamBasedAccess(
    ctx,
    project.teamId,
    project.sharedWithTeamIds,
    userId,
  );
  if (teamAccess) {
    return teamAccess;
  }

  // 5. Check organization-visible project (public within org)
  if (project.isPublic && project.organizationId) {
    const orgAccess = await checkOrgPublicAccess(ctx, project.organizationId, userId);
    if (orgAccess) {
      return orgAccess;
    }
  }

  return noAccess;
}

// ============================================================================
// Convenience functions (thin wrappers around computeProjectAccess)
// ============================================================================

/**
 * Check if user can access a project (read access)
 */
export async function canAccessProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const access = await computeProjectAccess(ctx, projectId, userId);
  return access.canAccess;
}

/**
 * Check if user can edit a project (write access)
 */
export async function canEditProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const access = await computeProjectAccess(ctx, projectId, userId);
  return access.canEdit;
}

/**
 * Check if user is project admin
 */
export async function isProjectAdmin(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const access = await computeProjectAccess(ctx, projectId, userId);
  return access.isAdmin;
}

/**
 * Get user's effective role in a project
 */
export async function getProjectRole(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<AccessLevel> {
  const access = await computeProjectAccess(ctx, projectId, userId);
  return access.role;
}

// ============================================================================
// Assert functions (throw on failure)
// ============================================================================

/**
 * Assert user can access project
 */
export async function assertCanAccessProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const access = await computeProjectAccess(ctx, projectId, userId);
  if (!access.canAccess) {
    throw forbidden();
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
  const access = await computeProjectAccess(ctx, projectId, userId);
  if (!access.canEdit) {
    throw forbidden("editor");
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
  const access = await computeProjectAccess(ctx, projectId, userId);
  if (!access.isAdmin) {
    throw forbidden("admin");
  }
}
