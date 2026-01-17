import { getAuthUserId } from "@convex-dev/auth/server";
import { type PaginationResult, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { batchFetchTeams, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { isOrganizationAdmin } from "./organizations";
import { isTest } from "./testConfig";
// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's role in a team
 * Returns null if user is not a member
 */
export async function getTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<"lead" | "member" | null> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is team lead
 */
export async function isTeamLead(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getTeamRole(ctx, teamId, userId);
  return role === "lead";
}

/**
 * Check if user can manage team (team lead or organization admin)
 */
async function canManageTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const team = await ctx.db.get(teamId);
  if (!team) return false;

  // Team lead can manage
  const isLead = await isTeamLead(ctx, teamId, userId);
  if (isLead) return true;

  // organization admin can manage
  return await isOrganizationAdmin(ctx, team.organizationId, userId);
}

/**
 * Assert user can manage team
 */
async function assertCanManageTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<void> {
  const canManage = await canManageTeam(ctx, teamId, userId);
  if (!canManage) {
    throw new Error("Only team leads or organization admins can perform this action");
  }
}

/**
 * Generate URL-friendly slug from team name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Mutations - Teams
// ============================================================================

/**
 * Create a new team
 * organization admin or member can create
 */
export const createTeam = mutation({
  args: {
    organizationId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(), // Default privacy for team projects
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Must be organization member to create team
    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId),
      )
      .first();

    if (!organizationMembership) {
      throw new Error("You must be an organization member to create a team");
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_organization_slug", (q) =>
          q.eq("organizationId", args.organizationId).eq("slug", slug),
        )
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    // Create team
    const teamId = await ctx.db.insert("teams", {
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      name: args.name,
      slug,
      description: args.description,
      isPrivate: args.isPrivate,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as team lead
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "lead",
      addedBy: userId,
      addedAt: now,
    });

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.create",
        actorId: userId,
        targetId: teamId,
        targetType: "team",
        metadata: { name: args.name, organizationId: args.organizationId },
      });
    }

    return { teamId, slug };
  },
});

/**
 * Update team details
 * Team lead or organization admin only
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const updates: {
      name?: string;
      slug?: string;
      description?: string;
      isPrivate?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      // Regenerate slug
      const baseSlug = generateSlug(args.name);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("teams")
          .withIndex("by_organization_slug", (q) =>
            q.eq("organizationId", team.organizationId).eq("slug", slug),
          )
          .first();

        if (!existing || existing._id === args.teamId) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;

    await ctx.db.patch(args.teamId, updates);

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.update",
        actorId: userId,
        targetId: args.teamId,
        targetType: "team",
        metadata: updates,
      });
    }

    return { success: true };
  },
});

/**
 * Delete team
 * Team lead or organization admin only
 * Will also delete all team members
 */
export const softDeleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, userId);

    // Soft delete team and cascade to members
    const deletedAt = Date.now();
    await ctx.db.patch(args.teamId, softDeleteFields(userId));
    await cascadeSoftDelete(ctx, "teams", args.teamId, userId, deletedAt);

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.softDelete",
        actorId: userId,
        targetId: args.teamId,
        targetType: "team",
        metadata: { deletedAt },
      });
    }

    return { success: true };
  },
});

/**
 * Restore a soft-deleted team
 * Team lead or organization admin only
 */
export const restoreTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (!team.isDeleted) {
      throw new Error("Team is not deleted");
    }

    // Must be organization admin or the deletedBy user
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);
    if (!isAdmin && team.deletedBy !== userId) {
      throw new Error("Only organization admins or the user who deleted the team can restore it");
    }

    // Restore with automatic cascading
    await ctx.db.patch(args.teamId, {
      isDeleted: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
    });

    // Import cascadeRestore dynamically
    const { cascadeRestore } = await import("./lib/relationships");
    await cascadeRestore(ctx, "teams", args.teamId);

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.restore",
        actorId: userId,
        targetId: args.teamId,
        targetType: "team",
      });
    }

    return { success: true };
  },
});

// ============================================================================
// Mutations - Team Members
// ============================================================================

/**
 * Add member to team
 * Team lead or organization admin only
 */
export const addTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    // Check if user is already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("User is already a member of this team");
    }

    // Verify user is organization member
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!organizationMembership) {
      throw new Error("User must be an organization member to join this team");
    }

    const now = Date.now();

    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: args.userId,
      role: args.role,
      addedBy: currentUserId,
      addedAt: now,
    });

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.member.add",
        actorId: currentUserId,
        targetId: args.userId,
        targetType: "user",
        metadata: { teamId: args.teamId, role: args.role },
      });
    }

    return { success: true };
  },
});

/**
 * Update team member role
 * Team lead or organization admin only
 */
export const updateTeamMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.member.updateRole",
        actorId: currentUserId,
        targetId: args.userId,
        targetType: "user",
        metadata: { teamId: args.teamId, role: args.role },
      });
    }

    return { success: true };
  },
});

/**
 * Remove member from team
 * Team lead or organization admin only
 */
export const removeTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.delete(membership._id);

    // Audit Log
    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "team.member.remove",
        actorId: currentUserId,
        targetId: args.userId,
        targetType: "user",
        metadata: { teamId: args.teamId },
      });
    }

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get team by ID
 */
export const getTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team || team.isDeleted) return null;

    // Check if user has access (team member or organization admin)
    const role = await getTeamRole(ctx, args.teamId, userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(role || isAdmin)) return null;

    return {
      ...team,
      userRole: role,
      isAdmin,
    };
  },
});

/**
 * Get team by slug
 */
export const getBySlug = query({
  args: {
    workspaceId: v.id("workspaces"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("slug", args.slug),
      )
      .first();

    if (!team) return null;

    // Check if user has access (team member or organization admin)
    const role = await getTeamRole(ctx, team._id, userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(role || isAdmin)) return null;

    return {
      ...team,
      userRole: role,
      isAdmin,
    };
  },
});

/**
 * List teams (paginated)
 */
export const getTeams = query({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Check if user is organization admin
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, userId);

    let results: PaginationResult<Doc<"teams">> | PaginationResult<Doc<"teamMembers">>;
    if (isAdmin) {
      // Admins see all teams in the organization
      results = await fetchPaginatedQuery<Doc<"teams">>(ctx, {
        paginationOpts: args.paginationOpts,
        query: (db) =>
          db
            .query("teams")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)),
      });
    } else {
      // Non-admins see only teams they are a member of
      const membershipResults = await fetchPaginatedQuery<Doc<"teamMembers">>(ctx, {
        paginationOpts: args.paginationOpts,
        query: (db) => db.query("teamMembers").withIndex("by_user", (q) => q.eq("userId", userId)),
      });

      // Map memberships to teams
      const teamIds = membershipResults.page.map((m) => m.teamId);
      const teams = await batchFetchTeams(ctx, teamIds);

      // Filter out teams from other companies
      const filteredPage = membershipResults.page.filter((m) => {
        const t = teams.get(m.teamId);
        return t && t.organizationId === args.organizationId;
      });

      results = {
        ...membershipResults,
        page: filteredPage,
      };
    }

    // Now enrich the page results

    // If admin, it's Doc<"teams">[], if member, it's Doc<"teamMembers">[]

    // We need unified handling.

    // Let's standardize on: We have a list of teamIds.
    let teamIds: Id<"teams">[];
    if (isAdmin) {
      teamIds = (results.page as Doc<"teams">[]).map((t) => t._id);
    } else {
      teamIds = (results.page as Doc<"teamMembers">[]).map((m) => m.teamId);
    }

    const teamMap = await batchFetchTeams(ctx, teamIds);

    // Fetch counts
    const memberCountsPromises = teamIds.map(async (teamId) => {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect()
        .then((m) => m.length);
    });

    const memberCounts = await Promise.all(memberCountsPromises);

    const projectCountsPromises = teamIds.map(async (teamId) => {
      return await ctx.db
        .query("projects")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .filter(notDeleted)
        .collect()
        .then((p) => p.length);
    });
    const projectCounts = await Promise.all(projectCountsPromises);

    // Fetch user role for each team
    const pageWithMetadata = await Promise.all(
      teamIds.map(async (teamId, index) => {
        const team = teamMap.get(teamId);
        if (!team) return null;
        if (team.organizationId !== args.organizationId) return null;

        const memberCount = memberCounts[index];
        const projectCount = projectCounts[index];

        const role = await getTeamRole(ctx, teamId, userId);

        return {
          ...team,
          userRole: role,
          isAdmin,
          memberCount,
          projectCount,
        };
      }),
    );

    return {
      ...results,
      page: pageWithMetadata.filter((t): t is NonNullable<typeof t> => t !== null),
    };
  },
});

/**
 * Get all teams in an organization
 */
export const getOrganizationTeams = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Must be organization member
    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId),
      )
      .filter(notDeleted)
      .first();

    if (!organizationMembership) return [];

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter(notDeleted)
      .collect();

    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, userId);

    // Fetch team members and projects per team using indexes (NOT loading all!)
    const teamIds = teams.map((t) => t._id);

    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .filter(notDeleted)
            .collect(),
        ),
      ),
    ]);

    // Build count maps
    const memberCountByTeam = new Map<string, number>();
    const userRoleByTeam = new Map<string, "lead" | "member">();

    teamIds.forEach((teamId, index) => {
      const members = teamMembersArrays[index];
      const teamIdStr = teamId.toString();
      memberCountByTeam.set(teamIdStr, members.length);

      // Track current user's role
      const userMembership = members.find((m) => m.userId === userId);
      if (userMembership) {
        userRoleByTeam.set(teamIdStr, userMembership.role);
      }
    });

    const projectCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      const projects = workspacesArrays[index];
      projectCountByTeam.set(teamId.toString(), projects.length);
    });

    // Enrich teams with pre-computed data (no N+1)
    const teamsWithInfo = teams.map((team) => {
      const teamIdStr = team._id.toString();
      return {
        ...team,
        userRole: userRoleByTeam.get(teamIdStr) ?? null,
        isAdmin,
        memberCount: memberCountByTeam.get(teamIdStr) ?? 0,
        projectCount: projectCountByTeam.get(teamIdStr) ?? 0,
      };
    });

    return teamsWithInfo;
  },
});

/**
 * Get all teams user is a member of
 */
export const getUserTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted)
      .collect();

    if (memberships.length === 0) return [];

    // Batch fetch all teams (avoid N+1!)
    const teamIds = memberships.map((m) => m.teamId);
    const teamMap = await batchFetchTeams(ctx, teamIds);

    // Fetch team members and projects per team using indexes (NOT loading all!)
    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .filter(notDeleted)
            .collect(),
        ),
      ),
    ]);

    // Build count maps
    const memberCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      memberCountByTeam.set(teamId.toString(), teamMembersArrays[index].length);
    });

    const projectCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      projectCountByTeam.set(teamId.toString(), workspacesArrays[index].length);
    });

    // Enrich with pre-fetched data (no N+1)
    const teams = memberships
      .map((membership) => {
        const team = teamMap.get(membership.teamId);
        if (!team) return null;

        const teamIdStr = membership.teamId.toString();
        return {
          ...team,
          userRole: membership.role,
          memberCount: memberCountByTeam.get(teamIdStr) ?? 0,
          projectCount: projectCountByTeam.get(teamIdStr) ?? 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return teams;
  },
});

/**
 * Get all members of a team
 * Team member or organization admin only
 */
export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check access
    const role = await getTeamRole(ctx, args.teamId, userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, userId);

    if (!(role || isAdmin)) {
      throw new Error("Only team members or organization admins can view team members");
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter(notDeleted)
      .collect();

    // Batch fetch all users (both members and addedBy) (avoid N+1!)
    // Deduplicate to avoid redundant fetches
    const allUserIds = [
      ...new Set([...memberships.map((m) => m.userId), ...memberships.map((m) => m.addedBy)]),
    ];
    const userMap = await batchFetchUsers(ctx, allUserIds);

    // Enrich with pre-fetched data (no N+1)
    const members = memberships.map((membership) => {
      const user = userMap.get(membership.userId);
      const addedBy = userMap.get(membership.addedBy);

      return {
        ...membership,
        user,
        addedByName: getUserName(addedBy),
      };
    });

    return members;
  },
});

/**
 * Get user's role in a team
 */
export const getTeamUserRole = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getTeamRole(ctx, args.teamId, userId);
  },
});
