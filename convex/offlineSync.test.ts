import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import { DAY, MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("offlineSync", () => {
  const SINGLE_ITEM_COUNT = 1;
  const MAX_FAILED_ATTEMPTS = 3;
  const ARCHIVE_AFTER_ATTEMPTS = 5;
  const STALE_COMPLETED_AGE_MS = 2 * DAY;
  const STALE_QUEUE_ITEM_AGE_MS = 8 * DAY;

  const queueOfflineIssueMutation = async (
    asUser: Awaited<ReturnType<typeof createTestContext>>["asUser"],
    issueId: string,
  ) => {
    return await asUser.mutation(api.offlineSync.queueMutation, {
      mutationType: "issues.update",
      mutationArgs: JSON.stringify({ id: issueId }),
    });
  };

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
        attempts: ARCHIVE_AFTER_ATTEMPTS,
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

    const queueId = await queueOfflineIssueMutation(asUser, "issue-1");

    expect(queueId).toBeDefined();

    const pendingMutations = await asUser.query(api.offlineSync.getPendingMutations);
    expect(pendingMutations.length).toBe(SINGLE_ITEM_COUNT);
    expect(pendingMutations[0]._id).toBe(queueId);
    expect(pendingMutations[0].mutationType).toBe("issues.update");
  });

  test("markSyncing, markCompleted, and markFailed", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);
    const userId2 = await createTestUser(t);
    const asUser2 = asAuthenticatedUser(t, userId2);

    const queueId = await queueOfflineIssueMutation(asUser, "issue-1");

    await asUser.mutation(api.offlineSync.markSyncing, { queueId });

    let status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.syncing).toBe(SINGLE_ITEM_COUNT);
    expect(status.pending).toBe(0);

    // Fail it once (attempts = 1) -> status becomes pending
    await asUser.mutation(api.offlineSync.markFailed, { queueId, error: "Network error" });

    status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.failed).toBe(0); // attempts < maxAttempts -> pending
    expect(status.pending).toBe(SINGLE_ITEM_COUNT);
    expect(status.syncing).toBe(0);

    // Fail it two more times (attempts = MAX_FAILED_ATTEMPTS) -> status becomes failed
    for (let attempt = 2; attempt <= MAX_FAILED_ATTEMPTS; attempt += 1) {
      await asUser.mutation(api.offlineSync.markFailed, { queueId, error: "Network error" });
    }

    status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.failed).toBe(SINGLE_ITEM_COUNT);
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

    const queueId1 = await queueOfflineIssueMutation(asUser, "issue-1");

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

    const queueId2 = await queueOfflineIssueMutation(asUser, "issue-2");
    await asUser.mutation(api.offlineSync.markCompleted, { queueId: queueId2 });

    // Fast forward to make item old enough
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.patch(queueId2, { updatedAt: now - STALE_COMPLETED_AGE_MS });
    });

    const result = await asUser.mutation(api.offlineSync.clearCompleted, {});
    expect(result.deleted).toBe(SINGLE_ITEM_COUNT);

    const retryResult = await asUser.mutation(api.offlineSync.retryFailed, {});
    expect(retryResult.retried).toBe(SINGLE_ITEM_COUNT);

    const status = await asUser.query(api.offlineSync.getSyncStatus);
    expect(status.pending).toBe(SINGLE_ITEM_COUNT);
  });

  test("listQueue and cleanupOldItems", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);
    const now = Date.now();

    const queueId = await queueOfflineIssueMutation(asUser, "issue-1");

    const items = await asUser.query(api.offlineSync.listQueue);
    expect(items.length).toBe(SINGLE_ITEM_COUNT);
    expect(items[0]._id).toBe(queueId);

    await asUser.mutation(api.offlineSync.markCompleted, { queueId });

    await t.run(async (ctx) => {
      await ctx.db.patch(queueId, { updatedAt: now - STALE_QUEUE_ITEM_AGE_MS });
    });

    const cleanup = await t.mutation(internal.offlineSync.cleanupOldItems);
    expect(cleanup.deletedCount).toBe(SINGLE_ITEM_COUNT);
  });
});
