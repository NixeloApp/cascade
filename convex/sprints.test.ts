import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Sprints", () => {
  describe("create", () => {
    it("should create a sprint with all fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const startDate = Date.now();
      const endDate = startDate + 2 * WEEK; // 2 weeks

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
        goal: "Complete user authentication",
        startDate,
        endDate,
      });

      expect(sprintId).toBeDefined();

      // Verify sprint was created correctly
      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.goal).toBe("Complete user authentication");
      expect(sprint?.startDate).toBe(startDate);
      expect(sprint?.endDate).toBe(endDate);
      expect(sprint?.status).toBe("future");
      expect(sprint?.createdBy).toBe(userId);
      expect(sprint?._creationTime).toBeDefined();
      expect(sprint?.updatedAt).toBeDefined();
    });

    it("should create a sprint with minimal fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.goal).toBeUndefined();
      expect(sprint?.startDate).toBeUndefined();
      expect(sprint?.endDate).toBeUndefined();
      expect(sprint?.status).toBe("future");
    });

    it("should allow project members to create sprints", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add member to project
      const asOwner = asAuthenticatedUser(t, owner);
      // Add member to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, member, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      // Member creates sprint
      const asMember = asAuthenticatedUser(t, member);
      const { sprintId } = await asMember.mutation(api.sprints.create, {
        projectId,
        name: "Member Sprint",
      });

      expect(sprintId).toBeDefined();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.mutation(api.sprints.create, {
          projectId,
          name: "Unauthorized Sprint",
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from creating sprints", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      // Other user should not be able to create sprint - requires editor role
      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.sprints.create, {
          projectId,
          name: "Unauthorized Sprint",
        });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
    });

    it("should throw error for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Delete project
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const asUser = asAuthenticatedUser(t, userId);
      await expect(async () => {
        await asUser.mutation(api.sprints.create, {
          projectId,
          name: "Sprint 1",
        });
      }).rejects.toThrow("Project not found");
    });
  });

  describe("listByProject", () => {
    it("should list all sprints for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });
      await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 3",
      });

      const sprints = await asUser.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(3);
      expect(sprints[0]?.name).toBe("Sprint 3"); // Most recent first
      expect(sprints[1]?.name).toBe("Sprint 2");
      expect(sprints[2]?.name).toBe("Sprint 1");
    });

    it("should include issue count for each sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create issues in the sprint
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
        sprintId,
      });
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
        sprintId,
      });

      const sprints = await asUser.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(1);
      expect(sprints[0]?.issueCount).toBe(2);
    });

    it("should include completed issue count for each sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create done issues in the sprint
      const { issueId: doneIssue1 } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Done Issue 1",
        type: "task",
        priority: "medium",
        sprintId,
      });
      await asUser.mutation(api.issues.updateStatus, {
        issueId: doneIssue1,
        newStatus: "done",
        newOrder: 0,
      });

      const { issueId: doneIssue2 } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Done Issue 2",
        type: "task",
        priority: "medium",
        sprintId,
      });
      await asUser.mutation(api.issues.updateStatus, {
        issueId: doneIssue2,
        newStatus: "done",
        newOrder: 0,
      });

      // Create todo issue in the sprint
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Todo Issue 1",
        type: "task",
        priority: "medium",
        sprintId,
      });

      // Create done issue NOT in the sprint
      const { issueId: otherIssue } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Done Issue Other",
        type: "task",
        priority: "medium",
      });
      await asUser.mutation(api.issues.updateStatus, {
        issueId: otherIssue,
        newStatus: "done",
        newOrder: 0,
      });

      const sprints = await asUser.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(1);
      expect(sprints[0]?.issueCount).toBe(3);
      expect(sprints[0]?.completedCount).toBe(2);
    });

    it("should deny non-members of private project", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOwner = asAuthenticatedUser(t, owner);
      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Other user tries to list sprints
      const asOther = asAuthenticatedUser(t, other);

      await expect(asOther.query(api.sprints.listByProject, { projectId })).rejects.toThrow(
        "Not authorized",
      );
    });

    it("should return sprints for organization-visible projects to organization members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const organizationMember = await createTestUser(t, { name: "organization Member" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, owner);

      // Add organization member (not project member)
      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: organizationMember,
          role: "member",
          addedBy: owner,
        });
      });

      // Create organization-visible project
      const projectId = await t.run(async (ctx) => {
        return ctx.db.insert("projects", {
          name: "organization Visible Project",
          key: "COMPVIS",
          organizationId,
          workspaceId,
          ownerId: owner,
          createdBy: owner,
          updatedAt: now,
          isPublic: true, // organization-visible
          boardType: "kanban",
          workflowStates: [],
        });
      });

      const asOwner = asAuthenticatedUser(t, owner);
      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "organization Sprint",
      });

      // organization member can see organization-visible project sprints
      const asOrganizationMember = asAuthenticatedUser(t, organizationMember);
      const sprints = await asOrganizationMember.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(1);
      expect(sprints[0]?.name).toBe("organization Sprint");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(t.query(api.sprints.listByProject, { projectId })).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should throw error for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Delete project
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const asUser = asAuthenticatedUser(t, userId);

      await expect(asUser.query(api.sprints.listByProject, { projectId })).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("startSprint", () => {
    it("should start a future sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const startDate = Date.now();
      const endDate = startDate + 2 * WEEK;

      const result = await asUser.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate,
      });

      expect(result).toEqual({ success: true });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("active");
      expect(sprint?.startDate).toBe(startDate);
      expect(sprint?.endDate).toBe(endDate);
    });

    it("should complete currently active sprint when starting new one", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and start first sprint
      const { sprintId: sprint1Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      const start1 = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: sprint1Id,
        startDate: start1,
        endDate: start1 + 2 * WEEK,
      });

      // Create and start second sprint
      const { sprintId: sprint2Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });
      const start2 = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: sprint2Id,
        startDate: start2,
        endDate: start2 + 2 * WEEK,
      });

      // First sprint should be completed
      const sprint1 = await t.run(async (ctx) => {
        return await ctx.db.get(sprint1Id);
      });
      expect(sprint1?.status).toBe("completed");

      // Second sprint should be active
      const sprint2 = await t.run(async (ctx) => {
        return await ctx.db.get(sprint2Id);
      });
      expect(sprint2?.status).toBe("active");
    });

    it("should allow project members to start sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add member
      const asOwner = asAuthenticatedUser(t, owner);
      // Add member to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, member, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Member starts sprint
      const asMember = asAuthenticatedUser(t, member);
      const startDate = Date.now();
      const result = await asMember.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate: startDate + 2 * WEEK,
      });

      expect(result).toEqual({ success: true });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });
      expect(sprint?.status).toBe("active");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      await expect(async () => {
        await t.mutation(api.sprints.startSprint, {
          sprintId,
          startDate: Date.now(),
          endDate: Date.now() + 2 * WEEK,
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from starting sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      const asOwner = asAuthenticatedUser(t, owner);
      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Other user should not be able to start sprint - requires editor role
      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.sprints.startSprint, {
          sprintId,
          startDate: Date.now(),
          endDate: Date.now() + 2 * WEEK,
        });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
    });

    it("should throw error for non-existent sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Delete sprint
      await t.run(async (ctx) => {
        await ctx.db.delete(sprintId);
      });

      await expect(async () => {
        await asUser.mutation(api.sprints.startSprint, {
          sprintId,
          startDate: Date.now(),
          endDate: Date.now() + 2 * WEEK,
        });
      }).rejects.toThrow("Sprint not found");
    });
  });

  describe("completeSprint", () => {
    it("should complete an active sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Start the sprint
      const startDate = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate: startDate + 2 * WEEK,
      });

      // Complete the sprint
      const result = await asUser.mutation(api.sprints.completeSprint, { sprintId });

      expect(result).toEqual({ success: true });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("completed");
    });

    it("should complete a future sprint (early completion)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Complete without starting
      const result = await asUser.mutation(api.sprints.completeSprint, { sprintId });

      expect(result).toEqual({ success: true });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("completed");
    });

    it("should allow project members to complete sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add member
      const asOwner = asAuthenticatedUser(t, owner);
      // Add member to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, member, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Member completes sprint
      const asMember = asAuthenticatedUser(t, member);
      const result = await asMember.mutation(api.sprints.completeSprint, { sprintId });

      expect(result).toEqual({ success: true });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });
      expect(sprint?.status).toBe("completed");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      await expect(async () => {
        await t.mutation(api.sprints.completeSprint, { sprintId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from completing sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      const asOwner = asAuthenticatedUser(t, owner);
      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Other user should not be able to complete sprint - requires editor role
      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.sprints.completeSprint, { sprintId });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
    });

    it("should throw error for non-existent sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Delete sprint
      await t.run(async (ctx) => {
        await ctx.db.delete(sprintId);
      });

      await expect(async () => {
        await asUser.mutation(api.sprints.completeSprint, { sprintId });
      }).rejects.toThrow("Sprint not found");
    });
  });
});
