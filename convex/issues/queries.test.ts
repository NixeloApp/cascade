import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
  type TestContext,
} from "../testUtils";

describe("issue queries", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
  });

  describe("get", () => {
    it("should return issue details", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId, {
        title: "Test Issue",
        description: "Description",
      });

      const result = await ctx.asUser.query(api.issues.queries.getIssue, { id: issueId });

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Issue");
      expect(result?.project).toBeDefined();
    });

    it("should return null for non-existent issue", async () => {
      // Create a fake ID that looks valid
      const issueId = await createTestIssue(t, projectId, ctx.userId);
      // Delete it
      await t.run(async (runCtx) => {
        await runCtx.db.delete(issueId);
      });

      const result = await ctx.asUser.query(api.issues.queries.getIssue, { id: issueId });
      expect(result).toBeNull();
    });

    it("should throw forbidden for unauthorized user", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId);

      // Create another user without access
      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      await expect(asOther.query(api.issues.queries.getIssue, { id: issueId })).rejects.toThrow();
    });

    it("should allow public project access for unauthenticated user", async () => {
      // Create a public project
      const publicProjectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId, {
        isPublic: true,
      });
      const issueId = await createTestIssue(t, publicProjectId, ctx.userId);

      // Query without authentication
      const result = await t.query(api.issues.queries.getIssue, { id: issueId });
      expect(result).not.toBeNull();
    });
  });

  describe("getByKey", () => {
    it("should return issue by key", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId, { title: "Find by Key" });

      // Get the issue to find its key
      const issue = await t.run(async (runCtx) => runCtx.db.get(issueId));

      const result = await ctx.asUser.query(api.issues.queries.getByKey, { key: issue?.key });

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Find by Key");
    });

    it("should return null for non-existent key", async () => {
      const result = await ctx.asUser.query(api.issues.queries.getByKey, {
        key: "NONEXISTENT-999",
      });
      expect(result).toBeNull();
    });

    it("should return null for unauthorized user", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId);
      const issue = await t.run(async (runCtx) => runCtx.db.get(issueId));

      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const result = await asOther.query(api.issues.queries.getByKey, { key: issue?.key });
      expect(result).toBeNull();
    });
  });

  describe("getUserIssueCount", () => {
    it("should return 0 when user has no issues", async () => {
      const result = await ctx.asUser.query(api.issues.queries.getUserIssueCount, {});
      expect(result).toBe(0);
    });

    it("should return 1 when user has assigned issue", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        assigneeId: ctx.userId,
      });

      const result = await ctx.asUser.query(api.issues.queries.getUserIssueCount, {});
      expect(result).toBe(1);
    });
  });

  describe("listByUser", () => {
    it("should return empty page when user has no assigned issues", async () => {
      const result = await ctx.asUser.query(api.issues.queries.listByUser, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(0);
      expect(result.isDone).toBe(true);
    });

    it("should return assigned issues", async () => {
      await createTestIssue(t, projectId, ctx.userId, {
        title: "My Task",
        assigneeId: ctx.userId,
      });

      const result = await ctx.asUser.query(api.issues.queries.listByUser, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("My Task");
    });
  });

  describe("listEpics", () => {
    it("should return empty array when no epics", async () => {
      const result = await ctx.asUser.query(api.issues.queries.listEpics, { projectId });
      expect(result).toHaveLength(0);
    });

    it("should return only epics", async () => {
      await createTestIssue(t, projectId, ctx.userId, { type: "epic", title: "Epic 1" });
      await createTestIssue(t, projectId, ctx.userId, { type: "task", title: "Task 1" });
      await createTestIssue(t, projectId, ctx.userId, { type: "epic", title: "Epic 2" });

      const result = await ctx.asUser.query(api.issues.queries.listEpics, { projectId });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title).sort()).toEqual(["Epic 1", "Epic 2"]);
    });

    it("should return empty for unauthorized user", async () => {
      await createTestIssue(t, projectId, ctx.userId, { type: "epic" });

      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const result = await asOther.query(api.issues.queries.listEpics, { projectId });
      expect(result).toHaveLength(0);
    });
  });

  describe("listSubtasks", () => {
    it("should return empty array when no subtasks", async () => {
      const parentId = await createTestIssue(t, projectId, ctx.userId);

      const result = await ctx.asUser.query(api.issues.queries.listSubtasks, { parentId });
      expect(result).toHaveLength(0);
    });

    it("should return subtasks of a parent issue", async () => {
      const parentId = await createTestIssue(t, projectId, ctx.userId, { title: "Parent" });

      // Create subtasks directly
      await t.run(async (runCtx) => {
        const project = await runCtx.db.get(projectId);
        await runCtx.db.insert("issues", {
          projectId,
          organizationId: project?.organizationId,
          workspaceId: project?.workspaceId,
          teamId: project?.teamId,
          key: `${project?.key}-100`,
          title: "Subtask 1",
          type: "subtask",
          status: "todo",
          priority: "medium",
          reporterId: ctx.userId,
          parentId,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
        });
        await runCtx.db.insert("issues", {
          projectId,
          organizationId: project?.organizationId,
          workspaceId: project?.workspaceId,
          teamId: project?.teamId,
          key: `${project?.key}-101`,
          title: "Subtask 2",
          type: "subtask",
          status: "todo",
          priority: "medium",
          reporterId: ctx.userId,
          parentId,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 1,
        });
      });

      const result = await ctx.asUser.query(api.issues.queries.listSubtasks, { parentId });
      expect(result).toHaveLength(2);
    });
  });

  describe("listSelectableIssues", () => {
    it("should return empty array when no issues", async () => {
      const result = await ctx.asUser.query(api.issues.queries.listSelectableIssues, { projectId });
      expect(result).toHaveLength(0);
    });

    it("should return issues without parents", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 1" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 2" });

      const result = await ctx.asUser.query(api.issues.queries.listSelectableIssues, { projectId });
      expect(result).toHaveLength(2);
    });

    it("should return empty for unauthorized user", async () => {
      await createTestIssue(t, projectId, ctx.userId);

      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const result = await asOther.query(api.issues.queries.listSelectableIssues, { projectId });
      expect(result).toHaveLength(0);
    });
  });

  describe("listProjectIssues", () => {
    it("should return empty result for non-existent project", async () => {
      const fakeProjectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
      await t.run(async (runCtx) => runCtx.db.delete(fakeProjectId));

      const result = await ctx.asUser.query(api.issues.queries.listProjectIssues, {
        projectId: fakeProjectId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(0);
      expect(result.isDone).toBe(true);
    });

    it("should return paginated issues", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 1" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 2" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 3" });

      const result = await ctx.asUser.query(api.issues.queries.listProjectIssues, {
        projectId,
        paginationOpts: { numItems: 2, cursor: null },
      });

      expect(result.page.length).toBeLessThanOrEqual(2);
    });

    it("should filter by status", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Todo", status: "todo" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Done", status: "done" });

      const result = await ctx.asUser.query(api.issues.queries.listProjectIssues, {
        projectId,
        status: "todo",
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page.every((i) => i.status === "todo")).toBe(true);
    });
  });

  describe("listTeamIssues", () => {
    it("should return empty for non-member", async () => {
      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const result = await asOther.query(api.issues.queries.listTeamIssues, {
        teamId: ctx.teamId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(0);
    });
  });

  describe("search", () => {
    it("should return empty when no filters provided", async () => {
      await createTestIssue(t, projectId, ctx.userId);

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
      });

      expect(result.page).toHaveLength(0);
    });

    it("should search by project", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Project Issue" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
      });

      expect(result.page.length).toBeGreaterThan(0);
    });

    it("should search by organization", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Org Issue" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        organizationId: ctx.organizationId,
      });

      expect(result.page.length).toBeGreaterThan(0);
    });

    it("should filter by type", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "Bug", type: "bug" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Task", type: "task" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        type: ["bug"],
      });

      expect(result.page.every((i) => i.type === "bug")).toBe(true);
    });

    it("should filter by status", async () => {
      await createTestIssue(t, projectId, ctx.userId, { status: "todo" });
      await createTestIssue(t, projectId, ctx.userId, { status: "done" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        status: ["todo"],
      });

      expect(result.page.every((i) => i.status === "todo")).toBe(true);
    });

    it("should filter by priority", async () => {
      await createTestIssue(t, projectId, ctx.userId, { priority: "high" });
      await createTestIssue(t, projectId, ctx.userId, { priority: "low" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        priority: ["high"],
      });

      expect(result.page.every((i) => i.priority === "high")).toBe(true);
    });

    it("should exclude specific issue", async () => {
      const issue1 = await createTestIssue(t, projectId, ctx.userId, { title: "Issue 1" });
      await createTestIssue(t, projectId, ctx.userId, { title: "Issue 2" });

      const result = await ctx.asUser.query(api.issues.queries.search, {
        query: "",
        projectId,
        excludeIssueId: issue1,
      });

      expect(result.page.every((i) => i._id !== issue1)).toBe(true);
    });
  });

  describe("listByProjectSmart", () => {
    it("should return issues grouped by workflow state", async () => {
      await createTestIssue(t, projectId, ctx.userId, { status: "todo" });
      await createTestIssue(t, projectId, ctx.userId, { status: "inprogress" });
      await createTestIssue(t, projectId, ctx.userId, { status: "done" });

      const result = await ctx.asUser.query(api.issues.queries.listByProjectSmart, {
        projectId,
      });

      expect(result.issuesByStatus).toBeDefined();
      expect(result.workflowStates).toBeDefined();
      expect(result.workflowStates.length).toBeGreaterThan(0);
    });
  });

  describe("getIssueCounts", () => {
    it("should return null for non-existent project", async () => {
      const fakeProjectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
      await t.run(async (runCtx) => runCtx.db.delete(fakeProjectId));

      const result = await ctx.asUser.query(api.issues.queries.getIssueCounts, {
        projectId: fakeProjectId,
      });

      expect(result).toBeNull();
    });

    it("should return counts per status", async () => {
      await createTestIssue(t, projectId, ctx.userId, { status: "todo" });
      await createTestIssue(t, projectId, ctx.userId, { status: "todo" });
      await createTestIssue(t, projectId, ctx.userId, { status: "done" });

      const result = await ctx.asUser.query(api.issues.queries.getIssueCounts, {
        projectId,
      });

      expect(result).not.toBeNull();
      expect(result?.todo).toBeDefined();
      expect(result?.todo.total).toBe(2);
    });
  });

  describe("listRoadmapIssues", () => {
    it("should return empty for non-existent project", async () => {
      const fakeProjectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
      await t.run(async (runCtx) => runCtx.db.delete(fakeProjectId));

      const result = await ctx.asUser.query(api.issues.queries.listRoadmapIssues, {
        projectId: fakeProjectId,
      });

      expect(result).toHaveLength(0);
    });

    it("should filter by hasDueDate", async () => {
      await createTestIssue(t, projectId, ctx.userId, { title: "No date" });
      await t.run(async (runCtx) => {
        const project = await runCtx.db.get(projectId);
        await runCtx.db.insert("issues", {
          projectId,
          organizationId: project?.organizationId,
          workspaceId: project?.workspaceId,
          teamId: project?.teamId,
          key: `${project?.key}-999`,
          title: "Has date",
          type: "story",
          status: "todo",
          priority: "medium",
          reporterId: ctx.userId,
          dueDate: Date.now() + 86400000,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
        });
      });

      const result = await ctx.asUser.query(api.issues.queries.listRoadmapIssues, {
        projectId,
        hasDueDate: true,
      });

      expect(result.every((i) => i.dueDate !== undefined)).toBe(true);
    });
  });

  describe("listComments", () => {
    it("should throw for non-existent issue", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId);
      await t.run(async (runCtx) => runCtx.db.delete(issueId));

      await expect(
        ctx.asUser.query(api.issues.queries.listComments, {
          issueId,
          paginationOpts: { numItems: 10, cursor: null },
        }),
      ).rejects.toThrow();
    });

    it("should return paginated comments", async () => {
      const issueId = await createTestIssue(t, projectId, ctx.userId);

      // Add comments
      await t.run(async (runCtx) => {
        const now = Date.now();
        await runCtx.db.insert("issueComments", {
          issueId,
          content: "Comment 1",
          authorId: ctx.userId,
          mentions: [],
          updatedAt: now,
        });
        await runCtx.db.insert("issueComments", {
          issueId,
          content: "Comment 2",
          authorId: ctx.userId,
          mentions: [],
          updatedAt: now + 1,
        });
      });

      const result = await ctx.asUser.query(api.issues.queries.listComments, {
        issueId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(2);
      expect(result.page[0].author).toBeDefined();
    });
  });

  describe("listIssuesByDateRange", () => {
    it("should return empty for unauthorized user", async () => {
      const otherUserId = await createTestUser(t);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const result = await asOther.query(api.issues.queries.listIssuesByDateRange, {
        projectId,
        from: Date.now(),
        to: Date.now() + 86400000,
      });

      expect(result).toHaveLength(0);
    });
  });
});
