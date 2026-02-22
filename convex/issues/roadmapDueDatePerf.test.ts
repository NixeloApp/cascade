import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "../testUtils";

describe("Roadmap Issues Due Date Performance", () => {
  it("should optimize query by skipping subtasks", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);
    const now = Date.now();

    // Create 10 tasks due tomorrow
    const taskPromises = Array.from({ length: 10 }).map((_, i) =>
      asUser.mutation(api.issues.createIssue, {
        projectId,
        title: `Task ${i}`,
        type: "task",
        priority: "medium",
        dueDate: now + DAY,
      }),
    );
    await Promise.all(taskPromises);

    // Create 50 subtasks due today (earlier than tasks)
    // In the old implementation (scan), these would be scanned first because they have earlier due date.
    // In the new implementation (type index), these should be skipped entirely.
    const { issueId: parentTask } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Parent Task",
      type: "task",
      priority: "medium",
    });

    const subtaskPromises = Array.from({ length: 50 }).map((_, i) =>
      asUser.mutation(api.issues.createIssue, {
        projectId,
        title: `Subtask ${i}`,
        type: "subtask",
        priority: "medium",
        dueDate: now, // Earlier than tasks
        parentId: parentTask,
      }),
    );
    await Promise.all(subtaskPromises);

    // Query roadmap issues with due date
    const issues = await asUser.query(api.issues.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
      excludeEpics: false,
    });

    // Should only return the 10 tasks and the parent task (if it has due date? No, parent task has no due date)
    // Wait, parent task has no due date, so it's excluded.
    // Subtasks have due date, but are type=subtask, so excluded.

    // We expect exactly 10 tasks.
    expect(issues.length).toBe(10);
    expect(issues.every((i) => i.type === "task")).toBe(true);
    expect(issues[0].title).toMatch(/Task \d+/);
  });
});
