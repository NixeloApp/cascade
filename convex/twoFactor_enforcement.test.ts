import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";
import type { Id } from "./_generated/dataModel";

// Helper to authenticate with specific session ID
function asAuthenticatedSession(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  sessionId: string
) {
  // convex-auth format: userId|sessionId
  const subject = `${userId}|${sessionId}`;
  return t.withIdentity({ subject });
}

describe("Two Factor Enforcement", () => {
  it("should require 2FA for authenticated queries when enabled but not verified", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const sessionId = "session1";

    // Enable 2FA for the user
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        // twoFactorVerifiedAt is undefined
      });
    });

    const asUser = asAuthenticatedSession(t, userId, sessionId);

    // Try to call an authenticated query
    await expect(asUser.query(api.users.getCurrent)).rejects.toThrow(
      "Two-factor authentication required",
    );
  });

  it("should allow authenticated queries when 2FA is verified for the session", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const sessionId = "session1";

    // Enable 2FA
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      });
    });

    // Manually verify the session
    await t.run(async (ctx) => {
      await ctx.db.insert("twoFactorSessions", {
        sessionId,
        userId,
        verifiedAt: Date.now(),
      });
    });

    const asUser = asAuthenticatedSession(t, userId, sessionId);
    const user = await asUser.query(api.users.getCurrent);
    expect(user).not.toBeNull();
  });

  it("should block access if verified on a DIFFERENT session", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const session1 = "session1";
    const session2 = "session2";

    // Enable 2FA and verify for session1
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      });
      await ctx.db.insert("twoFactorSessions", {
        sessionId: session1,
        userId,
        verifiedAt: Date.now(),
      });
    });

    // Try session2
    const asUser2 = asAuthenticatedSession(t, userId, session2);
    await expect(asUser2.query(api.users.getCurrent)).rejects.toThrow(
      "Two-factor authentication required",
    );

    // Try session1
    const asUser1 = asAuthenticatedSession(t, userId, session1);
    const user = await asUser1.query(api.users.getCurrent);
    expect(user).not.toBeNull();
  });
});
