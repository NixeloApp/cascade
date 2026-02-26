import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("SSO Functionality", () => {
  it("should create an SSO connection", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    const connection = await asAdmin.query(api.sso.get, { connectionId });
    expect(connection).not.toBeNull();
    expect(connection?.name).toBe("Test SAML Connection");
    expect(connection?.type).toBe("saml");
    expect(connection?.isEnabled).toBe(false);
  });

  it("should update SAML configuration", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    const samlConfig = {
      idpEntityId: "https://idp.example.com",
      idpSsoUrl: "https://idp.example.com/sso",
    };

    await asAdmin.mutation(api.sso.updateSamlConfig, {
      connectionId,
      config: samlConfig,
    });

    const connection = await asAdmin.query(api.sso.get, { connectionId });
    expect(connection?.samlConfig).toMatchObject(samlConfig);
  });

  it("should validate configuration before enabling", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    // Attempt to enable without configuration should fail
    const result = await asAdmin.mutation(api.sso.setEnabled, {
      connectionId,
      isEnabled: true,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("configuration is incomplete");

    // Configure and try again
    await asAdmin.mutation(api.sso.updateSamlConfig, {
      connectionId,
      config: {
        idpEntityId: "https://idp.example.com",
        idpSsoUrl: "https://idp.example.com/sso",
      },
    });

    const result2 = await asAdmin.mutation(api.sso.setEnabled, {
      connectionId,
      isEnabled: true,
    });
    expect(result2.success).toBe(true);

    const connection = await asAdmin.query(api.sso.get, { connectionId });
    expect(connection?.isEnabled).toBe(true);
  });

  it("should update verified domains and prevent conflicts", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    // Add domain
    const updateResult = await asAdmin.mutation(api.sso.updateDomains, {
      connectionId,
      domains: ["example.com"],
    });
    expect(updateResult.success).toBe(true);

    const connection = await asAdmin.query(api.sso.get, { connectionId });
    expect(connection?.verifiedDomains).toContain("example.com");

    // Try to add same domain to another org
    const user2Id = await createTestUser(t);
    const { organizationId: org2Id } = await createOrganizationAdmin(t, user2Id);
    const asAdmin2 = asAuthenticatedUser(t, user2Id);

    const { connectionId: connection2Id } = await asAdmin2.mutation(api.sso.create, {
      organizationId: org2Id,
      type: "saml",
      name: "Another SAML Connection",
    });

    const conflictResult = await asAdmin2.mutation(api.sso.updateDomains, {
      connectionId: connection2Id,
      domains: ["example.com"],
    });
    expect(conflictResult.success).toBe(false);
    expect(conflictResult.error).toContain("already configured");
  });

  it("should resolve SSO connection by domain", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    await asAdmin.mutation(api.sso.updateSamlConfig, {
      connectionId,
      config: {
        idpEntityId: "https://idp.example.com",
        idpSsoUrl: "https://idp.example.com/sso",
      },
    });

    await asAdmin.mutation(api.sso.updateDomains, {
      connectionId,
      domains: ["example.com"],
    });

    await asAdmin.mutation(api.sso.setEnabled, {
      connectionId,
      isEnabled: true,
    });

    // Resolve by domain
    const result = await t.query(api.sso.getForDomain, { domain: "example.com" });
    expect(result).not.toBeNull();
    expect(result?.connectionId).toEqual(connectionId);
    expect(result?.organizationId).toEqual(organizationId);

    // Case insensitive check
    const result2 = await t.query(api.sso.getForDomain, {
      domain: "EXAMPLE.COM",
    });
    expect(result2).not.toBeNull();
    expect(result2?.connectionId).toEqual(connectionId);
  });

  it("should remove SSO connection and associated domains", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asAdmin = asAuthenticatedUser(t, userId);

    const { connectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId,
      type: "saml",
      name: "Test SAML Connection",
    });

    await asAdmin.mutation(api.sso.updateDomains, {
      connectionId,
      domains: ["example.com"],
    });

    // Verify domain exists in ssoDomains table
    const domainsBefore = await t.run(async (ctx) => {
      return await ctx.db
        .query("ssoDomains")
        .withIndex("by_domain", (q) => q.eq("domain", "example.com"))
        .collect();
    });
    expect(domainsBefore.length).toBe(1);

    // Remove connection
    const result = await asAdmin.mutation(api.sso.remove, { connectionId });
    expect(result).toEqual({ success: true, deleted: true });

    // Verify connection is gone
    const connection = await asAdmin.query(api.sso.get, { connectionId });
    expect(connection).toBeNull();

    // Verify domain is gone
    const domainsAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("ssoDomains")
        .withIndex("by_domain", (q) => q.eq("domain", "example.com"))
        .collect();
    });
    expect(domainsAfter.length).toBe(0);
  });
});
