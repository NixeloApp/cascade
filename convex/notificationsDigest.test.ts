import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("Notifications Digest", () => {
  it("should filter notifications by startTime", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const actorId = await createTestUser(t);

    // Create notifications with distinct timestamps
    const n1 = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        actorId,
        type: "test",
        title: "Notification 1",
        message: "Oldest",
        isRead: false,
      });
    });

    // We need to ensure time passes, but convex-test runs fast.
    // However, since we rely on _creationTime which is server time,
    // and subsequent inserts should have >= timestamps.
    // If they happen in same millisecond, they might be equal.
    // The test logic relies on inclusive filtering, so equal is fine.

    const n2 = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        actorId,
        type: "test",
        title: "Notification 2",
        message: "Middle",
        isRead: false,
      });
    });

    const n3 = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        actorId,
        type: "test",
        title: "Notification 3",
        message: "Newest",
        isRead: false,
      });
    });

    // Get actual creation time of n2
    const n2Doc = await t.run(async (ctx) => ctx.db.get(n2));
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    const startTime = n2Doc!._creationTime;

    // Query with startTime equal to middle notification
    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime,
    });

    // Should include n2 (inclusive) and n3 (newer or same)
    // Filter out n1
    const resultIds = result.map((n) => n._id);
    expect(resultIds).toContain(n2);
    expect(resultIds).toContain(n3);
    expect(resultIds).not.toContain(n1);
  });

  it("should exclude soft-deleted notifications", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Create active notification
    const activeId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        type: "test",
        title: "Active",
        message: "Active",
        isRead: false,
      });
    });

    // Create notification to be deleted
    const deletedId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        type: "test",
        title: "Deleted",
        message: "Deleted",
        isRead: false,
      });
    });

    // Soft delete it
    await asUser.mutation(api.notifications.softDeleteNotification, { id: deletedId });

    // Query with startTime 0 to include everything
    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: 0,
    });

    // Verify only active one is returned
    const resultIds = result.map((n) => n._id);
    expect(resultIds).toContain(activeId);
    expect(resultIds).not.toContain(deletedId);
  });

  it("should enrich notifications with actor and issue details", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const actorId = await createTestUser(t, { name: "Test Actor" });

    // Create issue context
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      key: "TEST",
    });
    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Test Issue",
    });

    // Get issue key for verification
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));

    // Create notification linked to actor and issue
    await t.run(async (ctx) => {
      await ctx.db.insert("notifications", {
        userId,
        actorId,
        issueId,
        type: "issue_assigned",
        title: "Assigned",
        message: "You have been assigned",
        isRead: false,
      });
    });

    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: 0,
    });

    expect(result).toHaveLength(1);
    expect(result[0].actorName).toBe("Test Actor");
    expect(result[0].issueKey).toBe(issue?.key);
  });

  it("should respect MAX_DIGEST_NOTIFICATIONS limit", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Create 105 notifications
    await t.run(async (ctx) => {
      // Create in batches to be faster? 105 is small enough.
      for (let i = 0; i < 105; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: `Notification ${i}`,
          message: "Test",
          isRead: false,
        });
      }
    });

    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: 0,
    });

    expect(result).toHaveLength(100);
  });

  it("should return notifications in descending order", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Create 3 notifications
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const id = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: `Notification ${i}`,
          message: "Test",
          isRead: false,
        });
      });
      ids.push(id);
    }

    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: 0,
    });

    expect(result).toHaveLength(3);
    // Newer (higher creation time) should come first
    // Since we created them 0, 1, 2, notification 2 is newest
    expect(result[0]._creationTime).toBeGreaterThanOrEqual(result[1]._creationTime);
    expect(result[1]._creationTime).toBeGreaterThanOrEqual(result[2]._creationTime);
  });

  it("should include notifications with creationTime exactly equal to startTime", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    const notificationId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        type: "test",
        title: "Exact Time",
        message: "Test",
        isRead: false,
      });
    });

    const notification = await t.run(async (ctx) => ctx.db.get(notificationId));
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    const startTime = notification!._creationTime;

    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime,
    });

    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe(notificationId);
  });
});
