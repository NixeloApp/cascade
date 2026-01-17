import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Workspaces", () => {
  describe("create", () => {
    it("should allow organization admin to create workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      expect(workspaceId).toBeDefined();

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace?.name).toBe("Test Workspace");
      expect(workspace?.organizationId).toBe(organizationId);
    });

    it("should allow organization owner to create workspace", async () => {
      // Owner is also an admin
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      // Verify role is owner
      const role = await asUser.query(api.organizations.getUserRole, { organizationId });
      expect(role).toBe("owner");

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      expect(workspaceId).toBeDefined();
    });

    it("should deny non-admin member from creating workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      // Add member
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      // Verify role is member
      const role = await asMember.query(api.organizations.getUserRole, { organizationId });
      expect(role).toBe("member");

      await expect(async () => {
        await asMember.mutation(api.workspaces.create, {
          name: "Test Workspace",
          slug: "test-workspace",
          organizationId,
        });
      }).rejects.toThrow("Only organization admins can create workspaces");
    });
  });

  describe("remove", () => {
    it("should allow organization admin to delete workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Verify deletion
      await asUser.mutation(api.workspaces.remove, { id: workspaceId });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace).toBeNull();
    });

    it("should allow workspace creator (admin) to delete workspace", async () => {
      const t = convexTest(schema, modules);
      // organization Owner
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      // Another Admin who creates the workspace
      const creatorId = await createTestUser(t);
      const asCreator = asAuthenticatedUser(t, creatorId);

      // Add creator as organization admin
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: creatorId,
        role: "admin",
      });

      const workspaceId = await asCreator.mutation(api.workspaces.create, {
        name: "Creator's Workspace",
        slug: "creators-workspace",
        organizationId,
      });

      // Now demote creator to member, or simply test as them (they are creator)
      // Even if they are just a member now, if they created it, they should be able to delete it?
      // Wait, logic says `workspace.createdBy === userId` OR `isOrganizationAdmin`.
      // If I demote them to member, `isOrganizationAdmin` is false.
      // So I should test that scenario: Creator but not Admin.

      await asOwner.mutation(api.organizations.updateMemberRole, {
        organizationId,
        userId: creatorId,
        role: "member",
      });

      const role = await asCreator.query(api.organizations.getUserRole, { organizationId });
      expect(role).toBe("member");

      // Attempt delete
      await asCreator.mutation(api.workspaces.remove, { id: workspaceId });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace).toBeNull();
    });

    it("should deny non-admin member from deleting workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaceId = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Add member
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      // Attempt delete
      await expect(async () => {
        await asMember.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Only workspace admins or organization admins can delete workspaces");
    });

    it("should deny deleting workspace with teams", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Create a team in the workspace
      // Assuming api.teams.create exists or inserting directly
      // Since I don't see teams.ts content, I will insert directly via t.run
      await t.run(async (ctx) => {
        await ctx.db.insert("teams", {
          organizationId,
          workspaceId,
          name: "Test Team",
          slug: "test-team",
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPrivate: false,
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Cannot delete workspace with teams. Please delete or move teams first.");
    });

    it("should deny deleting workspace with projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Create a project in the workspace
      await t.run(async (ctx) => {
        await ctx.db.insert("projects", {
          name: "Test Project",
          key: "TEST",
          organizationId,
          workspaceId,
          ownerId: userId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          boardType: "kanban",
          workflowStates: [],
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow(
        "Cannot delete workspace with projects. Please delete or move projects first.",
      );
    });
  });
});
