import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("IP Restrictions", () => {
  describe("getIpRestrictionsStatus", () => {
    it("should return disabled status by default", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const status = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
        organizationId,
      });

      expect(status.enabled).toBe(false);
      expect(status.allowlistCount).toBe(0);
    });

    it("should return enabled status when restrictions are enabled", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId } = await createTestContext(t);

      // First add an IP (required before enabling)
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
        description: "Test IP",
      });

      // Enable restrictions
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      const status = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
        organizationId,
      });

      expect(status.enabled).toBe(true);
      expect(status.allowlistCount).toBe(1);
    });

    it("should reject non-admin users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, userId: adminId } = await createTestContext(t);

      // Create a regular member
      const memberId = await createTestUser(t, { name: "Member", email: "member@test.com" });
      const asMember = asAuthenticatedUser(t, memberId);

      // Add member to organization with non-admin role
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: memberId,
          role: "member",
          addedBy: adminId,
        });
      });

      await expect(
        asMember.query(api.ipRestrictions.getIpRestrictionsStatus, { organizationId }),
      ).rejects.toThrow(/admin|forbidden/i);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      await expect(
        t.query(api.ipRestrictions.getIpRestrictionsStatus, { organizationId }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("listIpAllowlist", () => {
    it("should return empty list when no IPs configured", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });

      expect(allowlist).toHaveLength(0);
    });

    it("should return configured IPs with creator info", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId } = await createTestContext(t);

      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
        description: "Office network",
      });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });

      expect(allowlist).toHaveLength(1);
      expect(allowlist[0].ipRange).toBe("192.168.1.0/24");
      expect(allowlist[0].description).toBe("Office network");
      expect(allowlist[0].createdBy).toBe(userId);
      expect(allowlist[0].createdByName).toBeDefined();
    });
  });

  describe("addIpToAllowlist", () => {
    it("should add a single IP address", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const result = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist).toHaveLength(1);
      expect(allowlist[0].ipRange).toBe("192.168.1.100");
    });

    it("should add a CIDR range", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const result = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "10.0.0.0/8",
        description: "Internal network",
      });

      expect(result.success).toBe(true);

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist[0].ipRange).toBe("10.0.0.0/8");
    });

    it("should reject invalid IP format", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      await expect(
        asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "invalid-ip",
        }),
      ).rejects.toThrow(/invalid.*ip|cidr/i);
    });

    it("should reject IP with invalid octet values", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // 256 is not a valid octet (must be 0-255)
      await expect(
        asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "192.168.256.1",
        }),
      ).rejects.toThrow(/invalid.*ip|cidr/i);
    });

    it("should reject duplicate IP entries", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      await expect(
        asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "192.168.1.100",
        }),
      ).rejects.toThrow(/already.*allowlist|duplicate/i);
    });

    it("should trim whitespace from IP input", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "  192.168.1.50  ",
      });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist[0].ipRange).toBe("192.168.1.50");
    });
  });

  describe("removeIpFromAllowlist", () => {
    it("should remove an IP entry", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist).toHaveLength(0);
    });

    it("should reject removing last IP when restrictions are enabled", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add an IP
      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      // Enable restrictions directly
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      // Try to remove the last IP
      await expect(
        asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id }),
      ).rejects.toThrow(/cannot remove.*last.*restrictions.*enabled/i);
    });

    it("should allow removing IP when multiple exist and restrictions enabled", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add two IPs
      const { id: id1 } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.101",
      });

      // Enable restrictions
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      // Should be able to remove one
      await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id: id1 });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist).toHaveLength(1);
    });

    it("should reject non-existent IP entry", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Create and delete an entry to get a valid but non-existent ID
      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });
      await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id });

      // Try to remove again
      await expect(
        asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("setIpRestrictionsEnabled", () => {
    it("should enable restrictions when allowlist has entries", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add an IP first
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      const result = await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      expect(result.success).toBe(true);

      const status = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
        organizationId,
      });
      expect(status.enabled).toBe(true);
    });

    it("should reject enabling without any IPs in allowlist", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      await expect(
        asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
          organizationId,
          enabled: true,
        }),
      ).rejects.toThrow(/cannot enable.*without.*ip|allowlist/i);
    });

    it("should allow disabling restrictions", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add IP and enable
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });
      await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      // Disable
      const result = await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: false,
      });

      expect(result.success).toBe(true);

      const status = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
        organizationId,
      });
      expect(status.enabled).toBe(false);
    });
  });

  describe("updateIpAllowlistEntry", () => {
    it("should update description of an entry", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
        description: "Original description",
      });

      await asUser.mutation(api.ipRestrictions.updateIpAllowlistEntry, {
        id,
        description: "Updated description",
      });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist[0].description).toBe("Updated description");
    });

    it("should allow clearing description", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
        description: "Some description",
      });

      await asUser.mutation(api.ipRestrictions.updateIpAllowlistEntry, {
        id,
        description: undefined,
      });

      const allowlist = await asUser.query(api.ipRestrictions.listIpAllowlist, { organizationId });
      expect(allowlist[0].description).toBeUndefined();
    });

    it("should reject non-existent entry", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const { id } = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });
      await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, { id });

      await expect(
        asUser.mutation(api.ipRestrictions.updateIpAllowlistEntry, {
          id,
          description: "New description",
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("checkCurrentIp", () => {
    it("should return allowed when restrictions are disabled", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "203.0.113.50",
      });

      expect(result.allowed).toBe(true);
      expect(result.restrictionsEnabled).toBe(false);
    });

    it("should return allowed when IP matches allowlist", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add IP range and enable
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
      });
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "192.168.1.50",
      });

      expect(result.allowed).toBe(true);
      expect(result.restrictionsEnabled).toBe(true);
    });

    it("should return not allowed when IP does not match allowlist", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add IP range and enable
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
      });
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "10.0.0.1",
      });

      expect(result.allowed).toBe(false);
      expect(result.restrictionsEnabled).toBe(true);
    });

    it("should handle exact IP match", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // Add single IP and enable
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "203.0.113.50",
      });
      await t.run(async (ctx) => {
        await ctx.db.patch(organizationId, { ipRestrictionsEnabled: true });
      });

      // Exact match
      const resultMatch = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "203.0.113.50",
      });
      expect(resultMatch.allowed).toBe(true);

      // Different IP
      const resultNoMatch = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "203.0.113.51",
      });
      expect(resultNoMatch.allowed).toBe(false);
    });
  });
});
