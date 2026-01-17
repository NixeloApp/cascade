/**
 * Test utilities for Convex backend tests
 *
 * This file provides helper functions for creating test data and managing test authentication.
 *
 * IMPORTANT: Authentication in tests
 * ----------------------------------
 * The @convex-dev/auth library's getAuthUserId() function works by:
 * 1. Calling ctx.auth.getUserIdentity()
 * 2. Extracting the 'subject' field
 * 3. Splitting by '|' delimiter and returning the first part as the user ID
 *
 * To properly authenticate in tests, use the asUser() helper which returns
 * a test accessor with the correct identity format.
 *
 * @see https://labs.convex.dev/auth/api_reference/server
 */

import type { TestConvex } from "convex-test";
import type { Id } from "./_generated/dataModel";
import type schema from "./schema";

type TestCtx = TestConvex<typeof schema>;

/**
 * TOKEN_SUB_CLAIM_DIVIDER used by @convex-dev/auth
 * The subject field format is: `${userId}|${sessionId}`
 */
const TOKEN_SUB_CLAIM_DIVIDER = "|";

/**
 * Create a test user
 *
 * @param t - Convex test helper
 * @param userData - Optional user data
 * @returns User ID
 */
export async function createTestUser(
  t: TestCtx,
  userData?: {
    name?: string;
    email?: string;
  },
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    const name = userData?.name || `Test User ${Date.now()}`;
    const email = userData?.email || `test${Date.now()}@example.com`;

    return await ctx.db.insert("users", {
      name,
      email,
      emailVerificationTime: Date.now(),
      image: undefined,
    });
  });
}

/**
 * Create an authenticated test accessor for a user
 *
 * This properly sets up the identity so that getAuthUserId() from @convex-dev/auth
 * correctly returns the user ID. The subject field must be formatted as:
 * `${userId}|${sessionId}` (or just userId for tests).
 *
 * @param t - Convex test helper
 * @param userId - User ID to authenticate as
 * @returns Test accessor with proper authentication
 *
 * @example
 * ```typescript
 * const userId = await createTestUser(t);
 * const asUser = asAuthenticatedUser(t, userId);
 * const doc = await asUser.mutation(api.documents.create, { title: "Test" });
 * ```
 */
export function asAuthenticatedUser(t: TestCtx, userId: Id<"users">) {
  // Format: userId|sessionId - the getAuthUserId extracts the part before the delimiter
  const subject = `${userId}${TOKEN_SUB_CLAIM_DIVIDER}test-session-${Date.now()}`;
  return t.withIdentity({ subject });
}

/**
 * Create a test project
 *
 * @param t - Convex test helper
 * @param creatorId - User ID of the project creator (also becomes owner)
 * @param organizationId - organization ID the project belongs to
 * @param projectData - Optional project data
 * @returns Project ID
 */
export async function createProjectInOrganization(
  t: TestCtx,
  creatorId: Id<"users">,
  organizationId: Id<"organizations">,
  projectData?: {
    name?: string;
    key?: string;
    description?: string;
    isPublic?: boolean;
    boardType?: "kanban" | "scrum";
  },
): Promise<Id<"projects">> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const name = projectData?.name || `Test Project ${now}`;
    const key = projectData?.key || `TEST${now.toString().slice(-6)}`;

    // Create workspace and team first
    const workspaceId = await ctx.db.insert("workspaces", {
      organizationId,
      name: `Workspace for ${name}`,
      slug: `ws-${key.toLowerCase()}`,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    });

    const teamId = await ctx.db.insert("teams", {
      organizationId,
      workspaceId,
      name: `Team for ${name}`,
      slug: `team-${key.toLowerCase()}`,
      isPrivate: false,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    });

    const projectId = await ctx.db.insert("projects", {
      name,
      key: key.toUpperCase(),
      description: projectData?.description,
      organizationId,
      workspaceId,
      teamId,
      ownerId: creatorId,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
      isPublic: projectData?.isPublic ?? false,
      boardType: projectData?.boardType || "kanban",
      workflowStates: [
        {
          id: "todo",
          name: "To Do",
          category: "todo" as const,
          order: 0,
        },
        {
          id: "inprogress",
          name: "In Progress",
          category: "inprogress" as const,
          order: 1,
        },
        {
          id: "done",
          name: "Done",
          category: "done" as const,
          order: 2,
        },
      ],
    });

    // Add creator as admin member
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: creatorId,
      role: "admin",
      addedBy: creatorId,
      addedAt: now,
    });

    return projectId;
  });
}

/**
 * @deprecated Use createProjectInOrganization instead
 */
export async function createTestProject(
  t: TestCtx,
  creatorId: Id<"users">,
  projectData?: {
    name?: string;
    key?: string;
    description?: string;
    isPublic?: boolean;
    boardType?: "kanban" | "scrum";
  },
): Promise<Id<"projects">> {
  // Create an organization first for backward compatibility
  const { organizationId } = await createOrganizationAdmin(t, creatorId);
  return createProjectInOrganization(t, creatorId, organizationId, projectData);
}

/**
 * Add a member to a project with a specific role
 *
 * @param t - Convex test helper
 * @param projectId - Project ID
 * @param userId - User ID to add
 * @param role - Role to assign
 * @param addedBy - User ID of the user adding the member
 * @returns Project member ID
 */
export async function addProjectMember(
  t: TestCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
  role: "admin" | "editor" | "viewer",
  addedBy: Id<"users">,
): Promise<Id<"projectMembers">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role,
      addedBy,
      addedAt: Date.now(),
    });
  });
}

/**
 * Create a test issue
 *
 * @param t - Convex test helper
 * @param projectId - Project ID
 * @param reporterId - User ID of the reporter
 * @param issueData - Optional issue data
 * @returns Issue ID
 */
export async function createTestIssue(
  t: TestCtx,
  projectId: Id<"projects">,
  reporterId: Id<"users">,
  issueData?: {
    title?: string;
    description?: string;
    type?: "task" | "bug" | "story" | "epic";
    status?: string;
    priority?: "lowest" | "low" | "medium" | "high" | "highest";
    assigneeId?: Id<"users">;
  },
): Promise<Id<"issues">> {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Get project to construct issue key
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Count existing issues to generate key
    const issueCount = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()
      .then((issues) => issues.length);

    const key = `${project.key}-${issueCount + 1}`;

    return await ctx.db.insert("issues", {
      projectId,
      workspaceId: project.workspaceId,
      teamId: project.teamId,
      key,
      title: issueData?.title || `Test Issue ${now}`,
      description: issueData?.description,
      type: issueData?.type || "task",
      status: issueData?.status || "todo",
      priority: issueData?.priority || "medium",
      assigneeId: issueData?.assigneeId,
      reporterId,
      createdAt: now,
      updatedAt: now,
      labels: [],
      linkedDocuments: [],
      attachments: [],
      loggedHours: 0,
      order: issueCount,
    });
  });
}

/**
 * Helper to expect async function to throw
 *
 * @param fn - Async function to test
 * @param expectedError - Expected error message (can be partial match)
 */
export async function expectThrowsAsync(
  fn: () => Promise<unknown>,
  expectedError?: string,
): Promise<void> {
  let error: Error | undefined;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error("Expected function to throw, but it didn't");
  }

  if (expectedError && !error.message.includes(expectedError)) {
    throw new Error(
      `Expected error message to include "${expectedError}", but got: ${error.message}`,
    );
  }
}

/**
 * Create an organization and add user as admin/owner
 *
 * This properly sets up organization admin status by creating both
 * the organization record and the organizationMembers record.
 *
 * @param t - Convex test helper
 * @param userId - User ID to make admin
 * @param organizationData - Optional organization data
 * @returns organization ID
 */
export async function createOrganizationAdmin(
  t: TestCtx,
  userId: Id<"users">,
  organizationData?: {
    name?: string;
    slug?: string;
  },
): Promise<{
  organizationId: Id<"organizations">;
  workspaceId: Id<"workspaces">;
  teamId: Id<"teams">;
}> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const name = organizationData?.name || `Test organization ${now}`;
    const slug = organizationData?.slug || `test-organization-${now}`;

    const organizationId = await ctx.db.insert("organizations", {
      createdBy: userId,
      timezone: "America/New_York",
      settings: {
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 8,
        requiresTimeApproval: false,
        billingEnabled: false,
      },
      name,
      slug,

      createdAt: now,
      updatedAt: now,
    });

    // Add user as owner in organizationMembers
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId,
      role: "owner",
      addedBy: userId,
      addedAt: now,
    });

    // Create default workspace for tests
    const workspaceId = await ctx.db.insert("workspaces", {
      organizationId,
      name: `Default Workspace`,
      slug: `default-ws-${now}`,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create default team for tests
    const teamId = await ctx.db.insert("teams", {
      organizationId,
      workspaceId,
      name: `Default Team`,
      slug: `default-team-${now}`,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isPrivate: false,
    });

    // Add user as team member
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "lead",
      addedBy: userId,
      addedAt: now,
    });

    return { organizationId, workspaceId, teamId };
  });
}
