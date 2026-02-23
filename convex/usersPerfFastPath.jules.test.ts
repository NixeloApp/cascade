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

describe("Users Performance Optimization (Fast Path)", () => {
  it("should correctly count issues with many shared projects (triggering fast path)", async () => {
    const t = convexTest(schema, modules);

    // User A (Viewer)
    const userA = await createTestUser(t);
    const asUserA = asAuthenticatedUser(t, userA);

    // User B (Target)
    const userB = await createTestUser(t);

    // Create Organization for User A
    const { organizationId: orgA } = await createOrganizationAdmin(t, userA);

    // Create 15 Shared Projects
    // Current threshold is 10, so this triggers "filtered" path (slow scan).
    // After optimization (threshold 50), this will trigger "fast" path.
    const projectCount = 15;

    const projectIds = await Promise.all(
      Array.from({ length: projectCount }, async () => {
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

        return project;
      }),
    );

    // Add User B to organization members
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgA,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // Create issues in each project for User B
    await Promise.all(
      projectIds.map(async (projectId, i) => {
        // 1 Active Issue
        await t.run(async (ctx) => {
          const p = await ctx.db.get(projectId);
          if (!p) throw new Error("Project missing");
          await ctx.db.insert("issues", {
            projectId,
            organizationId: p.organizationId,
            // biome-ignore lint/style/noNonNullAssertion: testing convenience
            workspaceId: p.workspaceId!,
            // biome-ignore lint/style/noNonNullAssertion: testing convenience
            teamId: p.teamId!,
            key: `KEY-A-${i}`,
            title: `Active ${i}`,
            status: "todo",
            priority: "medium",
            type: "task",
            reporterId: userB,
            assigneeId: userB,
            updatedAt: Date.now(),
            labels: [],
            order: 0,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
          });
        });

        // 1 Completed Issue (only for even projects to mix it up)
        if (i % 2 === 0) {
          await t.run(async (ctx) => {
            const p = await ctx.db.get(projectId);
            if (!p) throw new Error("Project missing");
            await ctx.db.insert("issues", {
              projectId,
              organizationId: p.organizationId,
              // biome-ignore lint/style/noNonNullAssertion: testing convenience
              workspaceId: p.workspaceId!,
              // biome-ignore lint/style/noNonNullAssertion: testing convenience
              teamId: p.teamId!,
              key: `KEY-D-${i}`,
              title: `Done ${i}`,
              status: "done",
              priority: "medium",
              type: "task",
              reporterId: userB,
              assigneeId: userB,
              updatedAt: Date.now(),
              labels: [],
              order: 0,
              linkedDocuments: [],
              attachments: [],
              embedding: [],
            });
          });
        }
      }),
    );

    // Expected Stats:
    // Projects: 15
    // Issues Created: 15 (Active) + 8 (Done: 0, 2, 4, 6, 8, 10, 12, 14) = 23
    // Issues Assigned: 23
    // Issues Completed: 8

    const stats = await asUserA.query(api.users.getUserStats, { userId: userB });

    expect(stats.issuesCreated).toBe(23);
    expect(stats.issuesAssigned).toBe(23);
    expect(stats.issuesCompleted).toBe(8);
    expect(stats.projects).toBe(15);
  });
});
