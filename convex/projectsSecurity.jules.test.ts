import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
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
  // Ensure we use the exact email created in step 3
  await expect(async () => {
    await admin.mutation(api.projects.addProjectMember, {
      projectId,
      userEmail: "outsider@example.com",
      role: "viewer",
    });
  }).rejects.toThrow(/User must be a member of the organization/);

  // 6. Verify Outsider still cannot access project
  await expect(async () => {
    await outsider.query(api.projects.getProject, { id: projectId });
  }).rejects.toThrow(/Not authorized/);
});

test("Removed Owner Access Revocation: Project creator loses access when removed from organization", async () => {
  const t = convexTest(schema, modules);

  // 1. Create organization owner
  const orgOwnerId = await createTestUser(t, { name: "Org Owner", email: "orgowner@example.com" });
  const { organizationId } = await createOrganizationAdmin(t, orgOwnerId);
  const orgOwner = asAuthenticatedUser(t, orgOwnerId);

  // 2. Create a second user who will create a project then be removed
  const creatorId = await createTestUser(t, { name: "Creator", email: "creator@example.com" });
  const creator = asAuthenticatedUser(t, creatorId);

  // 3. Add creator to organization as admin so they can create projects
  await addUserToOrganization(t, organizationId, creatorId, orgOwnerId, "admin");

  // 4. Creator creates a project within the organization
  const projectId = await createProjectInOrganization(t, creatorId, organizationId, {
    name: "Creator's Project",
    key: "CRPR",
  });

  // 5. Verify creator has access to their project
  const projectBefore = await creator.query(api.projects.getProject, { id: projectId });
  expect(projectBefore).toBeDefined();
  expect(projectBefore?.name).toBe("Creator's Project");

  // 6. Org owner removes creator from the organization
  await orgOwner.mutation(api.organizations.removeMember, {
    organizationId,
    userId: creatorId,
  });

  // 7. Also remove the project membership that was created with the project
  // This tests the pure "owner bypass" scenario
  await t.run(async (ctx) => {
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", creatorId))
      .first();
    if (membership) {
      await ctx.db.delete(membership._id);
    }
  });

  // 8. CRITICAL: Verify creator can no longer access the project they created
  // Even though they are the owner/creator, they must be an org member
  await expect(async () => {
    await creator.query(api.projects.getProject, { id: projectId });
  }).rejects.toThrow(/Not authorized/);
});
