import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestContext,
} from "./testUtils";

describe("Documents Security", () => {
  it("should prevent creating documents with cross-organization project linkage", async () => {
    const t = convexTest(schema, modules);
    // Create Context 1 (User A, Org A)
    const { userId, organizationId: orgA } = await createTestContext(t, { name: "User A" });
    const asUserA = asAuthenticatedUser(t, userId);

    // Create Project A in Org A
    const projectA = await createProjectInOrganization(t, userId, orgA, { name: "Project A" });

    // Create Org B where User A is also an admin/member
    const { organizationId: orgB } = await createOrganizationAdmin(t, userId, { name: "Org B" });

    // Attempt to create a document in Org B, but linked to Project A (which belongs to Org A)
    // This should fail because Project A does not belong to Org B
    await expect(async () => {
      await asUserA.mutation(api.documents.create, {
        title: "Malicious Doc",
        isPublic: false,
        organizationId: orgB,
        projectId: projectA,
      });
    }).rejects.toThrow(/Project does not belong to the specified organization/);
  });

  it("should prevent creating documents with cross-organization workspace linkage", async () => {
    const t = convexTest(schema, modules);
    // Create Context 1 (User A, Org A)
    const { userId, workspaceId: wsA } = await createTestContext(t, { name: "User A" });
    const asUserA = asAuthenticatedUser(t, userId);

    // Create Org B
    const { organizationId: orgB } = await createOrganizationAdmin(t, userId, { name: "Org B" });

    // Attempt to create a document in Org B, but linked to Workspace A (from Org A)
    await expect(async () => {
      await asUserA.mutation(api.documents.create, {
        title: "Malicious Doc Workspace",
        isPublic: false,
        organizationId: orgB,
        workspaceId: wsA,
      });
    }).rejects.toThrow(/Workspace does not belong to the specified organization/);
  });
});
