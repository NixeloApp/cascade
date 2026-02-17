import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Users", () => {
  describe("updateProfile", () => {
    it("should update user fields", async () => {
      const t = convexTest(schema, modules);
      register(t);
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
      register(t);
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
        // biome-ignore lint/style/noNonNullAssertion: test
        token: token!,
      });

      user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("new.email@example.com");
    });

    it("should reject invalid email format", async () => {
      const t = convexTest(schema, modules);
      register(t);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.users.updateProfile, {
          email: "invalid-email",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should initiate verification even if email is in use (enumeration protection)", async () => {
      const t = convexTest(schema, modules);
      register(t);
      const user1Id = await createTestUser(t);
      const user2Id = await createTestUser(t); // Automatically gets a different email if testUtils handles it, or we set it

      // Ensure user2 has a specific email
      await t.run(async (ctx) => {
        await ctx.db.patch(user2Id, { email: "taken@example.com" });
      });

      const asUser1 = asAuthenticatedUser(t, user1Id);

      // Should verify email instead of failing immediately
      await asUser1.mutation(api.users.updateProfile, {
        email: "taken@example.com",
      });

      const user = await t.run(async (ctx) => ctx.db.get(user1Id));
      expect(user?.pendingEmail).toBe("taken@example.com");
    });

    it("should allow updating to own email (no-op but valid)", async () => {
      const t = convexTest(schema, modules);
      register(t);
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

    it("should count completed issues correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await createTestProject(t, userId);

      // Create a done issue
      await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        if (!(project.workspaceId && project.teamId)) {
          throw new Error("Project missing workspace or team");
        }

        await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "P-2",
          title: "Task 2",
          status: "done", // Completed
          priority: "medium",
          type: "task",
          reporterId: userId,
          assigneeId: userId,
          updatedAt: Date.now(),
          labels: [],
          order: 2,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });

      const stats = await asUser.query(api.users.getUserStats, { userId });
      expect(stats.issuesCreated).toBe(1);
      expect(stats.issuesAssigned).toBe(1);
      expect(stats.issuesCompleted).toBe(1);
    });

    it("should count stats only for shared projects when viewing another user", async () => {
      const t = convexTest(schema, modules);

      // 1. Create User A (Viewer) and their org
      // We need userA context to create projects in their org
      const ctxA = await createTestContext(t, { name: "User A" });
      const viewerId = ctxA.userId;

      // 2. Create User B (Target)
      // Create separate org/context for User B to have a private project
      const ctxB = await createTestContext(t, { name: "User B" });
      const targetId = ctxB.userId;

      // 3. Create Project Shared (in Viewer's org)
      const projectSharedId = await createProjectInOrganization(t, viewerId, ctxA.organizationId, {
        name: "Shared Project",
      });

      // Add User B (targetId) to shared project as viewer
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId: projectSharedId,
          userId: targetId,
          role: "viewer",
          addedBy: viewerId,
        });
      });

      // 4. Create Project Private (in Target's org)
      const projectPrivateId = await createProjectInOrganization(t, targetId, ctxB.organizationId, {
        name: "Private Project",
      });

      // 5. Create issues by Target in Shared Project
      await t.run(async (ctx) => {
        await ctx.db.insert("issues", {
          projectId: projectSharedId,
          organizationId: ctxA.organizationId,
          workspaceId: ctxA.workspaceId,
          teamId: ctxA.teamId,
          key: "S-1",
          title: "Shared Issue",
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: targetId,
          assigneeId: targetId, // Assigned to self
          updatedAt: Date.now(),
          labels: [],
          order: 1,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });

        // Add a completed issue in shared project
        await ctx.db.insert("issues", {
          projectId: projectSharedId,
          organizationId: ctxA.organizationId,
          workspaceId: ctxA.workspaceId,
          teamId: ctxA.teamId,
          key: "S-2",
          title: "Shared Done Issue",
          status: "done",
          type: "task",
          priority: "medium",
          reporterId: targetId,
          assigneeId: targetId, // Assigned to self
          updatedAt: Date.now(),
          labels: [],
          order: 2,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });

      // 6. Create issues by Target in Private Project
      await t.run(async (ctx) => {
        await ctx.db.insert("issues", {
          projectId: projectPrivateId,
          organizationId: ctxB.organizationId,
          workspaceId: ctxB.workspaceId,
          teamId: ctxB.teamId,
          key: "P-1",
          title: "Private Issue",
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: targetId,
          assigneeId: targetId,
          updatedAt: Date.now(),
          labels: [],
          order: 1,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });

      // 7. Viewer views Target's stats
      const stats = await ctxA.asUser.query(api.users.getUserStats, { userId: targetId });

      // 8. Expect counts to reflect only Shared Project
      // Shared: 2 created, 2 assigned, 1 completed
      // Private: 1 created, 1 assigned
      // Total: 3 created, 3 assigned, 1 completed
      // Visible: 2 created, 2 assigned, 1 completed

      expect(stats.issuesCreated).toBe(2);
      expect(stats.issuesAssigned).toBe(2);
      expect(stats.issuesCompleted).toBe(1);
    });
  });
});
