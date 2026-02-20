import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Two Factor Enforcement", () => {
  it("should require 2FA for authenticated queries when enabled but not verified", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Enable 2FA for the user
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        // twoFactorVerifiedAt is undefined
      });
    });

    const asUser = asAuthenticatedUser(t, userId);

    // Try to call an authenticated query
    // Currently this should SUCCEED (vulnerability) because enforcement is missing
    // We expect it to throw once fixed
    await expect(asUser.query(api.users.getCurrent)).rejects.toThrow(
      "Two-factor authentication required",
    );
  });

  it("should allow authenticated queries when 2FA is verified", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const sessionId = "test-session-123";

    // Enable 2FA and verify it
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      });
      await ctx.db.insert("twoFactorSessions", {
        userId,
        sessionId,
        verifiedAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({ subject: `${userId}|${sessionId}` });
    const user = await asUser.query(api.users.getCurrent);
    expect(user).not.toBeNull();
  });
});
