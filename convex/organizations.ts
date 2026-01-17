import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { batchFetchOrganizations, batchFetchUsers } from "./lib/batchHelpers";
import { notDeleted } from "./lib/softDeleteHelpers";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's role in a organization
 * Returns null if user is not a member
 */
export async function getOrganizationRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<"owner" | "admin" | "member" | null> {
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is organization admin (owner or admin role)
 */
export async function isOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role === "owner" || role === "admin";
}

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
    throw new Error("Only organization admins can perform this action");
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
    throw new Error("Only organization owner can perform this action");
  }
}

/**
 * Reserved slugs that cannot be used as organization slugs
 * These are route paths in the application - GitHub-style validation
 */
const RESERVED_SLUGS = [
  // App routes
  "dashboard",
  "documents",
  "projects",
  "issues",
  "settings",
  "time-tracking",
  "timetracking",
  // Auth routes
  "onboarding",
  "invite",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "signout",
  // System routes
  "api",
  "admin",
  "app",
  "auth",
  "oauth",
  "callback",
  "webhooks",
  "health",
  "status",
  // Reserved terms
  "www",
  "mail",
  "email",
  "support",
  "help",
  "about",
  "contact",
  "legal",
  "privacy",
  "terms",
  "blog",
  "docs",
  "pricing",
  "enterprise",
] as const;

/**
 * Check if a slug is reserved
 */
function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as (typeof RESERVED_SLUGS)[number]);
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
export const createOrganization = mutation({
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate slug from name
    const baseSlug = generateSlug(args.name);

    // Validate slug is not reserved (GitHub-style validation)
    if (isReservedSlug(baseSlug)) {
      throw new Error(
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
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId,
      role: "owner",
      addedBy: userId,
      addedAt: now,
    });

    // Set as user's default organization if they don't have one
    const user = await ctx.db.get(userId);
    if (!user?.defaultOrganizationId) {
      await ctx.db.patch(userId, { defaultOrganizationId: organizationId });
    }

    return { organizationId, slug };
  },
});

/**
 * Update organization details
 * Admin only
 */
export const updateOrganization = mutation({
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertOrganizationAdmin(ctx, args.organizationId, userId);

    const updates: Partial<Doc<"organizations">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      // Regenerate slug if name changes
      const baseSlug = generateSlug(args.name);

      // Validate slug is not reserved (GitHub-style validation)
      if (isReservedSlug(baseSlug)) {
        throw new Error(
          `The name "${args.name}" cannot be used because "${baseSlug}" is a reserved URL path. Please choose a different name.`,
        );
      }

      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!existing || existing._id === args.organizationId) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
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
export const deleteOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertOrganizationOwner(ctx, args.organizationId, userId);

    // Delete all organization members
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);

      // Clear defaultOrganizationId if this was the user's default
      const user = await ctx.db.get(member.userId);
      if (user?.defaultOrganizationId === args.organizationId) {
        await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
      }
    }

    // Delete organization
    await ctx.db.delete(args.organizationId);

    return { success: true };
  },
});

/**
 * Add member to organization
 * Admin only
 */
export const addMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")), // Can't directly add as owner
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertOrganizationAdmin(ctx, args.organizationId, currentUserId);

    // Check if user is already a member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this organization");
    }

    const now = Date.now();

    await ctx.db.insert("organizationMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      addedBy: currentUserId,
      addedAt: now,
    });

    // Set as user's default organization if they don't have one
    const user = await ctx.db.get(args.userId);
    if (!user?.defaultOrganizationId) {
      await ctx.db.patch(args.userId, { defaultOrganizationId: args.organizationId });
    }

    return { success: true };
  },
});

/**
 * Update member role
 * Owner only - owner role can't be changed
 */
export const updateMemberRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertOrganizationOwner(ctx, args.organizationId, currentUserId);

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Remove member from organization
 * Admin only - owner can't be removed
 */
export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertOrganizationAdmin(ctx, args.organizationId, currentUserId);

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot remove organization owner");
    }

    await ctx.db.delete(membership._id);

    // Clear defaultOrganizationId if this was the user's default
    const user = await ctx.db.get(args.userId);
    if (user?.defaultOrganizationId === args.organizationId) {
      await ctx.db.patch(args.userId, { defaultOrganizationId: undefined });
    }

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get organization by ID
 */
export const getOrganization = query({
  args: {
    organizationId: v.id("organizations"),
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
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) return null;

    // Check if user is a member
    const role = await getOrganizationRole(ctx, args.organizationId, userId);
    if (!role) return null;

    return {
      ...organization,
      userRole: role,
    };
  },
});

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = query({
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
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!organization) return null;

    // Check if user is a member
    const role = await getOrganizationRole(ctx, organization._id, userId);
    if (!role) return null;

    return {
      ...organization,
      userRole: role,
    };
  },
});

/**
 * Get all companies user is a member of
 */
export const getUserOrganizations = query({
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
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.null()),
      memberCount: v.number(),
      projectCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

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
    const organizations = memberships
      .map((membership) => {
        const organization = organizationMap.get(membership.organizationId);
        if (!organization) return null;

        const organizationIdStr = membership.organizationId.toString();
        return {
          ...organization,
          userRole: roleMap.get(organizationIdStr) ?? null,
          memberCount: memberCountMap.get(organizationIdStr) ?? 0,
          projectCount: projectCountMap.get(organizationIdStr) ?? 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return organizations;
  },
});

/**
 * Get all members of a organization
 * Admin only
 */
export const getOrganizationMembers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizationMembers"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      userId: v.id("users"),
      role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
      addedBy: v.id("users"),
      addedAt: v.number(),
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertOrganizationAdmin(ctx, args.organizationId, userId);

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter(notDeleted)
      .collect();

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
 * Get user's role in a organization (public query version)
 */
export const getUserRole = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getOrganizationRole(ctx, args.organizationId, userId);
  },
});

// ============================================================================
// Migration & Initialization
// ============================================================================

/**
 * Initialize default organization for a user
 * Creates a personal project named after the user
 */
export const initializeDefaultOrganization = mutation({
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has a organization
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
    const user = await ctx.db.get(userId);
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
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add current user as owner
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId,
      role: "owner",
      addedBy: userId,
      addedAt: now,
    });

    // Set as user's default organization
    await ctx.db.patch(userId, { defaultOrganizationId: organizationId });

    return {
      organizationId,
      slug,
      message: "organization created successfully",
      usersAssigned: 1,
    };
  },
});
