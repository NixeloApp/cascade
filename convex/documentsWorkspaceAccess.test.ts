import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Documents Workspace Access", () => {
  it("should deny access to create document in workspace for non-workspace members", async () => {
    const t = convexTest(schema, modules);

    // 1. Create Organization Admin (User A)
    const admin = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, admin);
    const asAdmin = asAuthenticatedUser(t, admin);

    // 2. Create another user (User B) and add to Organization as a member
    const user = await createTestUser(t, { name: "User" });
    await asAdmin.mutation(api.organizations.addMember, {
      organizationId,
      userId: user,
      role: "member",
    });
    const asUser = asAuthenticatedUser(t, user);

    // 3. Create a NEW restricted workspace in the organization
    // We create it manually to ensure no automatic membership for User B
    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        organizationId,
        name: "Restricted Workspace",
        slug: "restricted-ws",
        createdBy: admin,
        updatedAt: Date.now(),
      });
    });

    // 4. User A (Org Admin) should be able to create a document in the workspace
    // (Org Admins typically have access to all workspaces)
    const { documentId: adminDocId } = await asAdmin.mutation(api.documents.create, {
      title: "Admin Document",
      isPublic: false,
      organizationId,
      workspaceId,
    });
    expect(adminDocId).toBeDefined();

    // 5. User B (Org Member, NOT Workspace Member) attempts to create a document in the workspace
    // This SHOULD fail, but currently succeeds due to the vulnerability
    await expect(async () => {
      await asUser.mutation(api.documents.create, {
        title: "Unauthorized Document",
        isPublic: false,
        organizationId,
        workspaceId,
      });
    }).rejects.toThrow("You must be a workspace member");
  });
});
