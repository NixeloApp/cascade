import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import { getOrganizationMemberships, hasSharedOrganization } from "./organizationAccess";
import { MAX_PAGE_SIZE } from "./queryLimits";

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

  it("should correctly identify shared organization when user2 has many memberships", async () => {
    const t = convexTest(schema, modules);
    const userId1 = await createTestUser(t);
    const userId2 = await createTestUser(t);

    // Create shared organization (user1 is owner)
    const { organizationId: sharedOrgId } = await createOrganizationAdmin(t, userId1);

    // Add user2 to > MAX_PAGE_SIZE organizations FIRST
    // We use Promise.all to parallelize inserts for speed (in test)
    // But convex-test limits concurrency.
    // We can do it in a single run block.
    await t.run(async (ctx) => {
      // Create filler organizations and add user2 to them
      const fillerCount = MAX_PAGE_SIZE + 5;

      // We can insert raw documents for speed
      for (let i = 0; i < fillerCount; i++) {
        const orgId = await ctx.db.insert("organizations", {
          name: `Filler Org ${i}`,
          slug: `filler-org-${i}`,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: false,
          },
          createdBy: userId2,
          updatedAt: Date.now(),
        });

        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: userId2,
          role: "owner",
          addedBy: userId2,
          // Ensure these are created 'before' the shared membership if ordering by ID/time matters
          // But actually, we just need the shared one to be 'after' or 'missing' from the first page.
          // Since getOrganizationMemberships takes MAX_PAGE_SIZE, and we insert fillerCount > MAX_PAGE_SIZE,
          // one of them will be cut off.
          // If we insert sharedOrgId membership LAST, it should be the one cut off (if query is default order).
        });
      }

      // Now add user2 to the shared organization
      await ctx.db.insert("organizationMembers", {
        organizationId: sharedOrgId,
        userId: userId2,
        role: "member",
        addedBy: userId1,
      });
    });

    await t.run(async (ctx) => {
      // Verify user2 has > MAX_PAGE_SIZE memberships
      // We can use getOrganizationMemberships to check truncation
      const { items, hasMore } = await getOrganizationMemberships(ctx, userId2);
      expect(items.length).toBe(MAX_PAGE_SIZE);
      expect(hasMore).toBe(true);

      // Verify the shared org is NOT in the returned items (due to truncation + insertion order)
      // Note: This assertion assumes the query returns items in insertion order (creation time).
      const sharedInPage = items.some(m => m.organizationId === sharedOrgId);

      // Verify reproduction: shared org should be missing from the page
      expect(sharedInPage).toBe(false);

      // Check hasSharedOrganization - this should return true even if the shared org is missing from the page
      // (After our fix is applied. Before fix, this will fail).
      const isShared = await hasSharedOrganization(ctx, userId1, userId2);
      expect(isShared).toBe(true);
    });
  });
});
