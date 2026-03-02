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

describe("Users Performance Optimization (Membership Check Strategy)", () => {
  it("should correctly count shared projects when viewer has between 11 and 50 projects", async () => {
    const t = convexTest(schema, modules);

    // User A (Viewer) - will have 15 projects
    const userA = await createTestUser(t);
    const asUserA = asAuthenticatedUser(t, userA);

    // User B (Target) - will have 100 projects
    const userB = await createTestUser(t);

    // Create Organization
    const { organizationId } = await createOrganizationAdmin(t, userA);

    // Add User B to organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // 1. Create 15 projects where BOTH are members
    // This will make allowedProjectIds.size = 15 for User A
    const sharedCount = 15;
    for (let i = 0; i < sharedCount; i++) {
      const project = await createProjectInOrganization(t, userA, organizationId);
      // Add User B
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId: project,
          userId: userB,
          role: "viewer",
          addedBy: userA,
        });
      });
    }

    // 2. Create 85 projects where ONLY User B is member
    const onlyBCount = 85;
    for (let i = 0; i < onlyBCount; i++) {
      // Created by B
      await createProjectInOrganization(t, userB, organizationId);
    }

    // Verify counts manually (use bounded read)
    const userBTotalProjects = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("projectMembers")
          .withIndex("by_user", (q) => q.eq("userId", userB))
          .take(200)
      ).length;
    });
    expect(userBTotalProjects).toBe(sharedCount + onlyBCount); // 100

    // Fetch stats as User A viewing User B
    // With threshold 10, this uses "filtered" strategy (fetch 100 memberships of B)
    // With threshold 50, this uses "fast" strategy (15 lookups)
    const stats = await asUserA.query(api.users.getUserStats, { userId: userB });

    expect(stats.projects).toBe(sharedCount);
  });
});
