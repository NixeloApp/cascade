import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("Dashboard", () => {
  describe("getMyIssues", () => {
    it("should return issues assigned to the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "DASH",
      });

      // Create issues assigned to the user
      await createTestIssue(t, projectId, userId, {
        title: "My Assigned Issue 1",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "My Assigned Issue 2",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getMyIssues, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(2);
      expect(result.page.some((i) => i.title === "My Assigned Issue 1")).toBe(true);
      expect(result.page.some((i) => i.title === "My Assigned Issue 2")).toBe(true);
      expect(result.isDone).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should not return issues assigned to other users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const otherUserId = await createTestUser(t, { name: "Other User" });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "DASH2",
      });

      // Create issue assigned to other user
      await createTestIssue(t, projectId, userId, {
        title: "Other User Issue",
        assigneeId: otherUserId,
      });

      // Create issue assigned to current user
      await createTestIssue(t, projectId, userId, {
        title: "My Issue",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getMyIssues, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(1);
      expect(result.page[0].title).toBe("My Issue");
      await t.finishInProgressScheduledFunctions();
    });

    it("should enrich issues with project and user names", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t, {
        name: "Test Reporter",
      });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Dashboard Project",
        key: "DASHP",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Enriched Issue",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getMyIssues, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page[0].projectName).toBe("Dashboard Project");
      expect(result.page[0].projectKey).toBe("DASHP");
      expect(result.page[0].reporterName).toBe("Test Reporter");
      expect(result.page[0].assigneeName).toBe("Test Reporter");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty array for user with no assigned issues", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.query(api.dashboard.getMyIssues, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page).toHaveLength(0);
      expect(result.isDone).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.query(api.dashboard.getMyIssues, {
          paginationOpts: { numItems: 10, cursor: null },
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("getMyCreatedIssues", () => {
    it("should return issues created by the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "CREATE",
      });

      await createTestIssue(t, projectId, userId, { title: "Created Issue 1" });
      await createTestIssue(t, projectId, userId, { title: "Created Issue 2" });

      const result = await asUser.query(api.dashboard.getMyCreatedIssues, {});

      expect(result).toHaveLength(2);
      expect(result.some((i) => i.title === "Created Issue 1")).toBe(true);
      expect(result.some((i) => i.title === "Created Issue 2")).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should not return issues created by other users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const otherUserId = await createTestUser(t, { name: "Other User" });

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "CREATE2",
      });

      // Add other user as project member so they can create issues
      await addProjectMember(t, projectId, otherUserId, "editor", userId);

      // Create issue as other user
      await createTestIssue(t, projectId, otherUserId, { title: "Other User Created" });

      // Create issue as current user
      await createTestIssue(t, projectId, userId, { title: "My Created Issue" });

      const result = await asUser.query(api.dashboard.getMyCreatedIssues, {});

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("My Created Issue");
      await t.finishInProgressScheduledFunctions();
    });

    it("should sort by creation time descending", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "SORT",
      });

      await createTestIssue(t, projectId, userId, { title: "First Issue" });
      await createTestIssue(t, projectId, userId, { title: "Second Issue" });
      await createTestIssue(t, projectId, userId, { title: "Third Issue" });

      const result = await asUser.query(api.dashboard.getMyCreatedIssues, {});

      // Most recent first
      expect(result[0].title).toBe("Third Issue");
      expect(result[2].title).toBe("First Issue");
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.dashboard.getMyCreatedIssues, {})).rejects.toThrow(
        "Not authenticated",
      );
    });
  });

  describe("getMyProjects", () => {
    it("should return projects the user is a member of", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await createProjectInOrganization(t, userId, organizationId, {
        name: "Project A",
        key: "PROJA",
      });
      await createProjectInOrganization(t, userId, organizationId, {
        name: "Project B",
        key: "PROJB",
      });

      const result = await asUser.query(api.dashboard.getMyProjects, {});

      expect(result).toHaveLength(2);
      expect(result.some((p) => p.name === "Project A")).toBe(true);
      expect(result.some((p) => p.name === "Project B")).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should include user role in project", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await createProjectInOrganization(t, userId, organizationId, {
        name: "Admin Project",
        key: "ADMIN",
      });

      const result = await asUser.query(api.dashboard.getMyProjects, {});

      expect(result[0].role).toBe("admin");
      await t.finishInProgressScheduledFunctions();
    });

    it("should count issues assigned to user per project", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Issue Count Project",
        key: "COUNT",
      });

      // Create 3 issues assigned to the user
      await createTestIssue(t, projectId, userId, { title: "Issue 1", assigneeId: userId });
      await createTestIssue(t, projectId, userId, { title: "Issue 2", assigneeId: userId });
      await createTestIssue(t, projectId, userId, { title: "Issue 3", assigneeId: userId });

      const result = await asUser.query(api.dashboard.getMyProjects, {});

      expect(result[0].myIssues).toBe(3);
      expect(result[0].totalIssues).toBe(3);
      await t.finishInProgressScheduledFunctions();
    });

    it("should keep totalIssues in sync after soft delete", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Issue Sync Project",
        key: "SYNC",
      });

      const issue1 = await createTestIssue(t, projectId, userId, {
        title: "Issue 1",
        assigneeId: userId,
      });
      const issue2 = await createTestIssue(t, projectId, userId, {
        title: "Issue 2",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, { title: "Issue 3", assigneeId: userId });

      await asUser.mutation(api.issues.bulkDelete, {
        issueIds: [issue1, issue2],
      });

      const result = await asUser.query(api.dashboard.getMyProjects, {});
      expect(result[0].totalIssues).toBe(1);
      expect(result[0].myIssues).toBe(1);
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty array for user with no project memberships", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "No Projects User" });
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.query(api.dashboard.getMyProjects, {});

      expect(result).toHaveLength(0);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.dashboard.getMyProjects, {})).rejects.toThrow("Not authenticated");
    });
  });

  describe("getMyStats", () => {
    it("should return correct assigned to me count", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Stats Project",
        key: "STATS",
      });

      await createTestIssue(t, projectId, userId, { title: "Issue 1", assigneeId: userId });
      await createTestIssue(t, projectId, userId, { title: "Issue 2", assigneeId: userId });

      const result = await asUser.query(api.dashboard.getMyStats, {});

      expect(result.assignedToMe).toBe(2);
      await t.finishInProgressScheduledFunctions();
    });

    it("should return correct created by me count", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Stats Project",
        key: "STATS2",
      });

      await createTestIssue(t, projectId, userId, { title: "Created 1" });
      await createTestIssue(t, projectId, userId, { title: "Created 2" });
      await createTestIssue(t, projectId, userId, { title: "Created 3" });

      const result = await asUser.query(api.dashboard.getMyStats, {});

      expect(result.createdByMe).toBe(3);
      await t.finishInProgressScheduledFunctions();
    });

    it("should return correct high priority count", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Priority Project",
        key: "PRIO",
      });

      await createTestIssue(t, projectId, userId, {
        title: "High",
        priority: "high",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "Highest",
        priority: "highest",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "Medium",
        priority: "medium",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "Low",
        priority: "low",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getMyStats, {});

      expect(result.highPriority).toBe(2); // high + highest
      await t.finishInProgressScheduledFunctions();
    });

    it("should return zero stats for new user", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.query(api.dashboard.getMyStats, {});

      expect(result.assignedToMe).toBe(0);
      expect(result.createdByMe).toBe(0);
      expect(result.completedThisWeek).toBe(0);
      expect(result.highPriority).toBe(0);
      await t.finishInProgressScheduledFunctions();
    });

    it("should count completed issues this week", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Completed Project",
        key: "COMP",
      });

      // Create an issue and mark it as done
      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Completed Issue",
        status: "done", // done is a default workflow state
        assigneeId: userId,
      });

      // Update the issue's updatedAt to be recent
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId, { updatedAt: Date.now() });
      });

      const result = await asUser.query(api.dashboard.getMyStats, {});

      expect(result.completedThisWeek).toBe(1);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.dashboard.getMyStats, {})).rejects.toThrow("Not authenticated");
    });
  });

  describe("getFocusTask", () => {
    it("should return null when user has no issues", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should return highest priority uncompleted issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Focus Project",
        key: "FOCUS",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Low Priority",
        priority: "low",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "High Priority",
        priority: "high",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "Medium Priority",
        priority: "medium",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result?.title).toBe("High Priority");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return null when all issues are completed", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Done Project",
        key: "DONE",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Completed Issue",
        status: "done",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should prioritize highest over high priority", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Priority Project",
        key: "PRIO2",
      });

      await createTestIssue(t, projectId, userId, {
        title: "High Priority",
        priority: "high",
        assigneeId: userId,
      });
      await createTestIssue(t, projectId, userId, {
        title: "Highest Priority",
        priority: "highest",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result?.title).toBe("Highest Priority");
      await t.finishInProgressScheduledFunctions();
    });

    it("should enrich with project name and key", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Focus Project Name",
        key: "FPN",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Focus Issue",
        assigneeId: userId,
      });

      const result = await asUser.query(api.dashboard.getFocusTask, {});

      expect(result?.projectName).toBe("Focus Project Name");
      expect(result?.projectKey).toBe("FPN");
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.dashboard.getFocusTask, {})).rejects.toThrow("Not authenticated");
    });
  });

  describe("getMyRecentActivity", () => {
    it("should return empty array for user with no project memberships", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "No Projects User" });
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.query(api.dashboard.getMyRecentActivity, {});

      expect(result).toHaveLength(0);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.dashboard.getMyRecentActivity, {})).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should respect the limit parameter", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.query(api.dashboard.getMyRecentActivity, { limit: 5 });

      expect(result.length).toBeLessThanOrEqual(5);
      await t.finishInProgressScheduledFunctions();
    });

    it("should exclude activity from projects where user is not a member", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const otherUserId = await createTestUser(t, { name: "Other User" });

      await asUser.mutation(api.organizations.addMember, {
        organizationId,
        userId: otherUserId,
        role: "member",
      });

      const memberProjectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Member Project",
        key: "MP",
      });
      const otherProjectId = await createProjectInOrganization(t, otherUserId, organizationId, {
        name: "Other Project",
        key: "OP",
      });

      const memberIssueId = await createTestIssue(t, memberProjectId, userId, {
        title: "Visible activity issue",
      });
      const otherIssueId = await createTestIssue(t, otherProjectId, otherUserId, {
        title: "Hidden activity issue",
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("issueActivity", {
          issueId: memberIssueId,
          userId,
          action: "commented",
          newValue: "Visible comment",
        });
        await ctx.db.insert("issueActivity", {
          issueId: otherIssueId,
          userId: otherUserId,
          action: "commented",
          newValue: "Hidden comment",
        });
      });

      const result = await asUser.query(api.dashboard.getMyRecentActivity, {});
      const issueTitles = result.map((activity) => activity.issueTitle);

      expect(issueTitles).toContain("Visible activity issue");
      expect(issueTitles).not.toContain("Hidden activity issue");
      await t.finishInProgressScheduledFunctions();
    });
  });
});
