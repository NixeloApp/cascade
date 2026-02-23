import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("organizations", () => {
  describe("createOrganization", () => {
    it("should create a organization and make creator owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId, slug } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      expect(organizationId).toBeDefined();
      expect(slug).toBe("test-organization");

      // Verify db state
      const organization = await t.run(async (ctx) => ctx.db.get(organizationId));
      expect(organization?.name).toBe("Test organization");
      expect(organization?.createdBy).toBe(userId);

      // Verify membership
      const membership = await t.run(async (ctx) =>
        ctx.db
          .query("organizationMembers")
          .withIndex("by_organization_user", (q) =>
            q.eq("organizationId", organizationId).eq("userId", userId),
          )
          .first(),
      );
      expect(membership?.role).toBe("owner");

      // Verify default organization set
      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.defaultOrganizationId).toBe(organizationId);
    });

    it("should handle duplicate names by appending increment", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/New_York",
      });

      const { slug } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Test organization",
        timezone: "America/Los_Angeles",
      });

      expect(slug).toBe("test-organization-1");
    });
  });

  describe("updateOrganization", () => {
    it("should allow admins to update details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
        name: "Original Name",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.organizations.updateOrganization, {
        organizationId,
        name: "New Name",
        timezone: "UTC",
      });

      const organization = await t.run(async (ctx) => ctx.db.get(organizationId));
      expect(organization?.name).toBe("New Name");
      expect(organization?.slug).toBe("original-name");
      expect(organization?.timezone).toBe("UTC");
    });

    it("should deny non-admins", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const otherId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "organization",
        timezone: "UTC",
      });

      // Add normal member
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: otherId,
        role: "member",
      });

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(async () => {
        await asOther.mutation(api.organizations.updateOrganization, {
          organizationId,
          name: "Hacked",
        });
      }).rejects.toThrow("Only organization admins can perform this action");
    });
  });

  describe("member management", () => {
    it("should add and remove members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "organization",
        timezone: "UTC",
      });

      // Add member
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      // Verify member added
      const members = await asOwner.query(api.organizations.getOrganizationMembers, {
        organizationId,
      });
      expect(members).toHaveLength(2);

      // Remove member
      await asOwner.mutation(api.organizations.removeMember, {
        organizationId,
        userId: memberId,
      });

      // Verify member removed
      const membersAfter = await asOwner.query(api.organizations.getOrganizationMembers, {
        organizationId,
      });
      expect(membersAfter).toHaveLength(1);
      expect(membersAfter[0].userId).toBe(ownerId);
    });

    it("should prevent removing the owner", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const adminId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId } = await asOwner.mutation(api.organizations.createOrganization, {
        name: "organization",
        timezone: "UTC",
      });

      // Add admin
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: adminId,
        role: "admin",
      });

      // Admin tries to remove owner
      const asAdmin = asAuthenticatedUser(t, adminId);
      await expect(async () => {
        await asAdmin.mutation(api.organizations.removeMember, {
          organizationId,
          userId: ownerId,
        });
      }).rejects.toThrow("Cannot remove organization owner");
    });
  });

  describe("queries", () => {
    it("should get organization if member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { organizationId, slug } = await asUser.mutation(api.organizations.createOrganization, {
        name: "My organization",
        timezone: "UTC",
      });

      const byId = await asUser.query(api.organizations.getOrganization, { id: organizationId });
      expect(byId?.name).toBe("My organization");

      const bySlug = await asUser.query(api.organizations.getOrganizationBySlug, { slug });
      expect(bySlug?.name).toBe("My organization");
    });

    it("should return null if not member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const otherId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { organizationId, slug } = await asOwner.mutation(
        api.organizations.createOrganization,
        {
          name: "Private organization",
          timezone: "UTC",
        },
      );

      const asOther = asAuthenticatedUser(t, otherId);
      const byId = await asOther.query(api.organizations.getOrganization, { id: organizationId });
      expect(byId).toBeNull();

      const bySlug = await asOther.query(api.organizations.getOrganizationBySlug, { slug });
      expect(bySlug).toBeNull();
    });

    it("should list user organizations", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.organizations.createOrganization, {
        name: "organization A",
        timezone: "UTC",
      });

      await asUser.mutation(api.organizations.createOrganization, {
        name: "organization B",
        timezone: "UTC",
      });

      const organizations = await asUser.query(api.organizations.getUserOrganizations, {});
      expect(organizations).toHaveLength(2);
      // Note: order is not guaranteed by default unless specified in query, usually creation order
      expect(organizations.some((c) => c.name === "organization A")).toBe(true);
      expect(organizations.some((c) => c.name === "organization B")).toBe(true);
    });
  });
});
