/**
 * Multi-Tenant Isolation Tests
 *
 * CRITICAL: These tests verify that data from one organization cannot be accessed by another.
 * This is the most important security property of a multi-tenant system.
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Multi-Tenant Isolation", () => {
  describe("Organization Isolation", () => {
    it("user from org A cannot access org B's projects", async () => {
      const t = convexTest(schema, modules);

      // Create two separate organizations with their own admins
      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project in Org A
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Secret Project",
        key: "SECA",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
        isPublic: false,
      });

      // User B should NOT be able to access User A's project (throws forbidden)
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.query(api.projects.getProject, {
          id: projectIdA,
        }),
      ).rejects.toThrow(/forbidden/i);
    });

    it("user from org A cannot list org B's projects", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      const { organizationId: orgB, workspaceId: wsB } = await createOrganizationAdmin(t, userOrgB);

      // User A creates projects
      const asUserA = asAuthenticatedUser(t, userOrgA);
      await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project 1",
        key: "OA1",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });
      await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project 2",
        key: "OA2",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      // User B creates projects
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await asUserB.mutation(api.projects.createProject, {
        name: "Org B Project 1",
        key: "OB1",
        organizationId: orgB,
        workspaceId: wsB,
        boardType: "kanban",
      });

      // User B lists their projects - should only see Org B projects
      // getCurrentUserProjects returns paginated results based on projectMembers
      const userBProjectsResult = await asUserB.query(api.projects.getCurrentUserProjects, {});

      expect(userBProjectsResult.page.length).toBe(1);
      expect(userBProjectsResult.page[0].name).toBe("Org B Project 1");

      // None of Org A's projects should be visible
      const orgAProjectNames = userBProjectsResult.page.filter((p) => p.name.includes("Org A"));
      expect(orgAProjectNames).toHaveLength(0);
    });

    it("user from org A cannot access org B's issues", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project and issue
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "ORGA",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      const { issueId: issueIdA } = await asUserA.mutation(api.issues.mutations.createIssue, {
        projectId: projectIdA,
        title: "Secret Issue from Org A",
        type: "task",
        priority: "medium",
      });

      // User B should NOT be able to access User A's issue (throws forbidden)
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.query(api.issues.queries.getIssue, {
          id: issueIdA,
        }),
      ).rejects.toThrow(/forbidden/i);
    });

    it("user from org A cannot modify org B's project", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "MODP",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      // User B should NOT be able to update User A's project
      // updateProject uses projectAdminMutation which requires projectId
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.mutation(api.projects.updateProject, {
          projectId: projectIdA,
          name: "Hacked by Org B",
        }),
      ).rejects.toThrow(/forbidden|not found|access/i);
    });

    it("user from org A cannot delete org B's project", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project to Delete",
        key: "DELP",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      // User B should NOT be able to soft delete User A's project
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.mutation(api.projects.softDeleteProject, {
          projectId: projectIdA,
        }),
      ).rejects.toThrow(/forbidden|not found|access/i);

      // Verify project still exists for User A
      const projectStillExists = await asUserA.query(api.projects.getProject, {
        id: projectIdA,
      });
      expect(projectStillExists).not.toBeNull();
    });
  });

  describe("Document Isolation", () => {
    it("user from org A cannot access org B's documents", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project and document
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "DOCA",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      const { documentId: docIdA } = await asUserA.mutation(api.documents.create, {
        title: "Secret Document from Org A",
        isPublic: false,
        projectId: projectIdA,
        organizationId: orgA,
        workspaceId: wsA,
      });

      // User B should NOT be able to access User A's document (throws forbidden)
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.query(api.documents.getDocument, {
          id: docIdA,
        }),
      ).rejects.toThrow(/forbidden/i);
    });
  });

  describe("Sprint Isolation", () => {
    it("user from org A cannot access org B's sprints via project", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project and sprint
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "SPRA",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "scrum",
      });

      const now = Date.now();
      await asUserA.mutation(api.sprints.create, {
        projectId: projectIdA,
        name: "Secret Sprint from Org A",
        startDate: now,
        endDate: now + 2 * WEEK, // 2 weeks
      });

      // User B should NOT be able to list sprints from User A's project (throws forbidden)
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.query(api.sprints.listByProject, {
          projectId: projectIdA,
        }),
      ).rejects.toThrow(/forbidden/i);
    });
  });

  describe("Cross-Organization Data Injection Prevention", () => {
    it("user cannot create issue in another org's project", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      await createOrganizationAdmin(t, userOrgB);

      // User A creates a project
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "INJA",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      // User B should NOT be able to create an issue in User A's project
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.mutation(api.issues.mutations.createIssue, {
          projectId: projectIdA,
          title: "Injected Issue from Org B",
          type: "task",
          priority: "medium",
        }),
      ).rejects.toThrow(/forbidden|not found|access/i);
    });

    it("user cannot add themselves to another org's project", async () => {
      const t = convexTest(schema, modules);

      const userOrgA = await createTestUser(t, { name: "User Org A" });
      const userOrgB = await createTestUser(t, { name: "User Org B", email: "userb@test.com" });

      const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, userOrgA);
      const { organizationId: orgB, workspaceId: wsB } = await createOrganizationAdmin(t, userOrgB);

      // User A creates a project
      const asUserA = asAuthenticatedUser(t, userOrgA);
      const { projectId: projectIdA } = await asUserA.mutation(api.projects.createProject, {
        name: "Org A Project",
        key: "MEMB",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
      });

      // User B should NOT be able to add themselves to User A's project
      // addProjectMember uses projectAdminMutation and requires userEmail, not userId
      const asUserB = asAuthenticatedUser(t, userOrgB);
      await expect(
        asUserB.mutation(api.projects.addProjectMember, {
          projectId: projectIdA,
          userEmail: "userb@test.com",
          role: "admin",
        }),
      ).rejects.toThrow(/forbidden|not found|access/i);
    });
  });
});
