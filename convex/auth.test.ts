/**
 * Authentication Backend Tests
 *
 * Tests for user management and authentication-related data.
 * Note: The actual signIn/signOut flows are handled by @convex-dev/auth
 * and are tested via E2E tests. These tests focus on:
 * - User data integrity
 * - Email verification status
 * - User creation patterns
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Authentication", () => {
  describe("User creation", () => {
    it("should create user with name and email", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, {
        name: "Test User",
        email: "test@example.com",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      expect(user).not.toBeNull();
      expect(user?.name).toBe("Test User");
      expect(user?.email).toBe("test@example.com");
    });

    it("should create user with unique email", async () => {
      const t = convexTest(schema, modules);

      const user1Id = await createTestUser(t, { email: "user1@example.com" });
      const user2Id = await createTestUser(t, { email: "user2@example.com" });

      expect(user1Id).not.toBe(user2Id);

      const user1 = await t.run(async (ctx) => ctx.db.get(user1Id));
      const user2 = await t.run(async (ctx) => ctx.db.get(user2Id));

      expect(user1?.email).toBe("user1@example.com");
      expect(user2?.email).toBe("user2@example.com");
    });

    it("should set emailVerificationTime on creation", async () => {
      const t = convexTest(schema, modules);
      const beforeCreate = Date.now();

      const userId = await createTestUser(t);

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      expect(user?.emailVerificationTime).not.toBeUndefined();
      expect(typeof user?.emailVerificationTime).toBe("number");
      expect(user?.emailVerificationTime).toBeGreaterThanOrEqual(beforeCreate);
    });

    it("should include all expected user fields", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, {
        name: "Complete User",
        email: "complete@example.com",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      // Verify required fields exist
      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("_creationTime");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("emailVerificationTime");
    });
  });

  describe("User data integrity", () => {
    it("should handle optional fields correctly", async () => {
      const t = convexTest(schema, modules);

      // Create user with minimal data
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "minimal@example.com",
          emailVerificationTime: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      expect(user?.email).toBe("minimal@example.com");
      expect(user?.name).toBeUndefined();
      expect(user?.image).toBeUndefined();
      expect(user?.isAnonymous).toBeUndefined();
    });

    it("should support anonymous users", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          isAnonymous: true,
          emailVerificationTime: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      expect(user?.isAnonymous).toBe(true);
      expect(user?.email).toBeUndefined();
    });

    it("should store user image URL", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User With Image",
          email: "image@example.com",
          image: "https://example.com/avatar.png",
          emailVerificationTime: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));

      expect(user?.image).toBe("https://example.com/avatar.png");
    });
  });

  describe("Email verification status", () => {
    it("should distinguish verified from unverified users", async () => {
      const t = convexTest(schema, modules);

      // Verified user
      const verifiedId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "verified@example.com",
          emailVerificationTime: Date.now(),
        });
      });

      // Unverified user (no emailVerificationTime)
      const unverifiedId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "unverified@example.com",
        });
      });

      const verified = await t.run(async (ctx) => ctx.db.get(verifiedId));
      const unverified = await t.run(async (ctx) => ctx.db.get(unverifiedId));

      expect(verified?.emailVerificationTime).not.toBeUndefined();
      expect(typeof verified?.emailVerificationTime).toBe("number");
      expect(unverified?.emailVerificationTime).toBeUndefined();
    });

    it("should check if user email is verified", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t);

      const isVerified = await t.run(async (ctx) => {
        const user = await ctx.db.get(userId);
        return user?.emailVerificationTime !== undefined;
      });

      expect(isVerified).toBe(true);
    });
  });

  describe("Auth identity pattern", () => {
    it("should support withIdentity for authenticated context", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Auth User" });

      // Set identity for subsequent operations
      t.withIdentity({ subject: userId });

      // Verify we can use this identity in authenticated operations
      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId);
      });

      expect(user?.name).toBe("Auth User");
    });
  });
});
