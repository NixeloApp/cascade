import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Soft Delete Cleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should permanently delete records older than 30 days and cascade delete", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    vi.setSystemTime(now);

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const OLD_DELETED_AT = now - THIRTY_DAYS_MS - 1000; // 30 days + 1 second ago
    const RECENT_DELETED_AT = now - THIRTY_DAYS_MS + 1000; // 30 days - 1 second ago

    // Setup User & Org
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Test User", email: "test@example.com" });
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
          billingEnabled: false,
        },
        createdBy: userId,
        updatedAt: now,
      });
    });
    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: now,
      });
    });

    // 1. Create a STALE project (deleted > 30 days ago)
    const staleProjectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Stale Project",
        key: "STALE",
        workspaceId,
        organizationId: orgId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [],
        isDeleted: true,
        deletedAt: OLD_DELETED_AT,
        deletedBy: userId,
      });
    });

    // 2. Create an Issue in the stale project (to test cascade)
    const issueInStaleProjectId = await t.run(async (ctx) => {
      return await ctx.db.insert("issues", {
        projectId: staleProjectId,
        organizationId: orgId,
        workspaceId,
        key: "STALE-1",
        title: "Issue in stale project",
        type: "task",
        status: "todo",
        priority: "medium",
        reporterId: userId,
        updatedAt: now,
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 0,
        // No need to set isDeleted here, cascadeDelete should delete it because parent is deleted
      });
    });

    // 3. Create a FRESH project (deleted < 30 days ago)
    const freshProjectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Fresh Project",
        key: "FRESH",
        workspaceId,
        organizationId: orgId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [],
        isDeleted: true,
        deletedAt: RECENT_DELETED_AT,
        deletedBy: userId,
      });
    });

    // 4. Create a STALE document
    const staleDocId = await t.run(async (ctx) => {
      return await ctx.db.insert("documents", {
        title: "Stale Doc",
        isPublic: false,
        createdBy: userId,
        updatedAt: now,
        organizationId: orgId,
        workspaceId,
        isDeleted: true,
        deletedAt: OLD_DELETED_AT,
        deletedBy: userId,
      });
    });

    // 5. Create a FRESH document
    const freshDocId = await t.run(async (ctx) => {
      return await ctx.db.insert("documents", {
        title: "Fresh Doc",
        isPublic: false,
        createdBy: userId,
        updatedAt: now,
        organizationId: orgId,
        workspaceId,
        isDeleted: true,
        deletedAt: RECENT_DELETED_AT,
        deletedBy: userId,
      });
    });

    // Run Cleanup
    const result = await t.mutation(internal.softDeleteCleanup.permanentlyDeleteOld);

    expect(result.deleted).toBeGreaterThan(0);

    // Verify
    await t.run(async (ctx) => {
      // Stale project should be gone
      const staleProject = await ctx.db.get(staleProjectId);
      expect(staleProject).toBeNull();

      // Issue in stale project should be gone (Cascade)
      const issue = await ctx.db.get(issueInStaleProjectId);
      expect(issue).toBeNull();

      // Fresh project should exist
      const freshProject = await ctx.db.get(freshProjectId);
      expect(freshProject).not.toBeNull();
      expect(freshProject?.isDeleted).toBe(true);

      // Stale doc should be gone
      const staleDoc = await ctx.db.get(staleDocId);
      expect(staleDoc).toBeNull();

      // Fresh doc should exist
      const freshDoc = await ctx.db.get(freshDocId);
      expect(freshDoc).not.toBeNull();
      expect(freshDoc?.isDeleted).toBe(true);
    });
  });
});
