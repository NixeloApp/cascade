import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("SSO Security", () => {
  it("should detect duplicate domains even when many SSO connections exist", async () => {
    const t = convexTest(schema, modules);

    // Create admin user for setup
    const adminId = await createTestUser(t);
    const asAdmin = asAuthenticatedUser(t, adminId);

    // Create many "noise" organizations and SSO connections to exceed the limit
    // BOUNDED_LIST_LIMIT is 100. We need > 100 connections.
    // Creating 105 to be safe.
    const noiseCount = BOUNDED_LIST_LIMIT + 5;

    console.log(`Creating ${noiseCount} noise SSO connections...`);

    // We can run this in a batch using t.run to speed up
    await t.run(async (ctx) => {
      for (let i = 0; i < noiseCount; i++) {
        const orgId = await ctx.db.insert("organizations", {
          name: `Noise Org ${i}`,
          slug: `noise-org-${i}`,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: false,
          },
          createdBy: adminId,
          updatedAt: Date.now(),
        });

        // Add admin as owner
        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: adminId,
          role: "owner",
          addedBy: adminId,
        });

        // Create SSO connection
        const connectionId = await ctx.db.insert("ssoConnections", {
          organizationId: orgId,
          type: "saml",
          name: `Noise SSO ${i}`,
          isEnabled: true,
          createdBy: adminId,
          updatedAt: Date.now(),
          verifiedDomains: [`noise-${i}.com`], // Unique domain for each
        });

        let domains = [`noise-${i}.com`];
        // Mark the LAST one as the "victim" with a specific domain
        if (i === noiseCount - 1) {
          domains = ["victim.com"];
          await ctx.db.patch(connectionId, {
            verifiedDomains: domains,
          });
        }

        // Populate ssoDomains (new table)
        for (const domain of domains) {
          await ctx.db.insert("ssoDomains", {
            domain,
            connectionId,
            organizationId: orgId,
          });
        }
      }
    });

    // Verify we have enough connections
    const count = await t.run(
      async (ctx) => (await ctx.db.query("ssoConnections").collect()).length,
    );
    expect(count).toBeGreaterThan(BOUNDED_LIST_LIMIT);

    // Verify ssoDomains count
    const domainsCount = await t.run(
      async (ctx) => (await ctx.db.query("ssoDomains").collect()).length,
    );
    expect(domainsCount).toBe(noiseCount);

    // Now try to create another connection claiming "victim.com"
    // This should FAIL if security is working, but currently PASSES due to the bug.

    // Create attacker org
    const attackerOrgId = await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Attacker Org",
        slug: "attacker-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: adminId,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("organizationMembers", {
        organizationId: orgId,
        userId: adminId,
        role: "owner",
        addedBy: adminId,
      });
      return orgId;
    });

    const { connectionId: attackerConnectionId } = await asAdmin.mutation(api.sso.create, {
      organizationId: attackerOrgId,
      type: "saml",
      name: "Attacker SSO",
    });

    // Try to claim "victim.com"
    // This expects to throw if fixed.
    // convex-test throws a ConvexError where the message is the stringified data.
    // We check for the error code and part of the message to be robust against quoting.
    await expect(
      asAdmin.mutation(api.sso.updateDomains, {
        connectionId: attackerConnectionId,
        domains: ["victim.com"],
      }),
    ).rejects.toThrow(/CONFLICT.*victim.com.*already configured/);
  });
});
