import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
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

describe("Issue Notifications", () => {
  it("should notify mentioned users and reporter on comment", async () => {
    const t = convexTest(schema, modules);
    const { userId: reporterId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, reporterId, organizationId, {
      name: "Notification Project",
      key: "NOTIF",
    });

    const issueId = await createTestIssue(t, projectId, reporterId, {
      title: "Test Issue",
      description: "Test description",
    });

    // Create a commenter and a mentioned user
    const commenterId = await createTestUser(t, { name: "Commenter" });
    const mentionedUserId = await createTestUser(t, { name: "Mentioned User" });

    // Add them to project
    await addProjectMember(t, projectId, commenterId, "viewer", reporterId);
    await addProjectMember(t, projectId, mentionedUserId, "viewer", reporterId);

    const asCommenter = asAuthenticatedUser(t, commenterId);

    // Commenter comments mentioning Mentioned User
    await asCommenter.mutation(api.issues.addComment, {
      issueId,
      content: "Hello @Mentioned User",
      mentions: [mentionedUserId],
    });

    // Verify notifications
    const notifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect();
    });

    // Mentioned user should get 'issue_mentioned'
    const mentionNotification = notifications.find(
      (n) => n.userId === mentionedUserId && n.type === "issue_mentioned",
    );
    expect(mentionNotification).toBeDefined();
    expect(mentionNotification?.issueId).toBe(issueId);

    // Reporter should get 'issue_comment' (since commenter != reporter)
    const reporterNotification = notifications.find(
      (n) => n.userId === reporterId && n.type === "issue_comment",
    );
    expect(reporterNotification).toBeDefined();
    expect(reporterNotification?.issueId).toBe(issueId);

    // Commenter should NOT get a notification
    const commenterNotification = notifications.find((n) => n.userId === commenterId);
    expect(commenterNotification).toBeUndefined();
  });

  it("should NOT notify mentioned users if they don't have project access", async () => {
    const t = convexTest(schema, modules);
    const { userId: reporterId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, reporterId, organizationId, {
      name: "Private Project",
      key: "PRIV",
    });

    const issueId = await createTestIssue(t, projectId, reporterId, {
      title: "Private Issue",
    });

    // Create a commenter (member) and an outsider (no access)
    const commenterId = await createTestUser(t, { name: "Commenter" });
    const outsiderId = await createTestUser(t, { name: "Outsider" });

    // Add commenter to project
    await addProjectMember(t, projectId, commenterId, "viewer", reporterId);

    // Ensure outsider is NOT added to project
    // (default behavior)

    const asCommenter = asAuthenticatedUser(t, commenterId);

    // Commenter tries to mention outsider
    await asCommenter.mutation(api.issues.addComment, {
      issueId,
      content: "Hey @Outsider check this out",
      mentions: [outsiderId],
    });

    // Verify notifications
    const notifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect();
    });

    // Outsider should NOT get any notification
    const outsiderNotification = notifications.find((n) => n.userId === outsiderId);
    expect(outsiderNotification).toBeUndefined();

    // Reporter should still get 'issue_comment'
    const reporterNotification = notifications.find(
      (n) => n.userId === reporterId && n.type === "issue_comment",
    );
    expect(reporterNotification).toBeDefined();
  });
});
