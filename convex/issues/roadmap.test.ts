import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("listRoadmapIssues optimization", () => {
  test("should efficiently fetch issues with due dates", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create 10 issues without due dates
    for (let i = 0; i < 10; i++) {
      await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId: project!.workspaceId,
          teamId: project!.teamId,
          key: `PROJ-${i + 1}`,
          title: `Issue ${i}`,
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
        });
      });
    }

    // Create 5 issues with due dates
    const datedIssueIds = [];
    for (let i = 0; i < 5; i++) {
        const id = await t.run(async (ctx) => {
          const project = await ctx.db.get(projectId);
          return await ctx.db.insert("issues", {
            projectId,
            organizationId,
            workspaceId: project!.workspaceId,
            teamId: project!.teamId,
            key: `PROJ-D-${i + 1}`,
            title: `Dated Issue ${i}`,
            type: "task",
            status: "todo",
            priority: "medium",
            reporterId: userId,
            dueDate: Date.now() + 100000,
            updatedAt: Date.now(),
            labels: [],
            linkedDocuments: [],
            attachments: [],
            order: 10 + i,
          });
        });
        datedIssueIds.push(id);
    }

    // Create a subtask with due date (should be excluded)
    await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId: project!.workspaceId,
          teamId: project!.teamId,
          key: `PROJ-SUB-1`,
          title: `Subtask with date`,
          type: "subtask",
          parentId: datedIssueIds[0],
          status: "todo",
          priority: "medium",
          reporterId: userId,
          dueDate: Date.now() + 100000,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 100,
        });
    });

    // Query with hasDueDate: true
    const issues = await asUser.query(api.issues.queries.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
    });

    // Should return exactly 5 issues
    expect(issues.length).toBe(5);
    for (const issue of issues) {
        expect(issue.dueDate).toBeDefined();
        expect(issue.type).not.toBe("subtask");
    }
  });

  test("should fetch all issues when hasDueDate is not set", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create 10 issues without due dates
    for (let i = 0; i < 10; i++) {
      await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId: project!.workspaceId,
          teamId: project!.teamId,
          key: `PROJ-${i + 1}`,
          title: `Issue ${i}`,
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
        });
      });
    }

    // Query with hasDueDate undefined
    const issues = await asUser.query(api.issues.queries.listRoadmapIssues, {
      projectId,
    });

    // Should return 10 issues
    expect(issues.length).toBe(10);
  });
});
