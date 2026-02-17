import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Invites Security", () => {
  beforeEach(() => {
    // Mock global fetch for email sending
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["msg_123"] }), {
        status: 200,
        statusText: "OK",
      }),
    );

    // Mock env vars required by invites.ts and email providers
    process.env.SITE_URL = "http://localhost:3000";
    process.env.MAILTRAP_API_TOKEN = "mock_token";
    process.env.MAILTRAP_INBOX_ID = "123";
    process.env.MAILTRAP_FROM_EMAIL = "test@example.com";
    process.env.MAILTRAP_MODE = "sandbox";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should prevent vulnerability: existing user NOT in organization receives invite instead of direct add", async () => {
    const t = convexTest(schema, modules);
    const adminId = await createTestUser(t);
    const projectId = await createTestProject(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    // Get organizationId from project
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    // Create an "Outsider" user who exists on platform but is NOT in the organization
    const outsiderId = await createTestUser(t, {
      name: "Outsider",
      email: "outsider@example.com",
    });

    // Verify Outsider is NOT in organization
    const orgMember = await t.run(async (ctx) =>
      ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", project.organizationId).eq("userId", outsiderId),
        )
        .first(),
    );
    expect(orgMember).toBeNull();

    // Admin invites Outsider to project
    const result = await asAdmin.mutation(api.invites.sendInvite, {
      email: "outsider@example.com",
      role: "user",
      organizationId: project.organizationId,
      projectId,
      projectRole: "viewer",
    });

    // Vulnerability Check: result should NOT have "addedDirectly: true"
    // Instead, it should be an invite object { inviteId, token }
    expect("inviteId" in result).toBe(true);
    expect("token" in result).toBe(true);

    // Verify Outsider is NOT yet a member of the project (must accept invite)
    const projectMember = await t.run(async (ctx) =>
      ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", outsiderId))
        .first(),
    );
    expect(projectMember).toBeNull();
  });

  it("should preserve convenience: existing user IN organization is added directly", async () => {
    const t = convexTest(schema, modules);
    const adminId = await createTestUser(t);
    const projectId = await createTestProject(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    // Get organizationId from project
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    // Create an "Insider" user who exists on platform and IS in the organization
    const insiderId = await createTestUser(t, {
      name: "Insider",
      email: "insider@example.com",
    });

    // Add Insider to Organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: project.organizationId,
        userId: insiderId,
        role: "member",
        addedBy: adminId,
      });
    });

    // Admin invites Insider to project
    const result = await asAdmin.mutation(api.invites.sendInvite, {
      email: "insider@example.com",
      role: "user",
      organizationId: project.organizationId,
      projectId,
      projectRole: "editor",
    });

    // Convenience Check: result has "addedDirectly: true"
    expect("addedDirectly" in result).toBe(true);
    if ("addedDirectly" in result) {
      expect(result.addedDirectly).toBe(true);
      expect(result.userId).toBe(insiderId);
    }
  });
});
