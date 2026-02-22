import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Projects Security", () => {
  it("should prevent cross-organization workspace access (IDOR)", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization A and User A
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId: orgA, workspaceId: workspaceA } = await createOrganizationAdmin(
      t,
      userA,
    );

    // 2. Setup Organization B and User B
    const userB = await createTestUser(t, { name: "User B" });
    await createOrganizationAdmin(t, userB);

    // 3. User A creates a project in Workspace A (orphaned from team, directly in workspace)
    const asUserA = asAuthenticatedUser(t, userA);
    const { projectId: _projectA } = await asUserA.mutation(api.projects.createProject, {
      name: "Secret Project A",
      key: "SEC",
      isPublic: false,
      boardType: "kanban",
      organizationId: orgA,
      workspaceId: workspaceA,
      // No teamId to make it a workspace-level project
    });

    // 4. User B attempts to fetch projects from Workspace A
    const asUserB = asAuthenticatedUser(t, userB);

    // In a secure system, this should fail.
    await expect(async () => {
      await asUserB.query(api.projects.getWorkspaceProjects, {
        workspaceId: workspaceA, // User B accessing Workspace A
        paginationOpts: { numItems: 10, cursor: null },
      });
    }).rejects.toThrow("You must be an organization member to access this workspace");

    await t.finishInProgressScheduledFunctions();
  });

  it("should prevent creating project in unauthorized organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization A (Victim)
    const userA = await createTestUser(t, { name: "Victim Admin" });
    const { organizationId: orgA, workspaceId: workspaceA } = await createOrganizationAdmin(
      t,
      userA,
    );

    // 2. Setup Attacker User (no access to Org A)
    const attacker = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attacker);

    // 3. Attacker tries to create a project in Organization A
    await expect(async () => {
      await asAttacker.mutation(api.projects.createProject, {
        name: "Malicious Project",
        key: "HACK",
        description: "I shouldn't be here",
        boardType: "kanban",
        organizationId: orgA,
        workspaceId: workspaceA,
        isPublic: true,
      });
    }).rejects.toThrow(
      /You must be an organization admin or workspace member to create a project here/,
    );
  });
});
