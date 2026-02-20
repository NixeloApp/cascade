import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("User Profiles Security", () => {
  it("should NOT leak sensitive user fields in listUserProfiles", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    // Make the user an admin so they can call listUserProfiles
    await createProjectInOrganization(t, userId, organizationId, {
      name: "Admin Project",
      key: "ADMIN",
    });

    // Create another user with sensitive data manually inserted
    // Since createTestUser uses internal mutation, we can't easily inject sensitive fields directly via that helper if it uses valid mutation.
    // However, we can use t.run to insert directly into the database for setup.
    const sensitiveUser = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Sensitive User",
        email: "sensitive@test.com",
        twoFactorSecret: "SUPER_SECRET_2FA_KEY",
        pendingEmailVerificationToken: "LEAKED_TOKEN_123",
      });
    });

    // Create a profile for this user so they appear in listUserProfiles
    await asUser.mutation(api.userProfiles.upsertUserProfile, {
      userId: sensitiveUser,
      employmentType: "employee",
      hasEquity: false,
      isActive: true,
    });

    // Call listUserProfiles
    const profiles = await asUser.query(api.userProfiles.listUserProfiles, {});
    const targetProfile = profiles.find((p) => p.userId === sensitiveUser);

    expect(targetProfile).toBeDefined();

    // Check if sensitive fields are leaked
    // The vulnerability is that `user` property contains the raw user document
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    const user = targetProfile!.user as any;

    // These assertions should FAIL if the vulnerability exists
    expect(user).toBeDefined();
    expect(user.twoFactorSecret).toBeUndefined();
    expect(user.pendingEmailVerificationToken).toBeUndefined();
  });

  it("should NOT leak sensitive user fields in getUsersWithoutProfiles", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    // Make the user an admin
    await createProjectInOrganization(t, userId, organizationId, {
      name: "Admin Project",
      key: "ADMIN",
    });

    // Create a user without a profile, with sensitive data
    const sensitiveUser = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "No Profile User",
        email: "noprofile@test.com",
        twoFactorSecret: "SUPER_SECRET_2FA_KEY_2",
        pendingEmailVerificationToken: "LEAKED_TOKEN_456",
      });
    });

    // Call getUsersWithoutProfiles
    const users = await asUser.query(api.userProfiles.getUsersWithoutProfiles, {});
    const targetUser = users.find((u: any) => u._id === sensitiveUser);

    expect(targetUser).toBeDefined();

    // These assertions should FAIL if the vulnerability exists
    expect((targetUser as any).twoFactorSecret).toBeUndefined();
    expect((targetUser as any).pendingEmailVerificationToken).toBeUndefined();
  });
});
