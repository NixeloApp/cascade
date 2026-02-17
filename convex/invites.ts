import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, type QueryCtx, query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { sendEmail } from "./email/index";
import { batchFetchProjects, batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { getSiteUrl } from "./lib/env";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { notDeleted } from "./lib/softDeleteHelpers";
import { inviteRoles, projectRoles } from "./validators";

// Helper: Check if user is a organization admin
async function isOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
) {
  // Primary: Check if user is admin or owner in the specified organization
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  return membership?.role === "owner" || membership?.role === "admin";
}

// Generate a cryptographically secure invite token
function generateInviteToken(): string {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomUUID() for secure random generation
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  return `invite_${timestamp}_${randomPart}`;
}

// Helper: Check if user is a project admin
async function isProjectAdmin(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // Creator is always admin
  if (project.createdBy === userId) return true;

  // Check project membership
  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .filter(notDeleted)
    .first();

  return membership?.role === "admin";
}

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Add existing user to project directly
async function addExistingUserToProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  existingUserId: Id<"users">,
  role: "admin" | "editor" | "viewer",
  addedBy: Id<"users">,
): Promise<{ success: boolean; addedDirectly: true; userId: Id<"users"> }> {
  // Note: Existence check should be done by caller or here if standalone.
  // We assume caller handles higher-level logic.

  // Add them directly to the project
  await ctx.db.insert("projectMembers", {
    projectId,
    userId: existingUserId,
    role,
    addedBy,
  });

  return { success: true, addedDirectly: true, userId: existingUserId };
}

// Helper: Try to add existing user to project if they are in the org
async function tryAddExistingUserToProject(
  ctx: MutationCtx,
  existingUserId: Id<"users">,
  organizationId: Id<"organizations">,
  projectId: Id<"projects">,
  role: "admin" | "editor" | "viewer",
  addedBy: Id<"users">,
): Promise<{ success: boolean; addedDirectly: true; userId: Id<"users"> } | null> {
  // Check project membership (prevent duplicates)
  const existingMember = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", existingUserId))
    .filter(notDeleted)
    .first();

  if (existingMember) {
    throw conflict("User is already a member of this project");
  }

  // Check org membership (security check)
  const orgMember = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", existingUserId),
    )
    .first();

  if (orgMember) {
    return addExistingUserToProject(ctx, projectId, existingUserId, role, addedBy);
  }

  return null;
}

// Helper: Check for duplicate pending invites
async function checkDuplicatePendingInvite(
  ctx: MutationCtx,
  email: string,
  projectId: Id<"projects"> | undefined,
): Promise<void> {
  const existingInvite = await ctx.db
    .query("invites")
    .withIndex("by_email_status", (q) => q.eq("email", email).eq("status", "pending"))
    .first();

  if (!existingInvite) return;

  const sameProject = projectId && existingInvite.projectId?.toString() === projectId.toString();
  const bothPlatform = !(projectId || existingInvite.projectId);

  if (sameProject) {
    throw conflict("An invitation has already been sent to this email for this project");
  }
  if (bothPlatform) {
    throw conflict("An invitation has already been sent to this email");
  }
}

// Helper: Build invite email content
function buildInviteEmail(
  inviteLink: string,
  isProjectInvite: boolean,
  projectName: string | undefined,
  projectRole: string | undefined,
  platformRole: string,
): { subject: string; html: string; text: string } {
  if (isProjectInvite && projectName) {
    return {
      subject: `You've been invited to join ${projectName} on Nixelo`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited to join ${projectName}</h2>
          <p>You have been invited to collaborate on the project <strong>${projectName}</strong> as a <strong>${projectRole}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
      text: `You have been invited to collaborate on ${projectName} as a ${projectRole}. Accept your invitation here: ${inviteLink}`,
    };
  }

  return {
    subject: "You've been invited to Nixelo",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Nixelo</h2>
        <p>You have been invited to join Nixelo as a <strong>${platformRole}</strong>.</p>
        <p>Click the button below to accept your invitation:</p>
        <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
      </div>
    `,
    text: `You have been invited to join Nixelo as a ${platformRole}. Accept your invitation here: ${inviteLink}`,
  };
}

/**
 * Send an invitation to a user
 * Only admins can send invites
 * Supports both platform-level and project-level invites
 */
export const sendInvite = authenticatedMutation({
  args: {
    email: v.string(),
    role: inviteRoles,
    organizationId: v.id("organizations"),
    // Optional project-level invite fields
    projectId: v.optional(v.id("projects")),
    projectRole: v.optional(projectRoles),
  },
  returns: v.union(
    v.object({
      inviteId: v.id("invites"),
      token: v.string(),
    }),
    v.object({
      success: v.boolean(),
      addedDirectly: v.boolean(), // or v.literal(true)
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx, args) => {
    // Validate email format early
    if (!isValidEmail(args.email)) {
      throw validation("email", "Invalid email address");
    }

    // Check permissions and get project info
    const isPlatAdmin = await isOrganizationAdmin(ctx, args.organizationId, ctx.userId);
    let projectName: string | undefined;
    const effectiveProjectRole = args.projectRole || "editor";

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) throw notFound("project", args.projectId);
      projectName = project.name;

      // Allow if platform admin OR project admin
      const hasProjectAdmin = await isProjectAdmin(ctx, args.projectId, ctx.userId);
      if (!(isPlatAdmin || hasProjectAdmin)) {
        throw forbidden("admin", "Only project admins can invite to projects");
      }
    } else if (!isPlatAdmin) {
      throw forbidden("admin", "Only admins can send platform invites");
    }

    // Check if user already exists with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    // For project invites, add existing users directly ONLY if they are already in the organization
    if (existingUser && args.projectId) {
      const result = await tryAddExistingUserToProject(
        ctx,
        existingUser._id,
        args.organizationId,
        args.projectId,
        effectiveProjectRole,
        ctx.userId,
      );
      if (result) return result;
    }

    if (existingUser && !args.projectId) {
      throw conflict("A user with this email already exists");
    }

    // Check for duplicate pending invites
    await checkDuplicatePendingInvite(ctx, args.email, args.projectId);

    // Create the invite
    const now = Date.now();
    const token = generateInviteToken();

    const inviteId = await ctx.db.insert("invites", {
      email: args.email,
      role: args.role,
      organizationId: args.organizationId,
      projectId: args.projectId,
      projectRole: args.projectId ? effectiveProjectRole : undefined,
      invitedBy: ctx.userId,
      token,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      status: "pending",
      updatedAt: now,
    });

    // Send email
    const inviteLink = `${getSiteUrl()}/invite/${token}`;
    const emailContent = buildInviteEmail(
      inviteLink,
      !!args.projectId,
      projectName,
      effectiveProjectRole,
      args.role,
    );

    await sendEmail(ctx, {
      to: args.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return { inviteId, token };
  },
});

/**
 * Revoke an invitation
 * Only admins can revoke invites
 */
export const revokeInvite = authenticatedMutation({
  args: {
    inviteId: v.id("invites"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw notFound("invite", args.inviteId);
    }

    // Check if user is admin of the organization the invite belongs to
    const isAdmin = await isOrganizationAdmin(ctx, invite.organizationId, ctx.userId);
    if (!isAdmin) {
      throw forbidden("admin", "Only admins can revoke invites");
    }

    if (invite.status !== "pending") {
      throw conflict("Can only revoke pending invites");
    }

    await ctx.db.patch(args.inviteId, {
      status: "revoked",
      revokedBy: ctx.userId,
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Resend an invitation
 * Only admins can resend invites
 */
export const resendInvite = authenticatedMutation({
  args: {
    inviteId: v.id("invites"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw notFound("invite", args.inviteId);
    }

    // Check if user is admin of the organization the invite belongs to
    const isAdmin = await isOrganizationAdmin(ctx, invite.organizationId, ctx.userId);
    if (!isAdmin) {
      throw forbidden("admin", "Only admins can resend invites");
    }

    if (invite.status !== "pending") {
      throw conflict("Can only resend pending invites");
    }

    // Extend expiration by another 7 days
    const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.inviteId, {
      expiresAt: newExpiresAt,
      updatedAt: Date.now(),
    });

    // Get project name if project invite
    let projectName: string | undefined;
    if (invite.projectId) {
      const project = await ctx.db.get(invite.projectId);
      projectName = project?.name;
    }

    // Send email with invite link again using the shared helper
    const inviteLink = `${getSiteUrl()}/invite/${invite.token}`;
    const emailContent = buildInviteEmail(
      inviteLink,
      !!invite.projectId,
      projectName,
      invite.projectRole,
      invite.role,
    );

    await sendEmail(ctx, {
      to: invite.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return { success: true };
  },
});

/**
 * Get an invitation by token (for accepting invites)
 */
export const getInviteByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("invites"),
      _creationTime: v.number(),
      email: v.string(),
      role: inviteRoles,
      organizationId: v.id("organizations"),
      projectId: v.optional(v.id("projects")),
      projectRole: v.optional(projectRoles),
      invitedBy: v.id("users"),
      token: v.string(),
      expiresAt: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("revoked"),
        v.literal("expired"),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
      acceptedBy: v.optional(v.id("users")),
      acceptedAt: v.optional(v.number()),
      revokedBy: v.optional(v.id("users")),
      revokedAt: v.optional(v.number()),
      isExpired: v.boolean(),
      inviterName: v.string(),
      projectName: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return null;
    }

    // Check if expired (just for display, actual expiration check happens in acceptInvite)
    const isExpired = invite.status === "pending" && invite.expiresAt < Date.now();

    // Get inviter name
    const inviter = await ctx.db.get(invite.invitedBy);

    // Get project name if project invite
    let projectName: string | undefined;
    if (invite.projectId) {
      const project = await ctx.db.get(invite.projectId);
      projectName = project?.name;
    }

    return {
      ...invite,
      createdAt: invite._creationTime,
      isExpired,
      inviterName: inviter?.name || inviter?.email || "Unknown",
      projectName,
    };
  },
});

/**
 * Accept an invitation (called during signup)
 * This should be called after a user creates their account with the email from the invite
 */
export const acceptInvite = authenticatedMutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    role: inviteRoles,
    projectId: v.optional(v.id("projects")),
    projectRole: v.optional(projectRoles),
  }),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw notFound("invite");
    }

    if (invite.status !== "pending") {
      throw conflict(`This invitation is ${invite.status}`);
    }

    if (invite.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invite._id, {
        status: "expired",
        updatedAt: Date.now(),
      });
      throw validation("token", "This invitation has expired");
    }

    // Verify the user's email matches the invite
    const user = await ctx.db.get(ctx.userId);
    if (user?.email !== invite.email) {
      throw forbidden(undefined, "This invitation was sent to a different email address");
    }

    // Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedBy: ctx.userId,
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Link the invite to the user (for tracking "was invited" vs "self-signup")
    await ctx.db.patch(ctx.userId, {
      inviteId: invite._id,
    });

    // If this is a project invite, add user to the project
    let projectId: Id<"projects"> | undefined;
    if (invite.projectId) {
      const inviteProjectId = invite.projectId; // Store in local for type narrowing
      // Check if user is not already a member (edge case: manually added after invite sent)
      const existingMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", inviteProjectId).eq("userId", ctx.userId),
        )
        .filter(notDeleted)
        .first();

      if (!existingMember) {
        await ctx.db.insert("projectMembers", {
          projectId: inviteProjectId,
          userId: ctx.userId,
          role: invite.projectRole || "editor",
          addedBy: invite.invitedBy,
        });
      }
      projectId = inviteProjectId;
    }

    return { success: true, role: invite.role, projectId, projectRole: invite.projectRole };
  },
});

/**
 * List all invitations (admin only)
 */
export const listInvites = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("revoked"),
        v.literal("expired"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("invites"),
      _creationTime: v.number(),
      email: v.string(),
      role: inviteRoles,
      organizationId: v.id("organizations"),
      projectId: v.optional(v.id("projects")),
      projectRole: v.optional(projectRoles),
      invitedBy: v.id("users"),
      token: v.string(),
      expiresAt: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("revoked"),
        v.literal("expired"),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
      acceptedBy: v.optional(v.id("users")),
      acceptedAt: v.optional(v.number()),
      revokedBy: v.optional(v.id("users")),
      revokedAt: v.optional(v.number()),
      inviterName: v.string(),
      acceptedByName: v.optional(v.string()),
      projectName: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Check if user is admin - return empty array for non-admins (UI-driven visibility)
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, ctx.userId);
    if (!isAdmin) {
      return [];
    }

    // Query invites for the specific organization
    const MAX_INVITES = 500;
    let invites: Doc<"invites">[];
    if (args.status !== undefined) {
      const status = args.status;
      invites = await ctx.db
        .query("invites")
        .withIndex("by_organization_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", status),
        )
        .order("desc")
        .take(MAX_INVITES);
    } else {
      invites = await ctx.db
        .query("invites")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .take(MAX_INVITES);
    }

    // Batch fetch all related data to avoid N+1
    const inviterIds = invites.map((i) => i.invitedBy);
    const acceptedByIds = invites.map((i) => i.acceptedBy).filter(Boolean) as Id<"users">[];
    const projectIds = invites.map((i) => i.projectId).filter(Boolean) as Id<"projects">[];

    const [inviterMap, acceptedByMap, projectMap] = await Promise.all([
      batchFetchUsers(ctx, inviterIds),
      batchFetchUsers(ctx, acceptedByIds),
      batchFetchProjects(ctx, projectIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    const invitesWithNames = invites.map((invite) => {
      const inviter = inviterMap.get(invite.invitedBy);
      const acceptedUser = invite.acceptedBy ? acceptedByMap.get(invite.acceptedBy) : null;
      const project = invite.projectId ? projectMap.get(invite.projectId) : null;

      return {
        ...invite,
        createdAt: invite._creationTime,
        inviterName: inviter?.name || inviter?.email || "Unknown",
        acceptedByName: acceptedUser
          ? acceptedUser.name || acceptedUser.email || "Unknown"
          : undefined,
        projectName: project?.name,
      };
    });

    // Already ordered by desc, just return
    return invitesWithNames;
  },
});

/**
 * List all users (admin only)
 */
export const listUsers = authenticatedQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      projectsCreated: v.number(),
      projectMemberships: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Check if user is admin - return empty array for non-admins (UI-driven visibility)
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, ctx.userId);
    if (!isAdmin) {
      return [];
    }

    // Bounded query - scope by organization
    const MAX_USERS = 500;
    const organizationMembers = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(MAX_USERS);

    const userIds = organizationMembers.map((m) => m.userId);

    // Fetch users in batch
    const users = (await asyncMap(userIds, (uid) => ctx.db.get(uid))).filter(
      (u): u is Doc<"users"> => u !== null,
    );

    // Parallel queries for all users at once
    const [allProjectCreations, allMemberships] = await Promise.all([
      asyncMap(userIds, (uid) =>
        ctx.db
          .query("projects")
          .withIndex("by_creator", (q) => q.eq("createdBy", uid))
          .filter(notDeleted)
          .take(BOUNDED_LIST_LIMIT),
      ),
      asyncMap(userIds, (uid) =>
        ctx.db
          .query("projectMembers")
          .withIndex("by_user", (q) => q.eq("userId", uid))
          .filter(notDeleted)
          .take(BOUNDED_LIST_LIMIT),
      ),
    ]);

    // Build count maps
    const createdCountMap = new Map(
      userIds.map((id, i) => [id.toString(), allProjectCreations[i].length]),
    );
    const membershipCountMap = new Map(
      userIds.map((id, i) => [id.toString(), allMemberships[i].length]),
    );

    // Enrich with pre-fetched data (no N+1 - all fetches are parallel)
    const usersWithInfo = users.map((user) => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name ?? user.email ?? "Unknown User",
      email: user.email,
      image: user.image,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
      projectsCreated: createdCountMap.get(user._id.toString()) ?? 0,
      projectMemberships: membershipCountMap.get(user._id.toString()) ?? 0,
    }));

    return usersWithInfo;
  },
});
