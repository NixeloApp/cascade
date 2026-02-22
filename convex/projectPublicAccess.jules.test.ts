import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Project Public Access Security", () => {
  it("should prevent cross-organization access to public projects", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization A (Victim)
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId: orgA, workspaceId: workspaceA } = await createOrganizationAdmin(
      t,
      userA,
    );

    const asUserA = asAuthenticatedUser(t, userA);

    // 2. User A creates a PUBLIC project
    const projectId = await asUserA.mutation(api.projects.createProject, {
      name: "Public Project A",
      key: "PUB",
      organizationId: orgA,
      workspaceId: workspaceA,
      isPublic: true, // This is the key
      boardType: "kanban",
    });

    // 3. Setup User B (Attacker) in a DIFFERENT organization
    const userB = await createTestUser(t, { name: "User B" });
    await createOrganizationAdmin(t, userB); // Creates Org B
    const asUserB = asAuthenticatedUser(t, userB);

    // 4. User B attempts to list issues in User A's public project
    // Currently, this succeeds because projectQuery checks `role || project.isPublic`
    // Since isPublic is true, it bypasses the role check (which correctly returns null)

    // We expect this to throw "Not authorized" or similar once fixed.
    // For reproduction, we assert that it DOES NOT throw (proving vulnerability)
    // or we can write the test assuming the fix and watch it fail.

    // Let's write it assuming the fix, so it fails now.
    await expect(async () => {
      await asUserB.query(api.issues.listByProjectSmart, {
        projectId,
      });
    }).rejects.toThrow();
  });
});
