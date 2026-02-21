
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
            q.eq("organizationId", project.organizationId).eq("userId", newUserId)
        )
        .first(),
    );

    // This expectation defines the security requirement.
    // If a user is invited to a project, they must be made a member of the organization
    // to ensure proper access control and billing boundaries.
    expect(orgMember).not.toBeNull();
  });
});
