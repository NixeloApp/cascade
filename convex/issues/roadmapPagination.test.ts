import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("listRoadmapIssues pagination issue", () => {
  test("should fetch dated issues even if many subtasks exist", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create a parent task
    const parentId = await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");
      return await ctx.db.insert("issues", {
        projectId,
        organizationId,
        workspaceId: project.workspaceId,
        teamId: project.teamId,
        key: `PARENT-1`,
        title: `Parent`,
        type: "task",
        status: "todo",
        priority: "medium",
        reporterId: userId,
        updatedAt: Date.now(),
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 1,
      });
    });

    // Create 450 subtasks with due dates
    // These should fill the default buffer of 400 if not filtered in DB
    // We do this in batches to avoid timeout
    for (let i = 0; i < 450; i += 50) {
      await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        for (let j = 0; j < 50; j++) {
          await ctx.db.insert("issues", {
            projectId,
            organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `SUB-${i + j}`,
            title: `Subtask ${i + j}`,
            type: "subtask",
            parentId,
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
        }
      });
    }

    // Create 10 tasks with due dates
    // These are created AFTER subtasks, so they are later in _creationTime order
    const datedIssueIds = [];
    for (let i = 0; i < 10; i++) {
      const id = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: `TASK-${i + 1}`,
          title: `Dated Task ${i}`,
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          dueDate: Date.now() + 200000,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 10 + i,
        });
      });
      datedIssueIds.push(id);
    }

    // Query with hasDueDate: true
    const issues = await asUser.query(api.issues.queries.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
    });

    // If fetching 400 items blindly (mostly subtasks), we miss the 10 tasks at the end
    // Result would be 0
    // If filtering in DB, we skip subtasks and get the 10 tasks
    expect(issues.length).toBe(10);
  });
});
