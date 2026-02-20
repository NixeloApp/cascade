import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("IP Restrictions", () => {
  it("should enforce admin access", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const memberId = await createTestUser(t);
    const asOwner = asAuthenticatedUser(t, ownerId);

    // Create org
    const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "UTC",
    });

    // Add member
    await asOwner.mutation(api.organizations.addMember, {
      organizationId,
      userId: memberId,
      role: "member",
    });

    const asMember = asAuthenticatedUser(t, memberId);

    // Member tries to add IP
    await expect(async () => {
      await asMember.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.1",
      });
    }).rejects.toThrow("Only organization admins can manage IP restrictions");

    // Member tries to enable restrictions
    await expect(async () => {
      await asMember.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });
    }).rejects.toThrow("Only organization admins can manage IP restrictions");
  });

  it("should manage allowlist", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const asOwner = asAuthenticatedUser(t, ownerId);

    const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "UTC",
    });

    // Add valid IP
    await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "192.168.1.1",
      description: "Office",
    });

    // Add valid CIDR
    await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "10.0.0.0/24",
      description: "VPN",
    });

    // Verify list
    const list = await asOwner.query(api.ipRestrictions.listIpAllowlist, { organizationId });
    expect(list).toHaveLength(2);
    expect(list.some((i) => i.ipRange === "192.168.1.1")).toBe(true);
    expect(list.some((i) => i.ipRange === "10.0.0.0/24")).toBe(true);

    // Try duplicate
    await expect(async () => {
      await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "192.168.1.1",
      });
    }).rejects.toThrow("This IP or range is already in the allowlist");

    // Try invalid IP
    await expect(async () => {
      await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
        organizationId,
        ipRange: "999.999.999.999",
      });
    }).rejects.toThrow("Invalid IP address or CIDR range");

    // Remove IP
    const entryToRemove = list.find((i) => i.ipRange === "192.168.1.1");
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    await asOwner.mutation(api.ipRestrictions.removeIpFromAllowlist, { id: entryToRemove!._id });

    const listAfter = await asOwner.query(api.ipRestrictions.listIpAllowlist, { organizationId });
    expect(listAfter).toHaveLength(1);
    expect(listAfter[0].ipRange).toBe("10.0.0.0/24");
  });

  it("should enforce restrictions", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const asOwner = asAuthenticatedUser(t, ownerId);

    const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "UTC",
    });

    // Try to enable with empty list
    await expect(async () => {
      await asOwner.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
        organizationId,
        enabled: true,
      });
    }).rejects.toThrow("Cannot enable IP restrictions without at least one IP");

    // Add IP
    await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "192.168.1.100",
    });

    // Check status - disabled by default
    const status = await asOwner.query(api.ipRestrictions.getIpRestrictionsStatus, {
      organizationId,
    });
    expect(status.enabled).toBe(false);

    // Check access - allowed because disabled
    let check = await asOwner.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "1.2.3.4",
    });
    expect(check.allowed).toBe(true);

    // Enable restrictions
    await asOwner.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
      organizationId,
      enabled: true,
    });

    // Check status
    const statusEnabled = await asOwner.query(api.ipRestrictions.getIpRestrictionsStatus, {
      organizationId,
    });
    expect(statusEnabled.enabled).toBe(true);

    // Check access - blocked
    check = await asOwner.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "1.2.3.4",
    });
    expect(check.allowed).toBe(false);

    // Check access - allowed
    check = await asOwner.query(api.ipRestrictions.checkCurrentIp, {
      organizationId,
      clientIp: "192.168.1.100",
    });
    expect(check.allowed).toBe(true);
  });

  it("should prevent removing last IP when enabled", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const asOwner = asAuthenticatedUser(t, ownerId);

    const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "UTC",
    });

    await asOwner.mutation(api.ipRestrictions.addIpToAllowlist, {
      organizationId,
      ipRange: "192.168.1.1",
    });

    await asOwner.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
      organizationId,
      enabled: true,
    });

    const list = await asOwner.query(api.ipRestrictions.listIpAllowlist, { organizationId });
    const entry = list[0];

    // Try to remove last IP
    await expect(async () => {
      await asOwner.mutation(api.ipRestrictions.removeIpFromAllowlist, {
        id: entry._id,
      });
    }).rejects.toThrow("Cannot remove the last IP from allowlist while restrictions are enabled");

    // Disable restrictions
    await asOwner.mutation(api.ipRestrictions.setIpRestrictionsEnabled, {
      organizationId,
      enabled: false,
    });

    // Now remove should succeed
    await asOwner.mutation(api.ipRestrictions.removeIpFromAllowlist, {
      id: entry._id,
    });

    const listAfter = await asOwner.query(api.ipRestrictions.listIpAllowlist, { organizationId });
    expect(listAfter).toHaveLength(0);
  });
});
