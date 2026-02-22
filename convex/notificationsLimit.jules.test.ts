import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Notifications Limit", () => {
  it("should cap unread count at 100", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await t.run(async (ctx) => {
      for (let i = 0; i < 105; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "info",
          title: `Unread ${i}`,
          message: "message",
          isRead: false,
          isDeleted: false,
        });
      }
    });

    const count = await asUser.query(api.notifications.getUnreadCount);
    // This will currently be 105 because efficientCount uses .count() which is unbounded
    // My fix will make it 100
    expect(count).toBe(100);
  });
});
