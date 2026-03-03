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

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
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

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
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
      }).rejects.toThrow("Only organization admins can perform this action");
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

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
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

      const { workspaceId } = await asCreator.mutation(api.workspaces.create, {
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

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
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
      }).rejects.toThrow("Only organization admins or the workspace creator can delete workspaces");
    });

    it("should deny deleting workspace with teams", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
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
          updatedAt: Date.now(),
          isPrivate: false,
          isDeleted: false,
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Cannot delete workspace with active teams");
    });

    it("should deny deleting workspace with projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
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
          updatedAt: Date.now(),
          boardType: "kanban",
          workflowStates: [],
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Cannot delete workspace with projects");
    });
  });

  describe("list", () => {
    it("should list workspaces for organization member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.workspaces.create, {
        name: "Workspace One",
        slug: "workspace-one",
        organizationId,
      });

      await asUser.mutation(api.workspaces.create, {
        name: "Workspace Two",
        slug: "workspace-two",
        organizationId,
      });

      const workspaces = await asUser.query(api.workspaces.list, { organizationId });

      expect(workspaces).toHaveLength(2);
      expect(workspaces.map((w) => w.name)).toContain("Workspace One");
      expect(workspaces.map((w) => w.name)).toContain("Workspace Two");
    });

    it("should return empty array when no workspaces exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspaces = await asUser.query(api.workspaces.list, { organizationId });

      expect(workspaces).toHaveLength(0);
    });
  });

  describe("get", () => {
    it("should get workspace by ID", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      const workspace = await asUser.query(api.workspaces.get, { id: workspaceId });

      expect(workspace.name).toBe("Test Workspace");
      expect(workspace.slug).toBe("test-workspace");
      expect(workspace.organizationId).toBe(organizationId);
    });

    it("should throw not found for non-existent workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create a workspace to get a valid ID format, then delete it
      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Temp Workspace",
        slug: "temp-workspace",
        organizationId,
      });

      await asUser.mutation(api.workspaces.remove, { id: workspaceId });

      await expect(async () => {
        await asUser.query(api.workspaces.get, { id: workspaceId });
      }).rejects.toThrow();
    });
  });

  describe("getWorkspace", () => {
    it("should get workspace by ID", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      const workspace = await asUser.query(api.workspaces.getWorkspace, { id: workspaceId });

      expect(workspace?.name).toBe("Test Workspace");
      expect(workspace?.slug).toBe("test-workspace");
      expect(workspace?.organizationId).toBe(organizationId);
    });

    it("should return null for non-existent workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create a workspace to get a valid ID format, then delete it
      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Temp Workspace",
        slug: "temp-workspace",
        organizationId,
      });

      await asUser.mutation(api.workspaces.remove, { id: workspaceId });

      const workspace = await asUser.query(api.workspaces.getWorkspace, { id: workspaceId });
      expect(workspace).toBeNull();
    });
  });

  describe("getBySlug", () => {
    it("should get workspace by slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "my-slug",
        organizationId,
      });

      const workspace = await asUser.query(api.workspaces.getBySlug, {
        organizationId,
        slug: "my-slug",
      });

      expect(workspace.name).toBe("Test Workspace");
      expect(workspace.slug).toBe("my-slug");
    });

    it("should throw not found for non-existent slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      await expect(async () => {
        await asUser.query(api.workspaces.getBySlug, {
          organizationId,
          slug: "non-existent-slug",
        });
      }).rejects.toThrow();
    });
  });

  describe("getWorkspaceBySlug", () => {
    it("should get workspace by slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "my-slug",
        organizationId,
      });

      const workspace = await asUser.query(api.workspaces.getWorkspaceBySlug, {
        organizationId,
        slug: "my-slug",
      });

      expect(workspace?.name).toBe("Test Workspace");
      expect(workspace?.slug).toBe("my-slug");
    });

    it("should return null for non-existent slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const workspace = await asUser.query(api.workspaces.getWorkspaceBySlug, {
        organizationId,
        slug: "non-existent-slug",
      });

      expect(workspace).toBeNull();
    });
  });

  describe("update", () => {
    it("should allow admin to update workspace name", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Original Name",
        slug: "test-workspace",
        organizationId,
      });

      const result = await asUser.mutation(api.workspaces.update, {
        workspaceId,
        name: "Updated Name",
      });

      expect(result).toEqual({ success: true, workspaceId });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace?.name).toBe("Updated Name");
    });

    it("should allow admin to update workspace description", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asUser.mutation(api.workspaces.update, {
        workspaceId,
        description: "A new description",
      });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace?.description).toBe("A new description");
    });

    it("should deny non-admin from updating workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      await expect(async () => {
        await asMember.mutation(api.workspaces.update, {
          workspaceId,
          name: "Hacked Name",
        });
      }).rejects.toThrow();
    });
  });

  describe("getStats", () => {
    it("should return zero counts for empty workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      const stats = await asUser.query(api.workspaces.getStats, { workspaceId });

      expect(stats.teamsCount).toBe(0);
      expect(stats.projectsCount).toBe(0);
    });

    it("should return correct counts for teams and projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Create teams directly
      await t.run(async (ctx) => {
        await ctx.db.insert("teams", {
          organizationId,
          workspaceId,
          name: "Team 1",
          slug: "team-1",
          createdBy: userId,
          updatedAt: Date.now(),
          isPrivate: false,
        });
        await ctx.db.insert("teams", {
          organizationId,
          workspaceId,
          name: "Team 2",
          slug: "team-2",
          createdBy: userId,
          updatedAt: Date.now(),
          isPrivate: false,
        });
      });

      // Create project directly
      await t.run(async (ctx) => {
        await ctx.db.insert("projects", {
          name: "Project 1",
          key: "PRJ1",
          organizationId,
          workspaceId,
          ownerId: userId,
          createdBy: userId,
          updatedAt: Date.now(),
          boardType: "kanban",
          workflowStates: [],
        });
      });

      const stats = await asUser.query(api.workspaces.getStats, { workspaceId });

      expect(stats.teamsCount).toBe(2);
      expect(stats.projectsCount).toBe(1);
    });
  });

  describe("getCrossTeamDependencies", () => {
    it("should return only cross-team blocking links in a workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Dependency organization",
        timezone: "America/New_York",
      });
      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        organizationId,
        name: "Dependency Workspace",
        slug: "dependency-workspace",
      });

      const { teamId: teamAId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Platform",
        isPrivate: false,
      });
      const { teamId: teamBId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Mobile",
        isPrivate: false,
      });

      const { crossLinkId, sameTeamLinkId } = await t.run(async (ctx) => {
        const now = Date.now();

        const platformProjectId = await ctx.db.insert("projects", {
          name: "Platform Project",
          key: "PLT",
          organizationId,
          workspaceId,
          teamId: teamAId,
          ownerId: ownerId,
          createdBy: ownerId,
          updatedAt: now,
          boardType: "kanban",
          workflowStates: [],
        });
        const mobileProjectId = await ctx.db.insert("projects", {
          name: "Mobile Project",
          key: "MOB",
          organizationId,
          workspaceId,
          teamId: teamBId,
          ownerId: ownerId,
          createdBy: ownerId,
          updatedAt: now,
          boardType: "kanban",
          workflowStates: [],
        });

        const issueAId = await ctx.db.insert("issues", {
          projectId: platformProjectId,
          organizationId,
          workspaceId,
          teamId: teamAId,
          key: "PLT-1",
          title: "Platform API",
          type: "task",
          status: "todo",
          priority: "high",
          reporterId: ownerId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 1,
        });
        const issueBId = await ctx.db.insert("issues", {
          projectId: mobileProjectId,
          organizationId,
          workspaceId,
          teamId: teamBId,
          key: "MOB-1",
          title: "Mobile Integration",
          type: "task",
          status: "inprogress",
          priority: "medium",
          reporterId: ownerId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 2,
        });
        const issueCId = await ctx.db.insert("issues", {
          projectId: platformProjectId,
          organizationId,
          workspaceId,
          teamId: teamAId,
          key: "PLT-2",
          title: "Platform Test Harness",
          type: "task",
          status: "todo",
          priority: "low",
          reporterId: ownerId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 3,
        });

        const crossLinkId = await ctx.db.insert("issueLinks", {
          fromIssueId: issueAId,
          toIssueId: issueBId,
          linkType: "blocks",
          createdBy: ownerId,
        });
        const sameTeamLinkId = await ctx.db.insert("issueLinks", {
          fromIssueId: issueAId,
          toIssueId: issueCId,
          linkType: "blocks",
          createdBy: ownerId,
        });

        return { crossLinkId, sameTeamLinkId };
      });

      const dependencies = await asOwner.query(api.workspaces.getCrossTeamDependencies, {
        workspaceId,
      });

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].linkId).toBe(crossLinkId);
      expect(dependencies[0].linkId).not.toBe(sameTeamLinkId);
      expect(dependencies[0].fromIssue.teamId).not.toBe(dependencies[0].toIssue.teamId);
    });

    it("should apply team/status/priority filters", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Dependency Filters organization",
        timezone: "America/New_York",
      });
      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        organizationId,
        name: "Dependency Filters Workspace",
        slug: "dependency-filters-workspace",
      });

      const { teamId: teamAId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Backend",
        isPrivate: false,
      });
      const { teamId: teamBId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Frontend",
        isPrivate: false,
      });

      await t.run(async (ctx) => {
        const now = Date.now();
        const backendProjectId = await ctx.db.insert("projects", {
          name: "Backend Project",
          key: "BCK",
          organizationId,
          workspaceId,
          teamId: teamAId,
          ownerId: ownerId,
          createdBy: ownerId,
          updatedAt: now,
          boardType: "kanban",
          workflowStates: [],
        });
        const frontendProjectId = await ctx.db.insert("projects", {
          name: "Frontend Project",
          key: "FRT",
          organizationId,
          workspaceId,
          teamId: teamBId,
          ownerId: ownerId,
          createdBy: ownerId,
          updatedAt: now,
          boardType: "kanban",
          workflowStates: [],
        });

        const blockerId = await ctx.db.insert("issues", {
          projectId: backendProjectId,
          organizationId,
          workspaceId,
          teamId: teamAId,
          key: "BCK-1",
          title: "API Contract",
          type: "task",
          status: "todo",
          priority: "highest",
          reporterId: ownerId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 1,
        });
        const blockedId = await ctx.db.insert("issues", {
          projectId: frontendProjectId,
          organizationId,
          workspaceId,
          teamId: teamBId,
          key: "FRT-1",
          title: "Shipping UI",
          type: "task",
          status: "inprogress",
          priority: "medium",
          reporterId: ownerId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 2,
        });

        await ctx.db.insert("issueLinks", {
          fromIssueId: blockerId,
          toIssueId: blockedId,
          linkType: "blocks",
          createdBy: ownerId,
        });
      });

      const byTeam = await asOwner.query(api.workspaces.getCrossTeamDependencies, {
        workspaceId,
        teamId: teamBId,
      });
      expect(byTeam).toHaveLength(1);
      expect(byTeam[0].toIssue.teamId).toBe(teamBId);

      const byStatus = await asOwner.query(api.workspaces.getCrossTeamDependencies, {
        workspaceId,
        status: "done",
      });
      expect(byStatus).toHaveLength(0);

      const byPriority = await asOwner.query(api.workspaces.getCrossTeamDependencies, {
        workspaceId,
        priority: "highest",
      });
      expect(byPriority).toHaveLength(1);
      expect(byPriority[0].fromIssue.priority).toBe("highest");
    });
  });

  describe("addMember", () => {
    it("should add organization member to workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      // Add member to organization first
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      // Add to workspace
      const { memberId: workspaceMemberId } = await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      expect(workspaceMemberId).toBeDefined();

      const membership = await t.run(async (ctx) => ctx.db.get(workspaceMemberId));
      expect(membership?.userId).toBe(memberId);
      expect(membership?.role).toBe("member");
    });

    it("should deny adding non-organization member to workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const outsiderId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await expect(async () => {
        await asOwner.mutation(api.workspaces.addMember, {
          workspaceId,
          userId: outsiderId,
          role: "member",
        });
      }).rejects.toThrow("User must be an organization member to join this workspace");
    });

    it("should deny adding duplicate member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      await expect(async () => {
        await asOwner.mutation(api.workspaces.addMember, {
          workspaceId,
          userId: memberId,
          role: "member",
        });
      }).rejects.toThrow("User is already a member of this workspace");
    });
  });

  describe("updateMemberRole", () => {
    it("should update workspace member role", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { memberId: workspaceMemberId } = await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.updateMemberRole, {
        workspaceId,
        userId: memberId,
        role: "admin",
      });

      const membership = await t.run(async (ctx) => ctx.db.get(workspaceMemberId));
      expect(membership?.role).toBe("admin");
    });

    it("should throw not found for non-member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const nonMemberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await expect(async () => {
        await asOwner.mutation(api.workspaces.updateMemberRole, {
          workspaceId,
          userId: nonMemberId,
          role: "admin",
        });
      }).rejects.toThrow();
    });
  });

  describe("removeMember", () => {
    it("should soft delete workspace member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { memberId: workspaceMemberId } = await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.removeMember, {
        workspaceId,
        userId: memberId,
      });

      const membership = await t.run(async (ctx) => ctx.db.get(workspaceMemberId));
      expect(membership?.isDeleted).toBe(true);
      expect(membership?.deletedAt).toBeDefined();
    });

    it("should throw not found for non-member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const nonMemberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await expect(async () => {
        await asOwner.mutation(api.workspaces.removeMember, {
          workspaceId,
          userId: nonMemberId,
        });
      }).rejects.toThrow();
    });
  });

  describe("getMembers", () => {
    it("should return workspace members with user details", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      const members = await asOwner.query(api.workspaces.getMembers, { workspaceId });

      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(memberId);
      expect(members[0].role).toBe("member");
      expect(members[0].user).toBeDefined();
    });

    it("should not include soft-deleted members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.workspaces.removeMember, {
        workspaceId,
        userId: memberId,
      });

      const members = await asOwner.query(api.workspaces.getMembers, { workspaceId });

      expect(members).toHaveLength(0);
    });

    it("should return empty array when no members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId,
      });

      const members = await asOwner.query(api.workspaces.getMembers, { workspaceId });

      expect(members).toHaveLength(0);
    });
  });

  describe("create - slug uniqueness", () => {
    it("should deny duplicate slug within organization", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.workspaces.create, {
        name: "First Workspace",
        slug: "same-slug",
        organizationId,
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.create, {
          name: "Second Workspace",
          slug: "same-slug",
          organizationId,
        });
      }).rejects.toThrow("A workspace with this slug already exists");
    });
  });
});
