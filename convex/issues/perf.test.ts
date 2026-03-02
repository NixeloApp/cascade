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
  type TestContext,
} from "../testUtils";

describe("issue performance queries", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
  });

  describe("listSelectableIssues", () => {
    it("should filter out deleted issues using the new index", async () => {
      // Create active issues
      await createTestIssue(t, projectId, ctx.userId, { title: "Active 1", type: "task" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Active 2", type: "bug" });

      // Create deleted issues
      const deletedId1 = await createTestIssue(t, projectId, ctx.userId, {
        title: "Deleted 1",
        type: "task",
      });
      const deletedId2 = await createTestIssue(t, projectId, ctx.userId, {
        title: "Deleted 2",
        type: "bug",
      });

      await t.run(async (runCtx) => {
        await runCtx.db.patch(deletedId1, { isDeleted: true });
        await runCtx.db.patch(deletedId2, { isDeleted: true });
      });

      const result = await ctx.asUser.query(api.issues.queries.listSelectableIssues, { projectId });

      // Should only return active issues
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.title).sort()).toEqual(["Active 1", "Active 2"]);
    });
  });

  describe("fetchRoadmapIssuesByType (via listRoadmapIssues)", () => {
    it("should filter out deleted issues", async () => {
      // Create active issues
      await createTestIssue(t, projectId, ctx.userId, { title: "Roadmap 1", type: "story" });

      // Create deleted issue
      const deletedId = await createTestIssue(t, projectId, ctx.userId, {
        title: "Deleted Roadmap",
        type: "story",
      });
      await t.run(async (runCtx) => {
        await runCtx.db.patch(deletedId, { isDeleted: true });
      });

      const result = await ctx.asUser.query(api.issues.queries.listRoadmapIssues, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Roadmap 1");
    });
  });

  describe("listEpics", () => {
    it("should filter out deleted epics", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Epic 1", type: "epic" });
      const deletedEpic = await createTestIssue(t, projectId, ctx.userId, {
        title: "Deleted Epic",
        type: "epic",
      });

      await t.run(async (runCtx) => {
        await runCtx.db.patch(deletedEpic, { isDeleted: true });
      });

      const result = await ctx.asUser.query(api.issues.queries.listEpics, { projectId });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Epic 1");
    });
  });
});
