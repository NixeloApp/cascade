import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Load More Done Issues", () => {
  it("should paginate done issues correctly using beforeTimestamp", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Create 3 issues and move them to Done sequentially
    const issues = [];
    for (let i = 1; i <= 3; i++) {
      const { issueId } = await asUser.mutation(api.issues.create, {
        projectId,
        title: `Issue ${i}`,
        type: "task",
        priority: "medium",
      });
      // Move to done
      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "done",
        newOrder: 0,
      });
      issues.push(issueId);
      // Small delay to ensure distinct timestamps
      await new Promise((r) => setTimeout(r, 10));
    }

    // Get the issues to inspect timestamps
    const issue1 = await asUser.query(api.issues.getIssue, { id: issues[0] });
    const issue2 = await asUser.query(api.issues.getIssue, { id: issues[1] });
    const issue3 = await asUser.query(api.issues.getIssue, { id: issues[2] });

    if (!(issue1 && issue2 && issue3)) throw new Error("Issues not found");

    // Sort by updatedAt desc (Issue 3 should be newest)
    expect(issue3.updatedAt).toBeGreaterThan(issue2.updatedAt);
    expect(issue2.updatedAt).toBeGreaterThan(issue1.updatedAt);

    // Try to load more issues BEFORE issue 3 (should return issue 2)
    const result1 = await asUser.query(api.issues.loadMoreDoneIssues, {
      projectId,
      beforeTimestamp: issue3.updatedAt,
      limit: 1,
    });

    // Expect to get Issue 2
    expect(result1).toHaveLength(1);
    expect(result1[0]._id).toBe(issue2._id);

    // Try to load more issues BEFORE issue 2 (should return issue 1)
    const result2 = await asUser.query(api.issues.loadMoreDoneIssues, {
      projectId,
      beforeTimestamp: issue2.updatedAt,
      limit: 1,
    });

    expect(result2).toHaveLength(1);
    expect(result2[0]._id).toBe(issue1._id);
  });

  it("should paginate done issues correctly with sprintId", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Create a sprint
    const { sprintId } = await asUser.mutation(api.sprints.create, {
      projectId,
      name: "Sprint 1",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
    });

    // Create 3 issues in sprint and move them to Done sequentially
    const issues = [];
    for (let i = 1; i <= 3; i++) {
      const { issueId } = await asUser.mutation(api.issues.create, {
        projectId,
        title: `Sprint Issue ${i}`,
        type: "task",
        priority: "medium",
        sprintId,
      });
      // Move to done
      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "done",
        newOrder: 0,
      });
      issues.push(issueId);
      // Small delay to ensure distinct timestamps
      await new Promise((r) => setTimeout(r, 10));
    }

    const issue1 = await asUser.query(api.issues.getIssue, { id: issues[0] });
    const issue2 = await asUser.query(api.issues.getIssue, { id: issues[1] });
    const issue3 = await asUser.query(api.issues.getIssue, { id: issues[2] });

    if (!(issue1 && issue2 && issue3)) throw new Error("Issues not found");

    // Try to load more issues BEFORE issue 3 (should return issue 2)
    const result1 = await asUser.query(api.issues.loadMoreDoneIssues, {
      projectId,
      sprintId,
      beforeTimestamp: issue3.updatedAt,
      limit: 1,
    });

    expect(result1).toHaveLength(1);
    expect(result1[0]._id).toBe(issue2._id);

    // Try to load more issues BEFORE issue 2 (should return issue 1)
    const result2 = await asUser.query(api.issues.loadMoreDoneIssues, {
      projectId,
      sprintId,
      beforeTimestamp: issue2.updatedAt,
      limit: 1,
    });

    expect(result2).toHaveLength(1);
    expect(result2[0]._id).toBe(issue1._id);
  });
});
