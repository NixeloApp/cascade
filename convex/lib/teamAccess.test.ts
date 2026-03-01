import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { getTeamRole, isTeamAdmin, isTeamMember } from "./teamAccess";

describe("Team Access", () => {
  it("should correctly identify team admin", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // 1. Setup Data
      const userId = await ctx.db.insert("users", {
        name: "Admin User",
        email: "admin@example.com",
        emailVerificationTime: Date.now(),
      });

      const organizationId = await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "America/Los_Angeles",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });

      const workspaceId = await ctx.db.insert("workspaces", {
        organizationId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: userId,
        updatedAt: Date.now(),
      });

      const teamId = await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Admin Team",
        slug: "admin-team",
        isPrivate: false,
        createdBy: userId,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "admin",
        addedBy: userId,
      });

      // 2. Assertions
      const role = await getTeamRole(ctx, teamId, userId);
      expect(role).toBe("admin");

      const isAdmin = await isTeamAdmin(ctx, teamId, userId);
      expect(isAdmin).toBe(true);

      const isMember = await isTeamMember(ctx, teamId, userId);
      expect(isMember).toBe(true);
    });
  });

  it("should correctly identify regular team member", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // 1. Setup Data
      const userId = await ctx.db.insert("users", {
        name: "Regular Member",
        email: "member@example.com",
        emailVerificationTime: Date.now(),
      });

      const creatorId = await ctx.db.insert("users", {
        name: "Creator",
        email: "creator@example.com",
        emailVerificationTime: Date.now(),
      });

      const organizationId = await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "America/Los_Angeles",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      const workspaceId = await ctx.db.insert("workspaces", {
        organizationId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      const teamId = await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Member Team",
        slug: "member-team",
        isPrivate: false,
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "member",
        addedBy: creatorId,
      });

      // 2. Assertions
      const role = await getTeamRole(ctx, teamId, userId);
      expect(role).toBe("member");

      const isAdmin = await isTeamAdmin(ctx, teamId, userId);
      expect(isAdmin).toBe(false);

      const isMember = await isTeamMember(ctx, teamId, userId);
      expect(isMember).toBe(true);
    });
  });

  it("should return null/false for non-members", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // 1. Setup Data
      const userId = await ctx.db.insert("users", {
        name: "Non Member",
        email: "nonmember@example.com",
        emailVerificationTime: Date.now(),
      });

      const creatorId = await ctx.db.insert("users", {
        name: "Creator",
        email: "creator@example.com",
        emailVerificationTime: Date.now(),
      });

      const organizationId = await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "America/Los_Angeles",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      const workspaceId = await ctx.db.insert("workspaces", {
        organizationId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      const teamId = await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Private Team",
        slug: "private-team",
        isPrivate: true,
        createdBy: creatorId,
        updatedAt: Date.now(),
      });

      // No teamMembers record inserted for userId

      // 2. Assertions
      const role = await getTeamRole(ctx, teamId, userId);
      expect(role).toBeNull();

      const isAdmin = await isTeamAdmin(ctx, teamId, userId);
      expect(isAdmin).toBe(false);

      const isMember = await isTeamMember(ctx, teamId, userId);
      expect(isMember).toBe(false);
    });
  });
});
