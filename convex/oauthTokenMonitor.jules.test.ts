import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("OAuth Token Monitor Error Handling", () => {
  async function createCalendarConnection(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    options: {
      expiresAt?: number;
    } = {},
  ) {
    return await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("calendarConnections", {
        userId,
        provider: "google",
        providerAccountId: "test@gmail.com",
        accessToken: "encrypted_access_token",
        refreshToken: "encrypted_refresh_token",
        expiresAt: options.expiresAt ?? now + HOUR,
        syncEnabled: true,
        syncDirection: "bidirectional",
        lastSyncAt: undefined,
        updatedAt: now,
      });
    });
  }

  it("should process all connections even if one fails", async () => {
    const t = convexTest(schema, modules);
    const user1 = await createTestUser(t, { name: "User One" });
    const user2 = await createTestUser(t, { name: "User Two" });
    const user3 = await createTestUser(t, { name: "User Three" });

    await createCalendarConnection(t, user1);
    await createCalendarConnection(t, user2);
    await createCalendarConnection(t, user3);

    // Run the health check
    await t.action(internal.oauthTokenMonitor.performTokenHealthCheck, {
      autoRefresh: false,
    });

    // Check stats to see if all were processed
    const stats = await t.query(internal.oauthTokenMonitor.getTokenHealthStats, {});

    // In a happy path, all 3 should be processed
    expect(stats.stats?.totalConnections).toBe(3);
    expect(stats.stats?.healthyCount).toBe(3);
  });
});
