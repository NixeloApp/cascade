import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { BOUNDED_DELETE_BATCH } from "./boundedQueries";
import { cascadeDelete, cascadeRestore, cascadeSoftDelete } from "./relationships";

describe("Relationship Cascade Operations - Overflow", () => {
  async function setupProjectWithIssues(issueCount: number) {
    const t = convexTest(schema, modules);

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

    await t.run(async (ctx) => {
      for (let i = 0; i < issueCount; i++) {
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

    return { t, userId, projectId };
  }

  it("should cascade hard delete all children even when count > BOUNDED_DELETE_BATCH", async () => {
    const numIssues = BOUNDED_DELETE_BATCH + 1;
    const { t, projectId } = await setupProjectWithIssues(numIssues);

    const countBefore = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect()
      ).length;
    });
    expect(countBefore).toBe(numIssues);

    await t.run(async (ctx) => {
      await cascadeDelete(ctx, "projects", projectId);
      await ctx.db.delete(projectId);
    });

    const projectAfter = await t.run(async (ctx) => ctx.db.get(projectId));
    const countAfter = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect()
      ).length;
    });

    expect(projectAfter).toBeNull();
    expect(countAfter).toBe(0);
  });

  it("should cascade soft delete all children even when count > BOUNDED_DELETE_BATCH", async () => {
    const numIssues = BOUNDED_DELETE_BATCH + 1;
    const { t, userId, projectId } = await setupProjectWithIssues(numIssues);
    const now = Date.now();

    await t.run(async (ctx) => {
      await cascadeSoftDelete(ctx, "projects", projectId, userId, now);
      await ctx.db.patch(projectId, { isDeleted: true, deletedAt: now, deletedBy: userId });
    });

    const deletedIssueCount = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .filter((q) => q.eq(q.field("isDeleted"), true))
          .collect()
      ).length;
    });

    expect(deletedIssueCount).toBe(numIssues);
  });

  it("should cascade restore all children even when count > BOUNDED_DELETE_BATCH", async () => {
    const numIssues = BOUNDED_DELETE_BATCH + 1;
    const { t, userId, projectId } = await setupProjectWithIssues(numIssues);
    const now = Date.now();

    await t.run(async (ctx) => {
      await cascadeSoftDelete(ctx, "projects", projectId, userId, now);
      await ctx.db.patch(projectId, { isDeleted: true, deletedAt: now, deletedBy: userId });
    });

    await t.run(async (ctx) => {
      await cascadeRestore(ctx, "projects", projectId);
      await ctx.db.patch(projectId, {
        isDeleted: undefined,
        deletedAt: undefined,
        deletedBy: undefined,
      });
    });

    const restoredIssueCount = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect()
      ).length;
    });

    expect(restoredIssueCount).toBe(numIssues);
  });
});
