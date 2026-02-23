import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "../testUtils";

describe("Issues Selectable", () => {
  it("should return all root issues and exclude subtasks, ordered by creation time", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // Create root issues
    const { issueId: taskId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Task 1",
      type: "task",
      priority: "medium",
    });

    const { issueId: _bugId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Bug 1",
      type: "bug",
      priority: "high",
    });

    const { issueId: _storyId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Story 1",
      type: "story",
      priority: "low",
    });

    const { issueId: _epicId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Epic 1",
      type: "epic",
      priority: "medium",
    });

    // Create subtask (should be excluded)
    await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Subtask 1",
      type: "subtask",
      priority: "medium",
      parentId: taskId,
    });

    // Create deleted issue (should be excluded)
    const { issueId: deletedIssueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Deleted Issue",
      type: "task",
      priority: "medium",
    });
    await asUser.mutation(api.issues.bulkDelete, { issueIds: [deletedIssueId] });

    // Create another task to check ordering
    const { issueId: _recentTaskId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Recent Task",
      type: "task",
      priority: "medium",
    });

    // Query selectable issues
    const issues = await asUser.query(api.issues.listSelectableIssues, {
      projectId,
    });

    // Should include 5 issues (task, bug, story, epic, recentTask)
    // Should NOT include subtask
    expect(issues).toHaveLength(5);

    // Check exclusion of subtask and deleted issue
    const titles = issues.map((i) => i.title);
    expect(titles).not.toContain("Subtask 1");
    expect(titles).not.toContain("Deleted Issue");
    expect(titles).toContain("Task 1");
    expect(titles).toContain("Bug 1");
    expect(titles).toContain("Story 1");
    expect(titles).toContain("Epic 1");
    expect(titles).toContain("Recent Task");

    // Check ordering (recent first)
    // Recent Task should be first
    expect(issues[0].title).toBe("Recent Task");

    // Verify creation time order for others (epic was created after story, etc.)
    // epic > story > bug > task
    expect(issues[1].title).toBe("Epic 1");
    expect(issues[2].title).toBe("Story 1");
    expect(issues[3].title).toBe("Bug 1");
    expect(issues[4].title).toBe("Task 1");

    await t.finishInProgressScheduledFunctions();
  });
});
