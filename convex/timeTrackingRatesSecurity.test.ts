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

describe("Time Tracking Rates Security", () => {
  it("should enforce permissions for setting user rates", async () => {
    const t = convexTest(schema, modules);

    // Setup: Admin creates project, adds member
    const { userId: adminId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Rate Project",
    });

    // Create a regular member
    const memberId = await createTestUser(t);
    // Add member to project with role "viewer" (not admin)
    await addProjectMember(t, projectId, memberId, "viewer", adminId);

    const asAdmin = asAuthenticatedUser(t, adminId);
    const asMember = asAuthenticatedUser(t, memberId);

    // 1. Member CANNOT set rate for another user (Global)
    await expect(
      asMember.mutation(api.timeTracking.setUserRate, {
        userId: adminId,
        hourlyRate: 100,
        currency: "USD",
        rateType: "internal",
      }),
    ).rejects.toThrow(); // Should be forbidden

    // 2. Member CANNOT set rate for another user in Project (requires admin)
    await expect(
      asMember.mutation(api.timeTracking.setUserRate, {
        userId: adminId,
        projectId,
        hourlyRate: 100,
        currency: "USD",
        rateType: "internal",
      }),
    ).rejects.toThrow(); // Should be forbidden (not admin)

    // 3. Admin CAN set rate for Member in Project
    await expect(
      asAdmin.mutation(api.timeTracking.setUserRate, {
        userId: memberId,
        projectId,
        hourlyRate: 150,
        currency: "USD",
        rateType: "billable",
      }),
    ).resolves.toMatchObject({ success: true });

    // 4. Member CAN set their OWN Global rate
    await expect(
      asMember.mutation(api.timeTracking.setUserRate, {
        userId: memberId,
        hourlyRate: 80,
        currency: "USD",
        rateType: "internal",
      }),
    ).resolves.toMatchObject({ success: true });
  });
});
