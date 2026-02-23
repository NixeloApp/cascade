import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Notifications Performance", () => {
  it("should list notifications for digest with time filtering", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const actorId = await createTestUser(t);

    // Create some notifications
    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.notifications.createNotification, {
        userId,
        actorId,
        type: "mention",
        title: `Notification ${i}`,
        message: "Test message",
      });
    }

    // Get actual creation times from the notifications
    const allNotifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect();
    });
    const times = allNotifications.map((n) => n._creationTime);
    const earliestTime = Math.min(...times);
    const latestTime = Math.max(...times);

    // Sanity check: all notifications should be created within 1 minute of each other
    const ONE_MINUTE = 60 * 1000;
    expect(latestTime - earliestTime).toBeLessThan(ONE_MINUTE);

    // Query with startTime at or before all notifications - should return all
    const digest = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: earliestTime,
    });

    expect(digest).toHaveLength(5);

    // Verify descending order (newest first based on _creationTime)
    for (let i = 1; i < digest.length; i++) {
      expect(digest[i - 1]._creationTime).toBeGreaterThanOrEqual(digest[i]._creationTime);
    }

    // Query with future startTime - should return nothing
    const emptyDigest = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: latestTime + 1,
    });

    expect(emptyDigest).toHaveLength(0);
  });
});
