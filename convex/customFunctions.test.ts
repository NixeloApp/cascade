import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

describe("Custom Functions Access Control", () => {
  describe("Organization Access (organizationQuery)", () => {
    it("should prevent non-members from accessing organization data", async () => {
      const t = convexTest(schema, modules);

      // 1. Create an Admin User with their Organization
      const { organizationId: adminOrgId } = await createTestContext(t, { name: "Admin User" });

      // 2. Create a Visitor User (not in the admin's org)
      const visitorId = await createTestUser(t, { name: "Visitor User" });
      const asVisitor = asAuthenticatedUser(t, visitorId);

      // 3. Visitor tries to access Admin's organization teams
      await expectThrowsAsync(async () => {
        await asVisitor.query(api.teams.getOrganizationTeams, {
          organizationId: adminOrgId,
        });
      }, "You must be an organization member to access this resource");
    });

    it("should allow members to access organization data", async () => {
      const t = convexTest(schema, modules);

      // 1. Create an Admin User with their Organization
      const { organizationId: adminOrgId, userId: adminId } = await createTestContext(t, {
        name: "Admin User",
      });

      // 2. Create a Member User (initially not in the admin's org)
      const memberId = await createTestUser(t, { name: "Member User" });
      const asMember = asAuthenticatedUser(t, memberId);

      // 3. Admin adds Member to the organization
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.organizations.addMember, {
        organizationId: adminOrgId,
        userId: memberId,
        role: "member",
      });

      // 4. Member accesses Admin's organization teams -> Success
      const teams = await asMember.query(api.teams.getOrganizationTeams, {
        organizationId: adminOrgId,
      });
      expect(teams).toBeDefined();
      expect(Array.isArray(teams)).toBe(true);
    });
  });

  describe("Project Admin Access (projectAdminMutation)", () => {
    it("should prevent editors from performing admin actions", async () => {
      const t = convexTest(schema, modules);

      // 1. Admin creates project
      const { organizationId, userId: adminId } = await createTestContext(t, {
        name: "Admin User",
      });
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // 2. Create Editor User
      const editorId = await createTestUser(t, { name: "Editor User" });
      const asEditor = asAuthenticatedUser(t, editorId);

      // 3. Add Editor to Project (role: editor)
      // First add to org
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.organizations.addMember, {
        organizationId,
        userId: editorId,
        role: "member",
      });

      // Then add to project
      await addProjectMember(t, projectId, editorId, "editor", adminId);

      // 4. Editor tries to update project (admin action)
      await expectThrowsAsync(async () => {
        await asEditor.mutation(api.projects.updateProject, {
          projectId,
          description: "Editor trying to update description",
        });
      }, "Not authorized");
    });

    it("should allow admins to perform admin actions", async () => {
      const t = convexTest(schema, modules);

      // 1. Admin creates project
      const { organizationId, userId: adminId } = await createTestContext(t, {
        name: "Admin User",
      });
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });
      const asAdmin = asAuthenticatedUser(t, adminId);

      // 2. Admin updates project
      await asAdmin.mutation(api.projects.updateProject, {
        projectId,
        description: "Admin updating description",
      });

      // Verify update
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.description).toBe("Admin updating description");
    });
  });

  describe("Project Editor Access (projectEditorMutation)", () => {
    it("should prevent viewers from creating issues", async () => {
      const t = convexTest(schema, modules);

      // 1. Admin creates project
      const { organizationId, userId: adminId } = await createTestContext(t, {
        name: "Admin User",
      });
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // 2. Create Viewer User
      const viewerId = await createTestUser(t, { name: "Viewer User" });
      const asViewer = asAuthenticatedUser(t, viewerId);

      // 3. Add Viewer to Project (role: viewer)
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.organizations.addMember, {
        organizationId,
        userId: viewerId,
        role: "member",
      });
      await addProjectMember(t, projectId, viewerId, "viewer", adminId);

      // 4. Viewer tries to create issue (editor action)
      await expectThrowsAsync(async () => {
        await asViewer.mutation(api.issues.create, {
          projectId,
          title: "Viewer Issue",
          type: "task",
          priority: "medium",
        });
      }, "Not authorized");
    });

    it("should allow editors to create issues", async () => {
      const t = convexTest(schema, modules);

      // 1. Admin creates project
      const { organizationId, userId: adminId } = await createTestContext(t, {
        name: "Admin User",
      });
      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Test Project",
      });

      // 2. Create Editor User
      const editorId = await createTestUser(t, { name: "Editor User" });
      const asEditor = asAuthenticatedUser(t, editorId);

      // 3. Add Editor to Project
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.organizations.addMember, {
        organizationId,
        userId: editorId,
        role: "member",
      });
      await addProjectMember(t, projectId, editorId, "editor", adminId);

      // 4. Editor creates issue
      const { issueId } = await asEditor.mutation(api.issues.create, {
        projectId,
        title: "Editor Issue",
        type: "task",
        priority: "medium",
      });

      expect(issueId).toBeDefined();
    });
  });
});
