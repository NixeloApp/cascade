import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { cascadeDelete, cascadeRestore, cascadeSoftDelete } from "./relationships";

describe("Relationship Cascade Operations", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    t = convexTest(schema, modules);
  });

  it("should cascade delete (hard delete) - Project -> Issue -> Comment", async () => {
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

    const issueId = await t.run(async (ctx) => {
      return ctx.db.insert("issues", {
        title: "Test Issue",
        projectId,
        organizationId: orgId,
        workspaceId,
        // createdBy: userId, // REMOVED: Not in schema
        updatedAt: Date.now(),
        status: "todo",
        type: "task",
        priority: "medium",
        key: "TP-1",
        searchContent: "Test Issue",
        embedding: [],
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 1,
        reporterId: userId,
      });
    });

    const commentId = await t.run(async (ctx) => {
      return ctx.db.insert("issueComments", {
        issueId,
        authorId: userId,
        content: "Test Comment",
        mentions: [],
        updatedAt: Date.now(),
      });
    });

    // 2. Execute cascade delete
    await t.run(async (ctx) => {
      await cascadeDelete(ctx, "projects", projectId);
      // Manually delete the parent as cascadeDelete only handles children
      await ctx.db.delete(projectId);
    });

    // 3. Verify
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));
    const comment = await t.run(async (ctx) => ctx.db.get(commentId));

    expect(project).toBeNull();
    expect(issue).toBeNull();
    expect(comment).toBeNull();
  });

  it("should cascade soft delete - Project -> Issue", async () => {
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

    const issueId = await t.run(async (ctx) => {
      return ctx.db.insert("issues", {
        title: "Test Issue",
        projectId,
        organizationId: orgId,
        workspaceId,
        // createdBy: userId, // REMOVED
        updatedAt: Date.now(),
        status: "todo",
        type: "task",
        priority: "medium",
        key: "TP-1",
        searchContent: "Test Issue",
        embedding: [],
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 1,
        reporterId: userId,
      });
    });

    const now = Date.now();

    // 2. Execute cascade soft delete
    await t.run(async (ctx) => {
      await cascadeSoftDelete(ctx, "projects", projectId, userId, now);
      // Manually soft delete the parent
      await ctx.db.patch(projectId, { isDeleted: true, deletedAt: now, deletedBy: userId });
    });

    // 3. Verify
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));

    expect(project?.isDeleted).toBe(true);
    expect(project?.deletedAt).toBe(now);
    expect(project?.deletedBy).toBe(userId);

    expect(issue?.isDeleted).toBe(true);
    expect(issue?.deletedAt).toBe(now);
    expect(issue?.deletedBy).toBe(userId);
  });

  it("should cascade restore - Project -> Issue", async () => {
    // 1. Setup Data
    const now = Date.now();
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
        updatedAt: now,
      });
    });

    const workspaceId = await t.run(async (ctx) => {
      return ctx.db.insert("workspaces", {
        name: "Test Workspace",
        slug: "test-workspace",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: now,
      });
    });

    const projectId = await t.run(async (ctx) => {
      return ctx.db.insert("projects", {
        name: "Test Project",
        key: "TP",
        organizationId: orgId,
        workspaceId,
        createdBy: userId,
        updatedAt: now,
        isPublic: false,
        ownerId: userId,
        boardType: "scrum",
        workflowStates: [],
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
      });
    });

    const issueId = await t.run(async (ctx) => {
      return ctx.db.insert("issues", {
        title: "Test Issue",
        projectId,
        organizationId: orgId,
        workspaceId,
        // createdBy: userId, // REMOVED
        updatedAt: now,
        status: "todo",
        type: "task",
        priority: "medium",
        key: "TP-1",
        searchContent: "Test Issue",
        embedding: [],
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 1,
        reporterId: userId,
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
      });
    });

    // 2. Execute cascade restore
    await t.run(async (ctx) => {
      await cascadeRestore(ctx, "projects", projectId);
      // Manually restore parent
      await ctx.db.patch(projectId, {
        isDeleted: undefined,
        deletedAt: undefined,
        deletedBy: undefined,
      });
    });

    // 3. Verify
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));

    expect(project?.isDeleted).toBeUndefined();
    expect(project?.deletedAt).toBeUndefined();
    expect(project?.deletedBy).toBeUndefined();

    expect(issue?.isDeleted).toBeUndefined();
    expect(issue?.deletedAt).toBeUndefined();
    expect(issue?.deletedBy).toBeUndefined();
  });

  it("should handle 'set_null' behavior - Project -> Documents", async () => {
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

    const documentId = await t.run(async (ctx) => {
      return ctx.db.insert("documents", {
        title: "Test Doc",
        projectId, // Should be set to null/undefined after delete
        organizationId: orgId,
        createdBy: userId,
        updatedAt: Date.now(),
        isPublic: false,
      });
    });

    // 2. Execute cascade delete
    await t.run(async (ctx) => {
      await cascadeDelete(ctx, "projects", projectId);
      // Manually delete parent
      await ctx.db.delete(projectId);
    });

    // 3. Verify
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const doc = await t.run(async (ctx) => ctx.db.get(documentId));

    expect(project).toBeNull();
    expect(doc).not.toBeNull();
    expect(doc?.projectId).toBeUndefined();
  });
});
