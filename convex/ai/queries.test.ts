import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
  expectThrowsAsync,
} from "../testUtils";

describe("AI Queries", () => {
  describe("getProjectContext", () => {
    it("should return correct context for project member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const projectId = await createProjectInOrganization(t, userId, organizationId);
      const asUser = asAuthenticatedUser(t, userId);

      // Create an active sprint
      await t.run(async (ctx) => {
        await ctx.db.insert("sprints", {
          projectId,
          name: "Sprint 1",
          status: "active",
          createdBy: userId,
          updatedAt: Date.now(),
        });
      });

      // Create issues with different statuses
      // 'todo' issue
      await createTestIssue(t, projectId, userId, {
        title: "Task 1",
        status: "todo",
      });
      // 'inprogress' issue
      await createTestIssue(t, projectId, userId, {
        title: "Task 2",
        status: "inprogress",
      });
      // 'done' issue
      await createTestIssue(t, projectId, userId, {
        title: "Task 3",
        status: "done",
      });

      const context = await asUser.query(api.ai.queries.getProjectContext, { projectId });

      // Verify Project
      expect(context.project.id).toBe(projectId);
      expect(context.project.name).toContain("Test Project");

      // Verify Active Sprint
      expect(context.activeSprint).toBeDefined();
      expect(context.activeSprint?.name).toBe("Sprint 1");

      // Verify Stats
      expect(context.stats.totalIssues).toBe(3);
      expect(context.stats.todo).toBe(1);
      expect(context.stats.inProgress).toBe(1);
      expect(context.stats.completed).toBe(1);

      // Verify Members
      expect(context.members).toHaveLength(1);
      expect(context.members[0].id).toBe(userId);
      expect(context.members[0].role).toBe("admin");

      // Verify Issues
      expect(context.issues).toHaveLength(3);
      const titles = context.issues.map((i: any) => i.title);
      expect(titles).toContain("Task 1");
      expect(titles).toContain("Task 2");
      expect(titles).toContain("Task 3");
    });

    it("should throw for non-member on private project", async () => {
      const t = convexTest(schema, modules);
      // Create owner
      const ownerId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      // Create private project
      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        isPublic: false,
      });

      // Create another user
      const otherUserId = await createTestUser(t);
      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      // Attempt to access context
      await expectThrowsAsync(async () => {
        await asOtherUser.query(api.ai.queries.getProjectContext, { projectId });
      });
    });

    it("should throw for non-org-member on public project", async () => {
      const t = convexTest(schema, modules);
      // Create owner
      const ownerId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      // Create PUBLIC project
      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        isPublic: true,
      });

      // Create another user (NOT in organization)
      const otherUserId = await createTestUser(t);
      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      // Attempt to access context - Should FAIL (Public means public to ORG, not world)
      await expectThrowsAsync(async () => {
        await asOtherUser.query(api.ai.queries.getProjectContext, { projectId });
      });
    });

    it("should allow access to public project for organization member", async () => {
      const t = convexTest(schema, modules);
      // Create owner
      const ownerId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      // Create PUBLIC project
      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        isPublic: true,
      });

      // Create another user and add to organization
      const otherUserId = await createTestUser(t);
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: otherUserId,
          role: "member",
          addedBy: ownerId,
        });
      });
      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      // Attempt to access context
      const context = await asOtherUser.query(api.ai.queries.getProjectContext, { projectId });

      expect(context.project.id).toBe(projectId);
      // Should succeed
    });
  });
});
