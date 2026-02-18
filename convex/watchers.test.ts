import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("Issue Watchers", () => {
  describe("watch", () => {
    it("should add user as watcher to issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      const watcherId = await asUser.mutation(api.watchers.watch, { issueId });
      expect(watcherId).toBeDefined();

      const isWatching = await asUser.query(api.watchers.isWatching, { issueId });
      expect(isWatching).toBe(true);
    });

    it("should return existing watcher if already watching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      const watcherId1 = await asUser.mutation(api.watchers.watch, { issueId });
      const watcherId2 = await asUser.mutation(api.watchers.watch, { issueId });

      expect(watcherId2).toBe(watcherId1);
    });

    it("should log activity when watching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await asUser.mutation(api.watchers.watch, { issueId });

      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      const watchActivity = activities.find((a) => a.action === "started_watching");
      expect(watchActivity).toBeDefined();
      expect(watchActivity?.userId).toBe(userId);
    });
  });

  describe("unwatch", () => {
    it("should remove user as watcher from issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await asUser.mutation(api.watchers.watch, { issueId });
      await asUser.mutation(api.watchers.unwatch, { issueId });

      const isWatching = await asUser.query(api.watchers.isWatching, { issueId });
      expect(isWatching).toBe(false);
    });

    it("should be idempotent (no error if not watching)", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      // Should not throw
      await asUser.mutation(api.watchers.unwatch, { issueId });

      const isWatching = await asUser.query(api.watchers.isWatching, { issueId });
      expect(isWatching).toBe(false);
    });

    it("should log activity when unwatching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await asUser.mutation(api.watchers.watch, { issueId });
      await asUser.mutation(api.watchers.unwatch, { issueId });

      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      const unwatchActivity = activities.find((a) => a.action === "stopped_watching");
      expect(unwatchActivity).toBeDefined();
    });
  });

  describe("getWatchers", () => {
    it("should return all watchers with user details", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, user1Id, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, user1Id, {
        title: "Test Issue",
      });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      await asUser1.mutation(api.watchers.watch, { issueId });
      await asUser2.mutation(api.watchers.watch, { issueId });

      // getWatchers is a public query (no auth required)
      const watchers = await t.query(api.watchers.getWatchers, { issueId });

      expect(watchers).toHaveLength(2);
      expect(watchers.map((w) => w.userName).sort()).toEqual(["User 1", "User 2"]);
    });

    it("should return empty array for issue with no watchers", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      const watchers = await t.query(api.watchers.getWatchers, { issueId });
      expect(watchers).toEqual([]);
    });
  });

  describe("isWatching", () => {
    it("should return true when user is watching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await asUser.mutation(api.watchers.watch, { issueId });

      const isWatching = await asUser.query(api.watchers.isWatching, { issueId });
      expect(isWatching).toBe(true);
    });

    it("should return false when user is not watching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      const isWatching = await asUser.query(api.watchers.isWatching, { issueId });
      expect(isWatching).toBe(false);
    });
  });

  describe("getWatchedIssues", () => {
    it("should return all issues user is watching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issue1 = await createTestIssue(t, projectId, userId, { title: "Issue 1" });
      const issue2 = await createTestIssue(t, projectId, userId, { title: "Issue 2" });
      const issue3 = await createTestIssue(t, projectId, userId, { title: "Issue 3" });

      await asUser.mutation(api.watchers.watch, { issueId: issue1 });
      await asUser.mutation(api.watchers.watch, { issueId: issue3 });
      // Not watching issue2

      const watchedIssues = await asUser.query(api.watchers.getWatchedIssues, {});

      expect(watchedIssues).toHaveLength(2);
      expect(watchedIssues.map((i) => i.title).sort()).toEqual(["Issue 1", "Issue 3"]);
    });

    it("should return empty array when not watching any issues", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const watchedIssues = await asUser.query(api.watchers.getWatchedIssues, {});
      expect(watchedIssues).toEqual([]);
    });

    it("should include issue metadata", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Important Bug",
        type: "bug",
        priority: "high",
      });

      await asUser.mutation(api.watchers.watch, { issueId });

      const watchedIssues = await asUser.query(api.watchers.getWatchedIssues, {});

      expect(watchedIssues).toHaveLength(1);
      expect(watchedIssues[0].title).toBe("Important Bug");
      expect(watchedIssues[0].type).toBe("bug");
      expect(watchedIssues[0].priority).toBe("high");
      expect(watchedIssues[0].projectName).toBe("Test Project");
      expect(watchedIssues[0].watchedAt).toBeDefined();
    });

    it("should only return current user's watched issues", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, user1Id, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issue1 = await createTestIssue(t, projectId, user1Id, { title: "Issue 1" });
      const issue2 = await createTestIssue(t, projectId, user1Id, { title: "Issue 2" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      await asUser1.mutation(api.watchers.watch, { issueId: issue1 });
      await asUser2.mutation(api.watchers.watch, { issueId: issue2 });

      const user1Watched = await asUser1.query(api.watchers.getWatchedIssues, {});
      const user2Watched = await asUser2.query(api.watchers.getWatchedIssues, {});

      expect(user1Watched).toHaveLength(1);
      expect(user1Watched[0].title).toBe("Issue 1");

      expect(user2Watched).toHaveLength(1);
      expect(user2Watched[0].title).toBe("Issue 2");
    });
  });

  describe("authentication", () => {
    it("should require auth for watch", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await expect(t.mutation(api.watchers.watch, { issueId })).rejects.toThrow(/authenticated/i);
    });

    it("should require auth for unwatch", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await expect(t.mutation(api.watchers.unwatch, { issueId })).rejects.toThrow(/authenticated/i);
    });

    it("should require auth for isWatching", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "WATCH",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await expect(t.query(api.watchers.isWatching, { issueId })).rejects.toThrow(/authenticated/i);
    });

    it("should require auth for getWatchedIssues", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.watchers.getWatchedIssues, {})).rejects.toThrow(/authenticated/i);
    });
  });
});
