import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("Bulk Update Deleted Issue Reproduction", () => {
  it("should NOT allow updating a deleted issue", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Repro Project",
      key: "REPRO",
    });

    // Create an issue
    const { issueId } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Issue to Delete",
      type: "task",
      priority: "medium",
      storyPoints: 3,
    });

    // Delete the issue
    await asUser.mutation(api.issues.bulkDelete, {
      issueIds: [issueId],
    });

    // Verify it is deleted
    const dbIssueBefore = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(dbIssueBefore?.isDeleted).toBe(true);
    expect(dbIssueBefore?.status).toBe("todo"); // Default status

    // Attempt to update status of the deleted issue
    const result = await asUser.mutation(api.issues.bulkUpdateStatus, {
      issueIds: [issueId],
      newStatus: "done",
    });

    // Check if it reported as updated
    // If the bug exists, this will likely be 1. If fixed, 0.
    console.log("Updated count:", result.updated);

    // Verify status in DB
    const dbIssueAfter = await t.run(async (ctx) => ctx.db.get(issueId));

    // We expect the status to remain "todo" because the update should have been skipped.
    expect(dbIssueAfter?.status).toBe("todo");
    expect(result.updated).toBe(0);
  });
});
