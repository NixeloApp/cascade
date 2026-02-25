import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

test("getUserProfile leaks equity data to other users", async () => {
  const t = convexTest(schema, modules);

  // Create User A (The Victim) with equity data
  const userA = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "User A",
      email: "usera@example.com",
    });

    await ctx.db.insert("userProfiles", {
      userId,
      employmentType: "employee",
      isActive: true,
      updatedAt: Date.now(),
      hasEquity: true,
      equityPercentage: 5.0,
      equityHourlyValue: 100,
      equityNotes: "Super Secret Equity",
      createdBy: userId,
    });

    return userId;
  });

  // Create User B (The Attacker) - regular user
  const userB = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: "User B",
      email: "userb@example.com",
    });
  });

  // User B tries to get User A's profile
  const profile = await t.withIdentity({ subject: userB }).query(api.userProfiles.getUserProfile, {
    userId: userA,
  });

  // Assert that sensitive data is SANITIZED (fixed behavior)
  expect(profile).not.toBeNull();

  // These fields SHOULD NOT be visible to User B
  expect(profile?.equityPercentage).toBeUndefined();
  expect(profile?.equityHourlyValue).toBeUndefined();
  expect(profile?.equityNotes).toBeUndefined();
});

test("listTimeEntries leaks hourly rate to other users", async () => {
  const t = convexTest(schema, modules);

  // Create User A (The Victim)
  const userA = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "User A",
      email: "usera@example.com",
    });

    await ctx.db.insert("timeEntries", {
      userId,
      startTime: Date.now() - 3600000,
      duration: 3600,
      date: Date.now(),
      hourlyRate: 250, // Sensitive!
      totalCost: 250,
      currency: "USD",
      billable: true,
      billed: false,
      isEquityHour: false,
      isLocked: false,
      isApproved: false,
      updatedAt: Date.now(),
      tags: [],
    });

    return userId;
  });

  // Create User B (The Attacker)
  const userB = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: "User B",
      email: "userb@example.com",
    });
  });

  // User B tries to list User A's time entries
  await expect(
    t.withIdentity({ subject: userB }).query(api.timeTracking.listTimeEntries, {
      userId: userA,
    }),
  ).rejects.toThrow(/Access denied/i);
});
