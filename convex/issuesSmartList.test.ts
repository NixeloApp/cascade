import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Smart Issue List", () => {
  it("should list issues correctly grouped by status and enriched", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // Create Todo issue
    const { issueId: todoId } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Todo Task",
      type: "task",
      priority: "medium",
      assigneeId: userId,
    });

    // Create In Progress issue
    const { issueId: inProgressId } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "In Progress Task",
      type: "task",
      priority: "high",
    });
    await asUser.mutation(api.issues.updateStatus, {
      issueId: inProgressId,
      newStatus: "inprogress",
      newOrder: 0,
    });

    // Create Done issue
    const { issueId: doneId } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Done Task",
      type: "task",
      priority: "low",
    });
    await asUser.mutation(api.issues.updateStatus, {
      issueId: doneId,
      newStatus: "done",
      newOrder: 0,
    });

    // Fetch smart list
    const result = await asUser.query(api.issues.listByProjectSmart, { projectId });

    expect(result.issuesByStatus).toBeDefined();
    expect(result.workflowStates).toHaveLength(3); // todo, inprogress, done

    // Check Todo
    const todos = result.issuesByStatus.todo;
    expect(todos).toHaveLength(1);
    expect(todos[0]._id).toBe(todoId);
    expect(todos[0].title).toBe("Todo Task");
    expect(todos[0].assignee).toBeDefined();
    expect(todos[0].assignee?._id).toBe(userId); // Check enrichment

    // Check In Progress
    const inProgress = result.issuesByStatus.inprogress;
    expect(inProgress).toHaveLength(1);
    expect(inProgress[0]._id).toBe(inProgressId);
    expect(inProgress[0].status).toBe("inprogress");

    // Check Done
    const done = result.issuesByStatus.done;
    expect(done).toHaveLength(1);
    expect(done[0]._id).toBe(doneId);

    await t.finishInProgressScheduledFunctions();
  });
});
