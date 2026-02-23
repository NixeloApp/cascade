import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Document Security - Project Viewers", () => {
  it("should prevent viewers from creating public documents in a project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization & Project
    const ownerId = await createTestUser(t, { name: "Owner" });
    const asOwner = asAuthenticatedUser(t, ownerId);

    const { organizationId: orgId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "America/New_York",
    });
    // Need a workspace first
    const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
      name: "Test Workspace",
      slug: "test-workspace",
      organizationId: orgId,
    });
    const { projectId } = await asOwner.mutation(api.projects.createProject, {
      name: "Test Project",
      organizationId: orgId,
      workspaceId: workspaceId,
      key: "TEST",
      boardType: "kanban",
    });

    // 2. Setup Viewer
    const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@example.com" });
    const asViewer = asAuthenticatedUser(t, viewerId);

    // Add viewer to organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgId,
        userId: viewerId,
        role: "member",
        addedBy: ownerId,
      });
    });

    // Add viewer to project explicitly as "viewer"
    await asOwner.mutation(api.projectMembers.add, {
      projectId: projectId, // Passed via ctx/args? Wait, projectAdminMutation takes args...
      userEmail: "viewer@example.com",
      role: "viewer",
    });

    // 3. Attempt to create PUBLIC document in project (Should Fail)
    await expect(
      asViewer.mutation(api.documents.create, {
        title: "Malicious Doc",
        isPublic: true,
        organizationId: orgId,
        projectId: projectId,
      }),
    ).rejects.toThrow(/editor/);

    // Verify document does NOT exist
    const docs = await t.run(async (ctx) => {
      return await ctx.db
        .query("documents")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
    });

    expect(docs.length).toBe(0);
  });

  it("should prevent viewers from toggling private documents to public in a project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization & Project
    const ownerId = await createTestUser(t, { name: "Owner" });
    const asOwner = asAuthenticatedUser(t, ownerId);

    const { organizationId: orgId } = await asOwner.mutation(api.organizations.createOrganization, {
      name: "Test Org",
      timezone: "America/New_York",
    });
    // Need a workspace first
    const { workspaceId } = await asOwner.mutation(api.workspaces.create, {
      name: "Test Workspace",
      slug: "test-workspace",
      organizationId: orgId,
    });
    const { projectId } = await asOwner.mutation(api.projects.createProject, {
      name: "Test Project",
      organizationId: orgId,
      workspaceId: workspaceId,
      key: "TEST",
      boardType: "kanban",
      isPublic: false,
    });

    // 2. Setup Viewer
    const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@example.com" });
    const asViewer = asAuthenticatedUser(t, viewerId);

    // Add viewer to organization and project
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgId,
        userId: viewerId,
        role: "member",
        addedBy: ownerId,
      });
    });

    await asOwner.mutation(api.projectMembers.add, {
      projectId: projectId,
      userEmail: "viewer@example.com",
      role: "viewer",
    });

    // 3. Create PRIVATE document (Allowed for viewer)
    const { documentId: docId } = await asViewer.mutation(api.documents.create, {
      title: "My Private Note",
      isPublic: false,
      organizationId: orgId,
      projectId: projectId,
    });

    // 4. Toggle Public (Should Fail)
    await expect(
      asViewer.mutation(api.documents.togglePublic, {
        id: docId,
      }),
    ).rejects.toThrow(/editor/);

    const doc = await t.run(async (ctx) => ctx.db.get(docId));
    expect(doc?.isPublic).toBe(false);
  });
});
