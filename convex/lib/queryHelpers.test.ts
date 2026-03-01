import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "../testUtils";
import { fetchPaginatedQuery } from "./queryHelpers";

describe("queryHelpers", () => {
  describe("fetchPaginatedQuery", () => {
    it("should exclude soft-deleted items", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Create 3 active issues and 2 deleted issues
      const active1 = await createTestIssue(t, projectId, userId, { title: "Active 1" });
      const deleted1 = await createTestIssue(t, projectId, userId, { title: "Deleted 1" });
      const active2 = await createTestIssue(t, projectId, userId, { title: "Active 2" });
      const deleted2 = await createTestIssue(t, projectId, userId, { title: "Deleted 2" });
      const active3 = await createTestIssue(t, projectId, userId, { title: "Active 3" });

      // Soft delete the "deleted" issues
      await t.run(async (ctx) => {
        await ctx.db.patch(deleted1, { isDeleted: true });
        await ctx.db.patch(deleted2, { isDeleted: true });
      });

      // Run fetchPaginatedQuery
      const result = await t.run(async (ctx) => {
        return await fetchPaginatedQuery(ctx, {
          paginationOpts: { numItems: 10, cursor: null },
          query: (db) =>
            db.query("issues").withIndex("by_project", (q) => q.eq("projectId", projectId)),
        });
      });

      // Verify results
      expect(result.page).toHaveLength(3);
      const ids = result.page.map((doc) => doc._id);
      expect(ids).toContain(active1);
      expect(ids).toContain(active2);
      expect(ids).toContain(active3);
      expect(ids).not.toContain(deleted1);
      expect(ids).not.toContain(deleted2);
    });

    it("should paginate correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Create 5 active issues
      const issues = [];
      for (let i = 0; i < 5; i++) {
        issues.push(await createTestIssue(t, projectId, userId, { title: `Issue ${i}` }));
      }

      // Fetch first page (2 items)
      const page1 = await t.run(async (ctx) => {
        return await fetchPaginatedQuery(ctx, {
          paginationOpts: { numItems: 2, cursor: null },
          query: (db) =>
            db.query("issues").withIndex("by_project", (q) => q.eq("projectId", projectId)),
        });
      });

      expect(page1.page).toHaveLength(2);
      expect(page1.continueCursor).toBeTruthy();

      // Fetch second page (2 items)
      const page2 = await t.run(async (ctx) => {
        return await fetchPaginatedQuery(ctx, {
          paginationOpts: { numItems: 2, cursor: page1.continueCursor },
          query: (db) =>
            db.query("issues").withIndex("by_project", (q) => q.eq("projectId", projectId)),
        });
      });

      expect(page2.page).toHaveLength(2);
      expect(page2.continueCursor).toBeTruthy();
      // Ensure no overlap
      const ids1 = page1.page.map((i) => i._id);
      const ids2 = page2.page.map((i) => i._id);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);

      // Fetch last page (1 item)
      const page3 = await t.run(async (ctx) => {
        return await fetchPaginatedQuery(ctx, {
          paginationOpts: { numItems: 2, cursor: page2.continueCursor },
          query: (db) =>
            db.query("issues").withIndex("by_project", (q) => q.eq("projectId", projectId)),
        });
      });

      expect(page3.page).toHaveLength(1);
      expect(page3.isDone).toBe(true);
    });
  });
});
