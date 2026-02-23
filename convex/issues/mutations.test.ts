import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { DAY, WEEK } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "../testUtils";

describe("Issue Mutations", () => {
  describe("createIssue", () => {
    it("should create issue with all optional fields", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Full Feature Project",
        key: "FULL",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Full Featured Issue",
        description: "A detailed description",
        type: "story",
        priority: "high",
        assigneeId: userId,
        estimatedHours: 8,
        storyPoints: 5,
        dueDate: Date.now() + WEEK,
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.title).toBe("Full Featured Issue");
      expect(issue?.description).toBe("A detailed description");
      expect(issue?.type).toBe("story");
      expect(issue?.priority).toBe("high");
      expect(issue?.estimatedHours).toBe(8);
      expect(issue?.storyPoints).toBe(5);
      expect(issue?.dueDate).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should create epic type issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Epic Project",
        key: "EPIC",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Epic Issue",
        type: "epic",
        priority: "high",
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.type).toBe("epic");
      await t.finishInProgressScheduledFunctions();
    });

    it("should create bug type issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Bug Project",
        key: "BUGP",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Bug Report",
        type: "bug",
        priority: "highest",
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.type).toBe("bug");
      expect(issue?.priority).toBe("highest");
      await t.finishInProgressScheduledFunctions();
    });

    it("should log activity when issue is created", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Activity Project",
        key: "ACT",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Activity Test",
        type: "task",
        priority: "medium",
      });

      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].action).toBe("created");
      expect(activities[0].userId).toBe(userId);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateStatus", () => {
    it("should not log activity when status is unchanged", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "No Change Project",
        key: "NOCH",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      // Clear activities from creation
      await t.run(async (ctx) => {
        const activities = await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
        await Promise.all(activities.map((a) => ctx.db.delete(a._id)));
      });

      // Update to same status
      const result = await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "todo", // Same as default
        newOrder: 0,
      });
      expect(result).toEqual({ success: true });

      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      expect(activities).toHaveLength(0);
      await t.finishInProgressScheduledFunctions();
    });

    it("should update order along with status", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Order Project",
        key: "ORDER",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Order Test",
        type: "task",
        priority: "medium",
      });

      const result = await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "inprogress",
        newOrder: 5,
      });
      expect(result).toEqual({ success: true });

      const issue = await t.run(async (ctx) => ctx.db.get(issueId));
      expect(issue?.order).toBe(5);
      expect(issue?.status).toBe("inprogress");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateStatusByCategory", () => {
    it("should update status by workflow category", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Category Project",
        key: "CAT",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Category Test",
        type: "task",
        priority: "medium",
      });

      const result = await asUser.mutation(api.issues.updateStatusByCategory, {
        issueId,
        category: "done",
        newOrder: 0,
      });
      expect(result).toEqual({ success: true });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.status).toBe("done");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for invalid category", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Invalid Category Project",
        key: "INVAL",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Category Error Test",
        type: "task",
        priority: "medium",
      });

      // Create custom project without certain categories
      await t.run(async (ctx) => {
        await ctx.db.patch(projectId, {
          workflowStates: [{ id: "only-todo", name: "Only Todo", category: "todo", order: 0 }],
        });
      });

      await expect(
        asUser.mutation(api.issues.updateStatusByCategory, {
          issueId,
          category: "done",
          newOrder: 0,
        }),
      ).rejects.toThrow(/No workflow state found for category/);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("update", () => {
    it("should update multiple fields at once", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Multi Update Project",
        key: "MULTI",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Original Title",
        description: "Original description",
        type: "task",
        priority: "low",
      });

      const result = await asUser.mutation(api.issues.update, {
        issueId,
        title: "Updated Title",
        description: "Updated description",
        priority: "high",
        estimatedHours: 4,
        storyPoints: 3,
      });
      expect(result).toEqual({ success: true });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.title).toBe("Updated Title");
      expect(issue?.description).toBe("Updated description");
      expect(issue?.priority).toBe("high");
      expect(issue?.estimatedHours).toBe(4);
      expect(issue?.storyPoints).toBe(3);
      await t.finishInProgressScheduledFunctions();
    });

    it("should clear optional fields when set to null", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Clear Fields Project",
        key: "CLEAR",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Clearable Issue",
        type: "task",
        priority: "medium",
        assigneeId: userId,
        estimatedHours: 8,
        storyPoints: 5,
        dueDate: Date.now() + DAY,
      });

      const result = await asUser.mutation(api.issues.update, {
        issueId,
        assigneeId: null,
        estimatedHours: null,
        storyPoints: null,
        dueDate: null,
      });
      expect(result).toEqual({ success: true });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.assigneeId).toBeUndefined();
      expect(issue?.estimatedHours).toBeUndefined();
      expect(issue?.storyPoints).toBeUndefined();
      expect(issue?.dueDate).toBeUndefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should update labels", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Labels Project",
        key: "LABEL",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Labels Issue",
        type: "task",
        priority: "medium",
      });

      const result = await asUser.mutation(api.issues.update, {
        issueId,
        labels: ["bug", "urgent", "frontend"],
      });
      expect(result).toEqual({ success: true });

      // Labels are enriched with color info when fetched via issues.get
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      const labelNames = issue?.labels.map((l: { name: string }) => l.name) ?? [];
      expect(labelNames).toContain("bug");
      expect(labelNames).toContain("urgent");
      expect(labelNames).toContain("frontend");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("addComment", () => {
    it("should add comment with mentions", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const mentionedUser = await createTestUser(t, { name: "Mentioned User" });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Comment Project",
        key: "COMM",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Comment Test",
        type: "task",
        priority: "medium",
      });

      const { commentId } = await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "Check this @mention",
        mentions: [mentionedUser],
      });

      expect(commentId).toBeDefined();

      const comment = await t.run(async (ctx) => ctx.db.get(commentId));
      expect(comment?.mentions).toContain(mentionedUser);
      await t.finishInProgressScheduledFunctions();
    });

    it("should log commented activity", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Activity Comment Project",
        key: "ACTC",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Activity Comment Test",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "A comment",
      });

      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      const commentActivity = activities.find((a) => a.action === "commented");
      expect(commentActivity).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should allow viewers to comment", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Viewer Comment Project",
        key: "VIEWC",
      });

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { issueId } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Viewer Comment Test",
        type: "task",
        priority: "medium",
      });

      // Add viewer to project
      await addProjectMember(t, projectId, viewerId, "viewer", adminId);

      // Viewer should be able to comment
      const asViewer = asAuthenticatedUser(t, viewerId);
      const { commentId } = await asViewer.mutation(api.issues.addComment, {
        issueId,
        content: "Viewer comment",
      });

      expect(commentId).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("bulk operations", () => {
    describe("bulkUpdateStatus", () => {
      it("should skip issues user cannot edit", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
        const { organizationId } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, adminId, organizationId, {
          name: "Bulk Skip Project",
          key: "BULKS",
        });

        const asAdmin = asAuthenticatedUser(t, adminId);
        const { issueId } = await asAdmin.mutation(api.issues.createIssue, {
          projectId,
          title: "Bulk Skip Test",
          type: "task",
          priority: "medium",
        });

        // Add viewer (cannot edit)
        await addProjectMember(t, projectId, viewerId, "viewer", adminId);

        const asViewer = asAuthenticatedUser(t, viewerId);
        const result = await asViewer.mutation(api.issues.bulkUpdateStatus, {
          issueIds: [issueId],
          newStatus: "done",
        });

        expect(result.updated).toBe(0); // Viewer cannot edit
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("bulkUpdatePriority", () => {
      it("should update priority for multiple issues", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Priority Project",
          key: "BULKP",
        });

        const issue1 = await createTestIssue(t, projectId, userId, {
          title: "Issue 1",
          priority: "low",
        });
        const issue2 = await createTestIssue(t, projectId, userId, {
          title: "Issue 2",
          priority: "low",
        });

        const result = await asUser.mutation(api.issues.bulkUpdatePriority, {
          issueIds: [issue1, issue2],
          priority: "highest",
        });

        expect(result.updated).toBe(2);

        const updated1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const updated2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        expect(updated1?.priority).toBe("highest");
        expect(updated2?.priority).toBe("highest");
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("bulkAssign", () => {
      it("should assign issues to a user", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);
        const assigneeId = await createTestUser(t, { name: "Assignee" });

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Assign Project",
          key: "BULKA",
        });

        const issue1 = await createTestIssue(t, projectId, userId, { title: "Issue 1" });
        const issue2 = await createTestIssue(t, projectId, userId, { title: "Issue 2" });

        const result = await asUser.mutation(api.issues.bulkAssign, {
          issueIds: [issue1, issue2],
          assigneeId,
        });

        expect(result.updated).toBe(2);

        const updated1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const updated2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        expect(updated1?.assigneeId).toBe(assigneeId);
        expect(updated2?.assigneeId).toBe(assigneeId);
        await t.finishInProgressScheduledFunctions();
      });

      it("should unassign issues when assigneeId is null", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Unassign Project",
          key: "BULKU",
        });

        const issue = await createTestIssue(t, projectId, userId, {
          title: "Assigned Issue",
          assigneeId: userId,
        });

        await asUser.mutation(api.issues.bulkAssign, {
          issueIds: [issue],
          assigneeId: null,
        });

        const updated = await asUser.query(api.issues.getIssue, { id: issue });
        expect(updated?.assigneeId).toBeUndefined();
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("bulkAddLabels", () => {
      it("should add labels to multiple issues", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Labels Project",
          key: "BULKL",
        });

        const issue1 = await createTestIssue(t, projectId, userId, { title: "Issue 1" });
        const issue2 = await createTestIssue(t, projectId, userId, { title: "Issue 2" });

        await asUser.mutation(api.issues.bulkAddLabels, {
          issueIds: [issue1, issue2],
          labels: ["important", "review"],
        });

        // Labels are enriched with color info when fetched via issues.get
        const updated1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const updated2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        const labels1 = updated1?.labels.map((l: { name: string }) => l.name) ?? [];
        const labels2 = updated2?.labels.map((l: { name: string }) => l.name) ?? [];
        expect(labels1).toContain("important");
        expect(labels1).toContain("review");
        expect(labels2).toContain("important");
        expect(labels2).toContain("review");
        await t.finishInProgressScheduledFunctions();
      });

      it("should not duplicate existing labels", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "No Dup Labels Project",
          key: "NODUP",
        });

        // Create issue with initial labels directly
        const issueId = await createTestIssue(t, projectId, userId, {
          title: "Label Test",
        });
        await t.run(async (ctx) => {
          await ctx.db.patch(issueId, { labels: ["existing"] });
        });

        // Bulk add with duplicate
        await asUser.mutation(api.issues.bulkAddLabels, {
          issueIds: [issueId],
          labels: ["existing", "new"],
        });

        // Labels are enriched with color info when fetched via issues.get
        const issue = await asUser.query(api.issues.getIssue, { id: issueId });
        const labelNames = issue?.labels.map((l: { name: string }) => l.name) ?? [];
        const existingCount = labelNames.filter((name: string) => name === "existing").length;
        expect(existingCount).toBe(1); // No duplicate
        expect(labelNames).toContain("new");
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("bulkDelete", () => {
      it("should delete multiple issues", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Delete Project",
          key: "BULKD",
        });

        const issue1 = await createTestIssue(t, projectId, userId, { title: "To Delete 1" });
        const issue2 = await createTestIssue(t, projectId, userId, { title: "To Delete 2" });

        const result = await asUser.mutation(api.issues.bulkDelete, {
          issueIds: [issue1, issue2],
        });

        expect(result.deleted).toBe(2);

        const deleted1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const deleted2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        expect(deleted1).toBeNull();
        expect(deleted2).toBeNull();
        await t.finishInProgressScheduledFunctions();
      });

      it("should require admin role to delete", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
        const { organizationId } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, adminId, organizationId, {
          name: "Delete Auth Project",
          key: "DELAUTH",
        });

        // Add editor to project
        await addProjectMember(t, projectId, editorId, "editor", adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const { issueId } = await asAdmin.mutation(api.issues.createIssue, {
          projectId,
          title: "Admin Only Delete",
          type: "task",
          priority: "medium",
        });

        // Editor should not be able to delete (requires admin)
        const asEditor = asAuthenticatedUser(t, editorId);
        const result = await asEditor.mutation(api.issues.bulkDelete, {
          issueIds: [issueId],
        });

        expect(result.deleted).toBe(0);

        // Issue should still exist
        const issue = await asAdmin.query(api.issues.getIssue, { id: issueId });
        expect(issue).toBeDefined();
        await t.finishInProgressScheduledFunctions();
      });
    });
  });
});
