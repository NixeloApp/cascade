import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("Inbox", () => {
  async function createInboxIssue(
    t: ReturnType<typeof convexTest>,
    projectId: Id<"projects">,
    issueId: Id<"issues">,
    userId: Id<"users">,
  ) {
    return await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("inboxIssues", {
        issueId,
        projectId,
        status: "pending",
        source: "email",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  describe("accept", () => {
    it("should accept a pending inbox issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Inbox Test Project",
        key: "INBOX",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Inbox Issue",
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, userId);

      await asUser.mutation(api.inbox.accept, {
        id: inboxIssueId,
        projectId,
        triageNotes: "Looks good!",
      });

      const inboxIssue = await t.run(async (ctx) => ctx.db.get(inboxIssueId));
      expect(inboxIssue?.status).toBe("accepted");
      expect(inboxIssue?.triageNotes).toBe("Looks good!");
      expect(inboxIssue?.triagedBy).toBe(userId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should create notification for issue creator", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const reporterId = await createTestUser(t, { name: "Reporter", email: "reporter@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Notification Test",
        key: "NOTIF",
      });

      // Create issue reported by different user
      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "NOTIF-1",
          title: "Reporter Issue",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId, // Different from admin
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
        });
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, reporterId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.inbox.accept, {
        id: inboxIssueId,
        projectId,
      });

      // Check notification was created for reporter
      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", reporterId))
          .collect();
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("inbox_accepted");
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject if issue already accepted", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Already Accepted",
        key: "ACCEPT",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Already Accepted Issue",
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, userId);

      // Manually set to accepted
      await t.run(async (ctx) => {
        await ctx.db.patch(inboxIssueId, { status: "accepted" });
      });

      await expect(
        asUser.mutation(api.inbox.accept, {
          id: inboxIssueId,
          projectId,
        }),
      ).rejects.toThrow(/Can only accept pending or snoozed issues/);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("decline", () => {
    it("should decline a pending inbox issue with reason", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Decline Test",
        key: "DECL",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "To Decline",
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, userId);

      await asUser.mutation(api.inbox.decline, {
        id: inboxIssueId,
        projectId,
        reason: "Not a valid issue",
      });

      const inboxIssue = await t.run(async (ctx) => ctx.db.get(inboxIssueId));
      expect(inboxIssue?.status).toBe("declined");
      expect(inboxIssue?.declineReason).toBe("Not a valid issue");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("snooze", () => {
    it("should snooze an inbox issue until future date", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Snooze Test",
        key: "SNOOZE",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "To Snooze",
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, userId);
      const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 week

      await asUser.mutation(api.inbox.snooze, {
        id: inboxIssueId,
        projectId,
        until: futureDate,
      });

      const inboxIssue = await t.run(async (ctx) => ctx.db.get(inboxIssueId));
      expect(inboxIssue?.status).toBe("snoozed");
      expect(inboxIssue?.snoozedUntil).toBe(futureDate);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject snooze date in the past", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Past Snooze Test",
        key: "PAST",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Invalid Snooze",
      });

      const inboxIssueId = await createInboxIssue(t, projectId, issueId, userId);
      const pastDate = Date.now() - 1000; // 1 second ago

      await expect(
        asUser.mutation(api.inbox.snooze, {
          id: inboxIssueId,
          projectId,
          until: pastDate,
        }),
      ).rejects.toThrow(/Snooze date must be in the future/);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("bulkAccept", () => {
    it("should accept multiple inbox issues", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Bulk Accept Test",
        key: "BULK",
      });

      const issue1 = await createTestIssue(t, projectId, userId, { title: "Bulk 1" });
      const issue2 = await createTestIssue(t, projectId, userId, { title: "Bulk 2" });

      const inbox1 = await createInboxIssue(t, projectId, issue1, userId);
      const inbox2 = await createInboxIssue(t, projectId, issue2, userId);

      const result = await asUser.mutation(api.inbox.bulkAccept, {
        ids: [inbox1, inbox2],
        projectId,
      });

      expect(result.accepted).toBe(2);

      const accepted1 = await t.run(async (ctx) => ctx.db.get(inbox1));
      const accepted2 = await t.run(async (ctx) => ctx.db.get(inbox2));
      expect(accepted1?.status).toBe("accepted");
      expect(accepted2?.status).toBe("accepted");
      await t.finishInProgressScheduledFunctions();
    });

    it("should skip already processed issues", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Skip Processed Test",
        key: "SKIP",
      });

      const issue1 = await createTestIssue(t, projectId, userId, { title: "Pending" });
      const issue2 = await createTestIssue(t, projectId, userId, { title: "Already Done" });

      const inbox1 = await createInboxIssue(t, projectId, issue1, userId);
      const inbox2 = await createInboxIssue(t, projectId, issue2, userId);

      // Mark second as already declined
      await t.run(async (ctx) => {
        await ctx.db.patch(inbox2, { status: "declined" });
      });

      const result = await asUser.mutation(api.inbox.bulkAccept, {
        ids: [inbox1, inbox2],
        projectId,
      });

      // Only 1 should be accepted, the other was already processed (declined)
      expect(result.accepted).toBe(1);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("authorization", () => {
    it("should reject viewer trying to accept", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Auth Test",
        key: "AUTH",
      });

      const issueId = await createTestIssue(t, projectId, adminId, { title: "Auth Issue" });
      const inboxIssueId = await createInboxIssue(t, projectId, issueId, adminId);

      // Add viewer (cannot edit)
      await addProjectMember(t, projectId, viewerId, "viewer", adminId);

      const asViewer = asAuthenticatedUser(t, viewerId);

      await expect(
        asViewer.mutation(api.inbox.accept, {
          id: inboxIssueId,
          projectId,
        }),
      ).rejects.toThrow();
      await t.finishInProgressScheduledFunctions();
    });
  });
});
