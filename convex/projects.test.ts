// @ts-nocheck - Test file with complex union type assertions

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Projects", () => {
  describe("create", () => {
    it("should create a project with default workflow states", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

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

      expect(projectId).toBeDefined();

      // Verify project was created
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("Test Project");
      expect(project?.key).toBe("TEST");
      expect(project?.description).toBe("A test project");
      expect(project?.isPublic).toBe(false);
      expect(project?.boardType).toBe("kanban");
      expect(project?.createdBy).toBe(userId);
      expect(project?.workflowStates).toHaveLength(4); // Default workflow states
      await t.finishInProgressScheduledFunctions();
    });

    it("should uppercase project keys", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "test",
        isPublic: false,
        boardType: "scrum",
        organizationId,
        workspaceId,
        teamId,
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project?.key).toBe("TEST");
      await t.finishInProgressScheduledFunctions();
    });

    it("should add creator as admin member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "ADMIN",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project?.userRole).toBe("admin");
      expect(project?.isOwner).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject duplicate project keys", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.projects.createProject, {
        name: "First Project",
        key: "DUP",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await expect(async () => {
        await asUser.mutation(api.projects.createProject, {
          name: "Second Project",
          key: "DUP",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });
      }).rejects.toThrow("Project key already exists");

      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      // Create a user and organization for the organizationId, but don't authenticate
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);

      await expect(async () => {
        await t.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "UNAUTH",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });
      }).rejects.toThrow("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("get", () => {
    it("should return project details for owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Owner" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "My Project",
        key: "MINE",
        description: "Owner's project",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("My Project");
      expect(project?.isOwner).toBe(true);
      expect(project?.userRole).toBe("admin");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return organization-visible projects for organization members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const organizationMember = await createTestUser(t, { name: "organization Member" });

      // Setup organization and members
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, owner);
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: organizationMember,
          role: "member",
          addedBy: owner,
          addedAt: Date.now(),
        });
      });

      // Create organization-visible project as owner
      const asOwner = asAuthenticatedUser(t, owner);
      const projectId = await asOwner.mutation(api.projects.createProject, {
        name: "organization Visible Project",
        key: "COMPVIS",
        isPublic: true, // isPublic means organization-visible
        organizationId,
        workspaceId,
        teamId,
        boardType: "kanban",
      }); // Access as different organization member
      const asMember = asAuthenticatedUser(t, organizationMember);
      const project = await asMember.query(api.projects.getProject, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("organization Visible Project");
      expect(project?.isPublic).toBe(true);
      expect(project?.isOwner).toBe(false);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny access to private projects for non-members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const nonMember = await createTestUser(t, { name: "Non-Member" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, owner);

      // Create private project
      const asOwner = asAuthenticatedUser(t, owner);
      const projectId = await asOwner.mutation(api.projects.createProject, {
        name: "Private Project",
        key: "PRIVATE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Try to access as non-member
      const asNonMember = asAuthenticatedUser(t, nonMember);
      await expect(async () => {
        await asNonMember.query(api.projects.getProject, { id: projectId });
      }).rejects.toThrow("Not authorized to access this project");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-existent projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a project to test non-existent ID behavior
      const projectId = await asUser.mutation(api.projects.createProject, {
        name: "To Delete",
        key: "DELETE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("list", () => {
    it("should return only projects user is a member of", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const {
        organizationId: organizationId1,
        workspaceId: workspaceId1,
        teamId: teamId1,
      } = await createOrganizationAdmin(t, user1);
      const {
        organizationId: organizationId2,
        workspaceId: workspaceId2,
        teamId: teamId2,
      } = await createOrganizationAdmin(t, user2);

      // User 1 creates two projects (one private, one with isPublic flag - legacy)
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.projects.createProject, {
        name: "User 1 Project",
        key: "U1",
        isPublic: false,
        boardType: "kanban",
        organizationId: organizationId1,
        workspaceId: workspaceId1,
        teamId: teamId1,
      });
      await asUser1.mutation(api.projects.createProject, {
        name: "User 1 Other Project",
        key: "U1B",
        isPublic: true, // Legacy flag - doesn't grant access to non-members
        boardType: "scrum",
        organizationId: organizationId1,
        workspaceId: workspaceId1,
        teamId: teamId1,
      });

      // User 2 creates one project
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.projects.createProject, {
        name: "User 2 Project",
        key: "U2",
        isPublic: false,
        boardType: "kanban",
        organizationId: organizationId2,
        workspaceId: workspaceId2,
        teamId: teamId2,
      });

      // User 2 should only see their own project (membership-based access)
      const { page: user2Projects } = await asUser2.query(api.projects.getCurrentUserProjects, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user2Projects).toHaveLength(1);
      const projectNames = user2Projects.map((p) => p.name);
      expect(projectNames).toContain("User 2 Project");
      expect(projectNames).not.toContain("User 1 Project");
      expect(projectNames).not.toContain("User 1 Other Project");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty array for unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      const { page: projects } = await t.query(api.projects.getCurrentUserProjects, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(projects).toEqual([]);
    });

    it("should include project metadata (issue count, role)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "META",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const { page: projects } = await asUser.query(api.projects.getCurrentUserProjects, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(projects).toHaveLength(1);
      expect(projects[0]).toHaveProperty("issueCount");
      expect(projects[0]).toHaveProperty("userRole");
      expect(projects[0]).toHaveProperty("isOwner");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateWorkflow", () => {
    it("should allow admins to update workflow states", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const projectId = await asAdmin.mutation(api.projects.createProject, {
        name: "Workflow Project",
        key: "WF",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const customWorkflow = [
        { id: "backlog", name: "Backlog", category: "todo" as const, order: 0 },
        { id: "dev", name: "Development", category: "inprogress" as const, order: 1 },
        { id: "done", name: "Completed", category: "done" as const, order: 2 },
      ];

      await asAdmin.mutation(api.projects.updateWorkflow, {
        projectId,
        workflowStates: customWorkflow,
      });

      const project = await asAdmin.query(api.projects.getProject, { id: projectId });
      expect(project?.workflowStates).toHaveLength(3);
      expect(project?.workflowStates[0].name).toBe("Backlog");
      expect(project?.workflowStates[1].name).toBe("Development");
      expect(project?.workflowStates[2].name).toBe("Completed");
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny editors from updating workflow", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const projectId = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "DENY",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add editor as member
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Try to update workflow as editor
      const asEditor = asAuthenticatedUser(t, editorId);
      await expect(async () => {
        await asEditor.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [],
        });
      }).rejects.toThrow();
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const projectId = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "UNAUTH",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Try without authentication
      await expect(async () => {
        await t.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [],
        });
      }).rejects.toThrow("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("member management", () => {
    describe("addMember", () => {
      it("should allow admins to add members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const newMemberId = await createTestUser(t, {
          name: "New Member",
          email: "newmember@test.com",
        });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.createProject, {
          name: "Team Project",
          key: "TEAM",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "newmember@test.com",
          role: "editor",
        });

        // Verify member was added
        const asNewMember = asAuthenticatedUser(t, newMemberId);
        const project = await asNewMember.query(api.projects.getProject, { id: projectId });
        expect(project?.userRole).toBe("editor");
        expect(project?.members.some((m) => m._id === newMemberId)).toBe(true);
        await t.finishInProgressScheduledFunctions();
      });

      it("should deny non-admins from adding members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const editorId = await createTestUser(t, {
          name: "Editor",
          email: "editor@test.com",
        });
        await createTestUser(t, { name: "New", email: "new@test.com" });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "NOADD",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "editor@test.com",
          role: "editor",
        });

        // Try to add member as editor
        const asEditor = asAuthenticatedUser(t, editorId);
        await expect(async () => {
          await asEditor.mutation(api.projects.addProjectMember, {
            projectId,
            userEmail: "new@test.com",
            role: "viewer",
          });
        }).rejects.toThrow();
      });
    });

    describe("updateMemberRole", () => {
      it("should allow admins to update member roles", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const memberId = await createTestUser(t, {
          name: "Member",
          email: "member@test.com",
        });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "ROLE",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "member@test.com",
          role: "viewer",
        });

        await asAdmin.mutation(api.projects.updateProjectMemberRole, {
          projectId,
          memberId: memberId,
          newRole: "editor",
        });

        // Verify role was updated
        const asMember = asAuthenticatedUser(t, memberId);
        const project = await asMember.query(api.projects.getProject, { id: projectId });
        expect(project?.userRole).toBe("editor");
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("removeMember", () => {
      it("should allow admins to remove members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const memberId = await createTestUser(t, {
          name: "Member",
          email: "member@test.com",
        });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "REMOVE",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "member@test.com",
          role: "editor",
        });

        await asAdmin.mutation(api.projects.removeProjectMember, {
          projectId,
          memberId: memberId,
        });

        // Verify member was removed
        const asMember = asAuthenticatedUser(t, memberId);
        await expect(async () => {
          await asMember.query(api.projects.getProject, { id: projectId });
        }).rejects.toThrow("Not authorized to access this project");
        await t.finishInProgressScheduledFunctions();
      });

      it("should prevent removing project creator", async () => {
        const t = convexTest(schema, modules);
        const creatorId = await createTestUser(t, { name: "Creator" });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, creatorId);

        const asCreator = asAuthenticatedUser(t, creatorId);
        const projectId = await asCreator.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "NOCREATOR",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await expect(async () => {
          await asCreator.mutation(api.projects.removeProjectMember, {
            projectId,
            memberId: creatorId,
          });
        }).rejects.toThrow();
        await t.finishInProgressScheduledFunctions();
      });
    });
  });
});
