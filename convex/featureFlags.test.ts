import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("featureFlags", () => {
  it("returns google auth enabled by default", async () => {
    const t = convexTest(schema, modules);
    const enabled = await t.query(api.featureFlags.isGoogleAuthEnabled, {});
    expect(enabled).toBe(true);
  });

  it("allows organization admin to toggle google auth flag", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, asUser } = await createTestContext(t);

    const disableResult = await asUser.mutation(api.featureFlags.setGoogleAuthEnabled, {
      organizationId,
      enabled: false,
      reason: "incident-123",
    });
    expect(disableResult.success).toBe(true);
    expect(await t.query(api.featureFlags.isGoogleAuthEnabled, {})).toBe(false);

    const enableResult = await asUser.mutation(api.featureFlags.setGoogleAuthEnabled, {
      organizationId,
      enabled: true,
    });
    expect(enableResult.success).toBe(true);
    expect(await t.query(api.featureFlags.isGoogleAuthEnabled, {})).toBe(true);
  });

  it("rejects non-admin organization members when toggling", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, userId: ownerId } = await createTestContext(t);
    const memberId = await createTestUser(t, { name: "Member" });

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: memberId,
        role: "member",
        addedBy: ownerId,
        joinedAt: Date.now(),
      });
    });

    const asMember = asAuthenticatedUser(t, memberId);
    await expect(
      asMember.mutation(api.featureFlags.setGoogleAuthEnabled, {
        organizationId,
        enabled: false,
      }),
    ).rejects.toThrow(/admin/i);
  });
});
