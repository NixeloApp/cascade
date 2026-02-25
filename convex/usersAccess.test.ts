import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Users Access Control", () => {
  it("should expose email only to users in shared organizations", async () => {
    const t = convexTest(schema, modules);

    // User 1 in Org A
    const user1 = await t.run(async (ctx) => {
      const u = await ctx.db.insert("users", {
        name: "User 1",
        email: "user1@example.com",
        emailVerificationTime: Date.now(),
      });
      const org = await ctx.db.insert("organizations", {
        name: "Org A",
        slug: "org-a",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: u,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMembers", {
        organizationId: org,
        userId: u,
        role: "owner",
        addedBy: u,
      });
      return u;
    });

    // User 2 in Org B
    const user2 = await t.run(async (ctx) => {
      const u = await ctx.db.insert("users", {
        name: "User 2",
        email: "user2@example.com",
        emailVerificationTime: Date.now(),
      });
      const org = await ctx.db.insert("organizations", {
        name: "Org B",
        slug: "org-b",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: u,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMembers", {
        organizationId: org,
        userId: u,
        role: "owner",
        addedBy: u,
      });
      return u;
    });

    // User 3 in Org A (colleague of User 1)
    const user3 = await t.run(async (ctx) => {
      const u = await ctx.db.insert("users", {
        name: "User 3",
        email: "user3@example.com",
        emailVerificationTime: Date.now(),
      });
      // Find Org A
      const orgMember1 = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user1))
        .first();
      if (!orgMember1) throw new Error("User 1 has no org");

      await ctx.db.insert("organizationMembers", {
        organizationId: orgMember1.organizationId,
        userId: u,
        role: "member",
        addedBy: user1,
      });
      return u;
    });

    // User 1 fetches User 2 (Different Org) - Should return NULL (Security Fix)
    const user2SeenByUser1 = await t
      .withIdentity({ subject: user1 })
      .query(api.users.getUser, { id: user2 });
    expect(user2SeenByUser1).toBeNull();

    // User 1 fetches User 3 (Same Org) - Should see email
    const user3SeenByUser1 = await t
      .withIdentity({ subject: user1 })
      .query(api.users.getUser, { id: user3 });
    expect(user3SeenByUser1?.name).toBe("User 3");
    expect(user3SeenByUser1?.email).toBe("user3@example.com");
  });
});
