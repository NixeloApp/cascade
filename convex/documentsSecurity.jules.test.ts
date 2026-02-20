import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Documents Security - Private Project Isolation", () => {
  it("should prevent accessing 'public' documents in a private project if user is not a project member", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin, Organization, and Private Project
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    const privateProjectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Private Project",
      isPublic: false,
    });

    // 2. Admin creates a "Public" document in the Private Project
    // (Intended to be shared with project members, but currently leaks to Org)
    const docId = await asAdmin.mutation(api.documents.create, {
      title: "Secret Launch Plan",
      isPublic: true,
      organizationId,
      projectId: privateProjectId,
    });

    // 3. Setup Attacker (Member of Organization, but NOT Project)
    const attackerId = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: attackerId,
        role: "member",
        addedBy: adminId,
      });
    });

    // 4. Vulnerability Check 1: getDocument
    // Attacker should NOT be able to see the document because they are not in the project
    await expect(async () => {
      await asAttacker.query(api.documents.getDocument, { id: docId });
    }).rejects.toThrow(/Not authorized/);

    // 5. Vulnerability Check 2: list
    // Attacker should NOT see the document in the list
    const listResult = await asAttacker.query(api.documents.list, { organizationId });
    const leakedDoc = listResult.documents.find((d) => d._id === docId);
    expect(leakedDoc).toBeUndefined();
  });
});
