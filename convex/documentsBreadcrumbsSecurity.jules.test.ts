import { convexTest } from "convex-test";
import { describe, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext, expectThrowsAsync } from "./testUtils";

describe("Documents Breadcrumbs Security", () => {
  it("FIXED: should prevent unauthorized access to breadcrumbs of public documents across organizations", async () => {
    const t = convexTest(schema, modules);

    // Setup Context 1: User A in Org A
    const ctxA = await createTestContext(t, { name: "User A" });
    const asUserA = ctxA.asUser;

    // Setup Context 2: User B in Org B
    const ctxB = await createTestContext(t, { name: "User B" });
    const asUserB = ctxB.asUser;

    // Create a project in Org B for User B
    const projectB = await createProjectInOrganization(t, ctxB.userId, ctxB.organizationId, {
      name: "Project B",
    });

    // User B creates a PUBLIC document in Org B
    const docId = await asUserB.mutation(api.documents.create, {
      title: "Secret Org B Document",
      isPublic: true, // Mark as public (but should be scoped to Org B)
      organizationId: ctxB.organizationId,
      projectId: projectB,
      workspaceId: ctxB.workspaceId,
    });

    // Vulnerability Check: User A (from Org A) attempts to get breadcrumbs for Org B's document
    // Now this should FAIL because we added the organization membership check
    await expectThrowsAsync(async () => {
      await asUserA.query(api.documents.getBreadcrumbs, {
        id: docId,
      });
    }, "You are not a member of this organization");
  });
});
