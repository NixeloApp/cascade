import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { authenticatedQuery, projectAdminMutation } from "./customFunctions";
import { logAudit } from "./lib/audit";
import { batchFetchUsers } from "./lib/batchHelpers";
import { conflict, forbidden, notFound } from "./lib/errors";
import { isOrganizationMember } from "./lib/organizationAccess";
import { MAX_TEAM_MEMBERS } from "./lib/queryLimits";
import { assertCanAccessProject, getProjectRole } from "./projectAccess";
import { projectRoles } from "./validators";

// List all members of a project with user details
export const list = authenticatedQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Check if user has access to project
    await assertCanAccessProject(ctx, args.projectId, ctx.userId);

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId).lt("isDeleted", true))
      .take(MAX_TEAM_MEMBERS);

    // Batch fetch all users (avoid N+1)
    const userIds = members.map((m) => m.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched user data, filter out deleted users
    return pruneNull(
      members.map((member) => {
        const user = userMap.get(member.userId);
        if (!user) return null; // User was deleted

        return {
          ...member,
          userName: user.name ?? user.email ?? "Unknown User",
          userEmail: user.email,
          userImage: user.image,
        };
      }),
    );
  },
});

/**
 * Add a new member to the project.
 *
 * Finds the user by email and creates a membership record.
 * Requires project admin permissions.
 *
 * @param userEmail - Email address of the user to add.
 * @param role - Role to assign (e.g., "member", "admin").
 *
 * @throws {ConvexError} "NotFound" if user doesn't exist.
 * @throws {ConvexError} "Conflict" if user is already a member.
 */
export const add = projectAdminMutation({
  args: {
    userEmail: v.string(),
    role: projectRoles,
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    // Security: User must be an organization member to be added to a project.
    // We check both existence and membership, and throw the SAME error if either fails.
    // This prevents attackers from enumerating valid emails in the system (global user enumeration).
    const isMember = user
      ? await isOrganizationMember(ctx, ctx.project.organizationId, user._id)
      : false;

    if (!user || !isMember) {
      throw notFound("user");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", ctx.projectId).eq("userId", user._id))
      .first();

    if (existingMembership) throw conflict("User is already a member");

    // Add to projectMembers table
    await ctx.db.insert("projectMembers", {
      projectId: ctx.projectId,
      userId: user._id,
      role: args.role,
      addedBy: ctx.userId,
    });

    await logAudit(ctx, {
      action: "member_added",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: {
        memberId: user._id,
        role: args.role,
      },
    });

    return { success: true };
  },
});

/**
 * Update a project member's role.
 *
 * Cannot change the role of the project owner.
 * Requires project admin permissions.
 *
 * @param memberId - User ID of the member.
 * @param newRole - New role to assign.
 *
 * @throws {ConvexError} "Forbidden" if trying to change the project owner's role.
 * @throws {ConvexError} "NotFound" if membership doesn't exist.
 */
export const updateRole = projectAdminMutation({
  args: {
    memberId: v.id("users"),
    newRole: projectRoles,
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId, ctx.project

    // Can't change project owner's role
    if (ctx.project.ownerId === args.memberId || ctx.project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot change project owner's role");
    }

    // Find membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", ctx.projectId).eq("userId", args.memberId),
      )
      .first();

    if (!membership) throw notFound("membership");

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });

    await logAudit(ctx, {
      action: "member_role_updated",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: {
        memberId: args.memberId,
        newRole: args.newRole,
      },
    });

    return { success: true };
  },
});

/**
 * Remove a member from the project.
 *
 * Cannot remove the project owner.
 * Requires project admin permissions.
 *
 * @param memberId - User ID of the member to remove.
 *
 * @throws {ConvexError} "Forbidden" if trying to remove the project owner.
 */
export const remove = projectAdminMutation({
  args: {
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId, ctx.project

    // Can't remove the project owner
    if (ctx.project.ownerId === args.memberId || ctx.project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot remove project owner");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", ctx.projectId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);

      await logAudit(ctx, {
        action: "member_removed",
        actorId: ctx.userId,
        targetId: ctx.projectId,
        targetType: "projects",
        metadata: {
          memberId: args.memberId,
        },
      });
    }

    return { success: true };
  },
});

/**
 * Get the current user's role in a project.
 *
 * @param projectId - The project ID.
 *
 * @returns The role string ("admin", "member", etc.) or null if not a member.
 */
export const getRole = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await getProjectRole(ctx, args.projectId, ctx.userId);
  },
});
