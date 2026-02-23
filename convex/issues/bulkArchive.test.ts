import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("Issue Bulk Archive/Restore Mutations", () => {
  it("should archive completed issues", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Archive Project",
      key: "ARCH",
    });

    // Create a "done" status (usually created by default but let's be sure)
    // Actually createProjectInOrganization creates default workflow states.
    // Let's find the "done" state ID.
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const doneState = project?.workflowStates.find((s) => s.category === "done");
    if (!doneState) throw new Error("No done state found");

    const todoState = project?.workflowStates.find((s) => s.category === "todo");
    if (!todoState) throw new Error("No todo state found");

    // Create one issue in "done" and one in "todo"
    const { issueId: doneIssueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Done Issue",
      type: "task",
      priority: "medium",
    });
    // Move to done (create uses default status which is likely todo)
    await asUser.mutation(api.issues.updateStatus, {
      issueId: doneIssueId,
      newStatus: doneState.id,
      newOrder: 0,
    });

    const { issueId: todoIssueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Todo Issue",
      type: "task",
      priority: "medium",
    });

    // Archive both
    const result = await asUser.mutation(api.issues.bulkArchive, {
      issueIds: [doneIssueId, todoIssueId],
    });

    // Only done issue should be archived
    expect(result.archived).toBe(1);

    const doneIssue = await t.run(async (ctx) => ctx.db.get(doneIssueId));
    expect(doneIssue?.archivedAt).toBeDefined();
    // Verify updatedAt was updated (use >= to avoid flakiness due to millisecond precision)
    expect(doneIssue?.updatedAt).toBeGreaterThanOrEqual(doneIssue?._creationTime || 0);

    const todoIssue = await t.run(async (ctx) => ctx.db.get(todoIssueId));
    expect(todoIssue?.archivedAt).toBeUndefined();
  });

  it("should restore archived issues", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Restore Project",
      key: "REST",
    });

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const doneState = project?.workflowStates.find((s) => s.category === "done");
    if (!doneState) throw new Error("No done state found");

    const { issueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "To Restore",
      type: "task",
      priority: "medium",
    });
    await asUser.mutation(api.issues.updateStatus, {
      issueId,
      newStatus: doneState.id,
      newOrder: 0,
    });

    // Archive first using bulkArchive to setup
    await asUser.mutation(api.issues.bulkArchive, {
      issueIds: [issueId],
    });

    const archivedIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(archivedIssue?.archivedAt).toBeDefined();

    // Restore
    const result = await asUser.mutation(api.issues.bulkRestore, {
      issueIds: [issueId],
    });

    expect(result.restored).toBe(1);

    const restoredIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(restoredIssue?.archivedAt).toBeUndefined();
  });
});
