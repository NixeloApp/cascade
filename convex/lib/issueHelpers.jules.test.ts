import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser } from "../testUtils";
import { enrichComments, enrichIssues } from "./issueHelpers";

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

  describe("enrichIssues optimization verification", () => {
    it("should correctly enrich assignee, reporter, epic, and labels in a single pass", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "Assignee User" });
      const user2 = await createTestUser(t, { name: "Reporter User" });
      const projectId = await createTestProject(t, user1);

      // Create a label
      const labelId = await t.run(async (ctx) => {
        return await ctx.db.insert("labels", {
          projectId,
          name: "bug",
          color: "#ff0000",
          createdBy: user1,
        });
      });

      // Create an epic
      const epicId = await t.run(async (ctx) => {
        const p = await ctx.db.get(projectId);
        if (!p) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: p.organizationId,
          workspaceId: p.workspaceId,
          title: "Epic Issue",
          type: "epic",
          status: "todo",
          priority: "medium",
          reporterId: user2,
          assigneeId: user1,
          labels: [],
          key: "EPIC-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      // Create a task linked to the epic and using the label
      const issueId = await t.run(async (ctx) => {
        const p = await ctx.db.get(projectId);
        if (!p) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: p.organizationId,
          workspaceId: p.workspaceId,
          title: "Task Issue",
          description: "Task Description",
          type: "task",
          priority: "high",
          status: "inprogress",
          reporterId: user2,
          assigneeId: user1,
          labels: ["bug"],
          key: "TASK-1",
          order: 1,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
          epicId,
        });
      });

      const enriched = await t.run(async (ctx) => {
        const issue = await ctx.db.get(issueId);
        if (!issue) throw new Error("Issue not found");
        return await enrichIssues(ctx, [issue]);
      });

      expect(enriched).toHaveLength(1);
      const issue = enriched[0];

      // Check Assignee
      expect(issue.assignee?._id).toBe(user1);
      expect(issue.assignee?.name).toBe("Assignee User");

      // Check Reporter
      expect(issue.reporter?._id).toBe(user2);
      expect(issue.reporter?.name).toBe("Reporter User");

      // Check Epic
      expect(issue.epic?._id).toBe(epicId);
      expect(issue.epic?.title).toBe("Epic Issue");

      // Check Labels
      expect(issue.labels).toHaveLength(1);
      expect(issue.labels[0].name).toBe("bug");
      expect(issue.labels[0].color).toBe("#ff0000");
    });
  });
});
