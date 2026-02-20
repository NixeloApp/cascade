import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Notifications Performance", () => {
  // TODO: Fix timing issue in convex-test where _creationTime may be identical across operations
  it.skip("should efficiently list notifications for digest", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const actorId = await createTestUser(t);

    // 1. Insert 20 'old' notifications
    for (let i = 0; i < 20; i++) {
      await t.mutation(internal.notifications.createNotification, {
        userId,
        actorId,
        type: "mention",
        title: `Old Notification ${i}`,
        message: "Old message",
      });
    }

    // Capture the time after old notifications
    // In convex-test, time advances with operations or we can check the last inserted item
    // But since we pass startTime explicitly, we can just use a timestamp that we know is after old ones.
    // However, convex-test uses real Date.now() by default or we can control it.
    // Let's assume real time and sleep slightly if needed, or just rely on sequential execution.

    // To be safe, we can fetch the last old notification's creation time
    const oldNotifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect();
    });
    const lastOldTime = oldNotifications[oldNotifications.length - 1]._creationTime;

    const startTime = lastOldTime + 1;

    // 2. Insert 5 'new' notifications
    for (let i = 0; i < 5; i++) {
      // Sleep to ensure time difference if needed (in real DB), but in test it might be fast.
      // But `_creationTime` is usually monotonic.
      await t.mutation(internal.notifications.createNotification, {
        userId,
        actorId,
        type: "mention",
        title: `New Notification ${i}`,
        message: "New message",
      });
    }

    // 3. List digest
    const digest = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime,
    });

    // 4. Verify
    expect(digest).toHaveLength(5);
    expect(digest.map((n) => n.title)).toEqual([
      "New Notification 4",
      "New Notification 3",
      "New Notification 2",
      "New Notification 1",
      "New Notification 0",
    ]);
  });
});
