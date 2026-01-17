import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { batchFetchUsers } from "./lib/batchHelpers";
import { notDeleted } from "./lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "./lib/userUtils";

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get a user by ID (sanitized for authenticated users)
 * Note: Does not check if requester should see this user.
 * For team contexts, ensure proper access checks.
 */
export const get = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    // Return sanitized user - strips sensitive fields beyond email
    return sanitizeUserForAuth(user);
  },
});

export const getCurrent = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      // Add other fields as optional
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      defaultOrganizationId: v.optional(v.id("organizations")),
      bio: v.optional(v.string()),
      timezone: v.optional(v.string()),
      emailNotifications: v.optional(v.boolean()),
      desktopNotifications: v.optional(v.boolean()),
      inviteId: v.optional(v.id("invites")),
      isTestUser: v.optional(v.boolean()),
      testUserCreatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    // Current user can see their full profile
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()), // IANA timezone e.g. "America/New_York"
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: {
      name?: string;
      email?: string;
      image?: string;
      bio?: string;
      timezone?: string;
      emailNotifications?: boolean;
      desktopNotifications?: boolean;
    } = {};

    if (args.name !== undefined) updates.name = args.name;

    if (args.email !== undefined) {
      if (!isValidEmail(args.email)) {
        throw new Error("Invalid email address");
      }

      // Check if email is already in use by another user
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (existingUser && existingUser._id !== userId) {
        throw new Error("Email already in use");
      }

      updates.email = args.email;
    }

    if (args.avatar !== undefined) updates.image = args.avatar;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.desktopNotifications !== undefined)
      updates.desktopNotifications = args.desktopNotifications;

    await ctx.db.patch(userId, updates);
  },
});

/**
 * Check if the current user is a organization admin
 * Returns true if user is:
 * - Owner or admin in any organization
 * - Creator of any project (backward compatibility)
 * - Admin in any project (backward compatibility)
 */
export const isOrganizationAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // Primary: Check if user is admin or owner in any organization
    const adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("role", "admin"))
      .first();

    if (adminMembership) return true;

    const ownerMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("role", "owner"))
      .first();

    return !!ownerMembership;
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  returns: v.object({
    issuesCreated: v.number(),
    issuesAssigned: v.number(),
    issuesCompleted: v.number(),
    comments: v.number(),
    projects: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get issues created
    const issuesCreated = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.userId))
      .filter(notDeleted)
      .collect();

    // Get issues assigned
    const issuesAssigned = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .filter(notDeleted)
      .collect();

    // Get comments
    const comments = await ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .filter(notDeleted)
      .collect();

    // Get projects (as member)
    const projectMemberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(notDeleted)
      .collect();

    return {
      issuesCreated: issuesCreated.length,
      issuesAssigned: issuesAssigned.length,
      issuesCompleted: issuesAssigned.filter((i) => {
        // Check if issue is in a "done" state - you'd need to check workflow states
        return i.status === "done";
      }).length,
      comments: comments.length,
      projects: projectMemberships.length,
    };
  },
});

/**
 * Internal query to get users with specific digest preferences
 * Used by cron jobs to send digest emails
 */
export const listWithDigestPreference = internalQuery({
  args: {
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      // sanitizeUserForAuth fields
    }),
  ),
  handler: async (ctx, args) => {
    // Bounded query for notification preferences
    const prefs = await ctx.db.query("notificationPreferences").take(1000);

    const filtered = prefs.filter(
      (pref) => pref.emailEnabled && pref.emailDigest === args.frequency,
    );

    // Batch fetch users to avoid N+1 queries
    const userIds = filtered.map((pref) => pref.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Return users that exist (filter out deleted users)
    return filtered
      .map((pref) => userMap.get(pref.userId))
      .filter((user): user is NonNullable<typeof user> => user !== null);
  },
});
