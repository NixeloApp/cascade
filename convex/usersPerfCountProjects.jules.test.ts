import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Users Performance - Project Counting", () => {
  it("should count projects efficiently using fast path for shared projects", async () => {
    const t = convexTest(schema, modules);

    // 1. Create Viewer (User A)
    const ctxViewer = await createTestContext(t, { name: "Viewer" });
    const viewerId = ctxViewer.userId;

    // 2. Create Target (User B)
    const ctxTarget = await createTestContext(t, { name: "Target" });
    const targetId = ctxTarget.userId;

    // 3. Create Shared Projects (2) in Viewer's org
    const sharedProject1 = await createProjectInOrganization(
      t,
      viewerId,
      ctxViewer.organizationId,
      { name: "Shared 1" },
    );
    const sharedProject2 = await createProjectInOrganization(
      t,
      viewerId,
      ctxViewer.organizationId,
      { name: "Shared 2" },
    );

    // Add Target as member to shared projects
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId: sharedProject1,
        userId: targetId,
        role: "viewer",
        addedBy: viewerId,
      });
      await ctx.db.insert("projectMembers", {
        projectId: sharedProject2,
        userId: targetId,
        role: "viewer",
        addedBy: viewerId,
      });
    });

    // 4. Create Private Projects (5) for Target in Target's org
    // Target is automatically added as admin/owner
    for (let i = 0; i < 5; i++) {
      await createProjectInOrganization(t, targetId, ctxTarget.organizationId, {
        name: `Private ${i}`,
      });
    }

    // 5. Create a shared project where Target was REMOVED (should not count)
    const removedProject = await createProjectInOrganization(
      t,
      viewerId,
      ctxViewer.organizationId,
      { name: "Removed Project" },
    );
    // Add Target then simulate removal (e.g. isDeleted flag or hard delete - schema says isDeleted optional)
    // Check schema for soft delete
    await t.run(async (ctx) => {
      // Add member
      await ctx.db.insert("projectMembers", {
        projectId: removedProject,
        userId: targetId,
        role: "viewer",
        addedBy: viewerId,
        isDeleted: true, // Simulate soft delete
      });
    });

    // 6. Verify stats as Viewer viewing Target
    const stats = await ctxViewer.asUser.query(api.users.getUserStats, { userId: targetId });

    // Expect 2 shared projects (Shared 1, Shared 2). Private projects ignored. Removed project ignored.
    expect(stats.projects).toBe(2);

    // 7. Verify stats as Target viewing Target (should see all: 2 shared + 5 private + 1 default workspace project created by createTestContext)
    // Wait, createTestContext creates a default workspace and team but does it create a project? No.
    // However, createTestProject/createProjectInOrganization creates a project.
    // Target created 5 private projects.
    // Target is member of 2 shared projects.
    // Total = 7.

    const statsOwn = await ctxTarget.asUser.query(api.users.getUserStats, { userId: targetId });
    expect(statsOwn.projects).toBe(7);
  });
});
