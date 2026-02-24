import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import {
  getWorkspaceRole,
  isWorkspaceAdmin,
  isWorkspaceEditor,
  isWorkspaceMember,
} from "./workspaceAccess";

describe("Workspace Access Helpers", () => {
  it("should return correct workspace role and access levels", async () => {
    const t = convexTest(schema, modules);

    // Create an organization admin (who also creates a workspace)
    const adminId = await createTestUser(t, { name: "Admin" });
    const { workspaceId, organizationId } = await createOrganizationAdmin(t, adminId);

    // Create other users
    const editorId = await createTestUser(t, { name: "Editor" });
    const memberId = await createTestUser(t, { name: "Member" });
    const outsiderId = await createTestUser(t, { name: "Outsider" });

    // Manually set up workspace memberships
    await t.run(async (ctx) => {
      // Admin is already an admin of the org, but let's check workspace role.
      // createOrganizationAdmin creates a workspace but doesn't assign workspace role.
      // So we need to assign it manually or verify it's null first.

      // Let's explicitly assign roles
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: adminId,
        role: "admin",
        addedBy: adminId,
      });

      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: editorId,
        role: "editor",
        addedBy: adminId,
      });

      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: memberId,
        role: "member",
        addedBy: adminId,
      });
    });

    await t.run(async (ctx) => {
      // Test getWorkspaceRole
      expect(await getWorkspaceRole(ctx, workspaceId, adminId)).toBe("admin");
      expect(await getWorkspaceRole(ctx, workspaceId, editorId)).toBe("editor");
      expect(await getWorkspaceRole(ctx, workspaceId, memberId)).toBe("member");
      expect(await getWorkspaceRole(ctx, workspaceId, outsiderId)).toBeNull();

      // Test isWorkspaceAdmin
      expect(await isWorkspaceAdmin(ctx, workspaceId, adminId)).toBe(true);
      expect(await isWorkspaceAdmin(ctx, workspaceId, editorId)).toBe(false);
      expect(await isWorkspaceAdmin(ctx, workspaceId, memberId)).toBe(false);
      expect(await isWorkspaceAdmin(ctx, workspaceId, outsiderId)).toBe(false);

      // Test isWorkspaceEditor
      expect(await isWorkspaceEditor(ctx, workspaceId, adminId)).toBe(true);
      expect(await isWorkspaceEditor(ctx, workspaceId, editorId)).toBe(true);
      expect(await isWorkspaceEditor(ctx, workspaceId, memberId)).toBe(false);
      expect(await isWorkspaceEditor(ctx, workspaceId, outsiderId)).toBe(false);

      // Test isWorkspaceMember
      expect(await isWorkspaceMember(ctx, workspaceId, adminId)).toBe(true);
      expect(await isWorkspaceMember(ctx, workspaceId, editorId)).toBe(true);
      expect(await isWorkspaceMember(ctx, workspaceId, memberId)).toBe(true);
      expect(await isWorkspaceMember(ctx, workspaceId, outsiderId)).toBe(false);
    });
  });

  it("should handle soft deleted members correctly (if applicable)", async () => {
    // Note: workspaceMembers table has isDeleted field in schema, but helpers might not filter it.
    // Let's check the implementation of getWorkspaceRole again.
    // implementation: .withIndex("by_workspace_user", ...) .first()
    // It does NOT check isDeleted.
    // This might be a bug or intended behavior depending on how deletion is handled (hard vs soft).
    // The schema has isDeleted: v.optional(v.boolean()).
    // If the helper doesn't filter, soft-deleted members still have access?

    // Let's verify this behavior. If it's a bug, I should probably just document it in the test
    // or fix it if I was asked to fix bugs, but my task is to add tests.
    // I will add a test case for soft deletion and see what happens.

    const t = convexTest(schema, modules);
    const adminId = await createTestUser(t, { name: "Admin" });
    const { workspaceId } = await createOrganizationAdmin(t, adminId);
    const deletedMemberId = await createTestUser(t, { name: "Deleted Member" });

    await t.run(async (ctx) => {
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: deletedMemberId,
        role: "member",
        addedBy: adminId,
        isDeleted: true,
      });
    });

    await t.run(async (ctx) => {
      // Based on current implementation, this should return "member" and true,
      // even if isDeleted is true, because the query doesn't filter by isDeleted.
      // I will assert the CURRENT behavior.
      const role = await getWorkspaceRole(ctx, workspaceId, deletedMemberId);
      expect(role).toBe("member");
    });
  });
});
