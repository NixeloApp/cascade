import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Projects Ghost Membership Vulnerability", () => {
  it("should prevent adding a user to a project if they are not a member of the organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization A and Admin User
    const adminUser = await createTestUser(t, { name: "Admin User", email: "admin@example.com" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, adminUser);
    const asAdmin = asAuthenticatedUser(t, adminUser);

    // 2. Create a Project in Organization A
    const projectId = await asAdmin.mutation(api.projects.createProject, {
      name: "Secret Project",
      key: "SEC",
      organizationId,
      workspaceId,
      boardType: "kanban",
    });

    // 3. Create User B (External User) - NOT a member of Organization A
    const externalUser = await createTestUser(t, {
      name: "External User",
      email: "external@example.com",
    });

    // 4. Admin tries to add External User to the Project
    // This SHOULD fail if the vulnerability is fixed.
    // If it succeeds (does not throw), the vulnerability is present.
    await expect(async () => {
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "external@example.com",
        role: "viewer",
      });
    }).rejects.toThrow(/User is not a member of the organization/);
  });
});
