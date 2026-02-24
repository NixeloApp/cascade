import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Issue Counts Performance", () => {
  it("should calculate issue counts correctly", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // Create 3 Todo issues
    await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        asUser.mutation(api.issues.createIssue, {
          projectId,
          title: `Todo ${i}`,
          type: "task",
          priority: "medium",
        }),
      ),
    );

    // Create 2 Done issues
    const doneResults = await Promise.all(
      Array.from({ length: 2 }, (_, i) =>
        asUser.mutation(api.issues.createIssue, {
          projectId,
          title: `Done ${i}`,
          type: "task",
          priority: "medium",
        }),
      ),
    );
    const doneIssueIds = doneResults.map((r) => r.issueId);

    // Move to done
    await asUser.mutation(api.issues.bulkUpdateStatus, {
      issueIds: doneIssueIds,
      newStatus: "done",
    });

    const counts = await asUser.query(api.issues.getIssueCounts, { projectId });

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
