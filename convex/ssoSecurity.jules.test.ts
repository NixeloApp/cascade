import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("SSO Security", () => {
  it("should enforce 2FA when creating SSO connections", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    // Enable 2FA for the user but DO NOT create a session verification
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      });
    });

    const asUser = asAuthenticatedUser(t, userId);

    // This mutation should FAIL because 2FA is enabled but not verified.
    await expect(
      asUser.mutation(api.sso.create, {
        organizationId,
        name: "Test SSO",
        type: "saml",
      }),
    ).rejects.toThrow("Two-factor authentication required");
  });

  it("should allow SSO creation when 2FA is verified", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
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

    // Manually construct identity with session ID
    const asUser = t.withIdentity({ subject: `${userId}|${sessionId}` });

    await asUser.mutation(api.sso.create, {
      organizationId,
      name: "Test SSO",
      type: "saml",
    });
  });
});
