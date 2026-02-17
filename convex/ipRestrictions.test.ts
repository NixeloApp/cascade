import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("ipRestrictions", () => {
  it("should manage IP allowlist and validate access", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    // Initial state: restrictions disabled, allowlist empty
    const status = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
      organizationId,
    });
    expect(status.enabled).toBe(false);
    expect(status.allowlistCount).toBe(0);

    const check1 = await asUser.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "1.2.3.4",
    });
    expect(check1.allowed).toBe(true); // Default allow when disabled

    // Try to enable without IPs (should fail)
    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });
    }).rejects.toThrow("Cannot enable IP restrictions without at least one IP");

    // Add IP
    const addResult = await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "192.168.1.100",
      description: "Home Office",
    });
    expect(addResult.success).toBe(true);

    // Enable restrictions
    await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
      organizationId,
      enabled: true,
    });

    const statusAfterEnable = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
      organizationId,
    });
    expect(statusAfterEnable.enabled).toBe(true);

    // Verify access
    const check2 = await asUser.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "192.168.1.100",
    });
    expect(check2.allowed).toBe(true);

    const check3 = await asUser.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "10.0.0.1",
    });
    expect(check3.allowed).toBe(false);

    // Test CIDR
    await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "10.0.0.0/24",
      description: "Office Network",
    });

    const check4 = await asUser.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "10.0.0.5",
    });
    expect(check4.allowed).toBe(true);

    const check5 = await asUser.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "10.0.1.5",
    });
    expect(check5.allowed).toBe(false);

    // Test remove
    const list = await asUser.query(api.ipRestrictions.listIpAllowlist, {
      organizationId,
    });
    const homeEntry = list.find((e) => e.ipRange === "192.168.1.100");
    const officeEntry = list.find((e) => e.ipRange === "10.0.0.0/24");

    expect(list).toHaveLength(2);

    await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, {
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      id: homeEntry!._id,
    });

    // Fail removing last IP while enabled
    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, {
        // biome-ignore lint/style/noNonNullAssertion: testing convenience
        id: officeEntry!._id,
      });
    }).rejects.toThrow("Cannot remove the last IP");

    // Disable and remove last
    await asUser.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
      organizationId,
      enabled: false,
    });
    await asUser.mutation(api.ipRestrictions.removeIpFromAllowlist, {
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      id: officeEntry!._id,
    });

    const finalStatus = await asUser.query(api.ipRestrictions.getIpRestrictionsStatus, {
      organizationId,
    });
    expect(finalStatus.allowlistCount).toBe(0);
  });

  it("should validate IP and CIDR formats", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "invalid-ip",
      });
    }).rejects.toThrow("Invalid IP address or CIDR range");

    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "256.0.0.1",
      });
    }).rejects.toThrow("Invalid IP address or CIDR range");

    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.0/33",
      });
    }).rejects.toThrow("Invalid IP address or CIDR range");
  });

  it("should prevent duplicate entries", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "192.168.1.100",
    });

    await expect(async () => {
      await asUser.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.100",
      });
    }).rejects.toThrow("This IP or range is already in the allowlist");
  });
});
