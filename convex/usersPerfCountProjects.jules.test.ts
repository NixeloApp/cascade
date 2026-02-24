import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Users Performance Optimization (Project Counts)", () => {
  it("should correctly count shared projects with large non-shared set", async () => {
    const t = convexTest(schema, modules);

    // User A (Viewer)
    const userA = await createTestUser(t);
    const asUserA = asAuthenticatedUser(t, userA);

    // User B (Target)
    const userB = await createTestUser(t);

    // Create Organization for User A (and B)
    const { organizationId: orgA } = await createOrganizationAdmin(t, userA);

    // Add User B to organization members
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgA,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // 1. Create 2 Shared Projects (User A and User B)
    const sharedCount = 2;
    await Promise.all(
      Array.from({ length: sharedCount }, async () => {
        const project = await createProjectInOrganization(t, userA, orgA);
        // Add User B to Project
        await t.run(async (ctx) => {
          await ctx.db.insert("projectMembers", {
            projectId: project,
            userId: userB,
            role: "viewer",
            addedBy: userA,
          });
        });
      }),
    );

    // 2. Create 98 Non-Shared Projects (User B only)
    // Note: We create these in the same org but don't add User A to them
    // (createProjectInOrganization adds creator (User A) automatically, so we need to remove User A or create as User B)
    // To be cleaner, let's create them as User B.
    const nonSharedCount = 98;
    await Promise.all(
      Array.from({ length: nonSharedCount }, () =>
        // Create as User B (so User A is not a member)
        createProjectInOrganization(t, userB, orgA),
      ),
    );
    // User B is automatically added as owner/admin

    // Verify User A memberships
    const userAMemberships = await t.run(async (ctx) => {
      return await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", userA))
        .collect();
    });
    // User A should be in:
    // - The 2 shared projects (created by A)
    // - NOT in the 98 projects created by B (assuming createProject doesn't add org admins automatically to all projects?
    //   Wait, createProjectInOrganization helper usually adds the creator.
    //   Let's check createProjectInOrganization implementation or just assume default behavior.

    // Actually, if User A is org admin, they might have access?
    // But project memberships are explicit.
    // Let's verifying User A count is 2.
    expect(userAMemberships.length).toBe(sharedCount);

    // Verify User B memberships
    const userBMemberships = await t.run(async (ctx) => {
      return await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", userB))
        .collect();
    });
    expect(userBMemberships.length).toBe(sharedCount + nonSharedCount); // 100

    // Now call getUserStats as User A for User B
    const stats = await asUserA.query(api.users.getUserStats, { userId: userB });

    // Should only count the shared projects (2)
    expect(stats.projects).toBe(sharedCount);
  });
});
