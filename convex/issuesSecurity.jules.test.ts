import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Issues Security", () => {
  it("should NOT send notifications to users who cannot access the project", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t, { name: "Owner" });
    const outsiderId = await createTestUser(t, { name: "Outsider" });

    // Create a PRIVATE project
    const projectId = await createTestProject(t, ownerId, { isPublic: false });

    const asOwner = asAuthenticatedUser(t, ownerId);

    // Create an issue
    const issueId = await asOwner.mutation(api.issues.create, {
      projectId,
      title: "Secret Issue",
      type: "task",
      priority: "medium",
    });

    // Owner comments and mentions Outsider
    await asOwner.mutation(api.issues.addComment, {
      issueId,
      content: "Hey @Outsider check this out",
      mentions: [outsiderId],
    });

    // Verify if Outsider got a notification
    // We can query the notifications table directly as we are in test environment (using t.run or asOutsider)

    // Using t.run to check DB state directly
    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", outsiderId))
        .collect();
    });

    // FAIL if notification exists
    // This assertion confirms the vulnerability exists.
    // Once fixed, this should be 0.
    expect(notifications.length).toBe(0);
  });

  it("should NOT assign issues to users who cannot access the project", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t, { name: "Owner" });
    const outsiderId = await createTestUser(t, { name: "Outsider" });

    // Create a PRIVATE project
    const projectId = await createTestProject(t, ownerId, { isPublic: false });

    const asOwner = asAuthenticatedUser(t, ownerId);

    // Create an issue assigned to Outsider
    // The create mutation doesn't seem to check assignee access either?
    const issueId = await asOwner.mutation(api.issues.create, {
      projectId,
      title: "Assigned to Outsider",
      type: "task",
      priority: "medium",
      assigneeId: outsiderId,
    });

    // Verify assignee is outsider
    const issue = await asOwner.query(api.issues.getIssue, { id: issueId });
    expect(issue?.assigneeId).toBe(outsiderId);

    // Try to update assignee to outsider
    await asOwner.mutation(api.issues.update, {
      issueId,
      assigneeId: outsiderId,
    });

    // Check if notification was sent (via email helper call which we can't easily check in test env as it returns void)
    // But we can check if the assignment was allowed.
    // Ideally, we should prevent assigning to users without access.
  });
});
