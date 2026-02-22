import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY, HOUR } from "./lib/timeUtils";
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
      startTime: Date.now() - HOUR,
      endTime: Date.now(),
      billable: true,
    });

    // 4. Viewer tries to getBurnRate
    await expect(
      asViewer.query(api.timeTracking.getBurnRate, {
        projectId,
        startDate: Date.now() - DAY,
        endDate: Date.now() + DAY,
      }),
    ).rejects.toThrow(/admin/i);
  });

  // Note: The "projectId is required" validation is enforced by TypeScript at compile time
  // via Convex's v.id("projects") validator, so no runtime test is needed.
});
