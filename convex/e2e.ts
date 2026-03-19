/**
 * E2E Testing Helpers
 *
 * Provides utilities for E2E tests:
 * - Create test users (bypassing email verification for speed)
 * - Delete test users
 * - Reset onboarding state
 * - Garbage collection for old test users
 *
 * Only works for emails ending in @inbox.mailtrap.io (test emails).
 * Real email verification is tested separately using Mailtrap API.
 */

import { v } from "convex/values";
import { Scrypt } from "lucia";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type ActionCtx, httpAction, internalMutation, internalQuery } from "./_generated/server";
import { constantTimeEqual } from "./lib/apiAuth";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { decryptE2EData, encryptE2EData } from "./lib/e2eCrypto";
import { fetchWithTimeout } from "./lib/fetchWithTimeout";
import { logger } from "./lib/logger";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { DAY, HOUR, MINUTE, MONTH, SECOND, WEEK } from "./lib/timeUtils";
import { type CalendarEventColor, otpCodeTypes, workflowCategories } from "./validators";

// Test user expiration (1 hour - for garbage collection)
const TEST_USER_EXPIRATION_MS = HOUR;

import { api } from "./_generated/api";

const SCREENSHOT_DOCUMENT_SNAPSHOTS: Record<
  "Project Requirements" | "Sprint Retrospective Notes",
  { type: "doc"; content: Array<Record<string, unknown>> }
> = {
  "Project Requirements": {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Project Requirements" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Cascade should unify board planning, client delivery, and documentation in one calmer workspace.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Success criteria" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Teams can move from specs to execution without losing linked context, approvals, or delivery timing.",
          },
        ],
      },
    ],
  },
  "Sprint Retrospective Notes": {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Sprint Retrospective" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The team closed the auth refresh, improved mobile board density, and stabilized screenshot capture across configs.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Wins" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Landing light mode feels more intentional, settings tabs compress cleanly on mobile, and project screenshots now use trustworthy seeded data.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Next steps" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Hydrate the editor from saved document versions and keep pushing page-level polish where screenshots still feel thin.",
          },
        ],
      },
    ],
  },
};

/**
 * Check if email is a test email
 */
function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

function generateUnsubscribePreviewToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateInvitePreviewToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  return `invite_${timestamp}_${randomPart}`;
}

/**
 * Validate E2E API key from request headers
 * Returns error Response if invalid, null if valid
 */
function validateE2EApiKey(request: Request): Response | null {
  const apiKey = process.env.E2E_API_KEY;

  // If no API key is configured, disable endpoints completely.
  // We do NOT allow "localhost" bypass because environment detection is fragile
  // and can be spoofed in some configurations (e.g. reverse proxies).
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "E2E endpoints disabled (missing E2E_API_KEY)" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providedKey = request.headers.get("x-e2e-api-key");
  if (!providedKey || !constantTimeEqual(providedKey, apiKey)) {
    return new Response(JSON.stringify({ error: "Invalid or missing E2E API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Valid
}

/**
 * Create a test user (bypassing email verification)
 * POST /e2e/create-test-user
 * Body: { email: string, password: string, skipOnboarding?: boolean }
 *
 * This creates a user with email already verified, optionally completing onboarding.
 * Only works for test emails (@inbox.mailtrap.io).
 */
export const createTestUserHandler = async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password, skipOnboarding = false } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Hash the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordHash = await scrypt.hash(password);

    const result = await ctx.runMutation(internal.e2e.createTestUserInternal, {
      email,
      passwordHash,
      skipOnboarding,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const createTestUserEndpoint = httpAction(createTestUserHandler);

/**
 * Log in a test user via API and return tokens
 * POST /e2e/login-test-user
 * Body: { email: string, password: string }
 */
export const loginTestUserEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Call the signIn action directly
    // The Password provider expects 'flow: "signIn"' in params
    const result = await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        password,
        flow: "signIn",
      },
    });

    if (!result.tokens) {
      return new Response(JSON.stringify({ error: "No tokens returned from signIn", result }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.tokens), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Trigger password reset OTP dispatch for a test user
 * POST /e2e/request-password-reset
 * Body: { email: string }
 */
export const requestPasswordResetEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        flow: "reset",
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to create test user with full auth credentials
 */
export const createTestUserInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    skipOnboarding: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.id("users"),
    existing: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Check if user already exists
    // Optimization: Use email index instead of filter-based table scan
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // User exists - check if authAccount exists too
      const existingAccount = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("providerAccountId"), args.email))
        .first();

      if (!existingAccount) {
        // User exists but no authAccount - create it
        await ctx.db.insert("authAccounts", {
          userId: existingUser._id,
          provider: "password",
          providerAccountId: args.email,
          secret: args.passwordHash,
        });
      }

      // Ensure existing user has organization and onboarding set up when skipOnboarding is true
      if (args.skipOnboarding) {
        const now = Date.now();

        // Check if user has onboarding record
        const existingOnboarding = await ctx.db
          .query("userOnboarding")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingOnboarding) {
          await ctx.db.insert("userOnboarding", {
            userId: existingUser._id,
            onboardingCompleted: true,
            onboardingStep: 5,
            sampleWorkspaceCreated: false,
            tourShown: true,
            wizardCompleted: true,
            checklistDismissed: true,
            updatedAt: now,
          });
        } else if (!existingOnboarding.onboardingCompleted) {
          // Mark existing onboarding as complete
          await ctx.db.patch(existingOnboarding._id, {
            onboardingCompleted: true,
            onboardingStep: 5,
          });
        }

        // Check if user has organization membership
        const existingMembership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingMembership) {
          // Use isolated organization per worker to avoid interference in parallel tests
          const workerMatch = args.email.match(/-w(\d+)@/);
          const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
          const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
          const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

          const existingOrganization = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();

          let organizationId: Id<"organizations">;

          if (existingOrganization) {
            // organization exists - just add this user as a member
            organizationId = existingOrganization._id;
          } else {
            // Create the organization
            organizationId = await ctx.db.insert("organizations", {
              name: organizationName,
              slug,
              timezone: "UTC",
              settings: {
                defaultMaxHoursPerWeek: 40,
                defaultMaxHoursPerDay: 8,
                requiresTimeApproval: false,
                billingEnabled: true,
              },
              createdBy: existingUser._id,
              updatedAt: now,
            });
          }

          await ctx.db.insert("organizationMembers", {
            organizationId,
            userId: existingUser._id,
            role: "admin",
            addedBy: existingUser._id,
          });

          await ctx.db.patch(existingUser._id, { defaultOrganizationId: organizationId });
        }
      }

      return { success: true, userId: existingUser._id, existing: true };
    }

    // Create the user with email verified
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      isTestUser: true,
      testUserCreatedAt: Date.now(),
    });

    // Create auth account with password hash and email verified
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: args.passwordHash,
      emailVerified: new Date().toISOString(), // Password provider checks this field
    });

    // If skipOnboarding is true, create completed onboarding record AND add to shared organization
    if (args.skipOnboarding) {
      const now = Date.now();

      // Create onboarding record
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        onboardingStep: 5,
        sampleWorkspaceCreated: false,
        tourShown: true,
        wizardCompleted: true,
        checklistDismissed: true,
        updatedAt: now,
      });

      // Use isolated organization per worker to avoid interference in parallel tests
      const workerMatch = args.email.match(/-w(\d+)@/);
      const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
      const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
      const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

      const existingOrganization = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      let organizationId: Id<"organizations">;

      if (existingOrganization) {
        // organization exists - just add this user as a member
        organizationId = existingOrganization._id;
      } else {
        // Create the organization (first user creates it)
        organizationId = await ctx.db.insert("organizations", {
          name: organizationName,
          slug,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: userId,
          updatedAt: now,
        });
      }

      // Add user as admin of the organization if not already a member
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organizationId).eq("userId", userId),
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId,
          role: "admin",
          addedBy: userId,
        });
      }

      // Set as user's default organization
      await ctx.db.patch(userId, { defaultOrganizationId: organizationId });
    }

    return { success: true, userId, existing: false };
  },
});

/**
 * Delete a test user
 * POST /e2e/delete-test-user
 * Body: { email: string }
 */
export const deleteTestUserEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.deleteTestUserInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to delete test user and all related data
 */
export const deleteTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.boolean(),
    deletedAccounts: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    let deletedUserData = false;
    let deletedAccountsCount = 0;

    // First, delete any authAccounts by email (providerAccountId) - this catches orphaned accounts
    // For password provider, providerAccountId is the email address
    // Optimization: Use providerAndAccountId index instead of filter-based table scan
    // For password provider, providerAccountId is the email address
    const accountsByEmail = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email),
      )
      .collect();
    for (const account of accountsByEmail) {
      await ctx.db.delete(account._id);
      deletedAccountsCount++;
    }

    // Note: authVerificationCodes doesn't have an identifier field we can filter on
    // Orphaned verification codes will be garbage collected by the auth system

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    for (const user of users) {
      // Delete user's onboarding record
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      // Delete user's auth sessions (if any)
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete user's auth accounts by userId (might be duplicates from above)
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        deletedAccountsCount++;
      }

      // Note: authRefreshTokens are tied to sessions, which we've already deleted
      // The auth system will clean up orphaned refresh tokens

      // Delete user's organization memberships and any organizations they created
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const membership of memberships) {
        // Check if user is the organization creator - if so, delete the organization
        const organization = await ctx.db.get(membership.organizationId);
        if (organization?.createdBy === user._id) {
          // Delete all members of this organization first
          const organizationMembers = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
            .collect();
          for (const member of organizationMembers) {
            // Check if this organization is the user's default
            const memberUser = await ctx.db.get(member.userId);
            if (memberUser?.defaultOrganizationId === organization._id) {
              await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
            }
            await ctx.db.delete(member._id);
          }
          // Delete the organization
          await ctx.db.delete(organization._id);
        } else {
          // Just delete the membership
          await ctx.db.delete(membership._id);
        }
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedUserData = true;
    }

    return {
      success: true,
      deleted: deletedUserData || deletedAccountsCount > 0,
      deletedAccounts: deletedAccountsCount,
    };
  },
});

/**
 * Reset onboarding for a specific user (by email)
 * POST /e2e/reset-onboarding
 * Body: { email?: string } - if not provided, resets ALL test users' onboarding
 */
export const resetOnboardingEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (email && !isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.resetOnboardingInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to reset onboarding
 */
export const resetOnboardingInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    reset: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    if (args.email) {
      // Reset specific user's onboarding
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!user) {
        return { success: false, error: "User not found" };
      }

      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      return { success: true, reset: 1 };
    }

    // Reset ALL test users' onboarding (for cleanup)
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .collect();

    let resetCount = 0;
    for (const user of testUsers) {
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
        resetCount++;
      }
    }

    return { success: true, reset: resetCount };
  },
});

/**
 * Force delete ALL test users and their associated data
 * POST /e2e/nuke-test-users
 */
export const nukeAllTestUsersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.nukeAllTestUsersInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Garbage collection - delete old test users
 * POST /e2e/cleanup
 * Deletes test users older than 1 hour
 */
export const cleanupTestUsersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.cleanupTestUsersInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Garbage collection - delete old test users
 *
 * Internal mutation for garbage collection
 */
export const cleanupTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffTime = Date.now() - TEST_USER_EXPIRATION_MS;

    // Find test users older than cutoff
    // Optimization: Use isTestUser index instead of filter-based table scan,
    // then filter by cutoff time in memory (much cheaper than scanning ALL users)
    const allTestUsers = await ctx.db
      .query("users")
      .withIndex("isTestUser", (q) => q.eq("isTestUser", true))
      .collect();
    const oldTestUsers = allTestUsers.filter(
      (u) => u.testUserCreatedAt && u.testUserCreatedAt < cutoffTime,
    );

    let deletedCount = 0;
    for (const user of oldTestUsers) {
      // Delete onboarding
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      // Delete sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
      }

      // Delete user's organization memberships and any organizations they created
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const membership of memberships) {
        // Check if user is the organization creator - if so, delete the organization
        const organization = await ctx.db.get(membership.organizationId);
        if (organization?.createdBy === user._id) {
          // Delete all members of this organization first
          const organizationMembers = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
            .collect();
          for (const member of organizationMembers) {
            // Check if this organization is the user's default
            const memberUser = await ctx.db.get(member.userId);
            if (memberUser?.defaultOrganizationId === organization._id) {
              await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
            }
            await ctx.db.delete(member._id);
          }
          // Delete the organization
          await ctx.db.delete(organization._id);
        } else {
          // Just delete the membership
          await ctx.db.delete(membership._id);
        }
      }

      // Delete user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Set up RBAC test project with users assigned to specific roles
 * POST /e2e/setup-rbac-project
 * Body: {
 *   projectKey: string;
 *   projectName: string;
 *   adminEmail: string;
 *   editorEmail: string;
 *   viewerEmail: string
 * }
 *
 * Creates a project and assigns users with their respective roles.
 * Returns the project ID for use in tests.
 */
export const setupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey, projectName, adminEmail, editorEmail, viewerEmail } = body;

    if (!(projectKey && projectName && adminEmail && editorEmail && viewerEmail)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: projectKey, projectName, adminEmail, editorEmail, viewerEmail",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate all emails are test emails
    for (const email of [adminEmail, editorEmail, viewerEmail]) {
      if (!isTestEmail(email)) {
        return new Response(JSON.stringify({ error: `Only test emails allowed: ${email}` }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await ctx.runMutation(internal.e2e.setupRbacProjectInternal, {
      projectKey,
      projectName,
      adminEmail,
      editorEmail,
      viewerEmail,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Seed built-in project templates
 * POST /e2e/seed-templates
 */
export const seedTemplatesEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(api.projectTemplates.initializeBuiltInTemplates, {});
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to set up RBAC test project
 * Uses the admin user's existing organization instead of creating a new one
 */
export const setupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
    projectName: v.string(),
    adminEmail: v.string(),
    editorEmail: v.string(),
    viewerEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    projectKey: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    orgSlug: v.optional(v.string()),
    // New hierarchy fields
    workspaceId: v.optional(v.id("workspaces")),
    teamId: v.optional(v.id("teams")),
    workspaceProjectId: v.optional(v.id("projects")),
    workspaceProjectKey: v.optional(v.string()),
    teamProjectId: v.optional(v.id("projects")),
    teamProjectKey: v.optional(v.string()),
    error: v.optional(v.string()),
    users: v.optional(
      v.object({
        admin: v.optional(v.id("users")),
        editor: v.optional(v.id("users")),
        viewer: v.optional(v.id("users")),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find latest users (in case of duplicates)
    const findLatestUser = async (email: string) => {
      const users = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), email))
        .collect();
      if (users.length === 0) return null;
      // Sort by creation time descending and take the first one
      return users.sort((a, b) => b._creationTime - a._creationTime)[0];
    };

    const adminUser = await findLatestUser(args.adminEmail);
    const editorUser = await findLatestUser(args.editorEmail);
    const viewerUser = await findLatestUser(args.viewerEmail);

    logger.info(`[RBAC-SETUP] Admin resolved to: ${adminUser?._id} (${args.adminEmail})`);
    logger.info(`[RBAC-SETUP] Editor resolved to: ${editorUser?._id} (${args.editorEmail})`);
    logger.info(`[RBAC-SETUP] Viewer resolved to: ${viewerUser?._id} (${args.viewerEmail})`);

    if (!adminUser) {
      return { success: false, error: `Admin user not found: ${args.adminEmail}` };
    }
    if (!editorUser) {
      return { success: false, error: `Editor user not found: ${args.editorEmail}` };
    }
    if (!viewerUser) {
      return { success: false, error: `Viewer user not found: ${args.viewerEmail}` };
    }

    const now = Date.now();

    // =========================================================================
    // Step 1: Find the admin user's existing organization (created during login)
    // =========================================================================
    let adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
      .first();

    // FALLBACK: If admin has no organization, create/link it now
    if (!adminMembership) {
      logger.info(`[RBAC-SETUP] Admin ${adminUser._id} has no organization. Attempting repair...`);

      const workerMatch = args.adminEmail.match(/-w(\d+)@/);
      const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
      const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
      const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

      let organization = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!organization) {
        logger.info(`[RBAC-SETUP] creating organization ${slug}`);
        const orgId = await ctx.db.insert("organizations", {
          name: organizationName,
          slug,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: adminUser._id,
          updatedAt: now,
        });
        organization = await ctx.db.get(orgId);
      }

      if (organization) {
        await ctx.db.insert("organizationMembers", {
          organizationId: organization._id,
          userId: adminUser._id,
          role: "admin",
          addedBy: adminUser._id, // Self-add
        });

        // Refresh membership query
        adminMembership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
          .first();

        // Correct default org
        await ctx.db.patch(adminUser._id, { defaultOrganizationId: organization._id });
      }
    }

    if (!adminMembership) {
      return { success: false, error: "Admin user has no organization membership (repair failed)" };
    }

    const organization = (await ctx.db.get(
      adminMembership.organizationId,
    )) as Doc<"organizations"> | null;
    if (!organization) {
      return { success: false, error: "Admin's organization not found" };
    }

    // =========================================================================
    // Step 2: Add editor and viewer as organization members (if not already)
    // =========================================================================
    const usersToAddToOrganization = [
      { userId: editorUser._id, role: "member" as const },
      { userId: viewerUser._id, role: "member" as const },
    ];

    for (const config of usersToAddToOrganization) {
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organization._id).eq("userId", config.userId),
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId: organization._id,
          userId: config.userId,
          role: config.role,
          addedBy: adminUser._id,
        });
      } else if (existingMember.role !== config.role) {
        // Enforce the correct role (downgrade from admin if necessary)
        await ctx.db.patch(existingMember._id, { role: config.role });
      }

      // Set as user's default organization
      await ctx.db.patch(config.userId, { defaultOrganizationId: organization._id });
    }

    // =========================================================================
    // Step 3: Create workspace and team for hierarchical testing
    // =========================================================================

    // Create a workspace (department) for the organization
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "E2E Testing Workspace",
      slug: "e2e-testing",
      description: "Workspace for E2E RBAC testing",
      icon: "🧪",
      organizationId: organization._id,
      createdBy: adminUser._id,
      updatedAt: now,
    });

    // Create a team within the workspace
    const teamId = await ctx.db.insert("teams", {
      name: "E2E Test Team",
      slug: "e2e-test-team",
      description: "Team for E2E RBAC testing",
      workspaceId,
      organizationId: organization._id,
      createdBy: adminUser._id,
      updatedAt: now,
      isPrivate: false, // Public team for testing
    });

    // Add all users to the team with appropriate roles
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: adminUser._id,
      role: "admin",
      addedBy: adminUser._id,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: editorUser._id,
      role: "member",
      addedBy: adminUser._id,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: viewerUser._id,
      role: "member",
      addedBy: adminUser._id,
    });

    // =========================================================================
    // Step 4: Create RBAC test projects at different hierarchy levels
    // =========================================================================

    // 4a. organization-level project (legacy style - no workspace/team)
    const organizationProjectKey = `${args.projectKey}-ORG`;
    let project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", organizationProjectKey))
      .filter(notDeleted)
      .first();

    if (!project) {
      // Create a default workspace for the organization-level project
      const workspaceId = await ctx.db.insert("workspaces", {
        organizationId: organization._id,
        name: "Organization Workspace",
        slug: "org-workspace",
        createdBy: adminUser._id,
        updatedAt: now,
      });

      const projectId = await ctx.db.insert("projects", {
        name: args.projectName,
        key: organizationProjectKey,
        description: "E2E test project for RBAC permission testing - organization level",
        organizationId: organization._id,
        workspaceId,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
        teamId: undefined, // Workspace-level project, no specific team
      });

      project = await ctx.db.get(projectId);
    } else {
      // Always update project metadata to match current test config
      await ctx.db.patch(project._id, {
        name: args.projectName,
        organizationId: organization._id,
        description: "E2E test project for RBAC permission testing - organization level",
      });
    }

    if (!project) {
      return { success: false, error: "Failed to create organization-level project" };
    }

    // 4b. Workspace-level project
    const workspaceProjectKey = `${args.projectKey}-WS`;
    let workspaceProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", workspaceProjectKey))
      .filter(notDeleted)
      .first();

    if (!workspaceProject) {
      const wsProjectId = await ctx.db.insert("projects", {
        name: `RBAC Workspace Project (${workspaceProjectKey})`,
        key: workspaceProjectKey,
        description: "E2E test project for RBAC - Workspace level",
        organizationId: organization._id,
        workspaceId,
        teamId, // Workspace level
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      workspaceProject = await ctx.db.get(wsProjectId);
    } else {
      await ctx.db.patch(workspaceProject._id, {
        name: `RBAC Workspace Project (${workspaceProjectKey})`,
        description: "E2E test project for RBAC - Workspace level",
        ownerId: adminUser._id, // Ensure ownership is updated
      });
    }

    // 4c. Team-level project
    const teamProjectKey = `${args.projectKey}-TM`;
    let teamProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", teamProjectKey))
      .filter(notDeleted)
      .first();

    if (!teamProject) {
      const tmProjectId = await ctx.db.insert("projects", {
        name: `RBAC Team Project (${teamProjectKey})`,
        key: teamProjectKey,
        description: "E2E test project for RBAC - Team level",
        organizationId: organization._id,
        workspaceId,
        teamId,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      teamProject = await ctx.db.get(tmProjectId);
    } else {
      await ctx.db.patch(teamProject._id, {
        name: `RBAC Team Project (${teamProjectKey})`,
        description: "E2E test project for RBAC - Team level",
        ownerId: adminUser._id, // Ensure ownership is updated
      });
    }

    // =========================================================================
    // Step 5: Add/update project members with roles for all projects
    // =========================================================================
    const memberConfigs = [
      { userId: adminUser._id, role: "admin" as const },
      { userId: editorUser._id, role: "editor" as const },
      { userId: viewerUser._id, role: "viewer" as const },
    ];

    // Add members to all three projects
    const allProjects = [project, workspaceProject, teamProject].filter(
      (p): p is NonNullable<typeof p> => p !== null && p !== undefined,
    );

    for (const proj of allProjects) {
      for (const config of memberConfigs) {
        const existingMember = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", proj._id).eq("userId", config.userId),
          )
          .filter(notDeleted)
          .first();

        if (existingMember) {
          // Update role if different
          if (existingMember.role !== config.role) {
            await ctx.db.patch(existingMember._id, { role: config.role });
          }
        } else {
          // Add new member
          await ctx.db.insert("projectMembers", {
            projectId: proj._id,
            userId: config.userId,
            role: config.role,
            addedBy: adminUser._id,
          });
        }
      }
    }

    return {
      success: true,
      projectId: project._id,
      projectKey: project.key,
      organizationId: organization._id,
      orgSlug: organization.slug,
      // Return all project info for comprehensive testing
      workspaceId,
      teamId,
      workspaceProjectId: workspaceProject?._id,
      workspaceProjectKey: workspaceProject?.key,
      teamProjectId: teamProject?._id,
      teamProjectKey: teamProject?.key,
      users: {
        admin: adminUser._id,
        editor: editorUser._id,
        viewer: viewerUser._id,
      },
    };
  },
});

/**
 * Clean up RBAC test project and its data
 * POST /e2e/cleanup-rbac-project
 * Body: { projectKey: string }
 */
export const cleanupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey } = body;

    if (!projectKey) {
      return new Response(JSON.stringify({ error: "Missing projectKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.cleanupRbacProjectInternal, { projectKey });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to clean up RBAC test project
 */
export const cleanupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.object({
      project: v.boolean(),
      members: v.number(),
      issues: v.number(),
      sprints: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .filter(notDeleted)
      .first();

    if (!project) {
      return {
        success: true,
        deleted: { project: false, members: 0, issues: 0, sprints: 0 },
      };
    }

    // Capture workspace ID before deleting project
    const workspaceId = project.workspaceId;
    // Delete all project members
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const issue of issues) {
      // Delete issue comments
      const comments = await ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .filter(notDeleted)
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      // Delete issue activity
      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }
      await ctx.db.delete(issue._id);
    }

    // Delete all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const sprint of sprints) {
      await ctx.db.delete(sprint._id);
    }

    // Delete the project
    await ctx.db.delete(project._id);

    // Verify and clean up workspace/team if they were created for E2E
    // We check if the workspace name matches our E2E pattern to avoid deleting user data
    if (workspaceId) {
      const workspace = await ctx.db.get(workspaceId);
      if (workspace && workspace.name === "E2E Testing Workspace") {
        // Delete all teams in this workspace
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .collect();
        for (const team of teams) {
          // Delete team members
          const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();
          for (const member of members) {
            await ctx.db.delete(member._id);
          }
          await ctx.db.delete(team._id);
        }
        await ctx.db.delete(workspace._id);
      }
    }

    return {
      success: true,
      deleted: {
        project: true,
        members: members.length,
        issues: issues.length,
        sprints: sprints.length,
      },
    };
  },
});

/**
 * Update organization settings for E2E testing
 * POST /e2e/update-organization-settings
 * Body: {
 *   orgSlug: string,
 *   settings: {
 *     defaultMaxHoursPerWeek?: number,
 *     defaultMaxHoursPerDay?: number,
 *     requiresTimeApproval?: boolean,
 *     billingEnabled?: boolean,
 *   }
 * }
 *
 * Allows tests to change settings profiles (e.g., enable/disable billing).
 */
export const updateOrganizationSettingsEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, settings } = body;

    if (!orgSlug) {
      return new Response(JSON.stringify({ error: "Missing orgSlug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!settings || typeof settings !== "object") {
      return new Response(JSON.stringify({ error: "Missing or invalid settings" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateOrganizationSettingsInternal, {
      orgSlug,
      settings,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to update organization settings
 */
export const updateOrganizationSettingsInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    settings: v.object({
      defaultMaxHoursPerWeek: v.optional(v.number()),
      defaultMaxHoursPerDay: v.optional(v.number()),
      requiresTimeApproval: v.optional(v.boolean()),
      billingEnabled: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    updatedSettings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find organization by slug
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    // Get current settings or use defaults
    const currentSettings = organization.settings ?? {
      defaultMaxHoursPerWeek: 40,
      defaultMaxHoursPerDay: 8,
      requiresTimeApproval: false,
      billingEnabled: true,
    };

    // Merge with provided settings
    const newSettings = {
      defaultMaxHoursPerWeek:
        args.settings.defaultMaxHoursPerWeek ?? currentSettings.defaultMaxHoursPerWeek,
      defaultMaxHoursPerDay:
        args.settings.defaultMaxHoursPerDay ?? currentSettings.defaultMaxHoursPerDay,
      requiresTimeApproval:
        args.settings.requiresTimeApproval ?? currentSettings.requiresTimeApproval,
      billingEnabled: args.settings.billingEnabled ?? currentSettings.billingEnabled,
    };

    // Update organization settings
    await ctx.db.patch(organization._id, {
      settings: newSettings,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      organizationId: organization._id,
      updatedSettings: newSettings,
    };
  },
});

/**
 * Update a seeded project's workflow state for interactive screenshot capture.
 * POST /e2e/update-project-workflow-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   stateId: string,
 *   wipLimit: number | null,
 * }
 */
export const updateProjectWorkflowStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, stateId, wipLimit } = body;

    if (!(orgSlug && projectKey && stateId)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or stateId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (wipLimit !== null && typeof wipLimit !== "number") {
      return new Response(JSON.stringify({ error: "wipLimit must be a number or null" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectWorkflowStateInternal, {
      orgSlug,
      projectKey,
      stateId,
      wipLimit,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectWorkflowStateInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    stateId: v.string(),
    wipLimit: v.union(v.number(), v.null()),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    workflowStates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          category: workflowCategories,
          order: v.number(),
          wipLimit: v.optional(v.number()),
        }),
      ),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const workflowStates = project.workflowStates ?? [];
    let stateFound = false;
    const updatedWorkflowStates = workflowStates.map((state) => {
      if (state.id !== args.stateId) {
        return state;
      }

      stateFound = true;
      return {
        ...state,
        wipLimit: args.wipLimit ?? undefined,
      };
    });

    if (!stateFound) {
      return {
        success: false,
        error: `workflow state not found: ${args.stateId}`,
      };
    }

    await ctx.db.patch(project._id, {
      workflowStates: updatedWorkflowStates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      projectId: project._id,
      workflowStates: updatedWorkflowStates,
    };
  },
});

/**
 * Replace a seeded project's workflow states for interactive screenshot capture.
 * POST /e2e/replace-project-workflow-states
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   workflowStates: WorkflowState[],
 * }
 */
export const replaceProjectWorkflowStatesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, workflowStates } = body;

    if (!(orgSlug && projectKey)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug or projectKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(workflowStates) || workflowStates.length === 0) {
      return new Response(JSON.stringify({ error: "workflowStates must be a non-empty array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectWorkflowStatesInternal, {
      orgSlug,
      projectKey,
      workflowStates,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectWorkflowStatesInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: workflowCategories,
        order: v.number(),
        wipLimit: v.optional(v.number()),
      }),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    workflowStates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          category: workflowCategories,
          order: v.number(),
          wipLimit: v.optional(v.number()),
        }),
      ),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    await ctx.db.patch(project._id, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      projectId: project._id,
      workflowStates: args.workflowStates,
    };
  },
});

/**
 * Verify a test user's email directly (bypassing email verification flow)
 * POST /e2e/verify-test-user
 * Body: { email: string }
 */
export const verifyTestUserEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.verifyTestUserInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to verify a test user's email
 */
export const verifyTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    verified: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("providerAccountId"), args.email))
      .filter(notDeleted)
      .first();

    if (!account) {
      return { success: false, verified: false, error: "Account not found" };
    }

    // Find the user
    const user = await ctx.db.get(account.userId);
    if (!user) {
      return { success: false, verified: false, error: "User not found" };
    }

    // Update both verification fields:
    // 1. authAccount.emailVerified - Used by Password provider to check verification
    // 2. user.emailVerificationTime - Our custom field for app logic
    await ctx.db.patch(account._id, {
      emailVerified: new Date().toISOString(),
    });

    // Update the user with emailVerificationTime
    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
    });

    return { success: true, verified: true };
  },
});

/** Stores plaintext OTP codes for test users with 15-minute expiration, used by E2E tests to bypass verification hashing. */
export const storeTestOtp = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
    type: otpCodeTypes,
  },
  handler: async (ctx, args) => {
    // Only allow test emails
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Delete any existing OTP for this email AND type
    const existingOtp = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", args.email).eq("type", args.type))
      .first();

    if (existingOtp) {
      await ctx.db.delete(existingOtp._id);
    }

    // Encrypt if API key is present
    let codeToStore = args.code;
    const apiKey = process.env.E2E_API_KEY;

    if (apiKey) {
      const encrypted = await encryptE2EData(args.code, apiKey);
      codeToStore = `enc:${encrypted}`;
    }

    // Store new OTP with 15-minute expiration
    await ctx.db.insert("testOtpCodes", {
      email: args.email,
      code: codeToStore,
      type: args.type,
      expiresAt: Date.now() + 15 * MINUTE,
    });
  },
});

/**
 * Get the latest OTP code for a test user (email)
 * Reads from testOtpCodes table which stores plaintext codes for E2E testing.
 */
export const getLatestOTP = internalQuery({
  args: { email: v.string(), type: otpCodeTypes },
  handler: async (ctx, args) => {
    // Only allow test emails
    if (!isTestEmail(args.email)) {
      return null;
    }

    // Get from testOtpCodes table (plaintext for E2E)
    const otpRecord = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", args.email).eq("type", args.type))
      .first();

    if (!otpRecord) return null;

    // Check if expired
    if (otpRecord.expiresAt < Date.now()) {
      return null;
    }

    // Decrypt if necessary
    if (otpRecord.code.startsWith("enc:")) {
      const apiKey = process.env.E2E_API_KEY;
      if (!apiKey) {
        throw new Error("Cannot decrypt E2E data: E2E_API_KEY missing");
      }
      return await decryptE2EData(otpRecord.code.slice(4), apiKey);
    }

    return otpRecord.code;
  },
});

/**
 * Debug endpoint: Verify password against stored hash
 * POST /e2e/debug-verify-password
 * Body: { email: string, password: string }
 *
 * Returns whether the password matches the stored hash.
 * Useful for debugging auth issues.
 */
export const debugVerifyPasswordEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.debugVerifyPasswordInternal, {
      email,
      password,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to verify password against stored hash
 */
export const debugVerifyPasswordInternal = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    accountFound: v.boolean(),
    hasStoredHash: v.boolean(),
    passwordMatches: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email (providerAccountId)
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), "password"),
          q.eq(q.field("providerAccountId"), args.email),
        ),
      )
      .filter(notDeleted)
      .first();

    if (!account) {
      return {
        success: false,
        accountFound: false,
        hasStoredHash: false,
        error: "No password account found for this email",
      };
    }

    const storedHash = account.secret;
    if (!storedHash) {
      return {
        success: false,
        accountFound: true,
        hasStoredHash: false,
        error: "Account exists but has no password hash",
      };
    }

    // Verify the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordMatches = await scrypt.verify(storedHash, args.password);

    return {
      success: true,
      accountFound: true,
      hasStoredHash: true,
      passwordMatches,
    };
  },
});

/**
 * Cleanup ALL E2E workspaces for a user (garbage collection)
 * POST /e2e/cleanup-workspaces
 * Body: { email: string }
 */
export const cleanupE2EWorkspacesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return new Response("Missing email", { status: 400 });

    const result = await ctx.runMutation(internal.e2e.cleanupE2EWorkspacesInternal, { email });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

/** Deletes E2E testing workspaces created by a specific user, including teams and team members. */
export const cleanupE2EWorkspacesInternal = internalMutation({
  args: { email: v.string() },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!user) return { deleted: 0 };

    const workspaces = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .collect();

    let deleted = 0;
    for (const ws of workspaces) {
      if (ws.name === "E2E Testing Workspace") {
        // Delete teams
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
          .collect();
        for (const team of teams) {
          const tMembers = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();
          for (const m of tMembers) await ctx.db.delete(m._id);
          await ctx.db.delete(team._id);
        }
        await ctx.db.delete(ws._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/**
 * Nuke ALL E2E workspaces (Global Cleanup)
 * POST /e2e/nuke-workspaces
 * Param: { confirm: true }
 */
export const nukeAllE2EWorkspacesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.confirm) return new Response("Missing confirm: true", { status: 400 });

    const result = await ctx.runMutation(internal.e2e.nukeAllE2EWorkspacesInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

/** Deletes all workspaces in the shared E2E organization, including teams and members. */
export const nukeAllE2EWorkspacesInternal = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    // 1. Find the shared E2E organization
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "nixelo-e2e"))
      .first();

    if (!organization) return { deleted: 0 };

    // 2. Find all workspaces in this organization
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .collect();

    let deleted = 0;
    for (const ws of workspaces) {
      // 3. Delete everything in the workspace
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .collect();

      for (const team of teams) {
        // Delete team members
        const tMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const m of tMembers) await ctx.db.delete(m._id);

        // Delete projects within the team
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .filter(notDeleted)
          .collect();
        for (const p of projects) await ctx.db.delete(p._id);

        await ctx.db.delete(team._id);
      }

      // Delete projects in workspace (if any direct children)
      const wsProjects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .filter(notDeleted)
        .collect();

      for (const p of wsProjects) await ctx.db.delete(p._id);

      await ctx.db.delete(ws._id);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * Nuke timers for E2E testing
 * POST /e2e/nuke-timers
 * Body: { email?: string }
 */
export const nukeTimersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    const result = await ctx.runMutation(internal.e2e.nukeTimersInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to nuke timers
 */
export const nukeTimersInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    let usersToCheck: Doc<"users">[] = [];

    if (args.email) {
      if (!isTestEmail(args.email)) {
        throw new Error("Only test emails allowed");
      }
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .filter(notDeleted)
        .first();
      if (user) usersToCheck.push(user);
    } else {
      // All test users
      usersToCheck = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isTestUser"), true))
        .collect();
    }

    let deletedCount = 0;
    for (const user of usersToCheck) {
      const timers = await ctx.db
        .query("timeEntries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const timer of timers) {
        await ctx.db.delete(timer._id);
        deletedCount++;
      }
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Nuke workspaces for E2E testing
 * POST /e2e/nuke-workspaces
 */
export const nukeWorkspacesEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.nukeWorkspacesInternal, {});

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to nuke workspaces created by test users
 */
export const nukeWorkspacesInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Find all test users
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .collect();

    let deletedCount = 0;

    // 2. Orphan Cleanup: Delete organizations/workspaces matching E2E patterns
    // This catches data where the creator user was already deleted

    // Delete orphan organizations by slug/name pattern
    await ctx.db
      .query("organizations")
      .withIndex("by_slug")
      .filter((q) => q.or(q.eq(q.field("slug"), "nixelo-e2e"), q.eq(q.field("name"), "Nixelo E2E")))
      .collect();

    // Also check for organizations wrapping E2E workspaces if possible?
    // Usually workspaces are children of organizations.
    // In the schema, `workspaces` have `organizationId`.
    // We should look for `workspaces` named "E2E Testing Workspace" and delete them + their parent organization if it's test-only?
    // Actually, just deleting the workspaces might be enough for the test selector?
    // The test selector looks for "E2E Testing Workspace".

    // Scan all workspaces to find "Engineering *" and other dynamic patterns
    // We fetch all because we can't filter by "startsWith" in DB query easily without specific index
    const allWorkspaces = await ctx.db.query("workspaces").collect();

    const spamWorkspaces = allWorkspaces.filter(
      (ws) =>
        ws.name === "E2E Testing Workspace" ||
        ws.name === "🧪 E2E Testing Workspace" ||
        // REMOVED "New Workspace" to prevent accidental data loss of user created workspaces
        ws.name.startsWith("Engineering ") ||
        ws.name.startsWith("Project-"), // Also clean up project leftovers if they leaked into workspaces table?
    );
    // Note: This full table scan is inefficient.
    // Ideally, we should add a `search_name` index or a `by_name_prefix` index
    // to filter these on the DB side. For now, in a test environment, this is acceptable.

    for (const ws of spamWorkspaces) {
      // Delete workspace artifacts?
      // Just delete the workspace for now to clear the UI list
      await ctx.db.delete(ws._id);
      deletedCount++;
    }

    // Continue with standard cleanup...
    for (const user of testUsers) {
      const organizations = await ctx.db
        .query("organizations")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();

      for (const organization of organizations) {
        // Delete organization members
        const members = await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const member of members) {
          await ctx.db.delete(member._id);
        }

        // Delete teams
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const team of teams) {
          await ctx.db.delete(team._id);
        }

        // Delete projects
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .filter(notDeleted)
          .collect();
        for (const project of projects) {
          await ctx.db.delete(project._id);
        }

        // Delete workspaces (departments)
        const workspaces = await ctx.db
          .query("workspaces")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const workspace of workspaces) {
          await ctx.db.delete(workspace._id);
        }

        // Delete the organization (workspace container)
        await ctx.db.delete(organization._id);
        deletedCount++;
      }
    }

    // Also cleaning up "E2E Testing Workspace" specifically if created by admin but somehow left over?
    // The above loop covers it if created by a test user.

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Reset a specific test workspace by name (Autonuke if exists)
 * POST /e2e/reset-workspace
 * Body: { name: string }
 */
export const resetTestWorkspaceEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Missing workspace name" }), { status: 400 });
    }

    const result = await ctx.runMutation(internal.e2e.resetTestWorkspaceInternal, { name });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to delete a workspace by name
 */
export const resetTestWorkspaceInternal = internalMutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    // Find workspaces with the exact name
    const workspaces = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    let deletedCount = 0;

    for (const ws of workspaces) {
      // Delete Projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .filter(notDeleted)
        .collect();
      for (const p of projects) await ctx.db.delete(p._id);

      // Delete Teams
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .collect();
      for (const t of teams) await ctx.db.delete(t._id);

      // Delete the workspace itself
      await ctx.db.delete(ws._id);
      deletedCount++;
    }

    // Also try to find organizations with this name
    const orgsWithName = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    for (const organization of orgsWithName) {
      // Delete children logic similar to nuke
      // ... abbreviated for safety, assume nuke handles big cleanup, this handles targeted test iterations
      // If we are strictly creating a workspace (department), the above workspace deletion is sufficient.
      // If we are creating a organization, we need organization deletion.
      // The test "User can create a workspace" likely creates a organization (multi-tenant root) or a WORKSPACE (project group)?
      // Based on UI text "Add new workspace", it usually maps to the top-level entity.
      // Let's delete the organization too.

      // Delete organization members
      const members = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const member of members) await ctx.db.delete(member._id);

      // Delete teams
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const team of teams) await ctx.db.delete(team._id);

      // Delete projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .filter(notDeleted)
        .collect();
      for (const project of projects) await ctx.db.delete(project._id);

      // Delete workspaces (departments)
      const workspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const workspace of workspaces) await ctx.db.delete(workspace._id);

      await ctx.db.delete(organization._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/** Lists duplicate test users by email address for debugging purposes. */
export const listDuplicateTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({
    testUsers: v.number(),
    duplicates: v.array(v.object({ email: v.string(), ids: v.array(v.id("users")) })),
  }),
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const testUsers = allUsers.filter((u) => u.email?.includes("@inbox.mailtrap.io"));

    const emailMap = new Map<string, Id<"users">[]>();
    for (const user of testUsers) {
      const email = user.email;
      if (!email) continue;
      const ids = emailMap.get(email) || [];
      ids.push(user._id);
      emailMap.set(email, ids);
    }

    const duplicates = Array.from(emailMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([email, ids]) => ({ email, ids }));

    logger.info(`[STALE] Found ${testUsers.length} total test users.`);
    logger.info(`[STALE] Found ${duplicates.length} duplicate emails.`);
    for (const d of duplicates) {
      logger.info(`[STALE] Email ${d.email} has IDs: ${d.ids.join(", ")}`);
    }

    return { testUsers: testUsers.length, duplicates };
  },
});

/**
 * Get latest OTP for a user
 * POST /e2e/get-latest-otp
 * Body: { email: string }
 */
export const getLatestOTPEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = await ctx.runQuery(internal.e2e.getLatestOTP, { email, type });

    return new Response(JSON.stringify({ code }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/** Deletes all test users and their associated data including organizations, projects, and memberships. */
export const nukeAllTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({ success: v.boolean(), deleted: v.number() }),
  handler: async (ctx) => {
    // Optimization: Use isTestUser index instead of full users table scan
    const testUsers = await ctx.db
      .query("users")
      .withIndex("isTestUser", (q) => q.eq("isTestUser", true))
      .collect();

    let deletedCount = 0;
    for (const user of testUsers) {
      // Delete accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      for (const acc of accounts) await ctx.db.delete(acc._id);

      // Delete organization memberships
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const m of memberships) await ctx.db.delete(m._id);

      // Delete project memberships
      const projMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const pm of projMemberships) await ctx.db.delete(pm._id);

      // Delete projects owned by test users
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
      for (const p of projects) await ctx.db.delete(p._id);

      // Delete auth sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const s of sessions) await ctx.db.delete(s._id);

      const createdProjects = await ctx.db
        .query("projects")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
      for (const p of createdProjects) await ctx.db.delete(p._id);

      // Delete organizations created by test users
      const organizations = await ctx.db
        .query("organizations")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();

      for (const org of organizations) {
        // Delete all members of this organization
        const members = await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const m of members) await ctx.db.delete(m._id);

        // Delete all workspaces in this organization
        const workspaces = await ctx.db
          .query("workspaces")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const w of workspaces) await ctx.db.delete(w._id);

        // Delete all teams in this organization
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const t of teams) await ctx.db.delete(t._id);

        await ctx.db.delete(org._id);
      }

      await ctx.db.delete(user._id);
      deletedCount++;
    }
    return { success: true, deleted: deletedCount };
  },
});

/**
 * Internal mutation to cleanup expired test OTP codes
 * Called by cron job to prevent testOtpCodes table from growing indefinitely
 */
/**
 * Seed screenshot data for visual regression testing
 * POST /e2e/seed-screenshot-data
 * Body: { email: string }
 *
 * Creates workspace, team, project, sprint, issues, and documents
 * so screenshot pages show filled states.
 */
export const seedScreenshotDataEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, orgSlug } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.seedScreenshotDataInternal, {
      email,
      orgSlug,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to seed screenshot data
 */
export const seedScreenshotDataInternal = internalMutation({
  args: {
    email: v.string(),
    orgSlug: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    orgSlug: v.optional(v.string()),
    projectKey: v.optional(v.string()),
    issueKeys: v.optional(v.array(v.string())),
    workspaceSlug: v.optional(v.string()),
    teamSlug: v.optional(v.string()),
    inviteToken: v.optional(v.string()),
    portalToken: v.optional(v.string()),
    portalProjectId: v.optional(v.string()),
    unsubscribeTokens: v.optional(
      v.object({
        desktopDark: v.string(),
        desktopLight: v.string(),
        tabletLight: v.string(),
        mobileLight: v.string(),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // 1. Find user by email (latest if duplicates)
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    if (users.length === 0) {
      return { success: false, error: `User not found: ${args.email}` };
    }
    const user = users.sort((a, b) => b._creationTime - a._creationTime)[0];
    const userId = user._id;

    // 1b. Set display name if missing
    if (!user.name) {
      await ctx.db.patch(userId, { name: "Emily Chen" });
    }

    // 2. Resolve the organization to seed against.
    let organizationId: Id<"organizations"> | null = null;

    if (args.orgSlug) {
      const organizationBySlug = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug as string))
        .filter(notDeleted)
        .first();

      if (!organizationBySlug) {
        return { success: false, error: `Organization not found: ${args.orgSlug}` };
      }

      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organizationBySlug._id).eq("userId", userId),
        )
        .first();

      if (!membership) {
        return {
          success: false,
          error: `User is not a member of organization: ${args.orgSlug}`,
        };
      }

      organizationId = organizationBySlug._id;
    } else {
      // Prefer user's defaultOrganizationId for deterministic org selection
      const defaultOrgId = user.defaultOrganizationId;
      if (defaultOrgId) {
        // Verify organization still exists (not hard-deleted)
        const defaultOrg = await ctx.db.get(defaultOrgId);
        if (defaultOrg) {
          // Verify membership still exists
          const defaultMembership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization_user", (q) =>
              q.eq("organizationId", defaultOrgId).eq("userId", userId),
            )
            .first();
          if (defaultMembership) {
            organizationId = defaultOrgId;
          }
        }
      }

      // Fall back to first membership only if defaultOrganizationId not usable
      if (!organizationId) {
        const membership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        if (!membership) {
          return { success: false, error: "User has no organization membership" };
        }

        organizationId = membership.organizationId;
      }
    }

    const organization = organizationId ? await ctx.db.get(organizationId) : null;
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    // Validate this is an E2E test organization to avoid seeding shared/production orgs
    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to seed non-E2E organization: ${organization.slug}. Use an org with 'nixelo-e2e' prefix.`,
      };
    }

    const orgId = organization._id;
    const orgSlug = organization.slug;
    const now = Date.now();

    // 2b. Create additional named team members (for project settings, etc.)
    const syntheticMembers: Array<{ name: string; email: string }> = [
      { name: "Alex Rivera", email: "alex-rivera-screenshots@inbox.mailtrap.io" },
      { name: "Sarah Kim", email: "sarah-kim-screenshots@inbox.mailtrap.io" },
    ];
    const syntheticUserIds: Array<typeof userId> = [];

    for (const member of syntheticMembers) {
      let existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), member.email))
        .first();

      if (!existingUser) {
        const newUserId = await ctx.db.insert("users", {
          name: member.name,
          email: member.email,
        });
        existingUser = await ctx.db.get(newUserId);
      } else if (!existingUser.name) {
        await ctx.db.patch(existingUser._id, { name: member.name });
      }

      if (!existingUser) continue;
      syntheticUserIds.push(existingUser._id);

      // Add to organization as member
      const orgMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", orgId).eq("userId", existingUser._id),
        )
        .first();
      if (!orgMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: existingUser._id,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 3. Create workspace (idempotent)
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("slug"), "product"))
      .first();

    if (!workspace) {
      const wsId = await ctx.db.insert("workspaces", {
        name: "Product",
        slug: "product",
        icon: "📱",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: now,
      });
      workspace = await ctx.db.get(wsId);
    }

    if (!workspace) {
      return { success: false, error: "Failed to create workspace" };
    }
    const workspaceId = workspace._id;

    // Ensure current user is a workspace member so workspace-scoped queries,
    // including calendar views, can actually see the seeded data.
    const existingWorkspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId))
      .first();
    if (!existingWorkspaceMember) {
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // Keep synthetic members aligned with the seeded workspace so team/workspace
    // scoped views operate on consistent membership data.
    for (const memberId of syntheticUserIds) {
      const existingWorkspaceSyntheticMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", workspaceId).eq("userId", memberId),
        )
        .first();
      if (!existingWorkspaceSyntheticMember) {
        await ctx.db.insert("workspaceMembers", {
          workspaceId,
          userId: memberId,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 4. Create team (idempotent)
    let team = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("slug"), "engineering"))
      .first();

    if (!team) {
      const newTeamId = await ctx.db.insert("teams", {
        name: "Engineering",
        slug: "engineering",
        organizationId: orgId,
        workspaceId,
        createdBy: userId,
        updatedAt: now,
        isPrivate: false,
      });
      team = await ctx.db.get(newTeamId);
    }

    if (!team) {
      return { success: false, error: "Failed to create team" };
    }
    const teamId = team._id;

    // Ensure current user is a team member (handles user re-creation between runs)
    const existingTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!existingTeamMember) {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // 4b. Add synthetic members to team
    for (const memberId of syntheticUserIds) {
      const existingTm = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .filter((q) => q.eq(q.field("userId"), memberId))
        .first();
      if (!existingTm) {
        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberId,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 5. Create project (idempotent)
    // Only re-use projects that were created by this seeding process (identified by
    // the specific description), to avoid hijacking legitimate DEMO projects in shared orgs
    const projectKey = "DEMO";
    const screenshotProjectDescription = "Demo project for screenshot visual review";
    let project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) =>
        q.and(
          notDeleted(q),
          q.eq(q.field("key"), projectKey),
          q.eq(q.field("description"), screenshotProjectDescription),
        ),
      )
      .first();

    if (!project) {
      const projId = await ctx.db.insert("projects", {
        name: "Demo Project",
        key: projectKey,
        description: screenshotProjectDescription,
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      project = await ctx.db.get(projId);
    } else {
      // Re-home the seeded project so list/detail queries all target the same org/workspace.
      await ctx.db.patch(project._id, {
        name: "Demo Project",
        description: screenshotProjectDescription,
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      project = await ctx.db.get(project._id);
    }

    if (!project) {
      return { success: false, error: "Failed to create project" };
    }
    const projectId = project._id;

    // Ensure current user is a project member (handles user re-creation between runs)
    const existingProjectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
      .filter(notDeleted)
      .first();
    if (!existingProjectMember) {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // 5b. Add synthetic members to project
    for (const memberId of syntheticUserIds) {
      const existingPm = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", memberId))
        .filter(notDeleted)
        .first();
      if (!existingPm) {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: memberId,
          role: "editor",
          addedBy: userId,
        });
      }
    }

    // Normalize screenshot project membership so stale test users don't accumulate
    // across repeated runs against the shared DEMO project.
    const intendedProjectMembers = new Map<Id<"users">, "admin" | "editor">([[userId, "admin"]]);
    for (const memberId of syntheticUserIds) {
      intendedProjectMembers.set(memberId, "editor");
    }
    const keptProjectMembershipIds = new Set<string>();
    const seenProjectMemberIds = new Set<Id<"users">>();
    while (true) {
      const activeProjectMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter(notDeleted)
        .take(BOUNDED_LIST_LIMIT);

      // Exit if we've processed all memberships (no more to fetch)
      if (activeProjectMemberships.length === 0) {
        break;
      }

      let deletedThisPass = 0;
      let newRecordsThisPass = 0;

      for (const membership of activeProjectMemberships) {
        if (keptProjectMembershipIds.has(membership._id)) {
          continue;
        }

        newRecordsThisPass += 1;
        const intendedRole = intendedProjectMembers.get(membership.userId);

        if (!intendedRole) {
          await ctx.db.patch(membership._id, softDeleteFields(userId));
          deletedThisPass += 1;
          continue;
        }

        if (seenProjectMemberIds.has(membership.userId)) {
          await ctx.db.patch(membership._id, softDeleteFields(userId));
          deletedThisPass += 1;
          continue;
        }

        seenProjectMemberIds.add(membership.userId);
        keptProjectMembershipIds.add(membership._id);

        await ctx.db.patch(membership._id, {
          role: intendedRole,
          addedBy: userId,
          isDeleted: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
        });
      }

      // Exit only if no deletions AND no new records were processed
      // (meaning we've seen all remaining records before)
      if (deletedThisPass === 0 && newRecordsThisPass === 0) {
        break;
      }
    }

    for (const [memberId, intendedRole] of intendedProjectMembers) {
      if (seenProjectMemberIds.has(memberId)) {
        continue;
      }

      await ctx.db.insert("projectMembers", {
        projectId,
        userId: memberId,
        role: intendedRole,
        addedBy: userId,
      });
    }

    // Add a second seeded project so the projects index reflects a real workspace instead
    // of stretching a single demo project across a list page.
    const secondaryProjectKey = "OPS";
    // Only look for projects in our org to avoid hijacking projects from other orgs
    let secondaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), secondaryProjectKey)))
      .first();

    if (!secondaryProject) {
      const secondaryProjectId = await ctx.db.insert("projects", {
        name: "Client Operations Hub",
        key: secondaryProjectKey,
        description: "Launch checklists, client handoffs, and delivery follow-through.",
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "scrum",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      secondaryProject = await ctx.db.get(secondaryProjectId);
    } else {
      await ctx.db.patch(secondaryProject._id, {
        name: "Client Operations Hub",
        description: "Launch checklists, client handoffs, and delivery follow-through.",
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        updatedAt: now,
        boardType: "scrum",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      secondaryProject = await ctx.db.get(secondaryProject._id);
    }

    if (!secondaryProject) {
      return { success: false, error: "Failed to create secondary project" };
    }

    const secondaryProjectId = secondaryProject._id;

    const screenshotInviteEmail = "invite-screenshots@nixelo.test";
    const existingScreenshotInvites = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", screenshotInviteEmail))
      .collect();

    for (const invite of existingScreenshotInvites) {
      await ctx.db.delete(invite._id);
    }

    const inviteToken = generateInvitePreviewToken();
    await ctx.db.insert("invites", {
      email: screenshotInviteEmail,
      role: "user",
      organizationId: orgId,
      projectId,
      projectRole: "editor",
      invitedBy: userId,
      token: inviteToken,
      expiresAt: now + WEEK,
      status: "pending",
      updatedAt: now,
    });

    const existingUnsubscribeTokens = await ctx.db
      .query("unsubscribeTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const token of existingUnsubscribeTokens) {
      await ctx.db.delete(token._id);
    }

    const unsubscribeTokens = {
      desktopDark: generateUnsubscribePreviewToken(),
      desktopLight: generateUnsubscribePreviewToken(),
      tabletLight: generateUnsubscribePreviewToken(),
      mobileLight: generateUnsubscribePreviewToken(),
    };

    for (const token of Object.values(unsubscribeTokens)) {
      await ctx.db.insert("unsubscribeTokens", {
        userId,
        token,
        usedAt: undefined,
      });
    }

    let portalClient = await ctx.db
      .query("clients")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", orgId).eq("email", "portal-screenshots@nixelo.test"),
      )
      .first();

    if (!portalClient) {
      const portalClientId = await ctx.db.insert("clients", {
        organizationId: orgId,
        name: "Northstar Labs",
        email: "portal-screenshots@nixelo.test",
        company: "Northstar Labs",
        address: "18 Market Street, Chicago, IL",
        hourlyRate: 185,
        createdBy: userId,
        updatedAt: now,
      });
      portalClient = await ctx.db.get(portalClientId);
    } else {
      await ctx.db.patch(portalClient._id, {
        name: "Northstar Labs",
        company: "Northstar Labs",
        address: "18 Market Street, Chicago, IL",
        hourlyRate: 185,
        updatedAt: now,
      });
      portalClient = await ctx.db.get(portalClient._id);
    }

    if (!portalClient) {
      return { success: false, error: "Failed to create portal client" };
    }

    const existingPortalTokens = await ctx.db
      .query("clientPortalTokens")
      .withIndex("by_client", (q) => q.eq("clientId", portalClient._id))
      .collect();

    for (const token of existingPortalTokens) {
      await ctx.db.delete(token._id);
    }

    const portalToken = `${crypto.randomUUID().replace(/-/g, "")}${crypto
      .randomUUID()
      .replace(/-/g, "")}`;

    await ctx.db.insert("clientPortalTokens", {
      organizationId: orgId,
      clientId: portalClient._id,
      token: portalToken,
      projectIds: [projectId, secondaryProjectId],
      permissions: {
        viewIssues: true,
        viewDocuments: true,
        viewTimeline: true,
        addComments: false,
      },
      expiresAt: now + 30 * DAY,
      lastAccessedAt: undefined,
      isRevoked: false,
      revokedAt: undefined,
      createdBy: userId,
      updatedAt: now,
    });

    // Normalize OPS project membership: remove stale members from previous runs
    // (autoLogin recreates the screenshot user, so old membership rows accumulate)
    const opsMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", secondaryProjectId))
      .filter(notDeleted)
      .collect();
    for (const member of opsMembers) {
      if (member.userId !== userId) {
        await ctx.db.delete(member._id);
      }
    }

    // Ensure current user is an OPS project member
    const secondaryProjectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", secondaryProjectId).eq("userId", userId),
      )
      .filter(notDeleted)
      .first();
    if (!secondaryProjectMember) {
      await ctx.db.insert("projectMembers", {
        projectId: secondaryProjectId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    const secondaryIssueDefinitions: Array<{
      key: string;
      title: string;
      priority: "lowest" | "low" | "medium" | "high" | "highest";
      status: string;
      type: "task" | "bug" | "story" | "epic";
    }> = [
      {
        key: "OPS-1",
        title: "Prepare customer launch checklist",
        priority: "high",
        status: "in-progress",
        type: "task",
      },
      {
        key: "OPS-2",
        title: "Collect approval notes for handoff packet",
        priority: "medium",
        status: "todo",
        type: "story",
      },
      {
        key: "OPS-3",
        title: "Confirm support rotation for go-live week",
        priority: "high",
        status: "in-review",
        type: "task",
      },
    ];

    for (let i = 0; i < secondaryIssueDefinitions.length; i++) {
      const def = secondaryIssueDefinitions[i];
      // Only look for issues in our secondary project to avoid hijacking issues from other orgs
      const existing = await ctx.db
        .query("issues")
        .withIndex("by_project_status", (q) => q.eq("projectId", secondaryProjectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), def.key)))
        .first();

      if (!existing) {
        await ctx.db.insert("issues", {
          projectId: secondaryProjectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          key: def.key,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: userId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
          version: 1,
        });
      } else {
        await ctx.db.patch(existing._id, {
          projectId: secondaryProjectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: userId,
          order: i,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          version: existing.version ?? 1,
          updatedAt: now,
        });
      }
    }

    // 6. Create sprint (idempotent - check by project + name)
    let sprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("name"), "Sprint 1"))
      .filter(notDeleted)
      .first();

    if (!sprint) {
      const sprintId = await ctx.db.insert("sprints", {
        projectId,
        name: "Sprint 1",
        goal: "Launch MVP features",
        status: "active",
        startDate: now - WEEK,
        endDate: now + WEEK,
        createdBy: userId,
        updatedAt: now,
      });
      sprint = await ctx.db.get(sprintId);
    }

    const sprintId = sprint?._id;

    // 7. Create issues (idempotent by key)
    const issueDefinitions: Array<{
      key: string;
      title: string;
      type: "task" | "bug" | "story" | "epic";
      status: string;
      priority: "lowest" | "low" | "medium" | "high" | "highest";
      assigned: boolean;
      inSprint: boolean;
      dueDate?: number;
    }> = [
      {
        key: "DEMO-1",
        title: "Set up CI/CD pipeline",
        type: "task",
        status: "done",
        priority: "high",
        assigned: true,
        inSprint: true,
        dueDate: now - 2 * DAY,
      },
      {
        key: "DEMO-2",
        title: "Fix login timeout on mobile",
        type: "bug",
        status: "in-progress",
        priority: "highest",
        assigned: true,
        inSprint: true,
        dueDate: now + 1 * DAY,
      },
      {
        key: "DEMO-3",
        title: "Design new dashboard layout",
        type: "story",
        status: "in-review",
        priority: "medium",
        assigned: true,
        inSprint: true,
        dueDate: now + 3 * DAY,
      },
      {
        key: "DEMO-4",
        title: "Add dark mode support",
        type: "story",
        status: "todo",
        priority: "medium",
        assigned: false,
        inSprint: true,
        dueDate: now + 7 * DAY,
      },
      {
        key: "DEMO-5",
        title: "Database query optimization",
        type: "task",
        status: "in-progress",
        priority: "high",
        assigned: true,
        inSprint: false,
      },
      {
        key: "DEMO-6",
        title: "User onboarding flow",
        type: "epic",
        status: "todo",
        priority: "low",
        assigned: false,
        inSprint: false,
      },
      {
        key: "DEMO-7",
        title: "Improve release checklist",
        type: "task",
        status: "todo",
        priority: "high",
        assigned: true,
        inSprint: true,
        dueDate: now + 2 * DAY,
      },
    ];

    const createdIssueKeys: string[] = [];

    for (let i = 0; i < issueDefinitions.length; i++) {
      const def = issueDefinitions[i];
      // Only look for issues in our screenshot project to avoid hijacking issues from other orgs
      const existing = await ctx.db
        .query("issues")
        .withIndex("by_project_status", (q) => q.eq("projectId", projectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), def.key)))
        .first();

      if (!existing) {
        await ctx.db.insert("issues", {
          projectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          key: def.key,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: def.assigned ? userId : undefined,
          sprintId: def.inSprint && sprintId ? sprintId : undefined,
          dueDate: def.dueDate,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
          version: 1,
        });
      } else {
        // Keep seeded issues attached to the current screenshot project instead of stale globals.
        await ctx.db.patch(existing._id, {
          projectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: def.assigned ? userId : undefined,
          sprintId: def.inSprint && sprintId ? sprintId : undefined,
          dueDate: def.dueDate,
          order: i,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          version: existing.version ?? 1,
          updatedAt: now,
        });
      }
      createdIssueKeys.push(def.key);
    }

    // 8. Create documents (idempotent by title + project)
    // Only look for documents in our screenshot project to avoid overwriting real docs
    const docTitles = ["Project Requirements", "Sprint Retrospective Notes"] as const;
    for (const title of docTitles) {
      let existingDoc = await ctx.db
        .query("documents")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("title"), title)))
        .first();

      if (!existingDoc) {
        const insertedId = await ctx.db.insert("documents", {
          title,
          isPublic: false,
          createdBy: userId,
          updatedAt: now,
          organizationId: orgId,
          workspaceId,
          projectId,
        });

        existingDoc = await ctx.db.get(insertedId);
      }

      if (!existingDoc) {
        continue;
      }

      const latestVersion = await ctx.db
        .query("documentVersions")
        .withIndex("by_document", (q) => q.eq("documentId", existingDoc._id))
        .order("desc")
        .first();

      const seededSnapshot = SCREENSHOT_DOCUMENT_SNAPSHOTS[title];
      // Insert a new version if no version exists OR if the snapshot has changed
      // (allows re-seeding to update stale document content across runs)
      if (
        seededSnapshot &&
        JSON.stringify(latestVersion?.snapshot ?? null) !== JSON.stringify(seededSnapshot)
      ) {
        await ctx.db.insert("documentVersions", {
          documentId: existingDoc._id,
          version: (latestVersion?.version ?? 0) + 1,
          snapshot: seededSnapshot,
          title,
          createdBy: userId,
        });
      }
    }

    // 9. Create calendar events (idempotent by organizer + title)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const calendarDefs: Array<{
      title: string;
      startHour: number;
      startMin: number;
      endHour: number;
      endMin: number;
      dayOffset: number;
      eventType: "meeting" | "deadline" | "timeblock" | "personal";
      color: CalendarEventColor;
      description?: string;
    }> = [
      // Today (dayOffset: 0) — 4 events to show overlap handling
      {
        title: "Sprint Planning",
        startHour: 9,
        startMin: 0,
        endHour: 10,
        endMin: 0,
        dayOffset: 0,
        eventType: "meeting",
        color: "blue",
        description: "Review sprint goals and assign tasks",
      },
      {
        title: "Design Review",
        startHour: 10,
        startMin: 30,
        endHour: 11,
        endMin: 30,
        dayOffset: 0,
        eventType: "meeting",
        color: "purple",
        description: "Review dashboard mockups with the team",
      },
      {
        title: "Focus Time: Bug Fixes",
        startHour: 14,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 0,
        eventType: "timeblock",
        color: "green",
        description: "Deep focus on critical bug fixes",
      },
      {
        title: "Standup Check-in",
        startHour: 16,
        startMin: 30,
        endHour: 17,
        endMin: 0,
        dayOffset: 0,
        eventType: "meeting",
        color: "teal",
        description: "Quick daily sync with the team",
      },
      // Tomorrow (dayOffset: 1)
      {
        title: "Client Demo",
        startHour: 11,
        startMin: 0,
        endHour: 12,
        endMin: 0,
        dayOffset: 1,
        eventType: "meeting",
        color: "orange",
        description: "Demo new features to client stakeholders",
      },
      {
        title: "Architecture Discussion",
        startHour: 14,
        startMin: 0,
        endHour: 15,
        endMin: 30,
        dayOffset: 1,
        eventType: "meeting",
        color: "indigo",
        description: "Discuss API v2 migration plan",
      },
      // Day +2
      {
        title: "Code Review Session",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 0,
        dayOffset: 2,
        eventType: "meeting",
        color: "amber",
        description: "Review open pull requests for the sprint",
      },
      {
        title: "Deep Work: API Integration",
        startHour: 13,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 2,
        eventType: "timeblock",
        color: "green",
        description: "Focus block for third-party API integration",
      },
      // Day +3
      {
        title: "Team Retrospective",
        startHour: 15,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 3,
        eventType: "meeting",
        color: "blue",
        description: "Sprint retrospective and improvement planning",
      },
      {
        title: "Gym & Wellness",
        startHour: 12,
        startMin: 0,
        endHour: 13,
        endMin: 0,
        dayOffset: 3,
        eventType: "personal",
        color: "pink",
        description: "Lunch break workout",
      },
      // Day +4
      {
        title: "QA Testing Window",
        startHour: 9,
        startMin: 0,
        endHour: 12,
        endMin: 0,
        dayOffset: 4,
        eventType: "timeblock",
        color: "green",
        description: "End-to-end testing before release",
      },
      {
        title: "Release Review",
        startHour: 14,
        startMin: 0,
        endHour: 15,
        endMin: 0,
        dayOffset: 4,
        eventType: "meeting",
        color: "red",
        description: "Go/no-go decision for v2.1 release",
      },
      // Day +5
      {
        title: "Sprint Deadline",
        startHour: 17,
        startMin: 0,
        endHour: 17,
        endMin: 30,
        dayOffset: 5,
        eventType: "deadline",
        color: "red",
        description: "All sprint items must be completed",
      },
      {
        title: "Knowledge Sharing",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 0,
        dayOffset: 5,
        eventType: "meeting",
        color: "purple",
        description: "Tech talk: React Server Components deep dive",
      },
      // Day +6
      {
        title: "Backlog Grooming",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 30,
        dayOffset: 6,
        eventType: "meeting",
        color: "indigo",
        description: "Prioritize and estimate upcoming stories",
      },
    ];

    for (const cal of calendarDefs) {
      const startTime =
        todayMs + cal.dayOffset * DAY + cal.startHour * HOUR + cal.startMin * MINUTE;
      const endTime = todayMs + cal.dayOffset * DAY + cal.endHour * HOUR + cal.endMin * MINUTE;

      const existing = await ctx.db
        .query("calendarEvents")
        .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
        .filter((q) => q.eq(q.field("title"), cal.title))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          organizationId: orgId,
          workspaceId,
          projectId,
          description: cal.description,
          startTime,
          endTime,
          eventType: cal.eventType,
          color: cal.color,
          attendeeIds: [userId, ...syntheticUserIds],
          status: "confirmed",
          isRecurring: false,
          isRequired: cal.eventType === "meeting",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("calendarEvents", {
          organizationId: orgId,
          workspaceId,
          projectId,
          title: cal.title,
          description: cal.description,
          startTime,
          endTime,
          allDay: false,
          eventType: cal.eventType,
          color: cal.color,
          organizerId: userId,
          attendeeIds: [userId, ...syntheticUserIds],
          status: "confirmed",
          isRecurring: false,
          isRequired: cal.eventType === "meeting",
          updatedAt: now,
        });
      }
    }

    // 10. Create time entries (idempotent by user + description)
    const timeEntryDefs: Array<{
      description: string;
      dayOffset: number;
      durationHours: number;
      activity: string;
      billable: boolean;
      hourlyRate?: number;
    }> = [
      {
        description: "CI/CD pipeline setup and configuration",
        dayOffset: -2,
        durationHours: 4,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Bug investigation: login timeout on mobile",
        dayOffset: -1,
        durationHours: 3,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Dashboard design review with team",
        dayOffset: -1,
        durationHours: 1.5,
        activity: "Code Review",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Sprint planning meeting",
        dayOffset: 0,
        durationHours: 1,
        activity: "Meeting",
        billable: false,
      },
      {
        description: "Mobile login fix implementation",
        dayOffset: 0,
        durationHours: 2.5,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
    ];

    for (const entry of timeEntryDefs) {
      const entryDate = todayMs + entry.dayOffset * DAY;
      const existing = await ctx.db
        .query("timeEntries")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", entryDate))
        .filter((q) => q.eq(q.field("description"), entry.description))
        .first();

      if (!existing) {
        const durationSeconds = entry.durationHours * 3600;
        const startTime = entryDate + 9 * HOUR; // 9 AM
        const endTime = startTime + durationSeconds * SECOND;
        const totalCost =
          entry.billable && entry.hourlyRate ? entry.durationHours * entry.hourlyRate : undefined;

        await ctx.db.insert("timeEntries", {
          userId,
          projectId,
          startTime,
          endTime,
          duration: durationSeconds,
          date: entryDate,
          description: entry.description,
          activity: entry.activity,
          tags: [],
          hourlyRate: entry.hourlyRate,
          totalCost,
          currency: "USD",
          billable: entry.billable,
          billed: false,
          isEquityHour: false,
          isLocked: false,
          isApproved: false,
          updatedAt: now,
        });
      }
    }

    // 10b. Create notifications (idempotent by type + title substring)
    const notificationDefs: Array<{
      type: string;
      title: string;
      body: string;
      hoursAgo: number;
    }> = [
      {
        type: "issue_assigned",
        title: "Issue assigned to you",
        body: "DEMO-1: Set up CI/CD pipeline was assigned to you",
        hoursAgo: 1,
      },
      {
        type: "issue_commented",
        title: "New comment on DEMO-3",
        body: 'Alex Rivera commented: "Dashboard layout looks great, merging now."',
        hoursAgo: 3,
      },
      {
        type: "issue_mentioned",
        title: "You were mentioned",
        body: "Sarah Kim mentioned you in DEMO-5: Database query optimization",
        hoursAgo: 8,
      },
      {
        type: "issue_status_changed",
        title: "Issue status updated",
        body: "DEMO-2: Fix login timeout moved from In Progress to In Review",
        hoursAgo: 24,
      },
      {
        type: "sprint_started",
        title: "Sprint started",
        body: "Sprint 1 has started with 5 issues assigned",
        hoursAgo: 48,
      },
    ];

    for (const notif of notificationDefs) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isDeleted", undefined))
        .filter((q) => q.eq(q.field("title"), notif.title))
        .first();

      if (!existing) {
        await ctx.db.insert("notifications", {
          userId,
          type: notif.type,
          title: notif.title,
          message: notif.body,
          isRead: notif.hoursAgo > 12,
          projectId,
          actorId: syntheticUserIds[0],
        });
      }
    }

    // 11. Return result
    return {
      success: true,
      orgSlug,
      projectKey,
      issueKeys: createdIssueKeys,
      workspaceSlug: "product",
      teamSlug: "engineering",
      inviteToken,
      portalToken,
      portalProjectId: projectId,
      unsubscribeTokens,
    };
  },
});

/** Cleans up expired test OTP codes to prevent table bloat. */
export const cleanupExpiredOtpsInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired OTP codes using the by_expiry index
    const expiredOtps = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    let deletedCount = 0;
    for (const otp of expiredOtps) {
      await ctx.db.delete(otp._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Batch cleanup endpoint - deletes test data in small batches to avoid 32k read limit.
 * Call this repeatedly until it returns { done: true }.
 * POST /e2e/batch-cleanup
 */
export const batchCleanupEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.batchCleanupInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Programmatic Google OAuth Login for E2E Testing
 * POST /e2e/google-oauth-login
 * Body: { refreshToken: string, skipOnboarding?: boolean }
 *
 * Uses a pre-generated Google refresh token (from OAuth Playground) to:
 * 1. Exchange refresh token for access token
 * 2. Fetch user profile from Google
 * 3. Create or login user via @convex-dev/auth Google provider
 * 4. Return auth tokens for the test to use
 *
 * This bypasses Google's browser OAuth flow (no captchas, no flakiness).
 */
export const googleOAuthLoginEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { refreshToken, skipOnboarding = false } = body;

    // Use provided token or fall back to OAUTH_MONITOR token
    const tokenToUse = refreshToken || process.env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN;

    if (!tokenToUse) {
      return new Response(
        JSON.stringify({
          error:
            "Missing refresh token. Provide refreshToken in body or set OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get Google OAuth credentials (same as used by @convex-dev/auth)
    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;

    if (!(clientId && clientSecret)) {
      return new Response(
        JSON.stringify({
          error: "Google OAuth not configured (AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET)",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Step 1: Exchange refresh token for access token
    const tokenResponse = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenToUse,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json().catch(() => ({}))) as {
        error?: string;
        error_description?: string;
      };
      return new Response(
        JSON.stringify({
          error: `Token refresh failed: ${errorData.error_description || errorData.error || tokenResponse.status}`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };
    const accessToken = tokens.access_token;

    // Step 2: Fetch user profile from Google
    const userInfoResponse = await fetchWithTimeout(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!userInfoResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch Google user info: ${userInfoResponse.status}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const googleUser = (await userInfoResponse.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    // Step 3: Create or update user in Convex (same as normal Google OAuth flow)
    const result = await ctx.runMutation(internal.e2e.createGoogleOAuthUserInternal, {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      skipOnboarding,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Login the user to get auth tokens
    // Use the signIn action with the "password" provider but skip password verification
    // Actually, we need to create a session directly since @convex-dev/auth Google flow
    // requires browser redirects. We'll create auth session manually.
    const authResult = await ctx.runMutation(internal.e2e.createGoogleOAuthSessionInternal, {
      userId: result.userId as Id<"users">,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email: googleUser.email,
        userId: result.userId,
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        redirectUrl: result.redirectUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to create/update user from Google OAuth profile
 */
export const createGoogleOAuthUserInternal = internalMutation({
  args: {
    googleId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
    skipOnboarding: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.id("users")),
    redirectUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { googleId, email, name, picture, skipOnboarding } = args;

    // Check if user exists by email
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (user) {
      // Update existing user with Google info
      await ctx.db.patch(user._id, {
        name: name || user.name,
        image: picture || user.image,
        emailVerificationTime: user.emailVerificationTime || Date.now(),
      });
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email,
        name,
        image: picture,
        emailVerificationTime: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      return { success: false, error: "Failed to create/get user" };
    }

    // Check/create Google auth account link
    const existingAccount = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(q.eq(q.field("provider"), "google"), q.eq(q.field("providerAccountId"), googleId)),
      )
      .first();

    if (!existingAccount) {
      // Link Google account to user
      await ctx.db.insert("authAccounts", {
        userId: user._id,
        provider: "google",
        providerAccountId: googleId,
      });
    } else if (existingAccount.userId !== user._id) {
      // Account linked to different user - this shouldn't happen in E2E
      return { success: false, error: "Google account linked to different user" };
    }

    // Handle onboarding
    let redirectUrl = "/app";
    if (skipOnboarding) {
      // Mark onboarding as complete
      const existingOnboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!existingOnboarding) {
        await ctx.db.insert("userOnboarding", {
          userId: user._id,
          onboardingCompleted: true,
          onboardingStep: 5,
          sampleWorkspaceCreated: false,
          tourShown: true,
          wizardCompleted: true,
          checklistDismissed: true,
          updatedAt: Date.now(),
        });
      } else if (!existingOnboarding.onboardingCompleted) {
        await ctx.db.patch(existingOnboarding._id, {
          onboardingCompleted: true,
          updatedAt: Date.now(),
        });
      }
      redirectUrl = "/app";
    } else {
      // Check if onboarding is needed
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!onboarding?.onboardingCompleted) {
        redirectUrl = "/onboarding";
      }
    }

    return {
      success: true,
      userId: user._id,
      redirectUrl,
    };
  },
});

/**
 * Internal mutation to create auth session for Google OAuth user
 * This creates a session directly, bypassing the normal @convex-dev/auth flow
 */
export const createGoogleOAuthSessionInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    token: v.string(),
    refreshToken: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Generate session tokens (similar to @convex-dev/auth internal flow)
    // Create a new auth session
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + MONTH,
    });

    // Generate tokens - using a simple but unique format
    // In production @convex-dev/auth uses JWT, but for E2E we just need working tokens
    const token = `e2e_${sessionId}_${Date.now()}`;
    const refreshToken = `e2e_refresh_${sessionId}_${Date.now()}`;

    return { token, refreshToken };
  },
});

/** Batch cleanup - processes up to 500 items per call to stay under limits. */
export const batchCleanupInternal = internalMutation({
  args: {},
  returns: v.object({
    done: v.boolean(),
    deleted: v.number(),
    remaining: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const BATCH_SIZE = 500;
    let deletedCount = 0;

    // 1. Clean up spam workspaces first (these cause UI issues)
    const spamWorkspaces = await ctx.db.query("workspaces").take(BATCH_SIZE * 2); // Take more to filter

    const toDelete = spamWorkspaces.filter(
      (ws) =>
        ws.name === "E2E Testing Workspace" ||
        ws.name === "🧪 E2E Testing Workspace" ||
        // REMOVED "New Workspace" to prevent accidental data loss of user created workspaces
        ws.name === "Organization Workspace" ||
        ws.name.startsWith("Engineering ") ||
        ws.name.startsWith("Project-"),
    );

    if (toDelete.length > 0) {
      for (const ws of toDelete.slice(0, BATCH_SIZE)) {
        await ctx.db.delete(ws._id);
        deletedCount++;
      }
      if (toDelete.length > BATCH_SIZE) {
        return {
          done: false,
          deleted: deletedCount,
          remaining: `${toDelete.length - BATCH_SIZE} workspaces`,
        };
      }
    }

    // 2. Clean up test users and their data
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .take(50);

    for (const user of testUsers) {
      // Delete auth accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .take(100);
      for (const acc of accounts) {
        await ctx.db.delete(acc._id);
        deletedCount++;
      }

      // Delete auth sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .take(100);
      for (const s of sessions) {
        await ctx.db.delete(s._id);
        deletedCount++;
      }

      // Delete organization memberships
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(100);
      for (const m of memberships) {
        await ctx.db.delete(m._id);
        deletedCount++;
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    if (testUsers.length > 0) {
      return { done: false, deleted: deletedCount, remaining: "more test users" };
    }

    // 3. Clean up orphan organizations with E2E patterns
    const orgs = await ctx.db.query("organizations").take(BATCH_SIZE);

    const e2eOrgs = orgs.filter(
      (o) =>
        o.slug?.startsWith("nixelo-e2e") ||
        o.name?.includes("E2E") ||
        o.name?.startsWith("E2E Org"),
    );

    for (const org of e2eOrgs.slice(0, 50)) {
      // Delete org members
      const members = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .take(100);
      for (const m of members) {
        await ctx.db.delete(m._id);
        deletedCount++;
      }

      // Delete workspaces in org
      const workspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .take(100);
      for (const w of workspaces) {
        await ctx.db.delete(w._id);
        deletedCount++;
      }

      await ctx.db.delete(org._id);
      deletedCount++;
    }

    if (e2eOrgs.length > 0) {
      return { done: false, deleted: deletedCount, remaining: "more orgs" };
    }

    return { done: true, deleted: deletedCount };
  },
});
