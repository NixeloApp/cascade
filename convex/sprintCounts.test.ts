import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Sprint Issue Counts", () => {
  it("should calculate sprint issue counts correctly", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    const sprintId = await asUser.mutation(api.sprints.create, {
      projectId,
      name: "Sprint 1",
    });

    // Create 3 Todo issues in sprint
    for (let i = 0; i < 3; i++) {
      await asUser.mutation(api.issues.create, {
        projectId,
        title: `Todo ${i}`,
        type: "task",
        priority: "medium",
        sprintId,
      });
    }

    // Create 2 Done issues in sprint
    const doneIssueIds = [];
    for (let i = 0; i < 2; i++) {
      const id = await asUser.mutation(api.issues.create, {
        projectId,
        title: `Done ${i}`,
        type: "task",
        priority: "medium",
        sprintId,
      });
      doneIssueIds.push(id);
    }

    // Move to done
    await asUser.mutation(api.issues.bulkUpdateStatus, {
      issueIds: doneIssueIds,
      newStatus: "done",
    });

    // Create 1 Todo issue NOT in sprint
    await asUser.mutation(api.issues.create, {
      projectId,
      title: "Todo Not In Sprint",
      type: "task",
      priority: "medium",
    });

    const counts = await asUser.query(api.issues.getIssueCounts, { projectId, sprintId });

    expect(counts).toBeDefined();

    // Check Todo
    expect(counts?.todo.total).toBe(3);
    expect(counts?.todo.visible).toBe(3);
    expect(counts?.todo.hidden).toBe(0);

    // Check Done
    expect(counts?.done.total).toBe(2);
    expect(counts?.done.visible).toBe(2);
    expect(counts?.done.hidden).toBe(0);

    await t.finishInProgressScheduledFunctions();
  });
});
