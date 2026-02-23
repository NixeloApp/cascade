import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Documents Security - Write Access Revocation", () => {
  it("should fail to update title if creator is removed from project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin, Organization, Workspace
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);

    // 2. Setup Project
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Secret Project",
      isPublic: false,
    });

    // 3. Setup Creator
    const creatorId = await createTestUser(t, { name: "Creator" });
    const asCreator = asAuthenticatedUser(t, creatorId);

    // Add Creator to Org and Project
    await addUserToOrganization(t, organizationId, creatorId, adminId, "member");
    await addProjectMember(t, projectId, creatorId, "editor", adminId);

    // 4. Creator creates a document in the project
    const { documentId } = await asCreator.mutation(api.documents.create, {
      title: "My Secret Doc",
      isPublic: false,
      organizationId,
      projectId,
    });

    // 5. Remove Creator from Project
    await t.run(async (ctx) => {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", creatorId))
        .first();
      if (!member) throw new Error("Test setup error: project member not found for removal");
      await ctx.db.delete(member._id);
    });

    // 6. Creator tries to update title - should fail after access revocation
    await expect(async () => {
      await asCreator.mutation(api.documents.updateTitle, {
        id: documentId,
        title: "Hacked Title",
      });
    }).rejects.toThrow("Not authorized to access this document");
  });

  it("should fail to delete document if creator is removed from project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin, Organization
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);

    // 2. Setup Project
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Secret Project",
      isPublic: false,
    });

    // 3. Setup Creator
    const creatorId = await createTestUser(t, { name: "Creator" });
    const asCreator = asAuthenticatedUser(t, creatorId);

    // Add Creator to Org and Project
    await addUserToOrganization(t, organizationId, creatorId, adminId, "member");
    await addProjectMember(t, projectId, creatorId, "editor", adminId);

    // 4. Creator creates a document
    const { documentId } = await asCreator.mutation(api.documents.create, {
      title: "My Secret Doc",
      isPublic: false,
      organizationId,
      projectId,
    });

    // 5. Remove Creator from Project
    await t.run(async (ctx) => {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", creatorId))
        .first();
      if (!member) throw new Error("Test setup error: project member not found for removal");
      await ctx.db.delete(member._id);
    });

    // 6. Creator tries to delete document - should fail after access revocation
    await expect(async () => {
      await asCreator.mutation(api.documents.deleteDocument, {
        id: documentId,
      });
    }).rejects.toThrow("Not authorized to access this document");
  });
});
