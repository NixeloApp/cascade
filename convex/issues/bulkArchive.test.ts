import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "../testUtils";

describe("Bulk Archive", () => {
  it("should archive multiple issues in done state", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);
    const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Issue 1",
      type: "task",
      priority: "medium",
    });
    const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Issue 2",
      type: "task",
      priority: "medium",
    });

    // Set status to done (assuming "done" is the id for done state, need to check default project workflow)
    // Default workflow usually has "todo", "inprogress", "done".
    await asUser.mutation(api.issues.updateStatus, {
      issueId: issue1Id,
      newStatus: "done",
      newOrder: 0,
    });
    await asUser.mutation(api.issues.updateStatus, {
      issueId: issue2Id,
      newStatus: "done",
      newOrder: 0,
    });

    const result = await asUser.mutation(api.issues.bulkArchive, {
      issueIds: [issue1Id, issue2Id],
    });

    expect(result.archived).toBe(2);

    const issue1 = await asUser.query(api.issues.getIssue, { id: issue1Id });
    const issue2 = await asUser.query(api.issues.getIssue, { id: issue2Id });

    expect(issue1?.archivedAt).toBeDefined();
    expect(issue2?.archivedAt).toBeDefined();
    await t.finishInProgressScheduledFunctions();
  });

  it("should not archive issues not in done state", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);
    const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Issue 1",
      type: "task",
      priority: "medium",
    });

    // status is 'todo' by default

    const result = await asUser.mutation(api.issues.bulkArchive, {
      issueIds: [issue1Id],
    });

    expect(result.archived).toBe(0);

    const issue1 = await asUser.query(api.issues.getIssue, { id: issue1Id });
    expect(issue1?.archivedAt).toBeUndefined();
    await t.finishInProgressScheduledFunctions();
  });
});
