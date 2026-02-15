import type { FilterBuilder, GenericTableInfo } from "convex/server";
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { sendEmail } from "./email";
import { batchFetchIssues, batchFetchUsers } from "./lib/batchHelpers";
import { efficientCount } from "./lib/boundedQueries";
import { validate } from "./lib/constrainedValidators";
import { generateOTP } from "./lib/crypto";
import { conflict, validation } from "./lib/errors";
import { logger } from "./lib/logger";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { sanitizeUserForAuth, sanitizeUserForCurrent, sanitizeUserForPublic } from "./lib/userUtils";
import { digestFrequencies } from "./validators";

// Limits for user stats queries
const MAX_ISSUES_FOR_STATS = 1000;
const MAX_COMMENTS_FOR_STATS = 1000;

/**
 * Internal query to get user by ID (system use only)
 */
export const getInternal = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a user by ID (sanitized for authenticated users)
 * Note: Does not check if requester should see this user.
 * For team contexts, ensure proper access checks.
 */
export const get = authenticatedQuery({
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
    if (!user) return null;

    // Users can always see themselves
    if (ctx.userId === args.id) {
      return sanitizeUserForAuth(user);
    }

    // Check for shared organization
    const myOrgs = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(MAX_PAGE_SIZE);

    if (myOrgs.length > 0) {
      const theirOrgs = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.id))
        .take(MAX_PAGE_SIZE);

      const myOrgIds = new Set(myOrgs.map((m) => m.organizationId));
      const hasSharedOrg = theirOrgs.some((m) => myOrgIds.has(m.organizationId));

      if (hasSharedOrg) {
        return sanitizeUserForAuth(user);
      }
    }

    // If no shared context, return public profile (no email)
    return sanitizeUserForPublic(user);
  },
});

export const getCurrent = authenticatedQuery({
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
    // Current user can see their full profile
    const user = await ctx.db.get(ctx.userId);
    return sanitizeUserForCurrent(user);
  },
});

export const updateProfile = authenticatedMutation({
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
    const updates: {
      name?: string;
      image?: string;
      bio?: string;
      timezone?: string;
      emailNotifications?: boolean;
      desktopNotifications?: boolean;
      pendingEmail?: string;
      pendingEmailVerificationToken?: string;
      pendingEmailVerificationExpires?: number;
    } = {};

    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      if (trimmedName.length === 0) {
        throw validation("name", "Name cannot be empty or whitespace-only");
      }
      validate.name(trimmedName);
      updates.name = trimmedName;
    }

    if (args.email !== undefined) {
      validate.email(args.email);

      // Check if email is already in use by another user
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (existingUser && existingUser._id !== ctx.userId) {
        throw conflict("Email already in use");
      }

      // Check if email actually changed
      const currentUser = await ctx.db.get(ctx.userId);
      if (currentUser?.email !== args.email) {
        // Do NOT update email immediately. Start pending verification flow.
        const token = generateOTP();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

        updates.pendingEmail = args.email;
        updates.pendingEmailVerificationToken = token;
        updates.pendingEmailVerificationExpires = expiresAt;

        // Send verification email
        await sendVerificationEmail(ctx, args.email, token);
      }
    }

    if (args.avatar !== undefined) {
      validate.url(args.avatar, "avatar");
      updates.image = args.avatar;
    }
    if (args.bio !== undefined) {
      validate.bio(args.bio);
      updates.bio = args.bio;
    }
    if (args.timezone !== undefined) {
      validate.timezone(args.timezone);
      updates.timezone = args.timezone;
    }
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.desktopNotifications !== undefined)
      updates.desktopNotifications = args.desktopNotifications;

    await ctx.db.patch(ctx.userId, updates);
  },
});

/**
 * Helper to send verification email for profile updates
 */
async function sendVerificationEmail(ctx: MutationCtx, email: string, token: string) {
  const isTestEmail = email.endsWith("@inbox.mailtrap.io");
  const isSafeEnvironment =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    !!process.env.CI ||
    !!process.env.E2E_API_KEY;

  // Store OTPs for test emails
  if (isTestEmail && isSafeEnvironment) {
    try {
      await ctx.runMutation(internal.e2e.storeTestOtp, { email, code: token });
    } catch (e) {
      logger.warn(`[Users] Failed to store test OTP: ${e}`);
    }
  }

  await sendEmail(ctx, {
    to: email,
    subject: "Verify your new email address",
    html: `
      <h2>Verify your new email address</h2>
      <p>Use the code below to verify your new email address:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">${token}</h1>
      <p>This code expires in 15 minutes.</p>
      <p>If you didn't request this change, you can safely ignore this email.</p>
    `,
    text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.`,
  });
}

export const verifyEmailChange = authenticatedMutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user) {
      throw validation("user", "User not found");
    }

    if (
      !user.pendingEmail ||
      !user.pendingEmailVerificationToken ||
      !user.pendingEmailVerificationExpires
    ) {
      throw validation("token", "No pending email verification found");
    }

    if (Date.now() > user.pendingEmailVerificationExpires) {
      throw validation("token", "Verification token expired");
    }

    if (args.token !== user.pendingEmailVerificationToken) {
      throw validation("token", "Invalid verification token");
    }

    const newEmail = user.pendingEmail;

    // Double check if email is taken (race condition)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", newEmail))
      .first();

    if (existingUser && existingUser._id !== ctx.userId) {
      throw conflict("Email already in use");
    }

    // Update email and clear pending fields
    await ctx.db.patch(ctx.userId, {
      email: newEmail,
      emailVerificationTime: Date.now(),
      pendingEmail: undefined,
      pendingEmailVerificationToken: undefined,
      pendingEmailVerificationExpires: undefined,
    });

    // Sync to auth accounts
    await syncEmailToAuthAccounts(ctx, ctx.userId, newEmail);
  },
});

/**
 * Helper function to sync email changes to authAccounts
 */
async function syncEmailToAuthAccounts(ctx: MutationCtx, userId: Id<"users">, newEmail: string) {
  // Synchronize with authAccounts (for Password provider) to prevent notification hijacking
  // and ensure the user logs in with the new email.
  const passwordAccount = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
    .first();

  if (passwordAccount) {
    // Check if new email is already in use by another account (in authAccounts)
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", newEmail),
      )
      .first();

    if (existingAccount && existingAccount._id !== passwordAccount._id) {
      throw conflict("Email already in use for authentication");
    }

    // Update authAccount
    await ctx.db.patch(passwordAccount._id, {
      providerAccountId: newEmail,
      emailVerified: undefined, // Revoke verification
    });
  }
}

/**
 * Check if the current user is an organization admin
 * Returns true if user is:
 * - Owner or admin in any organization
 * - Creator of any project (backward compatibility)
 * - Admin in any project (backward compatibility)
 */
export const isOrganizationAdmin = authenticatedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Primary: Check if user is admin or owner in any organization
    const adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", ctx.userId).eq("role", "admin"))
      .first();

    if (adminMembership) return true;

    const ownerMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", ctx.userId).eq("role", "owner"))
      .first();

    return !!ownerMembership;
  },
});

// Helper to construct allowed project filter
function isAllowedProject(q: FilterBuilder<GenericTableInfo>, projectIds: Id<"projects">[]) {
  return q.or(...projectIds.map((id) => q.eq(q.field("projectId"), id)));
}

async function countIssuesByReporter(
  ctx: QueryCtx,
  reporterId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  if (allowedProjectIds) {
    if (allowedProjectIds.size === 0) return 0;
    const projectIds = Array.from(allowedProjectIds) as Id<"projects">[];
    return await efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_reporter", (q) => q.eq("reporterId", reporterId).lt("isDeleted", true))
        .filter((q) => isAllowedProject(q, projectIds)),
      MAX_ISSUES_FOR_STATS,
    );
  }
  return await efficientCount(
    ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", reporterId).lt("isDeleted", true)),
  );
}

async function countIssuesByAssignee(
  ctx: QueryCtx,
  assigneeId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  if (allowedProjectIds) {
    if (allowedProjectIds.size === 0) return [0, 0];
    const projectIds = Array.from(allowedProjectIds) as Id<"projects">[];
    return await Promise.all([
      efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", assigneeId).lt("isDeleted", true))
          .filter((q) => isAllowedProject(q, projectIds)),
        MAX_ISSUES_FOR_STATS,
      ),
      efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_assignee_status", (q) =>
            q.eq("assigneeId", assigneeId).eq("status", "done").lt("isDeleted", true),
          )
          .filter((q) => isAllowedProject(q, projectIds)),
        MAX_ISSUES_FOR_STATS,
      ),
    ]);
  }
  return await Promise.all([
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee", (q) => q.eq("assigneeId", assigneeId).lt("isDeleted", true)),
    ),
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee_status", (q) =>
          q.eq("assigneeId", assigneeId).eq("status", "done").lt("isDeleted", true),
        ),
    ),
  ]);
}

async function countComments(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  if (allowedProjectIds) {
    const commentsAll = await ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter(notDeleted)
      .take(MAX_COMMENTS_FOR_STATS);

    // Batch fetch unique issue IDs to check project membership using batchFetchIssues
    // This avoids unbounded Promise.all calls
    const issueIds = [...new Set(commentsAll.map((c) => c.issueId))];
    const issueMap = await batchFetchIssues(ctx, issueIds);

    const allowedIssueIds = new Set<string>();
    for (const [issueId, issue] of issueMap.entries()) {
      if (issue.projectId && allowedProjectIds.has(issue.projectId)) {
        allowedIssueIds.add(issueId);
      }
    }

    return commentsAll.filter((c) => allowedIssueIds.has(c.issueId)).length;
  }
  return await efficientCount(
    ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter(notDeleted),
    MAX_COMMENTS_FOR_STATS,
  );
}

async function countProjects(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  if (allowedProjectIds) {
    const projectMembershipsAll = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    return projectMembershipsAll.filter((m) => allowedProjectIds.has(m.projectId)).length;
  }
  return await efficientCount(
    ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted),
    MAX_PAGE_SIZE,
  );
}

export const getUserStats = authenticatedQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    issuesCreated: v.number(),
    issuesAssigned: v.number(),
    issuesCompleted: v.number(),
    comments: v.number(),
    projects: v.number(),
  }),
  handler: async (ctx, args) => {
    // If viewing another user, only count data from shared projects
    let allowedProjectIds: Set<string> | null = null;
    if (ctx.userId !== args.userId) {
      const myMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .filter(notDeleted)
        .take(MAX_PAGE_SIZE);
      allowedProjectIds = new Set(myMemberships.map((m) => m.projectId));
    }

    // Optimize: Parallelize all counting operations
    const [
      issuesCreatedCount,
      [issuesAssignedCount, issuesCompletedCount],
      commentsCount,
      projectsCount,
    ] = await Promise.all([
      countIssuesByReporter(ctx, args.userId, allowedProjectIds),
      countIssuesByAssignee(ctx, args.userId, allowedProjectIds),
      countComments(ctx, args.userId, allowedProjectIds),
      countProjects(ctx, args.userId, allowedProjectIds),
    ]);

    return {
      issuesCreated: issuesCreatedCount,
      issuesAssigned: issuesAssignedCount,
      issuesCompleted: issuesCompletedCount,
      comments: commentsCount,
      projects: projectsCount,
    };
  },
});

/** Lists users with a specific email digest frequency preference for cron job processing. */
export const listWithDigestPreference = internalQuery({
  args: {
    frequency: digestFrequencies,
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Optimized query: Use by_digest_frequency index to find matching users directly
    // This avoids scanning irrelevant records and fixes the bug where users beyond the first 1000 were ignored
    const filtered = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_digest_frequency", (q) =>
        q.eq("emailEnabled", true).eq("emailDigest", args.frequency),
      )
      .take(1000); // Bounded limit to capture users efficiently

    // Batch fetch users to avoid N+1 queries
    const userIds = filtered.map((pref) => pref.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Return users that exist (filter out deleted users)
    return pruneNull(
      filtered.map((pref) => {
        const user = userMap.get(pref.userId);
        if (!user) return null;
        return {
          _id: user._id,
          name: user.name ?? user.email ?? "Unknown",
          email: user.email,
          image: user.image,
          createdAt: user._creationTime,
        };
      }),
    );
  },
});
