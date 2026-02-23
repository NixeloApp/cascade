import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

test("Ghost Membership Prevention: User cannot be added to project without being in organization", async () => {
  const t = convexTest(schema, modules);

  // 1. Setup Admin and Organization
  const adminId = await createTestUser(t, { name: "Admin", email: "admin@example.com" });
  const { organizationId } = await createOrganizationAdmin(t, adminId);
  const admin = asAuthenticatedUser(t, adminId);

  // 2. Create Project
  const projectId = await createProjectInOrganization(t, adminId, organizationId, {
    name: "Secret Project",
    key: "SEC",
  });

  // 3. Create Outsider (not in organization)
  const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@example.com" });
  const outsider = asAuthenticatedUser(t, outsiderId);

  // 4. Verify Outsider cannot access project initially
  // Currently getProject throws forbidden if access check fails
  await expect(async () => {
    await outsider.query(api.projects.getProject, { id: projectId });
  }).rejects.toThrow(/Not authorized/);

  // 5. Admin attempts to add Outsider to project
  // Should fail because outsider is not in the organization
  // Note: Error message is now "User not found" to prevent email enumeration
  await expect(async () => {
    await admin.mutation(api.projects.addProjectMember, {
      projectId,
      userEmail: "outsider@example.com",
      role: "viewer",
    });
  }).rejects.toThrow(/User not found/);

  // 6. Verify Outsider still cannot access project
  await expect(async () => {
    await outsider.query(api.projects.getProject, { id: projectId });
  }).rejects.toThrow(/Not authorized/);
});
