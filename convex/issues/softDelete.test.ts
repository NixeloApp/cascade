import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "../testUtils";

describe("Issue Soft Delete", () => {
  it("should soft delete issue and preserve history", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Soft Delete Project",
      key: "SOFT",
    });

    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Issue to Delete",
    });

    // Add a comment to verify it's preserved
    const { commentId } = await asUser.mutation(api.issues.addComment, {
      issueId,
      content: "This comment should survive deletion",
    });

    // Delete the issue
    await asUser.mutation(api.issues.bulkDelete, {
      issueIds: [issueId],
    });

    // Verify issue is not accessible via get
    const deletedIssue = await asUser.query(api.issues.getIssue, { id: issueId });
    expect(deletedIssue).toBeNull();

    // Verify issue exists in DB with isDeleted: true
    const dbIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(dbIssue).toBeDefined();
    expect(dbIssue?.isDeleted).toBe(true);
    expect(dbIssue?.deletedBy).toBe(userId);
    expect(dbIssue?.deletedAt).toBeDefined();

    // Verify comment still exists in DB
    const dbComment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(dbComment).toBeDefined();
    expect(dbComment?.content).toBe("This comment should survive deletion");

    // Verify activity log contains "deleted" action
    const activities = await t.run(async (ctx) => {
      return await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();
    });

    const deleteAction = activities.find((a) => a.action === "deleted");
    expect(deleteAction).toBeDefined();
    expect(deleteAction?.userId).toBe(userId);

    await t.finishInProgressScheduledFunctions();
  });
});
