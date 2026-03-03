import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import { DAY, MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext, createTestUser } from "./testUtils";

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
        lastAttempt: now - 5 * MINUTE, // 5 mins ago
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
        lastAttempt: now - 20 * MINUTE, // 20 mins ago
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

  test("queueMutation and getPendingMutations", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const queueId = await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: '{"id": "issue-1"}',
    });

    expect(queueId).toBeDefined();

    const pendingMutations = await asUser.query(api.offlineSync.getPendingMutations);
    expect(pendingMutations.length).toBe(1);
    expect(pendingMutations[0]._id).toBe(queueId);
    expect(pendingMutations[0].mutationType).toBe("issues.update");
  });

  test("markSyncing, markCompleted, and markFailed", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);
    const userId2 = await createTestUser(t);
    const asUser2 = t.withIdentity({ subject: userId2 });

    const queueId = await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: '{"id": "issue-1"}',
    });

    await asUser.mutation(api.offlineSync.markSyncing, { queueId });

    let status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.syncing).toBe(1);
    expect(status.pending).toBe(0);

    // Fail it once (attempts = 1) -> status becomes pending
    await asUser.mutation(api.offlineSync.markFailed, { queueId, error: "Network error" });

    status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.failed).toBe(0); // attempts < maxAttempts (3) -> pending
    expect(status.pending).toBe(1);
    expect(status.syncing).toBe(0);

    // Fail it twice more (attempts = 3) -> status becomes failed
    await asUser.mutation(api.offlineSync.markFailed, { queueId, error: "Network error" });
    await asUser.mutation(api.offlineSync.markFailed, { queueId, error: "Network error" });

    status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.failed).toBe(1);
    expect(status.pending).toBe(0);

    // Unauthorized check
    await expect(asUser2.mutation(api.offlineSync.markCompleted, { queueId })).rejects.toThrow(
      /Unauthorized/,
    );

    await asUser.mutation(api.offlineSync.markCompleted, { queueId });
    status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.hasItems).toBe(false);
  });

  test("clearCompleted and retryFailed", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const queueId1 = await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: '{"id": "issue-1"}',
    });

    await asUser.mutation(api.offlineSync.markFailed, {
      queueId: queueId1,
      error: "Network error",
    });
    await asUser.mutation(api.offlineSync.markFailed, {
      queueId: queueId1,
      error: "Network error",
    });
    await asUser.mutation(api.offlineSync.markFailed, {
      queueId: queueId1,
      error: "Network error",
    });
    // queueId1 is now failed

    const queueId2 = await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: '{"id": "issue-2"}',
    });
    await asUser.mutation(api.offlineSync.markCompleted, { queueId: queueId2 });

    // Fast forward to make item old enough
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.patch(queueId2, { updatedAt: now - 2 * DAY });
    });

    const result = await asUser.mutation(api.offlineSync.clearCompleted, {});
    expect(result.deleted).toBe(1);

    const retryResult = await asUser.mutation(api.offlineSync.retryFailed, {});
    expect(retryResult.retried).toBe(1);

    const status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.pending).toBe(1);
  });

  test("listQueue and cleanupOldItems", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);
    const now = Date.now();

    const queueId = await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: '{"id": "issue-1"}',
    });

    const items = await asUser.query(api.offlineSync.listQueue);
    expect(items.length).toBe(1);
    expect(items[0]._id).toBe(queueId);

    await asUser.mutation(api.offlineSync.markCompleted, { queueId });

    await t.run(async (ctx) => {
      await ctx.db.patch(queueId, { updatedAt: now - 8 * DAY });
    });

    const cleanup = await t.mutation(internal.offlineSync.cleanupOldItems);
    expect(cleanup.deletedCount).toBe(1);
  });
});
