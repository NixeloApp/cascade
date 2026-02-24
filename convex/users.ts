import type { FunctionReference } from "convex/server";
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalQuery, type MutationCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { constantTimeEqual } from "./lib/apiAuth";
import { batchFetchUsers } from "./lib/batchHelpers";
import { validate } from "./lib/constrainedValidators";
import { generateOTP } from "./lib/crypto";
import { conflict, validation } from "./lib/errors";
import { logger } from "./lib/logger";
import { getOrganizationMemberships, hasSharedOrganization } from "./lib/organizationAccess";
import { MINUTE } from "./lib/timeUtils";
import { collectUserStats } from "./lib/userStats";
import {
  sanitizeUserForAuth,
  sanitizeUserForCurrent,
  sanitizeUserForPublic,
} from "./lib/userUtils";
import { rateLimit } from "./rateLimits";
import { digestFrequencies } from "./validators";

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
 * Internal query to get user by email (system use only)
 */
export const getInternalByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Get a user by ID (sanitized for authenticated users)
 * Note: Does not check if requester should see this user.
 * For team contexts, ensure proper access checks.
 */
export const getUser = authenticatedQuery({
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
    const isShared = await hasSharedOrganization(ctx, ctx.userId, args.id);

    if (isShared) {
      return sanitizeUserForAuth(user);
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

/**
 * Update the current user's profile information.
 *
 * If the email is changed, it triggers a verification flow:
 * - A verification code is sent to the new email address.
 * - The `email` field is NOT updated immediately.
 * - `pendingEmail` and related fields are set.
 * - The user must call `verifyEmailChange` with the code to complete the update.
 *
 * @throws {ConvexError} if name is empty or validation fails.
 */
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
  returns: v.object({ success: v.boolean() }),
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
      const emailUpdates = await handleEmailChange(ctx, args.email);
      Object.assign(updates, emailUpdates);
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

    return { success: true };
  },
});

/**
 * Helper to handle email changes:
 * - Validates email format
 * - Checks if email actually changed
 * - Rate limits requests
 * - Generates OTP and expiration
 * - Checks for uniqueness (safe against enumeration)
 * - Sends verification email
 */
async function handleEmailChange(
  ctx: MutationCtx & { userId: Id<"users"> },
  newEmail: string,
): Promise<
  | Record<string, never>
  | {
      pendingEmail: string;
      pendingEmailVerificationToken: string;
      pendingEmailVerificationExpires: number;
    }
> {
  const normalizedEmail = newEmail.trim().toLowerCase();
  validate.email(normalizedEmail);

  // Check if email actually changed
  const currentUser = await ctx.db.get(ctx.userId);
  if (currentUser?.email === normalizedEmail) {
    return {};
  }

  // Rate limit email change requests to prevent spam
  await rateLimit(ctx, "emailChange", { key: ctx.userId });

  // Do NOT update email immediately. Start pending verification flow.
  const token = generateOTP();
  const expiresAt = Date.now() + 15 * MINUTE; // 15 minutes

  const updates = {
    pendingEmail: normalizedEmail,
    pendingEmailVerificationToken: token,
    pendingEmailVerificationExpires: expiresAt,
  };

  // Check if email is already taken by ANOTHER user
  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", normalizedEmail))
    .first();

  // Only send verification email if the email is NOT taken
  // If taken, we still update pending fields to prevent enumeration (attacker sees success),
  // but we skip sending the email to prevent spamming the victim.
  if (!existingUser || existingUser._id === ctx.userId) {
    // Schedule email sending asynchronously to avoid blocking the mutation
    // and preventing "fetch in mutation" errors.
    // Use strict casting to avoid "any" and Biome errors
    const usersInternal = internal.users as unknown as {
      sendVerificationEmailAction: FunctionReference<"action">;
    };

    // In unit tests (convex-test), we skip scheduling to avoid "Write outside of transaction" errors
    // from the test environment tearing down before the async action completes.
    // E2E tests run against real deployments where IS_TEST_ENV is false, so they will run this.
    if (!process.env.IS_TEST_ENV) {
      await ctx.scheduler.runAfter(0, usersInternal.sendVerificationEmailAction, {
        email: normalizedEmail,
        token,
        isTestUser: currentUser?.isTestUser,
      });
    }
  }

  return updates;
}

/**
 * Internal action to send verification email asynchronously
 */
export const sendVerificationEmailAction = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
    isTestUser: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { email, token, isTestUser } = args;
    const isTestEmail = email.endsWith("@inbox.mailtrap.io");
    const isSafeEnvironment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test" ||
      !!process.env.CI ||
      !!process.env.E2E_TEST_MODE;

    // Store OTPs for test emails ONLY if they are test users
    if (isTestEmail && isSafeEnvironment && isTestUser) {
      try {
        await ctx.runMutation(internal.e2e.storeTestOtp, { email, code: token });
      } catch (e) {
        logger.warn(`[Users] Failed to store test OTP: ${e}`);
      }
    }

    const result = await ctx.runAction(internal.email.index.sendEmailAction, {
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

    if (!result.success) {
      throw new Error(`Failed to send verification email: ${result.error}`);
    }
  },
});

/**
 * Verify a pending email change using the OTP token sent to the user.
 *
 * This function:
 * 1. Checks that the token matches and hasn't expired.
 * 2. Verifies the new email is still unique (handles race conditions).
 * 3. Updates the user's `email` field and clears pending fields.
 * 4. Syncs the change to `authAccounts` to maintain login consistency.
 *
 * @throws {ConvexError} if token is invalid/expired or email is already in use.
 */
export const verifyEmailChange = authenticatedMutation({
  args: { token: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Rate limit verification attempts to prevent brute-forcing
    await rateLimit(ctx, "emailChange", { key: ctx.userId });

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

    // Use constant-time comparison to prevent timing attacks on the verification token
    if (!constantTimeEqual(args.token, user.pendingEmailVerificationToken)) {
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

    return { success: true };
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
 * Check if the current user is an organization admin.
 *
 * This permission check is used to gate access to administrative features.
 *
 * Returns `true` if the user is:
 * - An 'owner' or 'admin' in ANY organization.
 * - (Legacy) A creator or admin of any project.
 */
export const isOrganizationAdmin = authenticatedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Optimization: Use cached memberships for the current user
    const { items: myOrgs, hasMore } = await getOrganizationMemberships(ctx, ctx.userId);

    const hasAdminRole = myOrgs.some((m) => m.role === "admin" || m.role === "owner");
    if (hasAdminRole) return true;

    // If cache was truncated, check for admin/owner role via index
    if (hasMore) {
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
    }

    return false;
  },
});

/**
 * Get aggregated statistics for a user profile.
 *
 * Returns counts for:
 * - Issues created by the user
 * - Issues assigned to the user
 * - Issues completed by the user
 * - Comments made by the user
 * - Projects the user is a member of
 *
 * Privacy:
 * - If viewing your own profile, counts include all projects.
 * - If viewing another user's profile, counts are filtered to only include
 *   projects that are SHARED between the viewer and the target user.
 */
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
    return await collectUserStats(ctx, ctx.userId, args.userId);
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
