import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Project Members", () => {
  describe("list", () => {
    it("should list project members with enriched user data", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, teamId, asUser } =
        await createTestContext(t);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "TEST",
        description: "A test project",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const memberUserId = await createTestUser(t, {
        name: "Member User",
        email: "member@example.com",
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: memberUserId,
          role: "editor",
          addedBy: userId,
        });
      });

      const members = await asUser.query(api.projectMembers.list, {
        projectId,
      });

      expect(members).toHaveLength(2);
      expect(members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            userName: expect.stringContaining("Test User"),
            role: "admin",
          }),
          expect.objectContaining({
            userId: memberUserId,
            userName: "Member User",
            userEmail: "member@example.com",
            role: "editor",
          }),
        ]),
      );
    });

    it("should filter out soft-deleted members", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, teamId, asUser } =
        await createTestContext(t);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "TEST2",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const memberUserId = await createTestUser(t);
      const memberId = await t.run(async (ctx) => {
        return await ctx.db.insert("projectMembers", {
          projectId,
          userId: memberUserId,
          role: "viewer",
          addedBy: userId,
        });
      });

      // Soft delete the member
      await t.run(async (ctx) => {
        await ctx.db.patch(memberId, { isDeleted: true });
      });

      const members = await asUser.query(api.projectMembers.list, {
        projectId,
      });

      expect(members).toHaveLength(1); // Only the creator
      expect(members[0].userId).toBe(userId);
    });

    it("should filter out members whose user record is missing", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, teamId, asUser } =
        await createTestContext(t);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "TEST3",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const deletedUserId = await createTestUser(t);
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: deletedUserId,
          role: "viewer",
          addedBy: userId,
        });
      });

      // Delete the user record
      await t.run(async (ctx) => {
        await ctx.db.delete(deletedUserId);
      });

      const members = await asUser.query(api.projectMembers.list, {
        projectId,
      });

      expect(members).toHaveLength(1); // Only the creator
      expect(members[0].userId).toBe(userId);
    });

    it("should deny access to non-members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } =
        await createTestContext(t);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Private Project",
        key: "PRIV",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const nonMemberUserId = await createTestUser(t);
      const asNonMember = asAuthenticatedUser(t, nonMemberUserId);

      await expect(
        asNonMember.query(api.projectMembers.list, { projectId }),
      ).rejects.toThrow(/Not authorized/);
    });
  });
});
