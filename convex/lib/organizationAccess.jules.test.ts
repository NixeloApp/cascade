import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import {
  getOrganizationMemberships,
  getOrganizationRole,
  hasSharedOrganization,
  isOrganizationAdmin,
  isOrganizationMember,
} from "./organizationAccess";
import { MAX_PAGE_SIZE } from "./queryLimits";

describe("organizationAccess", () => {
  const createTestUser = async (t: any) => {
    return t.run(async (ctx: any) => {
      return ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });
  };

  const createOrganization = async (t: any, userId: any, name: string) => {
    return t.run(async (ctx: any) => {
      return ctx.db.insert("organizations", {
        name,
        slug: name.toLowerCase().replace(/\s/g, "-"),
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });
  };

  const addMember = async (
    t: any,
    organizationId: any,
    userId: any,
    role: "owner" | "admin" | "member",
  ) => {
    return t.run(async (ctx: any) => {
      return ctx.db.insert("organizationMembers", {
        organizationId,
        userId,
        role,
        addedBy: userId,
        joinedAt: Date.now(),
      });
    });
  };

  it("should return organization memberships", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const org1 = await createOrganization(t, userId, "Org 1");
    const org2 = await createOrganization(t, userId, "Org 2");
    await addMember(t, org1, userId, "owner");
    await addMember(t, org2, userId, "member");

    await t.run(async (ctx) => {
      const { items } = await getOrganizationMemberships(ctx, userId);
      expect(items).toHaveLength(2);
      const orgIds = items.map((i) => i.organizationId);
      expect(orgIds).toContain(org1);
      expect(orgIds).toContain(org2);
    });
  });

  it("should correctly handle fallback for > 100 organizations", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Create 105 organizations
    // We do this in batches to avoid overwhelming the transaction if needed,
    // but convex-test handles it.
    await t.run(async (ctx) => {
      const orgsToCreate = Array.from({ length: 105 }, (_, i) => ({
        name: `Org ${i}`,
        slug: `org-${i}`,
      }));

      await Promise.all(
        orgsToCreate.map(async (orgData) => {
          const orgId = await ctx.db.insert("organizations", {
            name: orgData.name,
            slug: orgData.slug,
            timezone: "UTC",
            settings: {
              defaultMaxHoursPerWeek: 40,
              defaultMaxHoursPerDay: 8,
              requiresTimeApproval: false,
              billingEnabled: false,
            },
            createdBy: userId,
            updatedAt: Date.now(),
          });
          await ctx.db.insert("organizationMembers", {
            organizationId: orgId,
            userId,
            role: "member",
            addedBy: userId,
            joinedAt: Date.now(),
          });
          return orgId;
        }),
      );
    });

    // Create one more organization that we explicitly want to check.
    // This ensures it is definitely created *after* the initial batch.
    const lastOrgId = await createOrganization(t, userId, "Last Org");
    await addMember(t, lastOrgId, userId, "owner");

    await t.run(async (ctx) => {
      // getOrganizationMemberships should return max 100 items
      const { items, hasMore } = await getOrganizationMemberships(ctx, userId);
      expect(items).toHaveLength(100);
      expect(hasMore).toBe(true);

      // Verify the last org is NOT in the first 100 (assuming simple creation order,
      // but even if it is, there's at least one org not in the list).
      // Actually, since we want to test the fallback, let's pick an org ID
      // that is NOT in the returned items.
      const returnedOrgIds = new Set(items.map((i) => i.organizationId));
      const targetOrgId = lastOrgId;

      if (returnedOrgIds.has(lastOrgId)) {
        // This is unlikely if sorted by creation time/id, but just in case:
        // Find an org that was created but not returned.
        // We know we created 106 total (105 + 1).
        // Since we can't easily list all orgs here without another query,
        // we'll rely on the fact that the last one created is likely last.
        // If it *is* in the list, then the first one created must be missing.
        // But getOrganizationMemberships sorts by index `by_user` which is `userId`.
        // The secondary sort key for `by_user` is `_id`.
        // `_id` is roughly time ordered.
        // So the last inserted one should be at the end.
        // Wait, `getOrganizationMemberships` uses `q.eq("userId", userId)`.
        // It doesn't specify sort order, so it defaults to index order.
        // Index `by_user` is `["userId"]`.
        // So it's sorted by `_id` ascending (creation time).
        // So the *first 100* created should be returned.
        // The *last one* (106th) should definitely NOT be in the list.
        throw new Error("Last created org should not be in the first 100 results");
      }

      // Now check the role for this missing org.
      // It should trigger the fallback query.
      const role = await getOrganizationRole(ctx, targetOrgId, userId);
      expect(role).toBe("owner");
    });
  });

  it("should check for shared organizations", async () => {
    const t = convexTest(schema, modules);
    const userA = await createTestUser(t);
    const userB = await createTestUser(t);
    const userC = await createTestUser(t);

    const org1 = await createOrganization(t, userA, "Org 1");
    const org2 = await createOrganization(t, userA, "Org 2");

    await addMember(t, org1, userA, "admin");
    await addMember(t, org1, userB, "member");

    await addMember(t, org2, userC, "owner");

    await t.run(async (ctx) => {
      const shareAB = await hasSharedOrganization(ctx, userA, userB);
      expect(shareAB).toBe(true);

      const shareAC = await hasSharedOrganization(ctx, userA, userC);
      expect(shareAC).toBe(false);

      const shareBC = await hasSharedOrganization(ctx, userB, userC);
      expect(shareBC).toBe(false);
    });
  });

  it("should verify admin/member status", async () => {
    const t = convexTest(schema, modules);
    const userAdmin = await createTestUser(t);
    const userMember = await createTestUser(t);
    const org = await createOrganization(t, userAdmin, "Org");

    await addMember(t, org, userAdmin, "admin");
    await addMember(t, org, userMember, "member");

    await t.run(async (ctx) => {
      // Check Admin
      expect(await isOrganizationAdmin(ctx, org, userAdmin)).toBe(true);
      expect(await isOrganizationMember(ctx, org, userAdmin)).toBe(true);

      // Check Member
      expect(await isOrganizationAdmin(ctx, org, userMember)).toBe(false);
      expect(await isOrganizationMember(ctx, org, userMember)).toBe(true);

      // Check Non-member (create another user)
      const userStranger = await ctx.db.insert("users", {
        name: "Stranger",
        email: "stranger@example.com",
      });
      expect(await isOrganizationAdmin(ctx, org, userStranger)).toBe(false);
      expect(await isOrganizationMember(ctx, org, userStranger)).toBe(false);
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
      const sharedInPage = items.some((m) => m.organizationId === sharedOrgId);

      // Verify reproduction: shared org should be missing from the page
      expect(sharedInPage).toBe(false);

      // Check hasSharedOrganization - this should return true even if the shared org is missing from the page
      // (After our fix is applied. Before fix, this will fail).
      const isShared = await hasSharedOrganization(ctx, userId1, userId2);
      expect(isShared).toBe(true);
    });
  });
});
