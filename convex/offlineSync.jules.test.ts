import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("offlineSync", () => {
  test("autoRetryFailed retries eligible items and archives max attempts", async () => {
    // Pass modules explicitly to convexTest
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const now = Date.now();

    // 1. Setup initial state
    // itemBackoff: attempts=1 -> index 1 -> 15 min wait. 5 mins passed -> too early -> status remains failed
    const itemBackoffId = await t.run(async (ctx) => {
      return await ctx.db.insert("offlineSyncQueue", {
        userId,
        mutationType: "test",
        mutationArgs: "{}",
        status: "failed",
        attempts: 1,
        lastAttempt: now - 5 * 60 * 1000, // 5 mins ago
        updatedAt: now,
      });
    });

    // itemRetry: attempts=1 -> index 1 -> 15 min wait. 20 mins passed -> ready -> status becomes pending
    const itemRetryId = await t.run(async (ctx) => {
      return await ctx.db.insert("offlineSyncQueue", {
        userId,
        mutationType: "test",
        mutationArgs: "{}",
        status: "failed",
        attempts: 1,
        lastAttempt: now - 20 * 60 * 1000, // 20 mins ago
        updatedAt: now,
      });
    });

    // itemArchive: attempts=5 -> max attempts reached -> should be deleted
    const itemArchiveId = await t.run(async (ctx) => {
      return await ctx.db.insert("offlineSyncQueue", {
        userId,
        mutationType: "test",
        mutationArgs: "{}",
        status: "failed",
        attempts: 5,
        lastAttempt: now,
        updatedAt: now,
      });
    });

    // 2. Execute the mutation
    const result = await t.mutation(internal.offlineSync.autoRetryFailed);

    // 3. Verify results
    expect(result).toEqual({
      retriedCount: 1,
      archivedCount: 1,
      totalFailed: 3,
    });

    await t.run(async (ctx) => {
      // Check itemBackoff
      const backoffItem = await ctx.db.get(itemBackoffId);
      expect(backoffItem).toBeDefined();
      expect(backoffItem?.status).toBe("failed");

      // Check itemRetry
      const retryItem = await ctx.db.get(itemRetryId);
      expect(retryItem).toBeDefined();
      expect(retryItem?.status).toBe("pending");
      // Should have updated updatedAt
      expect(retryItem?.updatedAt).toBeGreaterThan(now);

      // Check itemArchive
      const archiveItem = await ctx.db.get(itemArchiveId);
      expect(archiveItem).toBeNull();
    });
  });
});
