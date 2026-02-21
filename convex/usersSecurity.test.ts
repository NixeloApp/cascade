import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Users Security", () => {
  describe("updateProfile", () => {
    it("should require verification when email is changed", async () => {
      const t = convexTest(schema, modules);
      register(t);
      const userId = await createTestUser(t);

      // Manually verify the user
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          emailVerificationTime: Date.now(),
          email: "old@example.com",
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Verify initial state
      let user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("old@example.com");
      expect(user?.emailVerificationTime).toBeDefined();

      // Change email
      await asUser.mutation(api.users.updateProfile, {
        email: "new@example.com",
      });

      // User email should NOT change yet
      user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("old@example.com");
      expect(user?.pendingEmail).toBe("new@example.com");

      // Verify
      const token = user?.pendingEmailVerificationToken;
      if (!token) throw new Error("Expected token to be defined");
      await asUser.mutation(api.users.verifyEmailChange, { token });

      // Now it should be changed and verified
      user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("new@example.com");
      expect(user?.emailVerificationTime).toBeDefined();
    });

    it("should NOT revoke verification when email is unchanged", async () => {
      const t = convexTest(schema, modules);
      register(t);
      const userId = await createTestUser(t);

      const verifiedTime = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          emailVerificationTime: verifiedTime,
          email: "same@example.com",
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Update with same email
      await asUser.mutation(api.users.updateProfile, {
        email: "same@example.com",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("same@example.com");
      expect(user?.emailVerificationTime).toBe(verifiedTime);
    });

    it("should synchronize email change to authAccounts after verification", async () => {
      const t = convexTest(schema, modules);
      register(t);
      const userId = await createTestUser(t);
      const oldEmail = "old@example.com";
      const newEmail = "new@example.com";

      // Set initial email
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          email: oldEmail,
          emailVerificationTime: Date.now(),
        });

        // Create authAccount
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: oldEmail,
          secret: "hashedpassword",
          emailVerified: new Date().toISOString(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Change email via updateProfile
      await asUser.mutation(api.users.updateProfile, {
        email: newEmail,
      });

      // Verify authAccount state (unchanged)
      let authAccount = await t.run(async (ctx) => {
        return await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
          .first();
      });
      expect(authAccount?.providerAccountId).toBe(oldEmail);

      // Verify
      const user = await t.run(async (ctx) => ctx.db.get(userId));
      if (!user?.pendingEmailVerificationToken) {
        throw new Error("Missing verification token");
      }
      await asUser.mutation(api.users.verifyEmailChange, {
        token: user.pendingEmailVerificationToken,
      });

      // Verify authAccount state (changed)
      authAccount = await t.run(async (ctx) => {
        return await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
          .first();
      });

      expect(authAccount?.providerAccountId).toBe(newEmail);
      // It might be undefined if syncEmailToAuthAccounts sets it to undefined
      // But verifyEmailChange sets user.emailVerificationTime
      // We should check what syncEmailToAuthAccounts does.
      // It sets emailVerified: undefined.
      expect(authAccount?.emailVerified).toBeUndefined();
    });
  });

  describe("getCurrent", () => {
    it("should not leak pendingEmailVerificationToken", async () => {
      const t = convexTest(schema, modules);
      register(t);
      // Create a user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          email: "test@example.com",
          emailVerificationTime: Date.now(),
        });
      });

      const user = t.withIdentity({ subject: userId });

      // Update email to trigger pending verification
      await user.mutation(api.users.updateProfile, {
        email: "new@example.com",
      });

      // Get current user profile via getCurrent
      const profile: any = await user.query(api.users.getCurrent);

      // Check if sensitive fields are leaked
      expect(profile.pendingEmail).toBeUndefined();
      expect(profile.pendingEmailVerificationToken).toBeUndefined();
      expect(profile.pendingEmailVerificationExpires).toBeUndefined();

      // Get logged in user via loggedInUser
      const loggedIn: any = await user.query(api.auth.loggedInUser);

      // Check if sensitive fields are leaked
      expect(loggedIn.pendingEmail).toBeUndefined();
      expect(loggedIn.pendingEmailVerificationToken).toBeUndefined();
      expect(loggedIn.pendingEmailVerificationExpires).toBeUndefined();
    });
  });
});
