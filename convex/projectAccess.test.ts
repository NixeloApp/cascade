import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { computeProjectAccess } from "./projectAccess";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Project Access", () => {
  it("should grant editor access to members of the owning team", async () => {
    const t = convexTest(schema, modules);

    // Create an organization admin to set up the org/workspace
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, adminId);

    // Create the team that will own the project
    const teamId = await t.run(async (ctx) => {
      return await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Owning Team",
        slug: "owning-team",
        isPrivate: false,
        createdBy: adminId,
        updatedAt: Date.now(),
      });
    });

    // Create a regular user who is a member of this team (not admin)
    const memberId = await createTestUser(t, { name: "Team Member" });
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member",
        addedBy: adminId,
      });
    });

    // Create a project owned by the admin (so member is not project owner)
    // but assigned to the team
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Team Project",
        key: "TEAMPROJ",
        organizationId,
        workspaceId,
        teamId, // Assigned to the team
        ownerId: adminId,
        createdBy: adminId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Verify access for the team member
    const access = await t.run(async (ctx) => {
      return await computeProjectAccess(ctx, projectId, memberId);
    });

    expect(access.canAccess).toBe(true);
    expect(access.canEdit).toBe(true);
    expect(access.role).toBe("editor");
    expect(access.isAdmin).toBe(false);
  });

  it("should grant viewer access to members of shared teams", async () => {
    const t = convexTest(schema, modules);

    // Create an organization admin
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, adminId);

    // Create "Owning Team"
    const owningTeamId = await t.run(async (ctx) => {
      return await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Owning Team",
        slug: "owning-team",
        isPrivate: false,
        createdBy: adminId,
        updatedAt: Date.now(),
      });
    });

    // Create "Shared Team"
    const sharedTeamId = await t.run(async (ctx) => {
      return await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Shared Team",
        slug: "shared-team",
        isPrivate: false,
        createdBy: adminId,
        updatedAt: Date.now(),
      });
    });

    // Create a user who is a member of the Shared Team
    const sharedMemberId = await createTestUser(t, { name: "Shared Member" });
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId: sharedTeamId,
        userId: sharedMemberId,
        role: "member", // Or even admin of the shared team
        addedBy: adminId,
      });
    });

    // Create a project assigned to Owning Team, but shared with Shared Team
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Shared Project",
        key: "SHARED",
        organizationId,
        workspaceId,
        teamId: owningTeamId,
        sharedWithTeamIds: [sharedTeamId], // Shared here
        ownerId: adminId,
        createdBy: adminId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Verify access for the shared team member
    const access = await t.run(async (ctx) => {
      return await computeProjectAccess(ctx, projectId, sharedMemberId);
    });

    expect(access.canAccess).toBe(true);
    expect(access.canEdit).toBe(false); // Shared access is viewer only
    expect(access.role).toBe("viewer");
    expect(access.isAdmin).toBe(false);
  });

  it("should prioritize explicit project membership over owning team membership", async () => {
    const t = convexTest(schema, modules);

    // Create an organization admin
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, adminId);

    // Create "Owning Team"
    const owningTeamId = await t.run(async (ctx) => {
      return await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Owning Team",
        slug: "owning-team",
        isPrivate: false,
        createdBy: adminId,
        updatedAt: Date.now(),
      });
    });

    // Create a regular user who is a member of this team (not admin)
    const memberId = await createTestUser(t, { name: "Team Member" });
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId: owningTeamId,
        userId: memberId,
        role: "member", // This would normally grant "editor" access
        addedBy: adminId,
      });
    });

    // Create a project assigned to Owning Team
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Team Project",
        key: "TEAMPROJ",
        organizationId,
        workspaceId,
        teamId: owningTeamId,
        ownerId: adminId,
        createdBy: adminId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Add member explicitly to the project as "viewer"
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: memberId,
        role: "viewer", // Should override team access (editor)
        addedBy: adminId,
      });
    });

    // Verify access
    const access = await t.run(async (ctx) => {
      return await computeProjectAccess(ctx, projectId, memberId);
    });

    expect(access.canAccess).toBe(true);
    expect(access.canEdit).toBe(false); // Explicit viewer overrides team editor
    expect(access.role).toBe("viewer");
    expect(access.reason).toBe("project_member"); // Ensure it was matched via project membership
  });

  it("should prioritize organization admin over explicit project membership", async () => {
    const t = convexTest(schema, modules);

    const ownerId = await createTestUser(t, { name: "Owner" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, ownerId);

    const secondAdminId = await createTestUser(t, { name: "Second Admin" });
    // Make secondAdminId an Org Admin
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: secondAdminId,
        role: "admin", // or owner
        addedBy: ownerId,
      });
    });

    // Create a project owned by Owner
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Org Project",
        key: "ORGPROJ",
        organizationId,
        workspaceId,
        ownerId: ownerId,
        createdBy: ownerId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Add secondAdmin explicitly as "viewer"
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: secondAdminId,
        role: "viewer",
        addedBy: ownerId,
      });
    });

    // Verify access
    const access = await t.run(async (ctx) => {
      return await computeProjectAccess(ctx, projectId, secondAdminId);
    });

    expect(access.canAccess).toBe(true);
    expect(access.canEdit).toBe(true);
    expect(access.role).toBe("admin");
    expect(access.reason).toBe("organization_admin");
  });
});
