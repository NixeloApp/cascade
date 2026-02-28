import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "./testUtils";

const TIME_OFFSET_MS = 10000;

describe("Dashboard - Missing Coverage", () => {
  describe("getMyRecentActivity", () => {
    it("should handle activities with null/undefined projects gracefully", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue",
      });

      await asUser.mutation(api.issues.mutations.update, {
        issueId,
        title: "Updated Title",
      });

      // Instead of soft deleting the project (which might still be fetched by get),
      // we can literally delete the project document entirely to force `projectMap.get` to return undefined.
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const result = await asUser.query(api.dashboard.getMyRecentActivity, {});

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].projectName).toBe("Unknown");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getFocusTask", () => {
    it("should sort issues by updatedAt when priorities are equal", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const issueId1 = await createTestIssue(t, projectId, userId, {
        title: "Older High Priority Issue",
        priority: "high",
        assigneeId: userId,
      });

      // Update the issue to set its updatedAt to an older timestamp
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId1, { updatedAt: Date.now() - TIME_OFFSET_MS });
      });

      const issueId2 = await createTestIssue(t, projectId, userId, {
        title: "Newer High Priority Issue",
        priority: "high",
        assigneeId: userId,
      });

      // Update the issue to set its updatedAt to a newer timestamp
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId2, { updatedAt: Date.now() });
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      // Should return the newer issue
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Newer High Priority Issue");

      await t.finishInProgressScheduledFunctions();
    });

    it("should return Unknown/??? for project details when project cannot be fetched", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Test Issue Missing Project",
        priority: "highest",
        assigneeId: userId,
      });

      // Hard delete the project so ctx.db.get(focusTask.projectId) returns null
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Issue Missing Project");
      expect(result?.projectName).toBe("Unknown");
      expect(result?.projectKey).toBe("???");

      await t.finishInProgressScheduledFunctions();
    });
  });
});
