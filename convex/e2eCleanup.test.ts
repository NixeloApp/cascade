import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("E2E Cleanup", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("cleanupExpiredOtpsInternal", () => {
    it("should delete expired OTPs and keep valid ones", async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();

      // Expired OTP (expired 1 second ago)
      await t.run(async (ctx) => {
        await ctx.db.insert("testOtpCodes", {
          email: "expired@test.com",
          code: "123456",
          expiresAt: now - 1000,
        });
      });

      // Valid OTP (expires in 1 hour)
      await t.run(async (ctx) => {
        await ctx.db.insert("testOtpCodes", {
          email: "valid@test.com",
          code: "654321",
          expiresAt: now + HOUR,
        });
      });

      // Run cleanup
      const result = await t.mutation(internal.e2e.cleanupExpiredOtpsInternal);
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(1);

      // Verify
      await t.run(async (ctx) => {
        const expired = await ctx.db
          .query("testOtpCodes")
          .withIndex("by_email", (q) => q.eq("email", "expired@test.com"))
          .first();
        expect(expired).toBeNull();

        const valid = await ctx.db
          .query("testOtpCodes")
          .withIndex("by_email", (q) => q.eq("email", "valid@test.com"))
          .first();
        expect(valid).not.toBeNull();
      });
    });
  });

  describe("cleanupTestUsersInternal", () => {
    it("should delete old test users and their data, keeping recent and regular users", async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const TWO_HOURS_AGO = now - 2 * HOUR;

      // 1. Old Test User (should be deleted)
      const oldTestUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "old-test@inbox.mailtrap.io",
          isTestUser: true,
          testUserCreatedAt: TWO_HOURS_AGO,
        });
      });

      // Seed related data for old test user
      await t.run(async (ctx) => {
        // Auth Account
        await ctx.db.insert("authAccounts", {
          userId: oldTestUserId,
          provider: "password",
          providerAccountId: "old-test@inbox.mailtrap.io",
        });

        // Auth Session
        await ctx.db.insert("authSessions", {
          userId: oldTestUserId,
          expirationTime: now + HOUR,
        });

        // Onboarding
        await ctx.db.insert("userOnboarding", {
          userId: oldTestUserId,
          onboardingCompleted: true,
          tourShown: true,
          wizardCompleted: true,
          checklistDismissed: true,
          updatedAt: TWO_HOURS_AGO,
        });

        // Organization created by user
        const orgId = await ctx.db.insert("organizations", {
          name: "Old Test Org",
          slug: "old-test-org",
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: oldTestUserId,
          updatedAt: TWO_HOURS_AGO,
        });

        // Org Membership
        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: oldTestUserId,
          role: "owner",
          addedBy: oldTestUserId,
        });
      });

      // 2. Recent Test User (should be kept)
      const recentTestUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "recent-test@inbox.mailtrap.io",
          isTestUser: true,
          testUserCreatedAt: now - 30 * 60 * 1000, // 30 mins ago
        });
      });

      // 3. Regular User (should be kept even if old)
      const regularUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "regular@example.com",
          isTestUser: false,
          testUserCreatedAt: TWO_HOURS_AGO, // Should be ignored if isTestUser is false/undefined
        });
      });

      // Run cleanup
      const result = await t.mutation(internal.e2e.cleanupTestUsersInternal);
      expect(result.success).toBe(true);
      // We expect 1 user deleted
      expect(result.deleted).toBe(1);

      // Verify Old Test User is gone
      await t.run(async (ctx) => {
        const user = await ctx.db.get(oldTestUserId);
        expect(user).toBeNull();

        // Verify cascading deletes
        const accounts = await ctx.db
          .query("authAccounts")
          .filter((q) => q.eq(q.field("userId"), oldTestUserId))
          .collect();
        expect(accounts.length).toBe(0);

        const sessions = await ctx.db
          .query("authSessions")
          .withIndex("userId", (q) => q.eq("userId", oldTestUserId))
          .collect();
        expect(sessions.length).toBe(0);

        const onboarding = await ctx.db
          .query("userOnboarding")
          .withIndex("by_user", (q) => q.eq("userId", oldTestUserId))
          .first();
        expect(onboarding).toBeNull();

        // Check if organization created by user is deleted
        const orgs = await ctx.db
          .query("organizations")
          .withIndex("by_creator", (q) => q.eq("createdBy", oldTestUserId))
          .collect();

        expect(orgs.length).toBe(0);
      });

      // Verify Recent Test User exists
      await t.run(async (ctx) => {
        const user = await ctx.db.get(recentTestUserId);
        expect(user).not.toBeNull();
      });

      // Verify Regular User exists
      await t.run(async (ctx) => {
        const user = await ctx.db.get(regularUserId);
        expect(user).not.toBeNull();
      });
    });
  });
});
