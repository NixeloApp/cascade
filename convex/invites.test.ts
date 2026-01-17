import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Invites", () => {
  beforeEach(() => {
    // Mock global fetch for email sending
    // Mock global fetch for email sending using native Response
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

  describe("sendInvite", () => {
    it("should send a platform invite from admin", { timeout: 15000 }, async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);

      // Create organization admin status (proper way, not relying on fallback)
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);

      const { inviteId, token } = await asAdmin.mutation(api.invites.sendInvite, {
        email: "newuser@example.com",
        role: "user",
        organizationId,
      });

      expect(inviteId).toBeDefined();
      expect(token).toBeDefined();

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      expect(invite?.email).toBe("newuser@example.com");
      expect(invite?.status).toBe("pending");
    });

    it("should send a project invite", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Creator is project admin automatically - need organizationId from project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const { inviteId } = await asAdmin.mutation(api.invites.sendInvite, {
        email: "collab@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "editor",
      });

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      expect(invite?.projectId).toBe(projectId);
      expect(invite?.projectRole).toBe("editor");
    });

    it("should prevent duplicate pending invites", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      // Setup admin rights via organization
      // Setup admin rights
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);

      await asAdmin.mutation(api.invites.sendInvite, {
        email: "dupe@example.com",
        role: "user",
        organizationId,
      });

      await expect(async () => {
        await asAdmin.mutation(api.invites.sendInvite, {
          email: "dupe@example.com",
          role: "user",
          organizationId,
        });
      }).rejects.toThrow("An invitation has already been sent");
    });
  });

  describe("acceptInvite", () => {
    it("should accept invite and link user", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      // Setup admin
      // Setup admin
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const { token } = await asAdmin.mutation(api.invites.sendInvite, {
        email: "new@example.com",
        role: "user",
        organizationId,
      });

      // Create the new user who will accept
      const newUserId = await createTestUser(t, { name: "New User", email: "new@example.com" });
      const asNewUser = asAuthenticatedUser(t, newUserId);

      await asNewUser.mutation(api.invites.acceptInvite, { token });

      // Verify user linked
      const user = await t.run(async (ctx) => ctx.db.get(newUserId));
      expect(user?.inviteId).toBeDefined();

      // Verify invite updated
      const invite = await t.run(async (ctx) =>
        ctx.db
          .query("invites")
          .withIndex("by_token", (q) => q.eq("token", token))
          .first(),
      );
      expect(invite?.status).toBe("accepted");
      expect(invite?.acceptedBy).toBe(newUserId);
    });

    it("should add to project on acceptance", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Get organizationId from project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const { token } = await asAdmin.mutation(api.invites.sendInvite, {
        email: "project@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "viewer",
      });

      const newUserId = await createTestUser(t, {
        name: "Project User",
        email: "project@example.com",
      });
      const asNewUser = asAuthenticatedUser(t, newUserId);

      await asNewUser.mutation(api.invites.acceptInvite, { token });

      const member = await t.run(async (ctx) =>
        ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", newUserId))
          .first(),
      );
      expect(member).toBeDefined();
      expect(member?.role).toBe("viewer");
    });
  });

  describe("revokeInvite", () => {
    it("should revoke pending invite", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      // Setup admin
      // Setup admin
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const { inviteId } = await asAdmin.mutation(api.invites.sendInvite, {
        email: "revoke@example.com",
        role: "user",
        organizationId,
      });

      await asAdmin.mutation(api.invites.revokeInvite, { inviteId });

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      expect(invite?.status).toBe("revoked");
    });
  });
});
