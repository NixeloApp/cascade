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

describe("Documents Project Access Security", () => {
  it("should prevent creating documents in a private project the user cannot access", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin user and Organization
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);

    // 2. Setup Private Project (Admin is owner/member)
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Private Project",
      isPublic: false,
    });

    // 3. Setup Attacker (Member of Organization, but NOT Project)
    const attackerId = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    // Add attacker to organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: attackerId,
        role: "member",
        addedBy: adminId,
      });
    });

    // 4. Attacker attempts to create a document linked to the Private Project
    // This should fail because Attacker is not a member of the project
    await expect(async () => {
      await asAttacker.mutation(api.documents.create, {
        title: "Injected Document",
        isPublic: false,
        organizationId,
        projectId,
      });
    }).rejects.toThrow(/Not authorized/);
  });
});
