import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Users", () => {
  describe("updateProfile", () => {
    it("should update user fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.users.updateProfile, {
        name: "Updated Name",
        bio: "New Bio",
        timezone: "Europe/London",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.name).toBe("Updated Name");
      expect(user?.bio).toBe("New Bio");
      expect(user?.timezone).toBe("Europe/London");
    });

    it("should allow updating email to a valid unused email", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.users.updateProfile, {
        email: "new.email@example.com",
      });

      // Email update is now two-step
      let user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).not.toBe("new.email@example.com");
      expect(user?.pendingEmail).toBe("new.email@example.com");

      const token = user?.pendingEmailVerificationToken;
      expect(token).toBeDefined();

      await asUser.mutation(api.users.verifyEmailChange, {
        token: token!,
      });

      user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("new.email@example.com");
    });

    it("should reject invalid email format", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.users.updateProfile, {
          email: "invalid-email",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should reject email already in use by another user", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t);
      const user2Id = await createTestUser(t); // Automatically gets a different email if testUtils handles it, or we set it

      // Ensure user2 has a specific email
      await t.run(async (ctx) => {
        await ctx.db.patch(user2Id, { email: "taken@example.com" });
      });

      const asUser1 = asAuthenticatedUser(t, user1Id);

      await expect(
        asUser1.mutation(api.users.updateProfile, {
          email: "taken@example.com",
        }),
      ).rejects.toThrow("Email already in use");
    });

    it("should allow updating to own email (no-op but valid)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Get current email
      const user = await t.run(async (ctx) => ctx.db.get(userId));
      const currentEmail = user?.email || "test@example.com";

      // Ensure email is set
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, { email: currentEmail });
      });

      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.users.updateProfile, {
        email: currentEmail,
      });

      const updatedUser = await t.run(async (ctx) => ctx.db.get(userId));
      expect(updatedUser?.email).toBe(currentEmail);
    });
  });

  describe("getUserStats", () => {
    it("should count stats", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await createTestProject(t, userId);

      // Create an issue
      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        if (!(project.workspaceId && project.teamId)) {
          throw new Error("Project missing workspace or team");
        }

        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "P-1",
          title: "Task 1",
          status: "todo",
          priority: "medium",
          type: "task",
          reporterId: userId,
          assigneeId: userId,
          updatedAt: Date.now(),
          labels: [],
          order: 1,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("issueComments", {
          issueId,
          authorId: userId,
          content: "Comment",
          mentions: [],
          updatedAt: Date.now(),
        });
      });

      const stats = await asUser.query(api.users.getUserStats, { userId });
      expect(stats.issuesCreated).toBe(1);
      expect(stats.issuesAssigned).toBe(1);
      expect(stats.comments).toBe(1);
    });
  });
});
