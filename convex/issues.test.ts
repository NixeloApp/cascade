import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Issues", () => {
  describe("create", () => {
    it("should create an issue with auto-generated key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, {
        name: "Test Project",
        key: "ISSUE",
      });

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        description: "This is a test issue",
        type: "task",
        priority: "medium",
      });

      expect(issueId).toBeDefined();

      // Verify issue was created
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.title).toBe("Test Issue");
      expect(issue?.description).toBe("This is a test issue");
      expect(issue?.type).toBe("task");
      expect(issue?.priority).toBe("medium");
      expect(issue?.key).toBe("ISSUE-1"); // First issue in project
      expect(issue?.reporterId).toBe(userId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should increment issue numbers per project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, { key: "AUTO" });

      const asUser = asAuthenticatedUser(t, userId);

      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "First Issue",
        type: "task",
        priority: "medium",
      });

      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Second Issue",
        type: "bug",
        priority: "high",
      });

      const issue1 = await asUser.query(api.issues.getIssue, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.getIssue, { id: issue2Id });

      expect(issue1?.key).toBe("AUTO-1");
      expect(issue2?.key).toBe("AUTO-2");
      await t.finishInProgressScheduledFunctions();
    });

    it("should set default status to first workflow state", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.status).toBe("todo"); // Default first workflow state
      await t.finishInProgressScheduledFunctions();
    });

    it("should allow setting assignee", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      const asReporter = asAuthenticatedUser(t, reporterId);
      const { issueId } = await asReporter.mutation(api.issues.createIssue, {
        projectId,
        title: "Assigned Issue",
        type: "task",
        priority: "medium",
        assigneeId,
      });

      const issue = await asReporter.query(api.issues.getIssue, { id: issueId });
      expect(issue?.assigneeId).toBe(assigneeId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.mutation(api.issues.createIssue, {
          projectId,
          title: "Unauthorized",
          type: "task",
          priority: "medium",
        });
      }).rejects.toThrow("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-editors from creating issues", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, adminId);
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // Add viewer to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: viewerId,
          role: "member",
          addedBy: adminId,
        });
      });

      // Add viewer
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to create issue as viewer
      const asViewer = asAuthenticatedUser(t, viewerId);
      // Viewer should not be able to create issues - requires editor role
      await expect(async () => {
        await asViewer.mutation(api.issues.createIssue, {
          projectId,
          title: "Should Fail",
          type: "task",
          priority: "medium",
        });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("get", () => {
    it("should return issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Detailed Issue",
        description: "Detailed description",
        type: "story",
        priority: "high",
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue).toBeDefined();
      expect(issue?.title).toBe("Detailed Issue");
      expect(issue?.description).toBe("Detailed description");
      expect(issue?.type).toBe("story");
      expect(issue?.priority).toBe("high");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for deleted issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "To Delete",
        type: "task",
        priority: "medium",
      });

      // Delete the issue using bulkDelete
      await asUser.mutation(api.issues.bulkDelete, { issueIds: [issueId] });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny access to issues in private projects", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const outsider = await createTestUser(t, { name: "Outsider" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOwner = asAuthenticatedUser(t, owner);
      const { issueId } = await asOwner.mutation(api.issues.createIssue, {
        projectId,
        title: "Private Issue",
        type: "task",
        priority: "medium",
      });

      // Try to access as outsider
      const asOutsider = asAuthenticatedUser(t, outsider);
      await expect(async () => {
        await asOutsider.query(api.issues.getIssue, { id: issueId });
      }).rejects.toThrow("Not authorized");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("update", () => {
    it("should allow editors to update issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Original Title",
        description: "Original description",
        type: "task",
        priority: "low",
      });

      await asUser.mutation(api.issues.update, {
        issueId,
        title: "Updated Title",
        description: "Updated description",
        priority: "high",
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.title).toBe("Updated Title");
      expect(issue?.description).toBe("Updated description");
      expect(issue?.priority).toBe("high");
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny viewers from updating issues", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, adminId);
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // Add viewer to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: viewerId,
          role: "member",
          addedBy: adminId,
        });
      });

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { issueId } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to update as viewer - should be forbidden (requires editor)
      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.issues.update, {
          issueId,
          title: "Updated by viewer",
        });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateStatus", () => {
    it("should update issue status and log activity", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "inprogress",
        newOrder: 0,
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.status).toBe("inprogress");

      // Verify activity was logged
      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      const statusChange = activities.find((a) => a.field === "status");
      expect(statusChange).toBeDefined();
      expect(statusChange?.oldValue).toBe("todo");
      expect(statusChange?.newValue).toBe("inprogress");
      await t.finishInProgressScheduledFunctions();
    });

    it("should allow updating status to any value", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      // Implementation accepts any status value (no workflow validation)
      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "custom_status",
        newOrder: 0,
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.status).toBe("custom_status");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("listProjectIssues", () => {
    it("should return all issues in a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "bug",
        priority: "high",
      });
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 3",
        type: "story",
        priority: "low",
      });

      const { page: issues } = await asUser.query(api.issues.listProjectIssues, {
        projectId,
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(issues).toHaveLength(3);
      expect(issues.map((i) => i.title)).toContain("Issue 1");
      expect(issues.map((i) => i.title)).toContain("Issue 2");
      expect(issues.map((i) => i.title)).toContain("Issue 3");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty array for projects with no issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { page: issues } = await asUser.query(api.issues.listProjectIssues, {
        projectId,
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(issues).toEqual([]);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("addComment", () => {
    it("should add a comment to an issue", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Commenter" });
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      const { commentId } = await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "This is a test comment",
      });

      expect(commentId).toBeDefined();

      // Verify comment was added
      const comments = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueComments")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("This is a test comment");
      expect(comments[0].authorId).toBe(userId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users from commenting", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      // Call without authentication
      await expect(async () => {
        await t.mutation(api.issues.addComment, {
          issueId,
          content: "Unauthorized comment",
        });
      }).rejects.toThrow("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("bulk operations", () => {
    it("should bulk update status for multiple issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.bulkUpdateStatus, {
        issueIds: [issue1Id, issue2Id],
        newStatus: "done",
      });

      const issue1 = await asUser.query(api.issues.getIssue, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.getIssue, { id: issue2Id });

      expect(issue1?.status).toBe("done");
      expect(issue2?.status).toBe("done");
      await t.finishInProgressScheduledFunctions();
    });

    it("should bulk update priority", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "low",
      });
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.bulkUpdatePriority, {
        issueIds: [issue1Id, issue2Id],
        priority: "highest",
      });

      const issue1 = await asUser.query(api.issues.getIssue, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.getIssue, { id: issue2Id });

      expect(issue1?.priority).toBe("highest");
      expect(issue2?.priority).toBe("highest");
      await t.finishInProgressScheduledFunctions();
    });

    it("should bulk assign issues to a user", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      const asReporter = asAuthenticatedUser(t, reporterId);
      const { issueId: issue1Id } = await asReporter.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asReporter.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asReporter.mutation(api.issues.bulkAssign, {
        issueIds: [issue1Id, issue2Id],
        assigneeId,
      });

      const issue1 = await asReporter.query(api.issues.getIssue, { id: issue1Id });
      const issue2 = await asReporter.query(api.issues.getIssue, { id: issue2Id });

      expect(issue1?.assigneeId).toBe(assigneeId);
      expect(issue2?.assigneeId).toBe(assigneeId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should skip issues for non-editors in bulk operations", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, adminId);
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // Add viewer to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: viewerId,
          role: "member",
          addedBy: adminId,
        });
      });

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { issueId } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Bulk operations silently skip issues the user can't edit
      const asViewer = asAuthenticatedUser(t, viewerId);
      const result = await asViewer.mutation(api.issues.bulkUpdateStatus, {
        issueIds: [issueId],
        newStatus: "done",
      });

      // Should return 0 updated since viewer lacks permission
      expect(result.updated).toBe(0);

      // Issue should remain unchanged
      const issue = await asAdmin.query(api.issues.getIssue, { id: issueId });
      expect(issue?.status).toBe("todo");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("search", () => {
    it("should search issues by title", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Fix login bug",
        type: "bug",
        priority: "high",
      });
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Add login feature",
        type: "story",
        priority: "medium",
      });
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Update dashboard",
        type: "task",
        priority: "low",
      });

      const searchResult = await asUser.query(api.issues.search, {
        query: "login",
      });

      expect(searchResult.page).toHaveLength(2);
      expect(searchResult.page.map((i) => i.title)).toContain("Fix login bug");
      expect(searchResult.page.map((i) => i.title)).toContain("Add login feature");
      await t.finishInProgressScheduledFunctions();
    });

    it("should search issues by description", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Normal Title",
        description: "Contains unique_word_in_desc",
        type: "task",
        priority: "medium",
      });

      const searchResult = await asUser.query(api.issues.search, {
        query: "unique_word_in_desc",
      });

      expect(searchResult.page).toHaveLength(1);
      expect(searchResult.page[0].title).toBe("Normal Title");
      await t.finishInProgressScheduledFunctions();
    });

    it("should update search results when description is modified", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Update Test",
        description: "Initial description",
        type: "task",
        priority: "medium",
      });

      // Update description
      await asUser.mutation(api.issues.update, {
        issueId,
        description: "Updated unique_update_word",
      });

      // Search for new word
      const searchResult = await asUser.query(api.issues.search, {
        query: "unique_update_word",
      });

      expect(searchResult.page).toHaveLength(1);
      expect(searchResult.page[0].title).toBe("Update Test");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("roadmap", () => {
    it("should exclude epics when excludeEpics is true", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create an epic
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Epic 1",
        type: "epic",
        priority: "high",
      });

      // Create a task
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Task 1",
        type: "task",
        priority: "medium",
      });

      // List without exclusion
      const issues = await asUser.query(api.issues.listRoadmapIssues, {
        projectId,
      });
      expect(issues).toHaveLength(2);

      // List WITH exclusion
      const issuesNoEpics = await asUser.query(api.issues.listRoadmapIssues, {
        projectId,
        excludeEpics: true,
      });
      expect(issuesNoEpics).toHaveLength(1);
      expect(issuesNoEpics[0].type).toBe("task");
      await t.finishInProgressScheduledFunctions();
    });

    it("should filter by epicId using optimized path", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create an epic
      const { issueId: epicId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Epic 1",
        type: "epic",
        priority: "high",
      });

      // Create task IN the epic
      const { issueId: taskInEpicId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Task in Epic",
        type: "task",
        priority: "medium",
        epicId: epicId,
      });

      // Create task NOT in the epic
      await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Task not in Epic",
        type: "task",
        priority: "medium",
      });

      // List by epicId
      const issuesInEpic = await asUser.query(api.issues.listRoadmapIssues, {
        projectId,
        epicId: epicId,
      });

      expect(issuesInEpic).toHaveLength(1);
      expect(issuesInEpic[0].title).toBe("Task in Epic");
      expect(issuesInEpic[0]._id).toBe(taskInEpicId);
      await t.finishInProgressScheduledFunctions();
    });
  });
});
