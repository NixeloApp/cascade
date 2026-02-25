import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser } from "../testUtils";
import { enrichComments } from "./issueHelpers";

describe("issueHelpers", () => {
  describe("enrichComments", () => {
    it("should correctly enrich comments with author and reactions", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, { name: "Author" });
      const reactorId = await createTestUser(t, { name: "Reactor" });
      const projectId = await createTestProject(t, authorId);

      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          title: "Test Issue",
          description: "Description",
          type: "task",
          priority: "medium",
          status: "todo",
          reporterId: authorId,
          assigneeId: authorId,
          labels: [],
          key: "TEST-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("issueComments", {
          issueId,
          authorId,
          content: "Test Comment",
          mentions: [],
          updatedAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("issueCommentReactions", {
          commentId,
          userId: reactorId,
          emoji: "👍",
          createdAt: Date.now(),
        });
      });

      const enriched = await t.run(async (ctx) => {
        const comment = await ctx.db.get(commentId);
        if (!comment) throw new Error("Comment not found");
        return await enrichComments(ctx, [comment]);
      });

      expect(enriched).toHaveLength(1);
      expect(enriched[0].author?._id).toBe(authorId);
      expect(enriched[0].author?.name).toBe("Author");
      expect(enriched[0].reactions).toHaveLength(1);
      expect(enriched[0].reactions[0].emoji).toBe("👍");
      expect(enriched[0].reactions[0].userIds).toContain(reactorId);
    });

    it("should handle comments with no reactions", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, { name: "Author" });
      const projectId = await createTestProject(t, authorId);

      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          title: "Test Issue",
          description: "Description",
          type: "task",
          priority: "medium",
          status: "todo",
          reporterId: authorId,
          assigneeId: authorId,
          labels: [],
          key: "TEST-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("issueComments", {
          issueId,
          authorId,
          content: "Test Comment No Reactions",
          mentions: [],
          updatedAt: Date.now(),
        });
      });

      const enriched = await t.run(async (ctx) => {
        const comment = await ctx.db.get(commentId);
        if (!comment) throw new Error("Comment not found");
        return await enrichComments(ctx, [comment]);
      });

      expect(enriched).toHaveLength(1);
      expect(enriched[0].reactions).toHaveLength(0);
    });

    it("should handle missing author gracefully", async () => {
      const t = convexTest(schema, modules);
      const projectId = await createTestProject(t, await createTestUser(t));
      const userId = await createTestUser(t);

      await t.run(async (ctx) => {
        await ctx.db.delete(userId);
      });

      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          title: "Test Issue",
          description: "Description",
          type: "task",
          priority: "medium",
          status: "todo",
          reporterId: userId, // Doesn't matter
          assigneeId: userId,
          labels: [],
          key: "TEST-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("issueComments", {
          issueId,
          authorId: userId, // Deleted user
          content: "Test Comment Missing Author",
          mentions: [],
          updatedAt: Date.now(),
        });
      });

      const enriched = await t.run(async (ctx) => {
        const comment = await ctx.db.get(commentId);
        if (!comment) throw new Error("Comment not found");
        return await enrichComments(ctx, [comment]);
      });

      expect(enriched).toHaveLength(1);
      expect(enriched[0].author).toBeNull();
    });

    it("should group multiple reactions correctly", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, { name: "Author" });
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const projectId = await createTestProject(t, authorId);

      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          title: "Test Issue",
          description: "Description",
          type: "task",
          priority: "medium",
          status: "todo",
          reporterId: authorId,
          assigneeId: authorId,
          labels: [],
          key: "TEST-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("issueComments", {
          issueId,
          authorId,
          content: "Test Comment Multiple Reactions",
          mentions: [],
          updatedAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        // User 1 reacts with 👍
        await ctx.db.insert("issueCommentReactions", {
          commentId,
          userId: user1,
          emoji: "👍",
          createdAt: Date.now(),
        });
        // User 2 reacts with 👍
        await ctx.db.insert("issueCommentReactions", {
          commentId,
          userId: user2,
          emoji: "👍",
          createdAt: Date.now(),
        });
        // User 1 reacts with 🚀
        await ctx.db.insert("issueCommentReactions", {
          commentId,
          userId: user1,
          emoji: "🚀",
          createdAt: Date.now(),
        });
      });

      const enriched = await t.run(async (ctx) => {
        const comment = await ctx.db.get(commentId);
        if (!comment) throw new Error("Comment not found");
        return await enrichComments(ctx, [comment]);
      });

      expect(enriched).toHaveLength(1);
      const reactions = enriched[0].reactions;
      expect(reactions).toHaveLength(2);

      const thumbsUp = reactions.find((r) => r.emoji === "👍");
      expect(thumbsUp).toBeDefined();
      expect(thumbsUp?.userIds).toHaveLength(2);
      expect(thumbsUp?.userIds).toContain(user1);
      expect(thumbsUp?.userIds).toContain(user2);

      const rocket = reactions.find((r) => r.emoji === "🚀");
      expect(rocket).toBeDefined();
      expect(rocket?.userIds).toHaveLength(1);
      expect(rocket?.userIds).toContain(user1);
    });
  });
});
