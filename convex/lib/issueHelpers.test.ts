import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser } from "../testUtils";
import { enrichIssues } from "./issueHelpers";

describe("issueHelpers", () => {
  describe("enrichIssues", () => {
    it("should correctly enrich issues with same assignee and reporter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "MultiRole User" });
      const projectId = await createTestProject(t, userId);

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
          reporterId: userId,
          assigneeId: userId,
          labels: [],
          key: "TEST-1",
          order: 0,
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
        });
      });

      const enriched = await t.run(async (ctx) => {
        const issue = await ctx.db.get(issueId);
        if (!issue) throw new Error("Issue not found");
        return await enrichIssues(ctx, [issue]);
      });

      expect(enriched).toHaveLength(1);
      expect(enriched[0].assignee?._id).toBe(userId);
      expect(enriched[0].reporter?._id).toBe(userId);
      expect(enriched[0].assignee?.name).toBe("MultiRole User");
      expect(enriched[0].reporter?.name).toBe("MultiRole User");
    });

    it("should handle mixed assignees and reporters", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const projectId = await createTestProject(t, user1);

      // Issue 1: Assignee=U1, Reporter=U1
      const issue1Id = await t.run(async (ctx) => {
        const p = await ctx.db.get(projectId);
        if (!p) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: p.organizationId,
          workspaceId: p.workspaceId,
          title: "Issue 1",
          key: "TEST-1",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: user1,
          assigneeId: user1,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 0,
        });
      });

      // Issue 2: Assignee=U2, Reporter=U1
      const issue2Id = await t.run(async (ctx) => {
        const p = await ctx.db.get(projectId);
        if (!p) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: p.organizationId,
          workspaceId: p.workspaceId,
          title: "Issue 2",
          key: "TEST-2",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: user1,
          assigneeId: user2,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 0,
        });
      });

      const enriched = await t.run(async (ctx) => {
        const i1 = await ctx.db.get(issue1Id);
        const i2 = await ctx.db.get(issue2Id);
        if (!i1 || !i2) throw new Error("Issues not found");
        return await enrichIssues(ctx, [i1, i2]);
      });

      expect(enriched).toHaveLength(2);

      const e1 = enriched.find(i => i._id === issue1Id);
      expect(e1?.assignee?._id).toBe(user1);
      expect(e1?.reporter?._id).toBe(user1);

      const e2 = enriched.find(i => i._id === issue2Id);
      expect(e2?.assignee?._id).toBe(user2);
      expect(e2?.reporter?._id).toBe(user1);
    });
  });
});
