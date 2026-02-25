import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("IP Restrictions Security", () => {
  it("should fail closed (deny access) when IP restrictions are enabled and client IP is null", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {});
    });

    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Secure Org",
        slug: "secure-org",
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

    // Add an allowed IP range just to be sure we have a configuration
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationIpAllowlist", {
        organizationId: orgId,
        ipRange: "192.168.1.0/24",
        createdBy: userId,
        createdAt: Date.now(),
      });
    });

    // Test Null IP (Should be DENIED/FALSE)
    const allowed = await t.run(async (ctx) => {
      return await ctx.runQuery(internal.ipRestrictions.checkProjectIpAllowed, {
        projectId,
        clientIp: null,
      });
    });

    // With fail-closed security, access is denied when IP is unavailable
    expect(allowed).toBe(false);
  });
});
