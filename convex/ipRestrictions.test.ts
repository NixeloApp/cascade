import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestUser,
} from "./testUtils";

describe("IP Restrictions", () => {
  describe("addIpToAllowlist", () => {
    it("should add a valid IPv4 address to allowlist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      const result = await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
        description: "Office IP",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("should add a valid CIDR range to allowlist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      const result = await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "10.0.0.0/8",
        description: "Internal network",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid IP addresses", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      await expect(
        asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "invalid-ip",
        }),
      ).rejects.toThrow(/Invalid IP address or CIDR range/);
    });

    it("should reject duplicate IP entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      // Add first time - should succeed
      await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      // Add again - should fail
      await expect(
        asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "192.168.1.100",
        }),
      ).rejects.toThrow(/already in the allowlist/);
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const memberId = await createTestUser(t, { email: "member@test.com" });
      const { organizationId } = await createOrganizationAdmin(t, adminId);

      // Add member as regular user (not admin)
      await addUserToOrganization(t, organizationId, memberId, adminId, "member");

      const asMember = asAuthenticatedUser(t, memberId);

      await expect(
        asMember.mutation(api.ipRestrictions.addIpToAllowlist, {
          organizationId,
          ipRange: "192.168.1.100",
        }),
      ).rejects.toThrow(/admin/i);
    });
  });

  describe("setIpRestrictionsEnabled", () => {
    it("should enable restrictions when allowlist has entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      // Add an IP first
      await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      const result = await asAdmin.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      expect(result.success).toBe(true);
    });

    it("should reject enabling restrictions with empty allowlist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      await expect(
        asAdmin.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
          organizationId,
          enabled: true,
        }),
      ).rejects.toThrow(/Cannot enable IP restrictions without/);
    });
  });

  describe("removeIpFromAllowlist", () => {
    it("should remove IP entry when restrictions are disabled", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      // Add an IP entry
      const { id: ipEntryId } = await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      const result = await asAdmin.mutation(api.ipRestrictions.removeIpFromAllowlist, {
        id: ipEntryId,
      });

      expect(result.success).toBe(true);
    });

    it("should prevent removing last IP when restrictions are enabled", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      // Add an IP entry and enable restrictions
      const { id: ipEntryId } = await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });

      await asAdmin.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      await expect(
        asAdmin.mutation(api.ipRestrictions.removeIpFromAllowlist, {
          id: ipEntryId,
        }),
      ).rejects.toThrow(/Cannot remove the last IP/);
    });
  });

  describe("listIpAllowlist", () => {
    it("should return all IP entries with creator names", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Admin User" });
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asAdmin = asAuthenticatedUser(t, userId);

      // Add IP entries
      await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
        description: "Office network",
      });
      await asAdmin.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "10.0.0.1",
        description: "VPN",
      });

      const result = await asAdmin.query(api.ipRestrictions.listIpAllowlist, {
        organizationId,
      });

      expect(result).toHaveLength(2);
      expect(result[0].createdByName).toBe("Admin User");
    });
  });

  describe("checkCurrentIp", () => {
    it("should return allowed=true when restrictions are disabled", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "1.2.3.4",
      });

      expect(result.allowed).toBe(true);
      expect(result.restrictionsEnabled).toBe(false);
    });

    it("should return allowed=true when IP is in allowlist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Add IP and enable restrictions
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
      });
      await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "192.168.1.50",
      });

      expect(result.allowed).toBe(true);
      expect(result.restrictionsEnabled).toBe(true);
    });

    it("should return allowed=false when IP is not in allowlist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Add IP and enable restrictions
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/24",
      });
      await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });

      const result = await asUser.query(api.ipRestrictions.checkCurrentIp, {
        organizationId,
        clientIp: "10.0.0.1",
      });

      expect(result.allowed).toBe(false);
      expect(result.restrictionsEnabled).toBe(true);
    });
  });
});
