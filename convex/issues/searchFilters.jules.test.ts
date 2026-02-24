import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
  type TestContext,
} from "../testUtils";

describe("issue search filters", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;
  let otherUserId: Id<"users">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
    otherUserId = await createTestUser(t);
  });

  describe("assignee filters", () => {
    it("should filter by specific assignee", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Assigned to Me",
        assigneeId: ctx.userId,
      });
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Assigned to Other",
        assigneeId: otherUserId,
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        assigneeId: ctx.userId,
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Assigned to Me");
    });

    it("should filter by 'me'", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Assigned to Me",
        assigneeId: ctx.userId,
      });
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Assigned to Other",
        assigneeId: otherUserId,
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        assigneeId: "me",
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Assigned to Me");
    });

    it("should filter by 'unassigned'", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Unassigned Issue",
      });
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Assigned Issue",
        assigneeId: ctx.userId,
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        assigneeId: "unassigned",
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Unassigned Issue");
    });
  });

  describe("reporter filters", () => {
    it("should filter by reporter", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Reported by Me",
      });

      // Create issue reported by other user manually
      await t.run(async (runCtx) => {
        const project = await runCtx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        const title = "Reported by Other";
        const searchContent = title;

        await runCtx.db.insert("issues", {
            projectId,
            organizationId: project.organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `${project.key}-999`,
            title,
            searchContent,
            type: "task",
            status: "todo",
            priority: "medium",
            reporterId: otherUserId,
            updatedAt: Date.now(),
            labels: [],
            linkedDocuments: [],
            attachments: [],
            loggedHours: 0,
            order: 0,
        });
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        reporterId: ctx.userId,
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Reported by Me");
    });
  });

  describe("combined text search and filters", () => {
    it("should filter by assignee with text query", async () => {
       await createTestIssue(t, projectId, ctx.userId, {
        title: "Bug Fix A",
        assigneeId: ctx.userId,
      });
      await createTestIssue(t, projectId, ctx.userId, {
        title: "Bug Fix B",
        assigneeId: otherUserId,
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "Bug",
        projectId,
        assigneeId: ctx.userId,
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Bug Fix A");
    });

    it("should filter by reporter with text query", async () => {
       await createTestIssue(t, projectId, ctx.userId, {
        title: "Feature X",
      });

       await t.run(async (runCtx) => {
         const project = await runCtx.db.get(projectId);
         if (!project) throw new Error("Project not found");

         const title = "Feature Y";
         const searchContent = title;

         await runCtx.db.insert("issues", {
            projectId,
            organizationId: project.organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `${project.key}-998`,
            title,
            searchContent,
            type: "task",
            status: "todo",
            priority: "medium",
            reporterId: otherUserId,
            updatedAt: Date.now(),
            labels: [],
            linkedDocuments: [],
            attachments: [],
            loggedHours: 0,
            order: 0,
         });
      });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "Feature",
        projectId,
        reporterId: ctx.userId,
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("Feature X");
    });
  });
});
