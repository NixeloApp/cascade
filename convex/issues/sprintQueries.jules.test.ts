import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, type TestContext } from "../testUtils";

describe("issue queries - sprint optimization", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;
  let sprintId: Id<"sprints">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);

    // Create a sprint
    sprintId = await t.run(async (runCtx) => {
      return await runCtx.db.insert("sprints", {
        projectId,
        name: "Test Sprint 1",
        status: "active",
        createdBy: ctx.userId,
        updatedAt: Date.now(),
      });
    });
  });

  async function createIssueInSprint(
    status: string,
    order: number,
    updatedAt: number,
    title: string,
  ) {
    return await t.run(async (runCtx) => {
      const project = await runCtx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      return await runCtx.db.insert("issues", {
        projectId,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId,
        teamId: project.teamId,
        key: `TEST-${Math.floor(Math.random() * 10000)}`,
        title,
        type: "task",
        status,
        priority: "medium",
        reporterId: ctx.userId,
        sprintId,
        updatedAt,
        labels: [],
        linkedDocuments: [],
        attachments: [],
        loggedHours: 0,
        order,
      });
    });
  }

  it("should return issues grouped by workflow state for a sprint", async () => {
    // Create issues in different statuses
    await createIssueInSprint("todo", 0, Date.now(), "Todo 1");
    await createIssueInSprint("todo", 1, Date.now(), "Todo 2");
    await createIssueInSprint("inprogress", 0, Date.now(), "In Progress 1");
    await createIssueInSprint("done", 0, Date.now(), "Done 1");

    const result = await ctx.asUser.query(api.issues.queries.listByProjectSmart, {
      projectId,
      sprintId,
    });

    expect(result.issuesByStatus).toBeDefined();
    expect(result.workflowStates).toBeDefined();

    const todoIssues = result.issuesByStatus.todo;
    expect(todoIssues).toHaveLength(2);
    expect(todoIssues.map((i) => i.title).sort()).toEqual(["Todo 1", "Todo 2"]);

    const inProgressIssues = result.issuesByStatus.inprogress;
    expect(inProgressIssues).toHaveLength(1);
    expect(inProgressIssues[0].title).toBe("In Progress 1");

    const doneIssues = result.issuesByStatus.done;
    expect(doneIssues).toHaveLength(1);
    expect(doneIssues[0].title).toBe("Done 1");
  });

  it("should respect order in non-done columns", async () => {
    // Create issues with specific order
    await createIssueInSprint("todo", 10, Date.now(), "Todo Second");
    await createIssueInSprint("todo", 5, Date.now(), "Todo First");

    const result = await ctx.asUser.query(api.issues.queries.listByProjectSmart, {
      projectId,
      sprintId,
    });

    const todoIssues = result.issuesByStatus.todo;
    expect(todoIssues).toHaveLength(2);
    // Should be sorted by order asc
    expect(todoIssues[0].title).toBe("Todo First");
    expect(todoIssues[1].title).toBe("Todo Second");
  });

  it("should filter done issues by threshold", async () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;

    // Recent done issue
    await createIssueInSprint("done", 0, twoDaysAgo, "Recent Done");
    // Old done issue
    await createIssueInSprint("done", 0, twentyDaysAgo, "Old Done");

    const result = await ctx.asUser.query(api.issues.queries.listByProjectSmart, {
      projectId,
      sprintId,
      doneColumnDays: 14, // Default
    });

    const doneIssues = result.issuesByStatus.done;
    expect(doneIssues).toHaveLength(1);
    expect(doneIssues[0].title).toBe("Recent Done");
  });

  it("should sort done issues by updatedAt ascending (current behavior)", async () => {
    const now = Date.now();
    await createIssueInSprint("done", 0, now - 1000, "Older");
    await createIssueInSprint("done", 0, now, "Newer");

    const result = await ctx.asUser.query(api.issues.queries.listByProjectSmart, {
      projectId,
      sprintId,
    });

    const doneIssues = result.issuesByStatus.done;
    expect(doneIssues).toHaveLength(2);
    // Current implementation sorts by updatedAt ASC
    expect(doneIssues[0].title).toBe("Older");
    expect(doneIssues[1].title).toBe("Newer");
  });
});
