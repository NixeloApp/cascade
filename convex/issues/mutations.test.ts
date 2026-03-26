import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { DAY, WEEK } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  addProjectMember,
  addUserToOrganization,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "../testUtils";

const EXPECTED_SINGLE_COMMENT = 1;

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
      expect(issue?.dueDate).toBeGreaterThan(Date.now());
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

    it("redirects assignment to an active OOO delegate", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const assigneeId = await createTestUser(t, { name: "OOO Assignee" });
      const delegateUserId = await createTestUser(t, { name: "Delegate" });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "OOO Redirect Project",
        key: "OOORD",
      });

      await addUserToOrganization(t, organizationId, assigneeId, userId);
      await addUserToOrganization(t, organizationId, delegateUserId, userId);
      await addProjectMember(t, projectId, assigneeId, "editor", userId);
      await addProjectMember(t, projectId, delegateUserId, "editor", userId);

      const asAssignee = asAuthenticatedUser(t, assigneeId);
      const now = Date.now();
      await asAssignee.mutation(api.outOfOffice.upsert, {
        startsAt: now - DAY,
        endsAt: now + DAY,
        reason: "vacation",
        delegateUserId,
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Redirected Issue",
        type: "task",
        priority: "medium",
        assigneeId,
      });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.assigneeId).toBe(delegateUserId);
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
        for (const a of activities) {
          await ctx.db.delete(a._id);
        }
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

    it("redirects assignee updates to an active OOO delegate", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const assigneeId = await createTestUser(t, { name: "OOO Assignee" });
      const delegateUserId = await createTestUser(t, { name: "Delegate" });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "OOO Update Project",
        key: "OOOUP",
      });

      await addUserToOrganization(t, organizationId, assigneeId, userId);
      await addUserToOrganization(t, organizationId, delegateUserId, userId);
      await addProjectMember(t, projectId, assigneeId, "editor", userId);
      await addProjectMember(t, projectId, delegateUserId, "editor", userId);

      const asAssignee = asAuthenticatedUser(t, assigneeId);
      const now = Date.now();
      await asAssignee.mutation(api.outOfOffice.upsert, {
        startsAt: now - DAY,
        endsAt: now + DAY,
        reason: "travel",
        delegateUserId,
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Update Redirect Issue",
        type: "task",
        priority: "medium",
      });

      const result = await asUser.mutation(api.issues.update, {
        issueId,
        assigneeId,
      });
      expect(result).toEqual({ success: true });

      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.assigneeId).toBe(delegateUserId);
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

      expect(typeof commentId).toBe("string");
      expect(commentId.length).toBeGreaterThan(0);

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
      expect(commentActivity?.action).toBe("commented");
      expect(commentActivity?.userId).toBe(userId);
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

      expect(typeof commentId).toBe("string");
      expect(commentId.length).toBeGreaterThan(0);
      await t.finishInProgressScheduledFunctions();
    });

    it("deduplicates retried comment submissions by client request ID", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Offline Replay Project",
        key: "OFFC",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Replay comment test",
        type: "task",
        priority: "medium",
      });

      const firstResult = await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "Post once even if replayed",
        clientRequestId: "issue-comment:request-1",
      });

      const secondResult = await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "Post once even if replayed",
        clientRequestId: "issue-comment:request-1",
      });

      expect(secondResult.commentId).toBe(firstResult.commentId);

      const [comments, activities] = await Promise.all([
        t.run(async (ctx) => {
          return await ctx.db
            .query("issueComments")
            .withIndex("by_issue", (q) => q.eq("issueId", issueId))
            .collect();
        }),
        t.run(async (ctx) => {
          return await ctx.db
            .query("issueActivity")
            .withIndex("by_issue", (q) => q.eq("issueId", issueId))
            .collect();
        }),
      ]);

      expect(comments).toHaveLength(EXPECTED_SINGLE_COMMENT);
      expect(comments[0]?.clientRequestId).toBe("issue-comment:request-1");
      expect(activities.filter((activity) => activity.action === "commented")).toHaveLength(
        EXPECTED_SINGLE_COMMENT,
      );
      await t.finishInProgressScheduledFunctions();
    });

    it("rejects empty client request IDs for comment idempotency", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Offline Replay Validation Project",
        key: "OFFV",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Replay validation test",
        type: "task",
        priority: "medium",
      });

      await expect(
        asUser.mutation(api.issues.addComment, {
          issueId,
          content: "Should fail validation",
          clientRequestId: "   ",
        }),
      ).rejects.toThrow("clientRequestId must be non-empty");
      await t.finishInProgressScheduledFunctions();
    });

    it("rejects conflicting comment replays for a reused client request ID", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Offline Replay Conflict Project",
        key: "OFFR",
      });

      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Replay conflict test",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "Original comment payload",
        clientRequestId: "issue-comment:request-conflict",
      });

      await expect(
        asUser.mutation(api.issues.addComment, {
          issueId,
          content: "Conflicting replay payload",
          clientRequestId: "issue-comment:request-conflict",
        }),
      ).rejects.toThrow("clientRequestId was already used for a different comment");
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

    describe("bulkRemoveLabels", () => {
      it("should remove labels from multiple issues", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Remove Labels Project",
          key: "BRMVL",
        });

        const issue1 = await createTestIssue(t, projectId, userId, { title: "Issue 1" });
        const issue2 = await createTestIssue(t, projectId, userId, { title: "Issue 2" });

        // Patch labels directly onto the issues
        await t.run(async (ctx) => {
          await ctx.db.patch(issue1, { labels: ["bug", "urgent", "review"] });
          await ctx.db.patch(issue2, { labels: ["bug", "feature"] });
        });

        await asUser.mutation(api.issues.bulkRemoveLabels, {
          issueIds: [issue1, issue2],
          labels: ["bug", "urgent"],
        });

        const updated1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const updated2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        const labels1 = updated1?.labels.map((l: { name: string }) => l.name) ?? [];
        const labels2 = updated2?.labels.map((l: { name: string }) => l.name) ?? [];
        expect(labels1).toEqual(["review"]);
        expect(labels2).toEqual(["feature"]);
        await t.finishInProgressScheduledFunctions();
      });

      it("should skip issues that don't have the specified labels", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Skip Remove Labels Project",
          key: "SKPRL",
        });

        const issueId = await createTestIssue(t, projectId, userId, { title: "No Match" });
        await t.run(async (ctx) => {
          await ctx.db.patch(issueId, { labels: ["unrelated"] });
        });

        const result = await asUser.mutation(api.issues.bulkRemoveLabels, {
          issueIds: [issueId],
          labels: ["nonexistent"],
        });

        expect(result.updated).toBe(0);

        const updated = await asUser.query(api.issues.getIssue, { id: issueId });
        const labelNames = updated?.labels.map((l: { name: string }) => l.name) ?? [];
        expect(labelNames).toEqual(["unrelated"]);
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
        expect(issue).not.toBeNull();
        expect(issue?.title).toBe("Admin Only Delete");
        await t.finishInProgressScheduledFunctions();
      });
    });

    describe("bulkMoveToSprint", () => {
      it("should move issues to a sprint", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Sprint Project",
          key: "BULKS",
        });

        const sprintId = await t.run(async (ctx) => {
          return await ctx.db.insert("sprints", {
            projectId,
            name: "Sprint 1",
            status: "active",
            createdBy: userId,
            updatedAt: Date.now(),
          });
        });

        const issue1 = await createTestIssue(t, projectId, userId, { title: "Issue 1" });
        const issue2 = await createTestIssue(t, projectId, userId, { title: "Issue 2" });

        const result = await asUser.mutation(api.issues.bulkMoveToSprint, {
          issueIds: [issue1, issue2],
          sprintId,
        });

        expect(result.updated).toBe(2);

        const updated1 = await asUser.query(api.issues.getIssue, { id: issue1 });
        const updated2 = await asUser.query(api.issues.getIssue, { id: issue2 });
        expect(updated1?.sprintId).toBe(sprintId);
        expect(updated2?.sprintId).toBe(sprintId);
        await t.finishInProgressScheduledFunctions();
      });

      it("should remove issues from sprint when sprintId is null", async () => {
        const t = convexTest(schema, modules);
        const { userId, organizationId, asUser } = await createTestContext(t);

        const projectId = await createProjectInOrganization(t, userId, organizationId, {
          name: "Bulk Unsprint Project",
          key: "BULKU",
        });

        const sprintId = await t.run(async (ctx) => {
          return await ctx.db.insert("sprints", {
            projectId,
            name: "Sprint 1",
            status: "active",
            createdBy: userId,
            updatedAt: Date.now(),
          });
        });

        const issue = await createTestIssue(t, projectId, userId, {
          title: "Sprinted Issue",
          sprintId,
        });

        await asUser.mutation(api.issues.bulkMoveToSprint, {
          issueIds: [issue],
          sprintId: null,
        });

        const updated = await asUser.query(api.issues.getIssue, { id: issue });
        expect(updated?.sprintId).toBeUndefined();
        await t.finishInProgressScheduledFunctions();
      });
    });
  });
});
