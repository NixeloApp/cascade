import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "../testUtils";

describe("Roadmap Issues Optimization", () => {
  it("should return sorted issues by due date and exclude subtasks", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    const now = Date.now();

    // 1. Bug due today
    await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Bug Today",
      type: "bug",
      priority: "high",
      dueDate: now,
    });

    // 2. Story due tomorrow
    await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Story Tomorrow",
      type: "story",
      priority: "medium",
      dueDate: now + DAY,
    });

    // 3. Task due next year
    await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Task Next Year",
      type: "task",
      priority: "low",
      dueDate: now + 365 * DAY,
    });

    // 4. Epic due next week
    const epic = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Epic Next Week",
      type: "epic",
      priority: "medium",
      dueDate: now + 7 * DAY,
    });

    // 5. Subtask due today (should be excluded)
    // Create a parent task first
    const { issueId: parentTask } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Parent Task",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Subtask Today",
      type: "subtask",
      priority: "medium",
      dueDate: now,
      parentId: parentTask,
    });

    // Query roadmap issues with due date
    const issues = await asUser.query(api.issues.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
      excludeEpics: false,
    });

    // Should include: Bug Today, Story Tomorrow, Epic Next Week, Task Next Year.
    // Should NOT include: Subtask Today, Parent Task (no due date).
    // Note: Parent Task has no due date, so it's excluded by hasDueDate: true filter in the query.

    const titles = issues.map((i) => i.title);
    expect(titles).not.toContain("Subtask Today");
    expect(titles).not.toContain("Parent Task");

    // Check order
    expect(titles[0]).toBe("Bug Today");
    expect(titles[1]).toBe("Story Tomorrow");
    expect(titles[2]).toBe("Epic Next Week");
    expect(titles[3]).toBe("Task Next Year");

    // Test with excludeEpics: true
    const issuesNoEpics = await asUser.query(api.issues.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
      excludeEpics: true,
    });

    const titlesNoEpics = issuesNoEpics.map((i) => i.title);
    expect(titlesNoEpics).not.toContain("Epic Next Week");
    expect(titlesNoEpics).toHaveLength(3);
    expect(titlesNoEpics[0]).toBe("Bug Today");
    expect(titlesNoEpics[1]).toBe("Story Tomorrow");
    expect(titlesNoEpics[2]).toBe("Task Next Year");
  });
});
