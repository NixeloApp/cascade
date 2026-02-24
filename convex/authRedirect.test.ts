import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { ROUTES } from "./shared/routes";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("getRedirectDestination", () => {
  it("should return null for unauthenticated user", async () => {
    const t = convexTest(schema, modules);
    const destination = await t.query(api.auth.getRedirectDestination);
    expect(destination).toBeNull();
  });

  it("should return null if user does not exist", async () => {
    const t = convexTest(schema, modules);
    // Use an ID that doesn't exist in DB
    const fakeUserId = "00000000000000000000000000000000" as any;
    const asUser = asAuthenticatedUser(t, fakeUserId);

    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBeNull();
  });

  it("should return null if email is unverified", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "unverified@example.com",
        // No emailVerificationTime
      });
    });

    const asUser = asAuthenticatedUser(t, userId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBeNull();
  });

  it("should return verify 2FA path if 2FA is required and session is unverified", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "2fa@example.com",
        emailVerificationTime: Date.now(),
        twoFactorEnabled: true,
        twoFactorSecret: "secret",
      });
    });

    const asUser = asAuthenticatedUser(t, userId); // Uses random session ID
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.verify2FA.path);
  });

  it("should return verify 2FA path if 2FA session is expired", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "2fa-expired@example.com",
        emailVerificationTime: Date.now(),
        twoFactorEnabled: true,
        twoFactorSecret: "secret",
      });
    });

    const sessionId = "expired-session-id";
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;

    await t.run(async (ctx) => {
      await ctx.db.insert("twoFactorSessions", {
        userId,
        sessionId,
        verifiedAt: twentyFiveHoursAgo,
      });
    });

    const asUser = asAuthenticatedUser(t, userId, sessionId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.verify2FA.path);
  });

  it("should continue if 2FA session is valid", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "2fa-valid@example.com",
        emailVerificationTime: Date.now(),
        twoFactorEnabled: true,
        twoFactorSecret: "secret",
      });
    });

    const sessionId = "valid-session-id";
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    await t.run(async (ctx) => {
      await ctx.db.insert("twoFactorSessions", {
        userId,
        sessionId,
        verifiedAt: oneHourAgo,
      });
      // Ensure onboarding is incomplete so we get onboarding path,
      // proving we passed the 2FA check
    });

    const asUser = asAuthenticatedUser(t, userId, sessionId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.onboarding.path);
  });

  it("should return onboarding path if onboarding is incomplete", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    // No onboarding record created by default

    const asUser = asAuthenticatedUser(t, userId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.onboarding.path);
  });

  it("should return app path if onboarding complete but no organization", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        tourShown: false,
        wizardCompleted: false,
        checklistDismissed: false,
        updatedAt: Date.now(),
      });
    });

    const asUser = asAuthenticatedUser(t, userId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.app.path);
  });

  it("should return dashboard path if organization member", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId, { slug: "my-org" });

    await t.run(async (ctx) => {
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        tourShown: false,
        wizardCompleted: false,
        checklistDismissed: false,
        updatedAt: Date.now(),
      });
    });

    const asUser = asAuthenticatedUser(t, userId);
    const destination = await asUser.query(api.auth.getRedirectDestination);
    expect(destination).toBe(ROUTES.dashboard.build("my-org"));
  });
});
