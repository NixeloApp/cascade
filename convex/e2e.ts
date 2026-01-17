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
import { httpAction, internalMutation } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";

// Test user expiration (1 hour - for garbage collection)
const TEST_USER_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Check if email is a test email
 */
function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

/**
 * Validate E2E API key from request headers
 * Returns error Response if invalid, null if valid
 */
function validateE2EApiKey(request: Request): Response | null {
  const apiKey = process.env.E2E_API_KEY;

  // If no API key is configured, reject all requests in production
  if (!apiKey) {
    // Allow in development (no key configured = development mode)
    if (process.env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "E2E endpoints disabled in production" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null; // Allow in dev without key
  }

  const providedKey = request.headers.get("x-e2e-api-key");
  if (providedKey !== apiKey) {
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
export const createTestUserEndpoint = httpAction(async (ctx, request) => {
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
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
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
            createdAt: now,
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
          // Check if shared E2E test organization already exists
          const organizationName = "Nixelo E2E";
          const slug = "nixelo-e2e";

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
              createdAt: now,
              updatedAt: now,
            });
          }

          await ctx.db.insert("organizationMembers", {
            organizationId,
            userId: existingUser._id,
            role: "admin",
            addedBy: existingUser._id,
            addedAt: now,
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
        createdAt: now,
        updatedAt: now,
      });

      // Check if shared E2E test organization already exists
      const organizationName = "Nixelo E2E";
      const slug = "nixelo-e2e";

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
          createdAt: now,
          updatedAt: now,
        });
      }

      // Add user as admin of the organization
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId,
        role: "admin",
        addedBy: userId,
        addedAt: now,
      });

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
    const accountsByEmail = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("providerAccountId"), args.email))
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

/**
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
    const oldTestUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(q.eq(q.field("isTestUser"), true), q.lt(q.field("testUserCreatedAt"), cutoffTime)),
      )
      .collect();

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
    const result = await ctx.runMutation(internal.projectTemplates.initializeBuiltInTemplates, {});
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

    console.log(`[RBAC-SETUP] Admin resolved to: ${adminUser?._id} (${args.adminEmail})`);
    console.log(`[RBAC-SETUP] Editor resolved to: ${editorUser?._id} (${args.editorEmail})`);
    console.log(`[RBAC-SETUP] Viewer resolved to: ${viewerUser?._id} (${args.viewerEmail})`);

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
    const adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
      .first();

    if (!adminMembership) {
      return { success: false, error: "Admin user has no organization membership" };
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
          addedAt: now,
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
      createdAt: now,
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
      createdAt: now,
      updatedAt: now,
      isPrivate: false, // Public team for testing
    });

    // Add all users to the team with appropriate roles
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: adminUser._id,
      role: "lead",
      addedBy: adminUser._id,
      addedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: editorUser._id,
      role: "member",
      addedBy: adminUser._id,
      addedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: viewerUser._id,
      role: "member",
      addedBy: adminUser._id,
      addedAt: now,
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
        createdAt: now,
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
        createdAt: now,
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
        createdAt: now,
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
        createdAt: now,
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
    const projectId = project._id;
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
            addedAt: now,
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
    const teamId = project.teamId;

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

// Legacy exports for backwards compatibility (can be removed later)
export const resetAllOnboarding = internalMutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Delete all userOnboarding records for test users
    const records = await ctx.db.query("userOnboarding").collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    return { deleted: records.length };
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

    // 2. Orphan Cleanup: Delete companies/workspaces matching E2E patterns
    // This catches data where the creator user was already deleted

    // Delete orphan companies by slug/name pattern
    const orphanCompanies = await ctx.db
      .query("organizations")
      .withIndex("by_slug")
      .filter((q) => q.or(q.eq(q.field("slug"), "nixelo-e2e"), q.eq(q.field("name"), "Nixelo E2E")))
      .collect();

    // Also check for companies wrapping E2E workspaces if possible?
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
        ws.name === "New Workspace" ||
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
      const companies = await ctx.db
        .query("organizations")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();

      for (const organization of companies) {
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

    // Also try to find companies (containers) with this name?
    // "E2E Testing Workspace" is used for the workspace list item, which comes from companies/workspaces.
    // Let's also check companies just in case
    const companies = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    for (const organization of companies) {
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

    console.log("[STALE] Found ", testUsers.length, " total test users.");
    console.log("[STALE] Found ", duplicates.length, " duplicate emails.");
    for (const d of duplicates) {
      console.log("[STALE] Email ", d.email, " has IDs: ", d.ids.join(", "));
    }

    return { testUsers: testUsers.length, duplicates };
  },
});

export const nukeAllTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({ success: v.boolean(), deleted: v.number() }),
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const testUsers = allUsers.filter((u) => u.email?.includes("@inbox.mailtrap.io"));

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

      const createdProjects = await ctx.db
        .query("projects")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
      for (const p of createdProjects) await ctx.db.delete(p._id);

      await ctx.db.delete(user._id);
      deletedCount++;
    }
    return { success: true, deleted: deletedCount };
  },
});
