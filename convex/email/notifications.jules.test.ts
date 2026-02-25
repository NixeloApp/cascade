import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "../testUtils";

describe("Email Notifications Error Handling", () => {
  it("sendNotificationEmail handles invalid type gracefully", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId);
    const issueId = await createTestIssue(t, projectId, userId);

    const args = {
      to: "test@example.com",
      userId,
      type: "invalid_type",
      actorName: "Test Actor",
      issueId,
      issueKey: "TEST-1",
      issueTitle: "Test Issue",
      issueType: "task",
      issuePriority: "medium",
      projectName: "Test Project",
    };

    const result = await t.action(internal.email.notifications.sendNotificationEmail, args);

    expect(result).toEqual({ success: false, error: "Unknown notification type: invalid_type" });
  });
});
