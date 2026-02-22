import { createHash } from "node:crypto";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("API Keys", () => {
  describe("generate", () => {
    it("should generate a new API key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.mutation(api.apiKeys.generate, {
        name: "Test Key",
        scopes: ["issues:read"],
      });

      expect(result.apiKey).toMatch(/^sk_casc_[a-zA-Z0-9]{32}$/);
      expect(result.name).toBe("Test Key");
      expect(result.scopes).toEqual(["issues:read"]);
      expect(result.keyPrefix).toBe(result.apiKey.substring(0, 16));

      // Verify it's in the database (hashed)
      const keys = await asUser.query(api.apiKeys.list, {});
      expect(keys).toHaveLength(1);
      expect(keys[0].name).toBe("Test Key");
      expect(keys[0].keyPrefix).toBe(result.keyPrefix);
    });

    it("should require authentication", async () => {
      const t = convexTest(schema, modules);
      await expect(async () => {
        await t.mutation(api.apiKeys.generate, {
          name: "Test Key",
          scopes: ["issues:read"],
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should validate scopes", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(async () => {
        await asUser.mutation(api.apiKeys.generate, {
          name: "Test Key",
          scopes: ["invalid:scope"],
        });
      }).rejects.toThrow("Invalid scope");
    });

    it("should enforce project access if project ID is provided", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.apiKeys.generate, {
          name: "Test Key",
          scopes: ["issues:read"],
          projectId,
        });
      }).rejects.toThrow("Not authorized");
    });

    it("should allow project access for members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, { email: "member@example.com" });
      const { organizationId } = await createOrganizationAdmin(t, owner);
      const projectId = await createProjectInOrganization(t, owner, organizationId);

      // Add member to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: member,
          role: "member",
          addedBy: owner,
        });
      });

      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@example.com",
        role: "viewer",
      });

      const asMember = asAuthenticatedUser(t, member);
      const result = await asMember.mutation(api.apiKeys.generate, {
        name: "Member Key",
        scopes: ["issues:read"],
        projectId,
      });

      expect(result.apiKey).toBeDefined();
    });
  });

  function hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  describe("validate", () => {
    it("should validate a valid API key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { apiKey } = await asUser.mutation(api.apiKeys.generate, {
        name: "Test Key",
        scopes: ["issues:read"],
      });

      const validation = await t.query(internal.apiKeys.validate, {
        keyHash: hashApiKey(apiKey),
      });
      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(userId);
      expect(validation.scopes).toEqual(["issues:read"]);
    });

    it("should reject an invalid API key", async () => {
      const t = convexTest(schema, modules);
      const validation = await t.query(internal.apiKeys.validate, {
        keyHash: hashApiKey("invalid_key"),
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("Invalid API key");
    });

    it("should reject a revoked API key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { id, apiKey } = await asUser.mutation(api.apiKeys.generate, {
        name: "Test Key",
        scopes: ["issues:read"],
      });

      await asUser.mutation(api.apiKeys.revoke, { keyId: id });

      const validation = await t.query(internal.apiKeys.validate, {
        keyHash: hashApiKey(apiKey),
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("API key has been revoked");
    });

    it("should reject an expired API key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const expiredTime = Date.now() - SECOND;
      const { apiKey } = await asUser.mutation(api.apiKeys.generate, {
        name: "Expired Key",
        scopes: ["issues:read"],
        expiresAt: expiredTime,
      });

      const validation = await t.query(internal.apiKeys.validate, {
        keyHash: hashApiKey(apiKey),
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("API key has expired");
    });
  });

  describe("management", () => {
    it("should list only user's keys", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t);
      const user2 = await createTestUser(t);

      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.apiKeys.generate, { name: "User1 Key", scopes: ["issues:read"] });

      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.apiKeys.generate, { name: "User2 Key", scopes: ["issues:read"] });

      const keys1 = await asUser1.query(api.apiKeys.list, {});
      expect(keys1).toHaveLength(1);
      expect(keys1[0].name).toBe("User1 Key");

      const keys2 = await asUser2.query(api.apiKeys.list, {});
      expect(keys2).toHaveLength(1);
      expect(keys2[0].name).toBe("User2 Key");
    });

    it("should update key settings", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { id } = await asUser.mutation(api.apiKeys.generate, {
        name: "Old Name",
        scopes: ["issues:read"],
      });

      await asUser.mutation(api.apiKeys.update, {
        keyId: id,
        name: "New Name",
        scopes: ["issues:write"],
      });

      const keys = await asUser.query(api.apiKeys.list, {});
      expect(keys[0].name).toBe("New Name");
      expect(keys[0].scopes).toEqual(["issues:write"]);
    });

    it("should remove a key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { id } = await asUser.mutation(api.apiKeys.generate, {
        name: "To Delete",
        scopes: ["issues:read"],
      });

      await asUser.mutation(api.apiKeys.remove, { keyId: id });

      const keys = await asUser.query(api.apiKeys.list, {});
      expect(keys).toHaveLength(0);
    });
  });
});
