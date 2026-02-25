import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Migrations", () => {
  it("should backfill isDeleted=false for notifications missing the field", async () => {
    const t = convexTest(schema, modules);

    // Setup: Create a user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Test User", email: "test@example.com" });
    });

    // Setup: Create notifications with various states
    await t.run(async (ctx) => {
      // 1. Existing isDeleted: true (should be untouched)
      await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: "Test 1",
        message: "Message 1",
        isRead: false,
        isDeleted: true,
      });

      // 2. Existing isDeleted: false (should be untouched)
      await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: "Test 2",
        message: "Message 2",
        isRead: false,
        isDeleted: false,
      });

      // 3. Missing isDeleted (should be updated)
      await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: "Test 3",
        message: "Message 3",
        isRead: false,
        isDeleted: undefined, // Simulating missing field
      });
    });

    // Run migration
    const result = await t.mutation(internal.migrations.backfillNotificationIsDeleted, {});

    expect(result.count).toBe(1);

    // Verify
    await t.run(async (ctx) => {
      const all = await ctx.db.query("notifications").collect();

      const n1 = all.find((n) => n.title === "Test 1");
      expect(n1?.isDeleted).toBe(true);

      const n2 = all.find((n) => n.title === "Test 2");
      expect(n2?.isDeleted).toBe(false);

      const n3 = all.find((n) => n.title === "Test 3");
      expect(n3?.isDeleted).toBe(false); // Was undefined, now false
    });
  });

  it("should respect limit argument", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Test User", email: "test@example.com" });
    });

    // Insert 5 missing ones
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("notifications", {
          userId,
          type: "mention",
          title: `Missing ${i}`,
          message: "Message",
          isRead: false,
          isDeleted: undefined,
        });
      }
    });

    // Run with limit 2
    const result1 = await t.mutation(internal.migrations.backfillNotificationIsDeleted, {
      limit: 2,
    });
    expect(result1.count).toBe(2);

    // Verify only 2 updated
    await t.run(async (ctx) => {
      const updated = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
      expect(updated.length).toBe(2);

      const remaining = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("isDeleted"), undefined))
        .collect();
      expect(remaining.length).toBe(3);
    });

    // Run remaining
    const result2 = await t.mutation(internal.migrations.backfillNotificationIsDeleted, {});
    expect(result2.count).toBe(3);

    // Verify all updated
    await t.run(async (ctx) => {
      const remaining = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("isDeleted"), undefined))
        .collect();
      expect(remaining.length).toBe(0);
    });
  });
});
