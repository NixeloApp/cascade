import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "../testUtils";

describe("Bulk Update Validation", () => {
  it("should not update status if new status is invalid for the project", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Validation Project",
      key: "VAL",
    });

    // Create an issue with default status (usually "todo")
    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Test Issue",
    });

    const initialIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    if (!initialIssue) throw new Error("Initial issue not found");
    const initialStatus = initialIssue.status;

    // Attempt to bulk update to a non-existent status
    const invalidStatus = "non-existent-status-id";

    // This should theoretically succeed currently (bug), but fail/skip after fix
    const result = await asUser.mutation(api.issues.bulkUpdateStatus, {
      issueIds: [issueId],
      newStatus: invalidStatus,
    });

    // After fix, we expect updated: 0 because it was skipped
    // For now, this assertion might fail if the bug exists (it will return updated: 1)
    // We want to assert the DESIRED behavior.
    expect(result.updated).toBe(0);

    const updatedIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    if (!updatedIssue) throw new Error("Updated issue not found");
    // Status should remain unchanged
    expect(updatedIssue.status).toBe(initialStatus);
    await t.finishInProgressScheduledFunctions();
  });
});
