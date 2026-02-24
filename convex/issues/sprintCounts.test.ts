import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DONE_COLUMN_DAYS } from "../lib/pagination";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, type TestContext } from "../testUtils";

describe("sprint issue counts", () => {
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
        name: "Sprint 1",
        status: "active",
        createdBy: ctx.userId,
        updatedAt: Date.now(),
      });
    });
  });

  it("should return correct counts for sprint issues", async () => {
    const now = Date.now();
    const oldDate = now - (DONE_COLUMN_DAYS + 1) * DAY;

    await t.run(async (runCtx) => {
      // Clear issues
      const issues = await runCtx.db.query("issues").collect();
      await Promise.all(issues.map((issue) => runCtx.db.delete(issue._id)));

      const project = await runCtx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      const commonFields = {
        projectId,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId,
        teamId: project.teamId,
        reporterId: ctx.userId,
        updatedAt: now,
        labels: [],
        linkedDocuments: [],
        attachments: [],
        loggedHours: 0,
        type: "task" as const,
        priority: "medium" as const,
      };

      // 2 Todo issues in sprint
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-1",
        title: "Todo 1",
        status: "todo",
        sprintId,
        order: 1,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-2",
        title: "Todo 2",
        status: "todo",
        sprintId,
        order: 2,
      });

      // 3 In Progress issues in sprint
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-3",
        title: "IP 1",
        status: "inprogress",
        sprintId,
        order: 3,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-4",
        title: "IP 2",
        status: "inprogress",
        sprintId,
        order: 4,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-5",
        title: "IP 3",
        status: "inprogress",
        sprintId,
        order: 5,
      });

      // 5 Done issues in sprint
      // 3 Recent (visible)
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-6",
        title: "Done 1",
        status: "done",
        sprintId,
        updatedAt: now,
        order: 6,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-7",
        title: "Done 2",
        status: "done",
        sprintId,
        updatedAt: now,
        order: 7,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-8",
        title: "Done 3",
        status: "done",
        sprintId,
        updatedAt: now,
        order: 8,
      });

      // 2 Old (hidden from visible count)
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-9",
        title: "Done Old 1",
        status: "done",
        sprintId,
        updatedAt: oldDate,
        order: 9,
      });
      await runCtx.db.insert("issues", {
        ...commonFields,
        key: "TEST-10",
        title: "Done Old 2",
        status: "done",
        sprintId,
        updatedAt: oldDate,
        order: 10,
      });
    });

    const counts = await ctx.asUser.query(api.issues.queries.getIssueCounts, {
      projectId,
      sprintId,
      doneColumnDays: DONE_COLUMN_DAYS,
    });

    expect(counts).not.toBeNull();

    // Todo: 2 total, 2 visible
    expect(counts?.todo.total).toBe(2);
    expect(counts?.todo.visible).toBe(2);

    // In Progress: 3 total, 3 visible
    expect(counts?.inprogress.total).toBe(3);
    expect(counts?.inprogress.visible).toBe(3);

    // Done: 5 total, 3 visible (only recent ones)
    expect(counts?.done.total).toBe(5);
    expect(counts?.done.visible).toBe(3);
    // Hidden is calculated as max(0, total - PAGE_SIZE), so with 5 items and 50 page size, it's 0.
    expect(counts?.done.hidden).toBe(0);
  });
});
