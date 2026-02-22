import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { batchFetch, batchFetchUsers } from "./batchHelpers";

describe("batchHelpers", () => {
  it("should batch fetch users correctly", async () => {
    const t = convexTest(schema, modules);

    // Create test users
    const user1Id = await t.run(async (ctx) =>
      ctx.db.insert("users", { name: "User 1", email: "user1@example.com" }),
    );
    const user2Id = await t.run(async (ctx) =>
      ctx.db.insert("users", { name: "User 2", email: "user2@example.com" }),
    );

    await t.run(async (ctx) => {
      // Test fetching both users
      const userMap = await batchFetchUsers(ctx, [user1Id, user2Id]);
      expect(userMap.size).toBe(2);
      expect(userMap.get(user1Id)?.name).toBe("User 1");
      expect(userMap.get(user2Id)?.name).toBe("User 2");

      // Test fetching with duplicates
      const userMapDup = await batchFetchUsers(ctx, [user1Id, user1Id, user2Id]);
      expect(userMapDup.size).toBe(2);

      // Test fetching with undefined
      const userMapUndef = await batchFetchUsers(ctx, [user1Id, undefined, user2Id]);
      expect(userMapUndef.size).toBe(2);

      // Test fetching single user
      const userMapSingle = await batchFetchUsers(ctx, [user1Id]);
      expect(userMapSingle.size).toBe(1);
      expect(userMapSingle.get(user1Id)?.name).toBe("User 1");
    });
  });

  it("should handle missing documents gracefully", async () => {
    const t = convexTest(schema, modules);
    const user1Id = await t.run(async (ctx) => ctx.db.insert("users", { name: "User 1" }));

    // Generate a fake ID that looks like a user ID but doesn't exist
    // Using a valid ID format from a deleted user or just another ID
    const fakeId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { name: "Temp" });
      await ctx.db.delete(id);
      return id;
    });

    await t.run(async (ctx) => {
      const userMap = await batchFetchUsers(ctx, [user1Id, fakeId]);
      // Should only contain the existing user
      expect(userMap.size).toBe(1);
      expect(userMap.has(user1Id)).toBe(true);
      expect(userMap.has(fakeId)).toBe(false);
    });
  });

  it("should handle empty input", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const map = await batchFetchUsers(ctx, []);
      expect(map.size).toBe(0);
    });
  });

  it("should handle generic batchFetch", async () => {
    const t = convexTest(schema, modules);
    // Using users table to test generic functionality to avoid complex project setup
    const user1Id = await t.run(async (ctx) =>
      ctx.db.insert("users", { name: "User 1", email: "user1@example.com" }),
    );

    await t.run(async (ctx) => {
      const map = await batchFetch(ctx, "users", [user1Id]);
      expect(map.size).toBe(1);
      expect(map.get(user1Id)?.name).toBe("User 1");
    });
  });
});
