import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("IP Restrictions", () => {
  it("should allow access when IP restrictions are disabled", async () => {
    const t = convexTest(schema, modules);

    // Setup
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: true,
        },
        ipRestrictionsEnabled: false, // Disabled
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        organizationId: orgId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Test Project",
        key: "TEST",
        organizationId: orgId,
        workspaceId: workspaceId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
        isPublic: false,
      });
    });

    // Test
    const allowed = await t.run(async (ctx) => {
      return await ctx.runQuery(internal.ipRestrictions.checkProjectIpAllowed, {
        projectId,
        clientIp: "1.2.3.4",
      });
    });

    expect(allowed).toBe(true);
  });

  it("should allow access when IP is in allowlist", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {});
    });

    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: true,
        },
        ipRestrictionsEnabled: true, // Enabled
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        organizationId: orgId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationIpAllowlist", {
        organizationId: orgId,
        ipRange: "192.168.1.0/24",
        createdBy: userId,
        createdAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Test Project",
        key: "TEST",
        organizationId: orgId,
        workspaceId: workspaceId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
        isPublic: false,
      });
    });

    // Test Allowed IP
    const allowed = await t.run(async (ctx) => {
      return await ctx.runQuery(internal.ipRestrictions.checkProjectIpAllowed, {
        projectId,
        clientIp: "192.168.1.50",
      });
    });

    expect(allowed).toBe(true);
  });

  it("should deny access when IP is NOT in allowlist", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {});
    });

    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: true,
        },
        ipRestrictionsEnabled: true, // Enabled
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        organizationId: orgId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationIpAllowlist", {
        organizationId: orgId,
        ipRange: "192.168.1.0/24",
        createdBy: userId,
        createdAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Test Project",
        key: "TEST",
        organizationId: orgId,
        workspaceId: workspaceId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
        isPublic: false,
      });
    });

    // Test Denied IP
    const allowed = await t.run(async (ctx) => {
      return await ctx.runQuery(internal.ipRestrictions.checkProjectIpAllowed, {
        projectId,
        clientIp: "10.0.0.1",
      });
    });

    expect(allowed).toBe(false);
  });

  it("should deny access when clientIp is null (cannot determine IP)", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {});
    });

    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: true,
        },
        ipRestrictionsEnabled: true, // Enabled
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        organizationId: orgId,
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Test Project",
        key: "TEST",
        organizationId: orgId,
        workspaceId: workspaceId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
        isPublic: false,
      });
    });

    // Test Null IP
    const allowed = await t.run(async (ctx) => {
      return await ctx.runQuery(internal.ipRestrictions.checkProjectIpAllowed, {
        projectId,
        clientIp: null,
      });
    });

    expect(allowed).toBe(false);
  });
});
