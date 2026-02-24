import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createTestContext,
  createTestProject,
  createTestUser,
} from "./testUtils";

// Helper to extract inviteId and token from sendInvite result (handles union type)
function expectInviteCreated(
  result:
    | { inviteId: Id<"invites">; token: string }
    | { success: boolean; addedDirectly: boolean; userId: Id<"users"> },
): { inviteId: Id<"invites">; token: string } {
  if (!("inviteId" in result)) {
    throw new Error("Expected invite to be created, but user was added directly");
  }
  return result;
}

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
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "newuser@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId, token } = expectInviteCreated(result);

      expect(inviteId).toBeDefined();
      expect(token).toBeDefined();

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId as Id<"invites">));
      if (!invite || invite.role !== "user") throw new Error("Invite not found");
      expect(invite.email).toBe("newuser@example.com");
      expect(invite.status).toBe("pending");
    });

    it("should send a project invite", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Creator is project admin automatically - need organizationId from project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "collab@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "editor",
      });
      const { inviteId } = expectInviteCreated(result);

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      if (!invite || invite.role !== "user") throw new Error("Invite not found");
      expect(invite.projectId).toBe(projectId);
      expect(invite.projectRole).toBe("editor");
    });

    it("should prevent duplicate pending invites", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

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

    it("should reject invalid email format", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      await expect(async () => {
        await asAdmin.mutation(api.invites.sendInvite, {
          email: "not-an-email",
          role: "user",
          organizationId,
        });
      }).rejects.toThrow("Invalid email address");
    });

    it("should reject non-admin platform invite attempt", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      // Create a regular user (non-admin) in the same org
      const regularUserId = await createTestUser(t, {
        name: "Regular",
        email: "regular@example.com",
      });
      const asRegular = asAuthenticatedUser(t, regularUserId);

      await expect(async () => {
        await asRegular.mutation(api.invites.sendInvite, {
          email: "someone@example.com",
          role: "user",
          organizationId,
        });
      }).rejects.toThrow("Only admins can send platform invites");
    });

    it("should add existing user directly to project instead of creating invite", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Create an existing user
      const existingUserId = await createTestUser(t, {
        name: "Existing",
        email: "existing@example.com",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Invite existing user to project - should add directly
      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "existing@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "editor",
      });

      // Should have returned addedDirectly result
      expect("addedDirectly" in result).toBe(true);
      if ("addedDirectly" in result) {
        expect(result.addedDirectly).toBe(true);
        expect(result.userId).toBe(existingUserId);
      }

      // Verify membership was created
      const member = await t.run(async (ctx) =>
        ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", projectId).eq("userId", existingUserId),
          )
          .first(),
      );
      expect(member).toBeDefined();
      expect(member?.role).toBe("editor");
    });

    it("should reject invite to existing platform user without project", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      // Create another existing user
      await createTestUser(t, { name: "Already Here", email: "exists@example.com" });

      await expect(async () => {
        await asAdmin.mutation(api.invites.sendInvite, {
          email: "exists@example.com",
          role: "user",
          organizationId,
        });
      }).rejects.toThrow("A user with this email already exists");
    });

    it("should set default projectRole to editor if not specified", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "newcollab@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        // No projectRole specified
      });
      const { inviteId } = expectInviteCreated(result);

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      if (!invite || invite.role !== "user") throw new Error("Invite not found");
      expect(invite.projectRole).toBe("editor");
    });
  });

  describe("acceptInvite", () => {
    it("should accept invite and link user", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "new@example.com",
        role: "user",
        organizationId,
      });
      const { token } = expectInviteCreated(result);

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

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "project@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "viewer",
      });
      const { token } = expectInviteCreated(result);

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
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "revoke@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      await asAdmin.mutation(api.invites.revokeInvite, {
        inviteId: inviteId as Id<"invites">,
      });

      const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
      if (!invite || invite.role !== "user") throw new Error("Invite not found");
      expect(invite.status).toBe("revoked");
      expect(invite.revokedAt).toBeDefined();
    });

    it("should reject revoking non-pending invite", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "revoke2@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      // First revoke
      await asAdmin.mutation(api.invites.revokeInvite, {
        inviteId: inviteId as Id<"invites">,
      });

      // Try to revoke again
      await expect(async () => {
        await asAdmin.mutation(api.invites.revokeInvite, {
          inviteId: inviteId as Id<"invites">,
        });
      }).rejects.toThrow("Can only revoke pending invites");
    });

    it("should reject non-admin revoke attempt", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "revoke3@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      // Non-admin user
      const regularUserId = await createTestUser(t, {
        name: "Regular",
        email: "reg@example.com",
      });
      const asRegular = asAuthenticatedUser(t, regularUserId);

      await expect(async () => {
        await asRegular.mutation(api.invites.revokeInvite, {
          inviteId: inviteId as Id<"invites">,
        });
      }).rejects.toThrow("Only admins can revoke invites");
    });
  });

  describe("resendInvite", () => {
    it("should resend invite and extend expiration", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "resend@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      const inviteBefore = await t.run(async (ctx) => ctx.db.get(inviteId as Id<"invites">));
      if (!inviteBefore || inviteBefore.role !== "user") throw new Error("Invite not found");
      const originalExpiry = inviteBefore.expiresAt;

      // Simulate some time passing
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asAdmin.mutation(api.invites.resendInvite, {
        inviteId: inviteId as Id<"invites">,
      });

      const inviteAfter = await t.run(async (ctx) => ctx.db.get(inviteId as Id<"invites">));
      if (!inviteAfter || inviteAfter.role !== "user") throw new Error("Invite not found");
      if (!(inviteAfter.expiresAt && originalExpiry)) throw new Error("Missing expiry");
      expect(inviteAfter.expiresAt).toBeGreaterThan(originalExpiry);
      expect(inviteAfter.status).toBe("pending");
    });

    it("should reject resending non-pending invite", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "resend2@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      await asAdmin.mutation(api.invites.revokeInvite, {
        inviteId: inviteId as Id<"invites">,
      });

      await expect(async () => {
        await asAdmin.mutation(api.invites.resendInvite, {
          inviteId: inviteId as Id<"invites">,
        });
      }).rejects.toThrow("Can only resend pending invites");
    });

    it("should reject non-admin resend attempt", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "resend3@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);

      const regularUserId = await createTestUser(t, { name: "Reg", email: "reg2@example.com" });
      const asRegular = asAuthenticatedUser(t, regularUserId);

      await expect(async () => {
        await asRegular.mutation(api.invites.resendInvite, {
          inviteId: inviteId as Id<"invites">,
        });
      }).rejects.toThrow("Only admins can resend invites");
    });
  });

  describe("getInviteByToken", () => {
    it("should return invite details for valid token", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "gettoken@example.com",
        role: "user",
        organizationId,
      });
      const { token } = expectInviteCreated(result);

      const invite = await t.query(api.invites.getInviteByToken, { token });

      expect(invite).toBeDefined();
      expect(invite?.email).toBe("gettoken@example.com");
      expect(invite?.status).toBe("pending");
      expect(invite?.isExpired).toBe(false);
      expect(invite?.inviterName).toBeDefined();
    });

    it("should return null for invalid token", async () => {
      const t = convexTest(schema, modules);

      const invite = await t.query(api.invites.getInviteByToken, { token: "invalid_token_xyz" });

      expect(invite).toBeNull();
    });

    it("should include project name for project invites", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "projtoken@example.com",
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "viewer",
      });
      const { token } = expectInviteCreated(result);

      const invite = await t.query(api.invites.getInviteByToken, { token });

      expect(invite?.projectName).toBeDefined();
      expect(invite?.projectRole).toBe("viewer");
    });

    it("should mark expired invites as isExpired", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "expired@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId, token } = expectInviteCreated(result);

      // Manually set expiresAt to past
      await t.run(async (ctx) => {
        await ctx.db.patch(inviteId as Id<"invites">, {
          expiresAt: Date.now() - SECOND,
        });
      });

      const invite = await t.query(api.invites.getInviteByToken, { token });

      expect(invite?.isExpired).toBe(true);
    });
  });

  describe("acceptInvite - edge cases", () => {
    it("should reject expired invite", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "expiredaccept@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId, token } = expectInviteCreated(result);

      // Expire the invite
      await t.run(async (ctx) => {
        await ctx.db.patch(inviteId as Id<"invites">, {
          expiresAt: Date.now() - SECOND,
        });
      });

      const newUserId = await createTestUser(t, {
        name: "Expired",
        email: "expiredaccept@example.com",
      });
      const asNewUser = asAuthenticatedUser(t, newUserId);

      await expect(async () => {
        await asNewUser.mutation(api.invites.acceptInvite, { token });
      }).rejects.toThrow("This invitation has expired");
    });

    it("should reject if email does not match", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "correct@example.com",
        role: "user",
        organizationId,
      });
      const { token } = expectInviteCreated(result);

      // Create user with different email
      const wrongUserId = await createTestUser(t, {
        name: "Wrong Email",
        email: "wrong@example.com",
      });
      const asWrongUser = asAuthenticatedUser(t, wrongUserId);

      await expect(async () => {
        await asWrongUser.mutation(api.invites.acceptInvite, { token });
      }).rejects.toThrow("different email address");
    });

    it("should reject already accepted invite", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "accepttwice@example.com",
        role: "user",
        organizationId,
      });
      const { token } = expectInviteCreated(result);

      const newUserId = await createTestUser(t, {
        name: "Accept Twice",
        email: "accepttwice@example.com",
      });
      const asNewUser = asAuthenticatedUser(t, newUserId);

      // Accept once
      await asNewUser.mutation(api.invites.acceptInvite, { token });

      // Try to accept again
      await expect(async () => {
        await asNewUser.mutation(api.invites.acceptInvite, { token });
      }).rejects.toThrow("This invitation is accepted");
    });

    it("should reject unverified user", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "unverified@example.com",
        role: "user",
        organizationId,
      });
      const { token } = expectInviteCreated(result);

      // Create unverified user
      const unverifiedUserId = await createTestUser(t, {
        name: "Unverified",
        email: "unverified@example.com",
      });
      await t.run(async (ctx) => {
        await ctx.db.patch(unverifiedUserId, { emailVerificationTime: undefined });
      });
      const asUnverifiedUser = asAuthenticatedUser(t, unverifiedUserId);

      await expect(async () => {
        await asUnverifiedUser.mutation(api.invites.acceptInvite, { token });
      }).rejects.toThrow("You must verify your email address");
    });

    it("should reject inviting existing project member", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Create user and manually add to project first
      const userId = await createTestUser(t, {
        name: "Already Member",
        email: "alreadymember@example.com",
      });
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId,
          role: "viewer",
          addedBy: adminId,
        });
      });

      // Trying to invite an existing member should throw
      await expect(async () => {
        await asAdmin.mutation(api.invites.sendInvite, {
          email: "alreadymember@example.com",
          role: "user",
          organizationId: project.organizationId,
          projectId,
          projectRole: "editor",
        });
      }).rejects.toThrow("User is already a member of this project");
    });
  });

  describe("listInvites", () => {
    it("should list all invites for admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      // Create multiple invites (inviteRoles: "user" | "superAdmin")
      await asAdmin.mutation(api.invites.sendInvite, {
        email: "list1@example.com",
        role: "user",
        organizationId,
      });
      await asAdmin.mutation(api.invites.sendInvite, {
        email: "list2@example.com",
        role: "superAdmin",
        organizationId,
      });

      const invites = await asAdmin.query(api.invites.listInvites, { organizationId });

      expect(invites.length).toBeGreaterThanOrEqual(2);
      expect(invites.some((i) => i.email === "list1@example.com")).toBe(true);
      expect(invites.some((i) => i.email === "list2@example.com")).toBe(true);
      // Should have enriched data
      expect(invites[0].inviterName).toBeDefined();
    });

    it("should filter by status", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser: asAdmin } = await createTestContext(t);

      const result = await asAdmin.mutation(api.invites.sendInvite, {
        email: "filter1@example.com",
        role: "user",
        organizationId,
      });
      const { inviteId } = expectInviteCreated(result);
      await asAdmin.mutation(api.invites.sendInvite, {
        email: "filter2@example.com",
        role: "user",
        organizationId,
      });

      // Revoke one
      await asAdmin.mutation(api.invites.revokeInvite, { inviteId });

      const pendingInvites = await asAdmin.query(api.invites.listInvites, {
        organizationId,
        status: "pending",
      });
      const revokedInvites = await asAdmin.query(api.invites.listInvites, {
        organizationId,
        status: "revoked",
      });

      expect(pendingInvites.every((i) => i.status === "pending")).toBe(true);
      expect(revokedInvites.every((i) => i.status === "revoked")).toBe(true);
    });

    it("should return empty array for non-admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      const regularUserId = await createTestUser(t, {
        name: "NonAdmin",
        email: "nonadmin@example.com",
      });
      const asRegular = asAuthenticatedUser(t, regularUserId);

      const invites = await asRegular.query(api.invites.listInvites, { organizationId });

      expect(invites).toEqual([]);
    });
  });

  describe("listUsers", () => {
    it("should list users with stats for admin", async () => {
      const t = convexTest(schema, modules);
      const { userId: adminId, organizationId, asUser: asAdmin } = await createTestContext(t);

      const users = await asAdmin.query(api.invites.listUsers, { organizationId });

      expect(users.length).toBeGreaterThanOrEqual(1);
      // Should include admin user
      const adminUser = users.find((u) => u._id === adminId);
      expect(adminUser).toBeDefined();
      expect(adminUser?.name).toBeDefined();
      expect(typeof adminUser?.projectsCreated).toBe("number");
      expect(typeof adminUser?.projectMemberships).toBe("number");
    });

    it("should return empty array for non-admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      const regularUserId = await createTestUser(t, {
        name: "NonAdmin2",
        email: "nonadmin2@example.com",
      });
      const asRegular = asAuthenticatedUser(t, regularUserId);

      const users = await asRegular.query(api.invites.listUsers, { organizationId });

      expect(users).toEqual([]);
    });

    it("should include project counts for users", async () => {
      const t = convexTest(schema, modules);
      const { userId: adminId, organizationId, asUser: asAdmin } = await createTestContext(t);

      // Admin already has projects from context setup, create one more
      await createTestProject(t, adminId);

      const users = await asAdmin.query(api.invites.listUsers, { organizationId });

      const adminUser = users.find((u) => u._id === adminId);
      expect(adminUser?.projectsCreated).toBeGreaterThanOrEqual(1);
      expect(adminUser?.projectMemberships).toBeGreaterThanOrEqual(1);
    });
  });
});
