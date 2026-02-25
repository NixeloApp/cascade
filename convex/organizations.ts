import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { logAudit } from "./lib/audit";
import { batchFetchOrganizations, batchFetchUsers } from "./lib/batchHelpers";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { getOrganizationRole, isOrganizationAdmin } from "./lib/organizationAccess";
import { MAX_ORG_MEMBERS } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { isReservedSlug } from "./shared/constants";
import {
  nullableOrganizationRoles,
  organizationMemberRoles,
  organizationRoles,
} from "./validators";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Assert user is organization admin - throws if not
 */
async function assertOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isOrganizationAdmin(ctx, organizationId, userId);
  if (!isAdmin) {
    throw forbidden("admin", "Only organization admins can perform this action");
  }
}

/**
 * Assert user is organization owner - throws if not
 */
async function assertOrganizationOwner(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<void> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  if (role !== "owner") {
    throw forbidden("owner", "Only organization owner can perform this action");
  }
}

/**
 * Generate URL-friendly slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Mutations
// ============================================================================

const DEFAULT_ORGANIZATION_SETTINGS = {
  defaultMaxHoursPerWeek: 40,
  defaultMaxHoursPerDay: 8,
  requiresTimeApproval: false,
  billingEnabled: true,
};

/**
 * Create a new organization
 * Creator automatically becomes owner
 */
export const createOrganization = authenticatedMutation({
  args: {
    name: v.string(),
    timezone: v.string(), // IANA timezone
    settings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  },
  returns: v.object({
    organizationId: v.id("organizations"),
    slug: v.string(),
  }),
  handler: async (ctx, args) => {
    // Generate slug from name
    const baseSlug = generateSlug(args.name);

    // Validate slug is not reserved (GitHub-style validation)
    if (isReservedSlug(baseSlug)) {
      throw validation(
        "name",
        `The name "${args.name}" cannot be used because "${baseSlug}" is a reserved URL path. Please choose a different name.`,
      );
    }

    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    // Create organization with default settings if not provided
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      timezone: args.timezone,
      settings: args.settings ?? DEFAULT_ORGANIZATION_SETTINGS,
      createdBy: ctx.userId,
      updatedAt: now,
    });

    // Add creator as owner
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: ctx.userId,
      role: "owner",
      addedBy: ctx.userId,
    });

    // Set as user's default organization if they don't have one
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) {
      await ctx.db.patch(ctx.userId, { defaultOrganizationId: organizationId });
    }

    return { organizationId, slug };
  },
});

/**
 * Update organization details
 * Admin only
 */
export const updateOrganization = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    const updates: Partial<Doc<"organizations">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      // NOTE: We do NOT regenerate slug when name changes to preserve URL stability.
      // Slugs should only be updated via a dedicated mutation if needed.
    }

    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.organizationId, updates);

    return { success: true };
  },
});

/**
 * Delete organization
 * Owner only - will also delete all organization members
 */
export const deleteOrganization = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({ success: v.boolean(), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    await assertOrganizationOwner(ctx, args.organizationId, ctx.userId);

    // Delete all organization members
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(MAX_ORG_MEMBERS);

    // Batch fetch all users to avoid N+1
    const userIds = members.map((m) => m.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    for (const member of members) {
      await ctx.db.delete(member._id);

      // Clear defaultOrganizationId if this was the user's default
      const user = userMap.get(member.userId);
      if (user?.defaultOrganizationId === args.organizationId) {
        await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
      }
    }

    // Delete organization
    await ctx.db.delete(args.organizationId);

    return { success: true, deleted: true } as const;
  },
});

/**
 * Add member to organization
 * Admin only
 */
export const addMember = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: organizationMemberRoles, // Can't directly add as owner
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    // Check if user is already a member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw conflict("User is already a member of this organization");
    }

    const _now = Date.now();

    await ctx.db.insert("organizationMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      addedBy: ctx.userId,
    });

    // Set as user's default organization if they don't have one
    const user = await ctx.db.get(args.userId);
    if (!user?.defaultOrganizationId) {
      await ctx.db.patch(args.userId, { defaultOrganizationId: args.organizationId });
    }

    // Audit log: membership changes are sensitive operations
    await logAudit(ctx, {
      action: "organization.member_added",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: {
        organizationId: args.organizationId,
        role: args.role,
      },
    });

    return { success: true };
  },
});

/**
 * Update member role
 * Owner only - owner role can't be changed
 */
export const updateMemberRole = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: organizationRoles,
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await assertOrganizationOwner(ctx, args.organizationId, ctx.userId);

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw notFound("membership", args.userId);
    }

    if (membership.role === "owner") {
      throw forbidden("owner", "Cannot change owner role");
    }

    const oldRole = membership.role;
    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    // Audit log: role changes are sensitive operations
    await logAudit(ctx, {
      action: "organization.member_role_changed",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: {
        organizationId: args.organizationId,
        oldRole,
        newRole: args.role,
      },
    });

    return { success: true };
  },
});

/**
 * Remove member from organization
 * Admin only - owner can't be removed
 */
export const removeMember = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw notFound("membership", args.userId);
    }

    if (membership.role === "owner") {
      throw forbidden("owner", "Cannot remove organization owner");
    }

    const removedRole = membership.role;
    await ctx.db.delete(membership._id);

    // Clear defaultOrganizationId if this was the user's default
    const user = await ctx.db.get(args.userId);
    if (user?.defaultOrganizationId === args.organizationId) {
      await ctx.db.patch(args.userId, { defaultOrganizationId: undefined });
    }

    // Audit log: member removal is a sensitive operation
    await logAudit(ctx, {
      action: "organization.member_removed",
      actorId: ctx.userId,
      targetId: args.userId,
      targetType: "user",
      metadata: {
        organizationId: args.organizationId,
        role: removedRole,
      },
    });

    return { success: true, deleted: true } as const;
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get organization by ID
 */
export const getOrganization = authenticatedQuery({
  args: {
    id: v.optional(v.id("organizations")),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      timezone: v.string(),
      settings: v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      userRole: nullableOrganizationRoles,
    }),
  ),
  handler: async (ctx, args) => {
    const id = args.id ?? args.organizationId;
    if (!id) {
      throw validation("id", "Either id or organizationId must be provided");
    }

    const organization = await ctx.db.get(id);
    if (!organization) return null;

    // Check if user is a member
    const role = await getOrganizationRole(ctx, id, ctx.userId);
    if (!role) return null;

    return {
      ...organization,
      createdAt: organization._creationTime,
      userRole: role,
    };
  },
});

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = authenticatedQuery({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      timezone: v.string(),
      settings: v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      userRole: nullableOrganizationRoles,
    }),
  ),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!organization) return null;

    // Check if user is a member
    const role = await getOrganizationRole(ctx, organization._id, ctx.userId);
    if (!role) return null;

    return {
      ...organization,
      createdAt: organization._creationTime,
      userRole: role,
    };
  },
});

/**
 * Get all organizations user is a member of
 */
export const getUserOrganizations = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      timezone: v.string(),
      settings: v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      userRole: nullableOrganizationRoles,
      memberCount: v.number(),
      projectCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(MAX_ORG_MEMBERS);

    // Batch fetch all organizations
    const organizationIds = memberships.map((m) => m.organizationId);
    const organizationMap = await batchFetchOrganizations(ctx, organizationIds);

    // Batch fetch member and project counts per organization (parallel queries)
    const [memberCountsArrays, projectCountsArrays] = await Promise.all([
      Promise.all(
        organizationIds.map((organizationId) =>
          ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .take(1000),
        ),
      ),
      Promise.all(
        organizationIds.map((organizationId) =>
          ctx.db
            .query("projects")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .take(1000),
        ),
      ),
    ]);

    // Build count maps
    const memberCountMap = new Map(
      organizationIds.map((id, i) => [id.toString(), memberCountsArrays[i].length]),
    );
    const projectCountMap = new Map(
      organizationIds.map((id, i) => [id.toString(), projectCountsArrays[i].length]),
    );

    // Build role map from memberships
    const roleMap = new Map(memberships.map((m) => [m.organizationId.toString(), m.role]));

    // Enrich with pre-fetched data (no N+1)
    const organizations = pruneNull(
      memberships.map((membership) => {
        const organization = organizationMap.get(membership.organizationId);
        if (!organization) return null;

        const organizationIdStr = membership.organizationId.toString();
        return {
          ...organization,
          createdAt: organization._creationTime,
          userRole: roleMap.get(organizationIdStr) ?? null,
          memberCount: memberCountMap.get(organizationIdStr) ?? 0,
          projectCount: projectCountMap.get(organizationIdStr) ?? 0,
        };
      }),
    );

    return organizations;
  },
});

/**
 * Get all members of an organization
 * Admin only
 */
export const getOrganizationMembers = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizationMembers"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      userId: v.id("users"),
      role: organizationRoles,
      addedBy: v.id("users"),
      user: v.union(
        v.null(),
        v.object({
          _id: v.id("users"),
          name: v.string(),
          email: v.optional(v.string()),
          image: v.optional(v.string()),
        }),
      ),
      addedByName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter(notDeleted)
      .take(MAX_ORG_MEMBERS);

    // Batch fetch all users (members + addedBy)
    const userIds = [...memberships.map((m) => m.userId), ...memberships.map((m) => m.addedBy)];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    const members = memberships.map((membership) => {
      const user = userMap.get(membership.userId);
      const addedBy = userMap.get(membership.addedBy);

      return {
        ...membership,
        user: user
          ? {
              _id: user._id,
              name: user.name ?? "Unknown",
              email: user.email,
              image: user.image,
            }
          : null,
        addedByName: addedBy?.name || addedBy?.email || "Unknown",
      };
    });

    return members;
  },
});

/**
 * Get user's role in an organization (public query version)
 */
export const getUserRole = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: nullableOrganizationRoles,
  handler: async (ctx, args) => {
    return await getOrganizationRole(ctx, args.organizationId, ctx.userId);
  },
});

// ============================================================================
// Migration & Initialization
// ============================================================================

/**
 * Initialize default organization for a user
 * Creates a personal project named after the user
 */
export const initializeDefaultOrganization = authenticatedMutation({
  args: {
    organizationName: v.optional(v.string()), // Optional custom name
    timezone: v.optional(v.string()), // Optional timezone, defaults to "America/New_York"
  },
  returns: v.object({
    organizationId: v.id("organizations"),
    slug: v.optional(v.string()),
    message: v.string(),
    usersAssigned: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if user already has an organization
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (existingMembership) {
      const existingOrganization = await ctx.db.get(existingMembership.organizationId);
      return {
        organizationId: existingMembership.organizationId,
        slug: existingOrganization?.slug,
        message: "User already has an organization",
        usersAssigned: 0,
      };
    }

    // Get user info to generate organization name
    const user = await ctx.db.get(ctx.userId);
    const userName = user?.name || user?.email?.split("@")[0] || "user";

    const now = Date.now();
    const organizationName = args.organizationName || `${userName}'s Project`;
    const timezone = args.timezone || "America/New_York";

    // Generate slug from organization name
    let baseSlug = generateSlug(organizationName);

    // If generated slug is reserved, append "project"
    if (isReservedSlug(baseSlug)) {
      baseSlug = `${baseSlug}-project`;
    }

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: organizationName,
      slug,
      timezone,
      settings: DEFAULT_ORGANIZATION_SETTINGS,
      createdBy: ctx.userId,
      updatedAt: now,
    });

    // Add current user as owner
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: ctx.userId,
      role: "owner",
      addedBy: ctx.userId,
    });

    // Set as user's default organization
    await ctx.db.patch(ctx.userId, { defaultOrganizationId: organizationId });

    return {
      organizationId,
      slug,
      message: "organization created successfully",
      usersAssigned: 1,
    };
  },
});
