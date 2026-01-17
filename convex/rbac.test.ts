// @ts-nocheck - Test file with complex union type assertions

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "./_generated/dataModel";
import type { ProjectRole } from "./rbac";
import { hasMinimumRole } from "./rbac";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  createOrganizationAdmin,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("RBAC Utilities", () => {
  describe("hasMinimumRole", () => {
    it("should return true when user has exact required role", () => {
      expect(hasMinimumRole("viewer", "viewer")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("admin", "admin")).toBe(true);
    });

    it("should return true when user has higher role than required", () => {
      expect(hasMinimumRole("editor", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "editor")).toBe(true);
    });

    it("should return false when user has lower role than required", () => {
      expect(hasMinimumRole("viewer", "editor")).toBe(false);
      expect(hasMinimumRole("viewer", "admin")).toBe(false);
      expect(hasMinimumRole("editor", "admin")).toBe(false);
    });

    it("should return false when user has no role (null)", () => {
      expect(hasMinimumRole(null, "viewer")).toBe(false);
      expect(hasMinimumRole(null, "editor")).toBe(false);
      expect(hasMinimumRole(null, "admin")).toBe(false);
    });

    it("should handle role hierarchy correctly", () => {
      const _roles: ProjectRole[] = ["viewer", "editor", "admin"];

      // Viewer can only access viewer
      expect(hasMinimumRole("viewer", "viewer")).toBe(true);
      expect(hasMinimumRole("viewer", "editor")).toBe(false);
      expect(hasMinimumRole("viewer", "admin")).toBe(false);

      // Editor can access viewer and editor
      expect(hasMinimumRole("editor", "viewer")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("editor", "admin")).toBe(false);

      // Admin can access everything
      expect(hasMinimumRole("admin", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "editor")).toBe(true);
      expect(hasMinimumRole("admin", "admin")).toBe(true);
    });
  });

  describe("getProjectRole (projectAccess)", () => {
    it("should return 'admin' for project creator", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./projectAccess");
        return await getProjectRole(ctx, projectId, userId);
      });

      expect(role).toBe("admin");
    });

    it("should return correct role from projectMembers table", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const memberId = await createTestUser(t, { name: "Member" });
      const projectId = await createTestProject(t, creatorId);

      // Add member as editor
      await addProjectMember(t, projectId, memberId, "editor", creatorId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./projectAccess");
        return await getProjectRole(ctx, projectId, memberId);
      });

      expect(role).toBe("editor");
    });

    it("should return null for non-members", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const nonMemberId = await createTestUser(t, { name: "Non-Member" });
      const projectId = await createTestProject(t, creatorId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./projectAccess");
        return await getProjectRole(ctx, projectId, nonMemberId);
      });

      expect(role).toBeNull();
    });

    it("should return null for non-existent project", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t);
      const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"projects">;

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./projectAccess");
        return await getProjectRole(ctx, fakeProjectId, userId);
      });

      expect(role).toBeNull();
    });
  });

  describe("canAccessProject (projectAccess)", () => {
    it("should allow access to organization-visible projects for organization members", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const organizationMemberId = await createTestUser(t, { name: "organization Member" });
      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, creatorId);

      // Add organization member (not project member)
      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: organizationMemberId,
          role: "member",
          addedBy: creatorId,
          addedAt: now,
        });
      });

      // Create organization-visible project
      const projectId = await t.run(async (ctx) => {
        return ctx.db.insert("projects", {
          name: "organization Visible Project",
          key: "COMPVIS",
          organizationId,
          workspaceId,
          ownerId: creatorId,
          createdBy: creatorId,
          createdAt: now,
          updatedAt: now,
          isPublic: true, // organization-visible
          boardType: "kanban",
          workflowStates: [],
        });
      });

      const canAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./projectAccess");
        return await canAccessProject(ctx, projectId, organizationMemberId);
      });

      expect(canAccess).toBe(true);
    });

    it("should require membership for private projects", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const memberId = await createTestUser(t, { name: "Member" });
      const nonMemberId = await createTestUser(t, { name: "Non-Member" });
      const projectId = await createTestProject(t, creatorId, {
        isPublic: false,
      });

      await addProjectMember(t, projectId, memberId, "viewer", creatorId);

      // Creator can access
      const creatorCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./projectAccess");
        return await canAccessProject(ctx, projectId, creatorId);
      });
      expect(creatorCanAccess).toBe(true);

      // Member can access
      const memberCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./projectAccess");
        return await canAccessProject(ctx, projectId, memberId);
      });
      expect(memberCanAccess).toBe(true);

      // Non-member cannot access
      const nonMemberCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./projectAccess");
        return await canAccessProject(ctx, projectId, nonMemberId);
      });
      expect(nonMemberCanAccess).toBe(false);
    });
  });

  describe("canEditProject (projectAccess)", () => {
    it("should allow editors to edit", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, editorId, "editor", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./projectAccess");
        return await canEditProject(ctx, projectId, editorId);
      });

      expect(canEdit).toBe(true);
    });

    it("should allow admins to edit", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const adminId = await createTestUser(t, { name: "Admin" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, adminId, "admin", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./projectAccess");
        return await canEditProject(ctx, projectId, adminId);
      });

      expect(canEdit).toBe(true);
    });

    it("should deny viewers from editing", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, viewerId, "viewer", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./projectAccess");
        return await canEditProject(ctx, projectId, viewerId);
      });

      expect(canEdit).toBe(false);
    });
  });

  describe("isProjectAdmin (projectAccess)", () => {
    it("should allow only admins to manage", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, adminId, "admin", creatorId);
      await addProjectMember(t, projectId, editorId, "editor", creatorId);
      await addProjectMember(t, projectId, viewerId, "viewer", creatorId);

      // Creator (admin) can manage
      const creatorCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./projectAccess");
        return await isProjectAdmin(ctx, projectId, creatorId);
      });
      expect(creatorCanManage).toBe(true);

      // Admin can manage
      const adminCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./projectAccess");
        return await isProjectAdmin(ctx, projectId, adminId);
      });
      expect(adminCanManage).toBe(true);

      // Editor cannot manage
      const editorCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./projectAccess");
        return await isProjectAdmin(ctx, projectId, editorId);
      });
      expect(editorCanManage).toBe(false);

      // Viewer cannot manage
      const viewerCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./projectAccess");
        return await isProjectAdmin(ctx, projectId, viewerId);
      });
      expect(viewerCanManage).toBe(false);
    });
  });

  describe("assertCanEditProject (projectAccess)", () => {
    it("should throw for insufficient permissions", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, viewerId, "viewer", creatorId);

      await expect(async () => {
        await t.run(async (ctx) => {
          const { assertCanEditProject } = await import("./projectAccess");
          await assertCanEditProject(ctx, projectId, viewerId);
        });
      }).rejects.toThrow("You don't have permission to edit this project");
    });

    it("should pass for sufficient permissions", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const projectId = await createTestProject(t, creatorId);

      await addProjectMember(t, projectId, editorId, "editor", creatorId);

      // Should not throw
      await t.run(async (ctx) => {
        const { assertCanEditProject } = await import("./projectAccess");
        await assertCanEditProject(ctx, projectId, editorId);
      });
    });
  });
});
