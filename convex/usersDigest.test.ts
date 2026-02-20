import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Users Digest Preference", () => {
  it("should list users with specific digest preference using optimized index", async () => {
    const t = convexTest(schema, modules);

    // Create users
    const userDailyId = await createTestUser(t);
    const userWeeklyId = await createTestUser(t);
    const userNoneId = await createTestUser(t);
    const userDisabledId = await createTestUser(t);
    const userDaily2Id = await createTestUser(t); // Another daily user

    // 1. User with Daily Digest enabled
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userDailyId,
        emailEnabled: true,
        emailDigest: "daily",
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        updatedAt: Date.now(),
      });
    });

    // 2. User with Weekly Digest enabled
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userWeeklyId,
        emailEnabled: true,
        emailDigest: "weekly",
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        updatedAt: Date.now(),
      });
    });

    // 3. User with None Digest enabled
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userNoneId,
        emailEnabled: true,
        emailDigest: "none",
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        updatedAt: Date.now(),
      });
    });

    // 4. User with Daily Digest BUT email disabled globally
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userDisabledId,
        emailEnabled: false, // Disabled
        emailDigest: "daily",
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        updatedAt: Date.now(),
      });
    });

    // 5. Another User with Daily Digest enabled
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userDaily2Id,
        emailEnabled: true,
        emailDigest: "daily",
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        updatedAt: Date.now(),
      });
    });

    // Query for DAILY digests
    const dailyUsers = await t.query(internal.users.listWithDigestPreference, {
      frequency: "daily",
    });

    // Should include userDailyId and userDaily2Id
    // Should NOT include userWeeklyId, userNoneId, userDisabledId
    expect(dailyUsers).toHaveLength(2);
    const dailyIds = dailyUsers.map((u) => u._id).sort();
    const expectedDailyIds = [userDailyId, userDaily2Id].sort();
    expect(dailyIds).toEqual(expectedDailyIds);

    // Query for WEEKLY digests
    const weeklyUsers = await t.query(internal.users.listWithDigestPreference, {
      frequency: "weekly",
    });

    // Should include userWeeklyId
    expect(weeklyUsers).toHaveLength(1);
    expect(weeklyUsers[0]._id).toBe(userWeeklyId);
  });
});
