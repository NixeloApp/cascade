import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Time Tracking Security", () => {
  it("should NOT allow viewers to see burn rate (Privilege Escalation)", async () => {
    const t = convexTest(schema, modules);

    // 1. Create Organization and Project
    const { userId: adminId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Secret Project",
    });
    const asAdmin = asAuthenticatedUser(t, adminId);

    // 2. Create a Viewer user
    const viewerId = await createTestUser(t);
    // Add viewer to organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: viewerId,
        role: "member",
        addedBy: adminId,
      });
    });
    // Add viewer to project
    await addProjectMember(t, projectId, viewerId, "viewer", adminId);

    const asViewer = asAuthenticatedUser(t, viewerId);

    // 3. Admin logs some time/cost
    await asAdmin.mutation(api.timeTracking.createTimeEntry, {
      projectId,
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      billable: true,
    });

    // 4. Viewer tries to getBurnRate
    await expect(
      asViewer.query(api.timeTracking.getBurnRate, {
        projectId,
        startDate: Date.now() - 86400000,
        endDate: Date.now() + 86400000,
      }),
    ).rejects.toThrow(/admin/i);
  });

  it("should NOT leak global time entries when projectId is missing (Cross-Tenant Leak)", async () => {
    const t = convexTest(schema, modules);

    // 1. User A in Organization A
    const ctxA = await createTestContext(t);
    const projectA = await createProjectInOrganization(t, ctxA.userId, ctxA.organizationId, {
      name: "Project A",
    });
    const asUserA = ctxA.asUser;

    // 2. User B in Organization B
    const ctxB = await createTestContext(t);
    // User B has NO access to Project A or Org A
    const asUserB = ctxB.asUser;

    // 3. User A logs time
    await asUserA.mutation(api.timeTracking.createTimeEntry, {
      projectId: projectA,
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      billable: true,
      description: "Secret Work A",
    });

    // 4. User B calls getTeamCosts without projectId
    // This SHOULD throw validation error now
    await expect(
      // @ts-expect-error - testing validation failure
      asUserB.query(api.timeTracking.getTeamCosts, {
        startDate: Date.now() - 86400000,
        endDate: Date.now() + 86400000,
      }),
    ).rejects.toThrow(/Validator error/);
  });
});
