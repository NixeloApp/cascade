import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import { getOrganizationMemberships } from "./organizationAccess";

describe("Organization Access", () => {
  it("should fetch memberships efficiently", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    await t.run(async (ctx) => {
      const { items } = await getOrganizationMemberships(ctx, userId);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].organizationId).toEqual(organizationId);
    });
  });

  it("should handle multiple checks concurrently", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Create multiple orgs
    const org1 = await createOrganizationAdmin(t, userId);
    const org2 = await createOrganizationAdmin(t, userId);

    await t.run(async (ctx) => {
      // Use Promise.all instead of loop to avoid "Async operation inside loop" validation error
      const results = await Promise.all([
        getOrganizationMemberships(ctx, userId),
        getOrganizationMemberships(ctx, userId),
      ]);
      expect(results[0].items.length).toBeGreaterThanOrEqual(2);
    });
  });
});
