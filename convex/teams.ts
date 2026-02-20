import { type PaginationResult, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  authenticatedMutation,
  authenticatedQuery,
  organizationMemberMutation,
  organizationQuery,
  teamLeadMutation,
  teamQuery,
} from "./customFunctions";
import { batchFetchTeams, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { isOrganizationAdmin } from "./lib/organizationAccess";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { MAX_PROJECTS_PER_TEAM, MAX_TEAM_MEMBERS, MAX_TEAMS_PER_ORG } from "./lib/queryLimits";
import { cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { getTeamRole } from "./lib/teamAccess";
import { logAudit } from "./lib/audit";
import { teamRoles } from "./validators";

// ============================================================================
// Helper Functions
// ============================================================================

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
export const createTeam = organizationMemberMutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(), // Default privacy for team projects
  },

  handler: async (ctx, args) => {
    // organizationMemberMutation handles auth + org membership check

    // Generate unique slug
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_organization_slug", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("slug", slug),
        )
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    // Create team
    const teamId = await ctx.db.insert("teams", {
      organizationId: ctx.organizationId,
      workspaceId: args.workspaceId,
      name: args.name,
      slug,
      description: args.description,
      isPrivate: args.isPrivate,
      createdBy: ctx.userId,
      updatedAt: now,
    });

    // Add creator as team admin
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: ctx.userId,
      role: "admin",
      addedBy: ctx.userId,
    });

    // Audit Log
    await logAudit(ctx, {
      action: "team.create",
      actorId: ctx.userId,
      targetId: teamId,
      targetType: "team",
      metadata: { name: args.name, organizationId: ctx.organizationId },
    });

    return { teamId, slug };
  },
});

/**
 * Update team details
 * Team lead or organization admin only
 */
export const updateTeam = teamLeadMutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // teamLeadMutation handles auth + team admin/org admin check

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
            q.eq("organizationId", ctx.organizationId).eq("slug", slug),
          )
          .first();

        if (!existing || existing._id === ctx.teamId) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;

    await ctx.db.patch(ctx.teamId, updates);

    // Audit Log
    await logAudit(ctx, {
      action: "team.update",
      actorId: ctx.userId,
      targetId: ctx.teamId,
      targetType: "team",
      metadata: updates,
    });

    return { success: true };
  },
});

/**
 * Delete team
 * Team lead or organization admin only
 * Will also delete all team members
 */
export const softDeleteTeam = teamLeadMutation({
  args: {},
  handler: async (ctx) => {
    // teamLeadMutation handles auth + team admin/org admin check

    // Soft delete team and cascade to members
    const deletedAt = Date.now();
    await ctx.db.patch(ctx.teamId, softDeleteFields(ctx.userId));
    await cascadeSoftDelete(ctx, "teams", ctx.teamId, ctx.userId, deletedAt);

    // Audit Log
    await logAudit(ctx, {
      action: "team.softDelete",
      actorId: ctx.userId,
      targetId: ctx.teamId,
      targetType: "team",
      metadata: { deletedAt },
    });

    return { success: true };
  },
});

/**
 * Restore a soft-deleted team
 * Team lead or organization admin only
 */
export const restoreTeam = authenticatedMutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw notFound("team", args.teamId);

    if (!team.isDeleted) {
      throw validation("teamId", "Team is not deleted");
    }

    // Must be organization admin or the deletedBy user
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);
    if (!isAdmin && team.deletedBy !== ctx.userId) {
      throw forbidden(
        undefined,
        "Only organization admins or the user who deleted the team can restore it",
      );
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
    await logAudit(ctx, {
      action: "team.restore",
      actorId: ctx.userId,
      targetId: args.teamId,
      targetType: "team",
    });

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
export const addTeamMember = teamLeadMutation({
  args: {
    userId: v.id("users"),
    role: teamRoles,
  },
  handler: async (ctx, args) => {
    // teamLeadMutation handles auth + team admin/org admin check

    // Check if user is already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", ctx.teamId).eq("userId", args.userId))
      .first();

    if (existing) throw conflict("User is already a member of this team");

    // Verify user is organization member
    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!organizationMembership) {
      throw forbidden(undefined, "User must be an organization member to join this team");
    }

    const _now = Date.now();

    await ctx.db.insert("teamMembers", {
      teamId: ctx.teamId,
      userId: args.userId,
      role: args.role,
      addedBy: ctx.userId,
    });

    // Audit Log
    await logAudit(ctx, {
      action: "team.member.add",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: { teamId: ctx.teamId, role: args.role },
    });

    return { success: true };
  },
});

/**
 * Update team member role
 * Team lead or organization admin only
 */
export const updateTeamMemberRole = teamLeadMutation({
  args: {
    userId: v.id("users"),
    role: teamRoles,
  },
  handler: async (ctx, args) => {
    // teamLeadMutation handles auth + team admin/org admin check

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", ctx.teamId).eq("userId", args.userId))
      .first();

    if (!membership) throw notFound("membership");

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    // Audit Log
    await logAudit(ctx, {
      action: "team.member.updateRole",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: { teamId: ctx.teamId, role: args.role },
    });

    return { success: true };
  },
});

/**
 * Remove member from team
 * Team lead or organization admin only
 */
export const removeTeamMember = teamLeadMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // teamLeadMutation handles auth + team admin/org admin check

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", ctx.teamId).eq("userId", args.userId))
      .first();

    if (!membership) throw notFound("membership");

    await ctx.db.delete(membership._id);

    // Audit Log
    await logAudit(ctx, {
      action: "team.member.remove",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: { teamId: ctx.teamId },
    });

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get team by ID
 */
export const getTeam = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team || team.isDeleted) return null;

    // Check if user has access (team member or organization admin)
    const role = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

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
export const getBySlug = authenticatedQuery({
  args: {
    workspaceId: v.id("workspaces"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("slug", args.slug),
      )
      .first();

    if (!team) return null;

    // Check if user has access (team member or organization admin)
    const role = await getTeamRole(ctx, team._id, ctx.userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

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
export const getTeams = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Check if user is organization admin
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, ctx.userId);

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
        query: (db) =>
          db.query("teamMembers").withIndex("by_user", (q) => q.eq("userId", ctx.userId)),
      });

      // Map memberships to teams
      const teamIds = membershipResults.page.map((m) => m.teamId);
      const teams = await batchFetchTeams(ctx, teamIds);

      // Filter out teams from other organizations
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

    // Fetch counts with limits
    const memberCountsPromises = teamIds.map(async (teamId) => {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId).lt("isDeleted", true))
        .take(MAX_TEAM_MEMBERS)
        .then((m) => m.length);
    });

    const memberCounts = await Promise.all(memberCountsPromises);

    const projectCountsPromises = teamIds.map(async (teamId) => {
      return await ctx.db
        .query("projects")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .filter(notDeleted)
        .take(MAX_PROJECTS_PER_TEAM)
        .then((p) => p.length);
    });
    const projectCounts = await Promise.all(projectCountsPromises);

    // Batch fetch user's team memberships to avoid N+1 getTeamRole calls
    const userMemberships = await Promise.all(
      teamIds.map((teamId) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", ctx.userId))
          .first(),
      ),
    );
    const userRoleByTeam = new Map<string, "admin" | "member">();
    teamIds.forEach((teamId, index) => {
      const membership = userMemberships[index];
      if (membership) {
        userRoleByTeam.set(teamId.toString(), membership.role);
      }
    });

    // Build page with metadata (no N+1)
    const pageWithMetadata = teamIds.map((teamId, index) => {
      const team = teamMap.get(teamId);
      if (!team) return null;
      if (team.organizationId !== args.organizationId) return null;

      const memberCount = memberCounts[index];
      const projectCount = projectCounts[index];
      const role = userRoleByTeam.get(teamId.toString()) ?? null;

      return {
        ...team,
        userRole: role,
        isAdmin,
        memberCount,
        projectCount,
      };
    });

    return {
      ...results,
      page: pruneNull(pageWithMetadata),
    };
  },
});

/**
 * Get all teams in an organization
 */
export const getOrganizationTeams = organizationQuery({
  args: {},
  handler: async (ctx) => {
    // organizationQuery handles auth + org membership check

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
      .filter(notDeleted)
      .take(MAX_TEAMS_PER_ORG);

    const isAdmin = ctx.organizationRole === "admin" || ctx.organizationRole === "owner";

    // Fetch team members and projects per team using indexes with limits
    const teamIds = teams.map((t) => t._id);

    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId).lt("isDeleted", true))
            .take(MAX_TEAM_MEMBERS),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .filter(notDeleted)
            .take(MAX_PROJECTS_PER_TEAM),
        ),
      ),
    ]);

    // Build count maps
    const memberCountByTeam = new Map<string, number>();
    const userRoleByTeam = new Map<string, "admin" | "member">();

    teamIds.forEach((teamId, index) => {
      const members = teamMembersArrays[index];
      const teamIdStr = teamId.toString();
      memberCountByTeam.set(teamIdStr, members.length);

      // Track current user's role
      const userMembership = members.find((m) => m.userId === ctx.userId);
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
export const getUserTeams = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(MAX_TEAMS_PER_ORG);

    if (memberships.length === 0) return [];

    // Batch fetch all teams (avoid N+1!)
    const teamIds = memberships.map((m) => m.teamId);
    const teamMap = await batchFetchTeams(ctx, teamIds);

    // Fetch team members and projects per team using indexes with limits
    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId).lt("isDeleted", true))
            .take(MAX_TEAM_MEMBERS),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .filter(notDeleted)
            .take(MAX_PROJECTS_PER_TEAM),
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
    const teams = pruneNull(
      memberships.map((membership) => {
        const team = teamMap.get(membership.teamId);
        if (!team) return null;

        const teamIdStr = membership.teamId.toString();
        return {
          ...team,
          userRole: membership.role,
          memberCount: memberCountByTeam.get(teamIdStr) ?? 0,
          projectCount: projectCountByTeam.get(teamIdStr) ?? 0,
        };
      }),
    );

    return teams;
  },
});

/**
 * Get all members of a team
 * Team member or organization admin only
 */
export const getTeamMembers = teamQuery({
  args: {},
  handler: async (ctx) => {
    // teamQuery handles auth + team member/org admin check

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", ctx.teamId).lt("isDeleted", true))
      .take(MAX_TEAM_MEMBERS);

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
export const getTeamUserRole = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    return await getTeamRole(ctx, args.teamId, ctx.userId);
  },
});
