import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Projects", () => {
  describe("create", () => {
    it("should create a project with default workflow states", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
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
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
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
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
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
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

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
      const { organizationId, workspaceId, teamId } = await createTestContext(t);

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
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t, {
        name: "Owner",
      });

      const { projectId } = await asUser.mutation(api.projects.createProject, {
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
        });
      });

      // Create organization-visible project as owner
      const asOwner = asAuthenticatedUser(t, owner);
      const { projectId } = await asOwner.mutation(api.projects.createProject, {
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
      const { projectId } = await asOwner.mutation(api.projects.createProject, {
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
      }).rejects.toThrow("Not authorized");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-existent projects", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      // Create and delete a project to test non-existent ID behavior
      const { projectId } = await asUser.mutation(api.projects.createProject, {
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

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.query(api.projects.getCurrentUserProjects, {
          paginationOpts: { numItems: 10, cursor: null },
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("should include project metadata (issue count, role)", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

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

    it("should exclude soft-deleted issues from issue count", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Count Project",
        key: "COUNT",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Create an active issue
      await asUser.mutation(api.issues.create, {
        title: "Active Issue",
        type: "task",
        priority: "medium",
        projectId,
      });

      // Create an issue and then delete it
      const deletedIssueId = await asUser.mutation(api.issues.create, {
        title: "Deleted Issue",
        type: "bug",
        priority: "high",
        projectId,
      });

      await asUser.mutation(api.issues.bulkDelete, {
        issueIds: [deletedIssueId],
      });

      const { page: projects } = await asUser.query(api.projects.getCurrentUserProjects, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      const project = projects.find((p) => p._id === projectId);
      expect(project).toBeDefined();
      expect(project?.issueCount).toBe(1); // Should count only the active issue
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateWorkflow", () => {
    it("should allow admins to update workflow states", async () => {
      const t = convexTest(schema, modules);
      const {
        organizationId,
        workspaceId,
        teamId,
        asUser: asAdmin,
      } = await createTestContext(t, {
        name: "Admin",
      });

      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
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

      const result = await asAdmin.mutation(api.projects.updateWorkflow, {
        projectId,
        workflowStates: customWorkflow,
      });
      expect(result).toEqual({ success: true });

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
      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "DENY",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, organizationId, editorId, adminId);
      // Add editor as member
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Try to update workflow as editor - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editorId);
      await expect(async () => {
        await asEditor.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [],
        });
      }).rejects.toThrow(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
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
        const { projectId } = await asAdmin.mutation(api.projects.createProject, {
          name: "Team Project",
          key: "TEAM",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        // Add new member to organization first (required by security check)
        await addUserToOrganization(t, organizationId, newMemberId, adminId);
        const result = await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "newmember@test.com",
          role: "editor",
        });
        expect(result).toEqual({ success: true });

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
        const newId = await createTestUser(t, { name: "New", email: "new@test.com" });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const { projectId } = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "NOADD",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        // Add editor to organization first (required by security check)
        await addUserToOrganization(t, organizationId, editorId, adminId);
        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "editor@test.com",
          role: "editor",
        });

        // Try to add member as editor - should be forbidden (requires admin)
        // Note: new user must be in organization first for the test to check the admin permission
        await addUserToOrganization(t, organizationId, newId, adminId);
        const asEditor = asAuthenticatedUser(t, editorId);
        await expect(async () => {
          await asEditor.mutation(api.projects.addProjectMember, {
            projectId,
            userEmail: "new@test.com",
            role: "viewer",
          });
        }).rejects.toThrow(/FORBIDDEN|admin/i);
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
        const { projectId } = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "ROLE",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        // Add member to organization first (required by security check)
        await addUserToOrganization(t, organizationId, memberId, adminId);
        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "member@test.com",
          role: "viewer",
        });

        const result = await asAdmin.mutation(api.projects.updateProjectMemberRole, {
          projectId,
          memberId: memberId,
          newRole: "editor",
        });
        expect(result).toEqual({ success: true });

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
        const { projectId } = await asAdmin.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "REMOVE",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        // Add member to organization first (required by security check)
        await addUserToOrganization(t, organizationId, memberId, adminId);
        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "member@test.com",
          role: "editor",
        });

        const result = await asAdmin.mutation(api.projects.removeProjectMember, {
          projectId,
          memberId: memberId,
        });
        expect(result).toEqual({ success: true });

        // Verify member was removed
        const asMember = asAuthenticatedUser(t, memberId);
        await expect(async () => {
          await asMember.query(api.projects.getProject, { id: projectId });
        }).rejects.toThrow("Not authorized");
        await t.finishInProgressScheduledFunctions();
      });

      it("should prevent removing project creator", async () => {
        const t = convexTest(schema, modules);
        const creatorId = await createTestUser(t, { name: "Creator" });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, creatorId);

        const asCreator = asAuthenticatedUser(t, creatorId);
        const { projectId } = await asCreator.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "NOCREATOR",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        // Should fail - cannot remove project owner
        await expect(async () => {
          await asCreator.mutation(api.projects.removeProjectMember, {
            projectId,
            memberId: creatorId,
          });
        }).rejects.toThrow(/FORBIDDEN|Cannot remove project owner/i);
        await t.finishInProgressScheduledFunctions();
      });

      it("should prevent changing project owner's role", async () => {
        const t = convexTest(schema, modules);
        const creatorId = await createTestUser(t, { name: "Creator" });
        const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, creatorId);

        const asCreator = asAuthenticatedUser(t, creatorId);
        const { projectId } = await asCreator.mutation(api.projects.createProject, {
          name: "Test Project",
          key: "NOCHANGE",
          isPublic: false,
          boardType: "kanban",
          organizationId,
          workspaceId,
          teamId,
        });

        await expect(async () => {
          await asCreator.mutation(api.projects.updateProjectMemberRole, {
            projectId,
            memberId: creatorId,
            newRole: "viewer",
          });
        }).rejects.toThrow(/Cannot change project owner's role/i);
        await t.finishInProgressScheduledFunctions();
      });
    });
  });

  describe("getByKey", () => {
    it("should return project by key for members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      await asUser.mutation(api.projects.createProject, {
        name: "My Project",
        key: "BYKEY",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const project = await asUser.query(api.projects.getByKey, { key: "BYKEY" });

      expect(project).toBeDefined();
      expect(project?.name).toBe("My Project");
      expect(project?.key).toBe("BYKEY");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-existent key", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const project = await asUser.query(api.projects.getByKey, { key: "NOTEXIST" });
      expect(project).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for private project non-members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      await asOwner.mutation(api.projects.createProject, {
        name: "Private Project",
        key: "PRIV",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const asOther = asAuthenticatedUser(t, otherId);
      const project = await asOther.query(api.projects.getByKey, { key: "PRIV" });
      expect(project).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateProject", () => {
    it("should allow admin to update project name", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Original Name",
        key: "UPDATE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asUser.mutation(api.projects.updateProject, {
        projectId,
        name: "Updated Name",
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project?.name).toBe("Updated Name");
      await t.finishInProgressScheduledFunctions();
    });

    it("should allow admin to update project description", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "DESC",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asUser.mutation(api.projects.updateProject, {
        projectId,
        description: "New description",
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project?.description).toBe("New description");
      await t.finishInProgressScheduledFunctions();
    });

    it("should allow admin to update project visibility", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "VIS",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asUser.mutation(api.projects.updateProject, {
        projectId,
        isPublic: true,
      });

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      expect(project?.isPublic).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin from updating project", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NOUPDATE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add viewer to organization first (required by security check)
      await addUserToOrganization(t, organizationId, viewerId, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.projects.updateProject, {
          projectId,
          name: "Hacked Name",
        });
      }).rejects.toThrow(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("softDeleteProject", () => {
    it("should allow owner to soft delete project", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "To Delete",
        key: "DEL",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const result = await asUser.mutation(api.projects.softDeleteProject, { projectId });
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.isDeleted).toBe(true);
      expect(project?.deletedAt).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-owner from deleting project", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member", email: "member@test.com" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { projectId } = await asOwner.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NODEL",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add member to organization first (required by security check)
      await addUserToOrganization(t, organizationId, memberId, ownerId);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@test.com",
        role: "admin",
      });

      const asMember = asAuthenticatedUser(t, memberId);
      await expect(async () => {
        await asMember.mutation(api.projects.softDeleteProject, { projectId });
      }).rejects.toThrow(/FORBIDDEN|owner/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("restoreProject", () => {
    it("should allow owner to restore deleted project", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "To Restore",
        key: "REST",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asUser.mutation(api.projects.softDeleteProject, { projectId });

      const result = await asUser.mutation(api.projects.restoreProject, { projectId });
      expect(result.success).toBe(true);
      expect(result.restored).toBe(true);

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.isDeleted).toBeUndefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny restoring non-deleted project", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Active Project",
        key: "ACTIVE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await expect(async () => {
        await asUser.mutation(api.projects.restoreProject, { projectId });
      }).rejects.toThrow(/not deleted/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-owner from restoring project", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { projectId } = await asOwner.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NORESTORE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asOwner.mutation(api.projects.softDeleteProject, { projectId });

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(async () => {
        await asOther.mutation(api.projects.restoreProject, { projectId });
      }).rejects.toThrow(/FORBIDDEN|owner/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getTeamProjects", () => {
    it("should return team projects for team members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      await asUser.mutation(api.projects.createProject, {
        name: "Team Project 1",
        key: "TP1",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await asUser.mutation(api.projects.createProject, {
        name: "Team Project 2",
        key: "TP2",
        isPublic: false,
        boardType: "scrum",
        organizationId,
        workspaceId,
        teamId,
      });

      const result = await asUser.query(api.projects.getTeamProjects, {
        teamId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page.length).toBeGreaterThanOrEqual(2);
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty for non-members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      await asOwner.mutation(api.projects.createProject, {
        name: "Team Project",
        key: "TEAM1",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const asOther = asAuthenticatedUser(t, otherId);
      const result = await asOther.query(api.projects.getTeamProjects, {
        teamId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(0);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getWorkspaceProjects", () => {
    it("should return workspace projects without team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      // Create a project without teamId (workspace-level project)
      await asUser.mutation(api.projects.createProject, {
        name: "Workspace Project",
        key: "WSP",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        // No teamId - orphaned to workspace
      });

      const result = await asUser.query(api.projects.getWorkspaceProjects, {
        workspaceId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page.length).toBeGreaterThanOrEqual(1);
      expect(result.page.some((p) => p.name === "Workspace Project")).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should not include team projects", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      // Create a project WITH teamId
      await asUser.mutation(api.projects.createProject, {
        name: "Team Project",
        key: "TEAMPRJ",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const result = await asUser.query(api.projects.getWorkspaceProjects, {
        workspaceId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page.some((p) => p.name === "Team Project")).toBe(false);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getProjectUserRole", () => {
    it("should return admin role for project admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "ROLE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const role = await asUser.query(api.projects.getProjectUserRole, { projectId });
      expect(role).toBe("admin");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return editor role for editors", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "EDITROLE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, organizationId, editorId, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const asEditor = asAuthenticatedUser(t, editorId);
      const role = await asEditor.query(api.projects.getProjectUserRole, { projectId });
      expect(role).toBe("editor");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const outsiderId = await createTestUser(t, { name: "Outsider" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { projectId } = await asOwner.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NOTROLE",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      const asOutsider = asAuthenticatedUser(t, outsiderId);
      const role = await asOutsider.query(api.projects.getProjectUserRole, { projectId });
      expect(role).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("addProjectMember edge cases", () => {
    it("should reject duplicate members", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const dupMemberId = await createTestUser(t, { name: "Member", email: "dup@test.com" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NODUP",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      // Add member to organization first (required by security check)
      await addUserToOrganization(t, organizationId, dupMemberId, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "dup@test.com",
        role: "viewer",
      });

      await expect(async () => {
        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "dup@test.com",
          role: "editor",
        });
      }).rejects.toThrow(/already a member/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject non-existent users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { projectId } = await asAdmin.mutation(api.projects.createProject, {
        name: "Test Project",
        key: "NOUSER",
        isPublic: false,
        boardType: "kanban",
        organizationId,
        workspaceId,
        teamId,
      });

      await expect(async () => {
        await asAdmin.mutation(api.projects.addProjectMember, {
          projectId,
          userEmail: "nonexistent@test.com",
          role: "viewer",
        });
      }).rejects.toThrow();
      await t.finishInProgressScheduledFunctions();
    });
  });
});
