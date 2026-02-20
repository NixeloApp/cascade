import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Issues Date Range", () => {
  it("should list issues by date range and sprint", async () => {
    const t = convexTest(schema, modules);
    const ctx = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId, {
      name: "Date Range Project",
    });

    // Create a sprint
    const sprintId = await ctx.asUser.run(async (mutationCtx) => {
      return await mutationCtx.db.insert("sprints", {
        projectId,
        name: "Sprint 1",
        status: "active",
        createdBy: ctx.userId,
        updatedAt: Date.now(),
      });
    });

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Create issues
    // 1. Inside sprint, inside date range
    await ctx.asUser.run(async (mutationCtx) => {
      const project = await mutationCtx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      const createIssue = async (title: string, dueDate: number, inSprint: boolean) => {
        await mutationCtx.db.insert("issues", {
          projectId,
          organizationId: ctx.organizationId,
          workspaceId: ctx.workspaceId,
          teamId: ctx.teamId,
          key: `KEY-${Date.now()}-${Math.random()}`,
          title,
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: ctx.userId,
          updatedAt: now,
          dueDate,
          sprintId: inSprint ? sprintId : undefined,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          searchContent: title,
          isDeleted: false,
        });
      };

      // Target Range: now to now + 5 days
      // Issue 1: Inside sprint, inside range (now + 3 days) - LATER
      await createIssue("In Sprint, Late", now + 3 * day, true);

      // Issue 0: Inside sprint, inside range (now + 1 day) - EARLIER
      await createIssue("In Sprint, Early", now + day, true);

      // Issue 2: Inside sprint, outside range (now + 10 days)
      await createIssue("In Sprint, Out Range", now + 10 * day, true);

      // Issue 3: Outside sprint, inside range (now + 2 days)
      await createIssue("Out Sprint, In Range", now + 2 * day, false);

      // Issue 4: Outside sprint, outside range
      await createIssue("Out Sprint, Out Range", now + 10 * day, false);

      // Issue 5: Inside sprint, no due date
      // (This one should be filtered out by range check, as range implies existing due date)
      // Actually listIssuesByDateRange filters by gte/lte, so undefined dueDate won't match.
    });

    // Test 1: Query by date range ONLY (no sprint)
    const issuesByDate = await ctx.asUser.query(api.issues.queries.listIssuesByDateRange, {
      projectId,
      from: now,
      to: now + 5 * day,
    });

    // Should find Issue 0, Issue 1 and Issue 3
    expect(issuesByDate).toHaveLength(3);
    expect(issuesByDate.map((i) => i.title).sort()).toEqual(
      ["In Sprint, Early", "In Sprint, Late", "Out Sprint, In Range"].sort(),
    );

    // Test 2: Query by date range AND sprint
    const issuesByDateAndSprint = await ctx.asUser.query(api.issues.queries.listIssuesByDateRange, {
      projectId,
      sprintId,
      from: now,
      to: now + 5 * day,
    });

    // Should find BOTH issues in correct order (by due date ascending)
    expect(issuesByDateAndSprint).toHaveLength(2);
    expect(issuesByDateAndSprint[0].title).toBe("In Sprint, Early");
    expect(issuesByDateAndSprint[1].title).toBe("In Sprint, Late");
  });
});
