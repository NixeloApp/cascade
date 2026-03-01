import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { BOUNDED_DELETE_BATCH } from "./boundedQueries";
import { cascadeDelete } from "./relationships";

describe("Relationship Cascade Operations - Overflow", () => {
  it("should fail to delete all children if count > BOUNDED_DELETE_BATCH", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Data
    const userId = await t.run(async (ctx) => {
      return ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    const orgId = await t.run(async (ctx) => {
      return ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: true,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return ctx.db.insert("workspaces", {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return ctx.db.insert("projects", {
        name: "Test Project",
        key: "TP",
        organizationId: orgId,
        workspaceId,
        createdBy: userId,
        updatedAt: Date.now(),
        isPublic: false,
        ownerId: userId,
        boardType: "scrum",
        workflowStates: [],
      });
    });

    // Create BOUNDED_DELETE_BATCH + 1 issues
    const numIssues = BOUNDED_DELETE_BATCH + 1;

    // Create in batches of 50 to avoid hitting limits during setup if any
    await t.run(async (ctx) => {
      for (let i = 0; i < numIssues; i++) {
        await ctx.db.insert("issues", {
          title: `Issue ${i}`,
          projectId,
          organizationId: orgId,
          workspaceId,
          updatedAt: Date.now(),
          status: "todo",
          type: "task",
          priority: "medium",
          key: `TP-${i + 1}`,
          searchContent: `Issue ${i}`,
          embedding: [],
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
          reporterId: userId,
        });
      }
    });

    // Verify count before delete
    const countBefore = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect()
      ).length;
    });
    expect(countBefore).toBe(numIssues);

    // 2. Execute cascade delete
    // Should now throw an error because of overflow
    await expect(
      t.run(async (ctx) => {
        await cascadeDelete(ctx, "projects", projectId);
        // Manually delete the parent
        await ctx.db.delete(projectId);
      }),
    ).rejects.toThrow(/Cannot cascade delete: projects .* has too many issues records/);

    // 3. Verify no deletion happened (transaction aborted)
    const countAfter = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect()
      ).length;
    });

    // Expect all issues to remain because the transaction threw
    expect(countAfter).toBe(numIssues);
  });
});
