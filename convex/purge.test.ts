import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { TABLES } from "./purge";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Purge Data", () => {
  it("should fail if not confirmed", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(internal.purge.purgeData, { confirm: false })).rejects.toThrow(
      "Confirmation required",
    );
  });

  it("should delete all data from known tables", async () => {
    const t = convexTest(schema, modules);

    // Insert some data
    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
      const orgId = await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test",
        timezone: "UTC",
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
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("projects", {
        name: "Test Project",
        key: "TEST",
        createdBy: userId,
        organizationId: orgId,
        updatedAt: Date.now(),
        // biome-ignore lint/style/noNonNullAssertion: testing convenience
        ownerId: userId!,
        isPublic: false,
        boardType: "kanban",
        workflowStates: [],
        workspaceId: workspaceId,
      });
      await ctx.db.insert("auditLogs", {
        action: "test",
        targetId: "1",
        targetType: "test",
        timestamp: Date.now(),
      });
    });

    // Verify data exists
    await t.run(async (ctx) => {
      expect((await ctx.db.query("users").collect()).length).toBe(1);
      expect((await ctx.db.query("projects").collect()).length).toBe(1);
      expect((await ctx.db.query("auditLogs").collect()).length).toBe(1);
    });

    // Purge
    await t.mutation(internal.purge.purgeData, { confirm: true });

    // Verify data is gone
    await t.run(async (ctx) => {
      expect((await ctx.db.query("users").collect()).length).toBe(0);
      expect((await ctx.db.query("projects").collect()).length).toBe(0);
      expect((await ctx.db.query("auditLogs").collect()).length).toBe(0);
    });
  });

  it("should cover all schema tables", () => {
    // @ts-expect-error - convenient access to private property
    const schemaTables = Object.keys(schema.tables);
    // @ts-expect-error - convenient access
    const missingTables = schemaTables.filter((table) => !TABLES.includes(table));

    if (missingTables.length > 0) {
      console.error("Missing tables in purge list:", missingTables);
    }

    expect(missingTables).toEqual([]);
  });
});
