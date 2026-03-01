import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Notifications Count Benchmark", () => {
  it("should efficiently count unread notifications ignoring deleted ones", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Batch insert notifications to speed up test setup
    await t.run(async (ctx) => {
      // 500 read notifications
      for (let i = 0; i < 500; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "info",
          title: `Read ${i}`,
          message: "message",
          isRead: true,
          isDeleted: false,
        });
      }

      // 400 unread but deleted notifications
      for (let i = 0; i < 400; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "info",
          title: `Deleted ${i}`,
          message: "message",
          isRead: false,
          isDeleted: true,
          deletedAt: Date.now(),
        });
      }

      // 100 unread and active notifications
      for (let i = 0; i < 100; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "info",
          title: `Active ${i}`,
          message: "message",
          isRead: false,
          // Explicitly false to match likely production data, though undefined is also possible
          isDeleted: false,
        });
      }
    });

    // authenticate as user
    const asUser = t.withIdentity({ subject: userId });

    // Measure time
    const start = Date.now();
    const count = await asUser.query(api.notifications.getUnreadCount);
    const duration = Date.now() - start;

    console.log(`getUnreadCount took ${duration}ms`);

    expect(count).toBe(100);
  });
});
