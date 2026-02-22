import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createTestContext,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Invites Security", () => {
  // Helper to create an unverified user
  async function createUnverifiedTestUser(
    t: any,
    userData?: { name?: string; email?: string },
  ): Promise<Id<"users">> {
    return await t.run(async (ctx: any) => {
      const name = userData?.name || `Test User ${Date.now()}`;
      const email = userData?.email || `test${Date.now()}@example.com`;

      return await ctx.db.insert("users", {
        name,
        email,
        emailVerificationTime: undefined, // Explicitly unverified
        image: undefined,
      });
    });
  }

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["msg_123"] }), {
        status: 200,
        statusText: "OK",
      }),
    );
    process.env.SITE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fail if user is not added to organization after accepting project invite", async () => {
    const t = convexTest(schema, modules);
    const adminId = await createTestUser(t);
    const projectId = await createTestProject(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    // Send invite to new user for the PROJECT
    const result = await asAdmin.mutation(api.invites.sendInvite, {
      email: "newmember@example.com",
      role: "user", // Platform role
      organizationId: project.organizationId,
      projectId,
      projectRole: "viewer",
    });

    // Extract token
    if (!("token" in result)) throw new Error("Expected invite token");
    const { token } = result;

    // Create the new user
    const newUserId = await createTestUser(t, {
      name: "New Member",
      email: "newmember@example.com",
    });
    const asNewUser = asAuthenticatedUser(t, newUserId);

    // Accept invite
    await asNewUser.mutation(api.invites.acceptInvite, { token });

    // Verify Project Membership (should exist)
    const projectMember = await t.run(async (ctx) =>
      ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", newUserId))
        .first(),
    );
    expect(projectMember).toBeDefined();

    // Verify Organization Membership (should exist? - expected behavior is YES)
    const orgMember = await t.run(async (ctx) =>
      ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", project.organizationId).eq("userId", newUserId),
        )
        .first(),
    );

    // This expectation defines the security requirement.
    // If a user is invited to a project, they must be made a member of the organization
    // to ensure proper access control and billing boundaries.
    expect(orgMember).not.toBeNull();
  });

  it("should prevent unverified users from accepting invites", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, asUser: asAdmin } = await createTestContext(t);

    // 1. Admin sends an invite to 'victim@example.com'
    const result = await asAdmin.mutation(api.invites.sendInvite, {
      email: "victim@example.com",
      role: "user",
      organizationId,
    });

    // Type narrowing to access token
    if (!("token" in result)) {
      throw new Error("Expected invite token");
    }
    const { token } = result;

    // 2. Attacker signs up as 'victim@example.com' but is NOT verified
    // In a real attack, they would just sign up and not complete verification,
    // or change their email to this (if allowed before verification).
    const attackerId = await createUnverifiedTestUser(t, {
      name: "Attacker",
      email: "victim@example.com",
    });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    // 3. Attacker tries to accept the invite using the token (assume they intercepted it)
    // This SHOULD fail if we enforce email verification.
    await expect(async () => {
      await asAttacker.mutation(api.invites.acceptInvite, { token });
    }).rejects.toThrow("You must verify your email address before accepting an invitation");
  });
});
