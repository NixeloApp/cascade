import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { softDeleteFields } from "../lib/softDeleteHelpers";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "../testUtils";

describe("User Stats Logic", () => {
  it("should correctly count stats based on viewer and soft deletion status", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Users
    const viewerId = await createTestUser(t, { name: "Viewer" });
    const targetId = await createTestUser(t, { name: "Target" });
    const otherId = await createTestUser(t, { name: "Other" });

    // 2. Setup Organization (Viewer is owner)
    const { organizationId } = await createOrganizationAdmin(t, viewerId);

    // Add Target and Other to Organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: targetId,
        role: "member",
        addedBy: viewerId,
      });
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: otherId,
        role: "member",
        addedBy: viewerId,
      });
    });

    // 3. Setup Projects

    // Project 1: Shared (Viewer & Target)
    const p1 = await createProjectInOrganization(t, viewerId, organizationId, {
      name: "Shared P1",
    });
    await addProjectMember(t, p1, targetId, "viewer", viewerId);

    // Project 2: Target Only (Target created, Viewer not member)
    // Note: createProjectInOrganization adds creator as admin
    const p2 = await createProjectInOrganization(t, targetId, organizationId, {
      name: "Target P2",
    });

    // Project 3: Shared but Soft Deleted
    const p3 = await createProjectInOrganization(t, viewerId, organizationId, {
      name: "Deleted P3",
    });
    await addProjectMember(t, p3, targetId, "viewer", viewerId);

    // 4. Create Issues

    // P1: 5 issues assigned to Target
    for (let i = 0; i < 5; i++) {
      await createTestIssue(t, p1, targetId, {
        title: `P1 Issue ${i}`,
        assigneeId: targetId,
        status: "todo",
      });
    }

    // P2: 3 issues assigned to Target
    for (let i = 0; i < 3; i++) {
      await createTestIssue(t, p2, targetId, {
        title: `P2 Issue ${i}`,
        assigneeId: targetId,
        status: "todo",
      });
    }

    // P3: 2 issues assigned to Target
    for (let i = 0; i < 2; i++) {
      await createTestIssue(t, p3, targetId, {
        title: `P3 Issue ${i}`,
        assigneeId: targetId,
        status: "todo",
      });
    }

    // Soft Delete P3 (simulate cascade delete by patching manually for test speed/simplicity)
    // In real app, `softDeleteProject` mutation handles this cascade.
    await t.run(async (ctx) => {
      const now = Date.now();
      const fields = softDeleteFields(viewerId);

      // Delete Project
      await ctx.db.patch(p3, fields);

      // Delete Members
      const members = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", p3))
        .collect();
      for (const m of members) await ctx.db.patch(m._id, fields);

      // Delete Issues
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", p3))
        .collect();
      for (const i of issues) await ctx.db.patch(i._id, fields);
    });

    // 5. Test Scenarios

    // Scenario 1: Unrestricted Access (Target viewing themselves)
    // Should see P1 (5) + P2 (3) = 8. P3 is deleted.
    const asTarget = asAuthenticatedUser(t, targetId);
    const statsUnrestricted = await asTarget.query(api.users.getUserStats, { userId: targetId });
    expect(statsUnrestricted.issuesAssigned).toBe(8);

    // Scenario 2: Restricted Access (Viewer viewing Target)
    // Should see P1 (5). P2 is not shared. P3 is deleted (so not shared).
    const asViewer = asAuthenticatedUser(t, viewerId);
    const statsRestricted = await asViewer.query(api.users.getUserStats, { userId: targetId });
    expect(statsRestricted.issuesAssigned).toBe(5);

    // Scenario 3: No Access (Other viewing Target)
    // Should see 0. No shared projects.
    const asOther = asAuthenticatedUser(t, otherId);
    const statsNone = await asOther.query(api.users.getUserStats, { userId: targetId });
    expect(statsNone.issuesAssigned).toBe(0);
  });
});
