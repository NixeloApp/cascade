import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Users Comments Performance Optimization", () => {
  it("should correctly count comments ignoring deleted ones", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const projectId = await createTestProject(t, userId);

    // Create a dummy issue
    const issueId = await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      return await ctx.db.insert("issues", {
        projectId,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId,
        teamId: project.teamId as any, // Cast as teamId is definitely there
        key: "TEST-1",
        title: "Test Issue",
        status: "todo",
        priority: "medium",
        type: "task",
        reporterId: userId,
        assigneeId: userId,
        updatedAt: Date.now(),
        labels: [],
        order: 0,
        linkedDocuments: [],
        attachments: [],
        embedding: [],
      });
    });

    // Create 5 active comments
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("issueComments", {
          issueId,
          authorId: userId,
          content: `Active Comment ${i}`,
          mentions: [],
          updatedAt: Date.now(),
        });
      });
    }

    // Create 3 deleted comments
    for (let i = 0; i < 3; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("issueComments", {
          issueId,
          authorId: userId,
          content: `Deleted Comment ${i}`,
          mentions: [],
          updatedAt: Date.now(),
          isDeleted: true,
          deletedAt: Date.now(),
          deletedBy: userId,
        });
      });
    }

    // Create 2 comments by another user (should be ignored)
    const otherUserId = await createTestUser(t);
    for (let i = 0; i < 2; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("issueComments", {
          issueId,
          authorId: otherUserId,
          content: `Other User Comment ${i}`,
          mentions: [],
          updatedAt: Date.now(),
        });
      });
    }

    // Check stats
    const stats = await asUser.query(api.users.getUserStats, { userId });

    // Expected: 5 active comments.
    // Deleted ones should be ignored.
    // Other user's comments should be ignored.

    expect(stats.comments).toBe(5);
  });
});
