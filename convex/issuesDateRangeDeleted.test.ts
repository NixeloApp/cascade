import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Issues Date Range Reproduction", () => {
  it("should list issues by date range and exclude deleted ones", async () => {
    const t = convexTest(schema, modules);
    const ctx = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId, {
      name: "Date Range Project",
    });

    const now = Date.now();

    // Create issues
    await ctx.asUser.run(async (mutationCtx) => {
      const createIssue = async (title: string, dueDate: number, isDeleted: boolean) => {
        await mutationCtx.db.insert("issues", {
          projectId,
          organizationId: ctx.organizationId,
          workspaceId: ctx.workspaceId,
          teamId: ctx.teamId,
          key: `KEY-${Date.now()}-${Math.random()}`,
          title,
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: ctx.userId,
          updatedAt: now,
          dueDate,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          searchContent: title,
          isDeleted: isDeleted ? true : undefined,
          deletedAt: isDeleted ? now : undefined,
          deletedBy: isDeleted ? ctx.userId : undefined,
        });
      };

      // Active issue in range
      await createIssue("Active In Range", now + 2 * DAY, false);

      // Deleted issue in range
      await createIssue("Deleted In Range", now + 2 * DAY, true);
    });

    // Query by date range
    const issuesByDate = await ctx.asUser.query(api.issues.queries.listIssuesByDateRange, {
      projectId,
      from: now,
      to: now + 5 * DAY,
    });

    // Should ONLY find the active issue
    expect(issuesByDate).toHaveLength(1);
    expect(issuesByDate[0].title).toBe("Active In Range");
  });
});
