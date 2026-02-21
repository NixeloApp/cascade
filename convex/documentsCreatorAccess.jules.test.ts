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

describe("Documents Security - Creator Access Revocation", () => {
  it("should prevent creator from accessing document after being removed from project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin and Organization
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    // 2. Setup Project
    const projectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Secret Project",
      isPublic: false,
    });

    // 3. Setup Creator (Member of Org and Project)
    const creatorId = await createTestUser(t, { name: "Creator" });
    const asCreator = asAuthenticatedUser(t, creatorId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: creatorId,
        role: "member",
        addedBy: adminId,
      });
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: creatorId,
        role: "editor",
        addedBy: adminId,
      });
    });

    // 4. Creator creates a document in the project
    const docId = await asCreator.mutation(api.documents.create, {
      title: "My Secret Doc",
      isPublic: false,
      organizationId,
      projectId,
    });

    // Verify creator can access it
    const docBefore = await asCreator.query(api.documents.getDocument, { id: docId });
    expect(docBefore).toBeDefined();

    // 5. Remove Creator from Project
    await t.run(async (ctx) => {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", creatorId))
        .first();
      if (member) await ctx.db.delete(member._id);
    });

    // 6. Creator tries to access document
    // EXPECTED: Should fail
    await expect(async () => {
      await asCreator.query(api.documents.getDocument, { id: docId });
    }).rejects.toThrow("Not authorized to access this document");
  });

  it("should prevent creator from accessing document after being removed from organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin and Organization
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);

    // 2. Setup Creator (Member of Org)
    const creatorId = await createTestUser(t, { name: "Creator" });
    const asCreator = asAuthenticatedUser(t, creatorId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: creatorId,
        role: "member",
        addedBy: adminId,
      });
    });

    // 3. Creator creates a document in the organization (no project)
    const docId = await asCreator.mutation(api.documents.create, {
      title: "Org Doc",
      isPublic: false,
      organizationId,
    });

    // Verify creator can access it
    const docBefore = await asCreator.query(api.documents.getDocument, { id: docId });
    expect(docBefore).toBeDefined();

    // 4. Remove Creator from Organization
    await t.run(async (ctx) => {
      const member = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organizationId).eq("userId", creatorId),
        )
        .first();
      if (member) await ctx.db.delete(member._id);
    });

    // 5. Creator tries to access document
    // EXPECTED: Should fail
    await expect(async () => {
      await asCreator.query(api.documents.getDocument, { id: docId });
    }).rejects.toThrow("Not authorized to access this document");
  });
});
