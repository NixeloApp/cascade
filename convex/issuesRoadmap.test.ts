import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Roadmap Issues Optimization", () => {
  it("should fetch due issues and exclude deleted ones using optimized index", async () => {
    const t = convexTest(schema, modules);
    const ctx = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId, {
      name: "Roadmap Project",
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

      // Active issue with due date
      await createIssue("Active Due", now + 2 * DAY, false);

      // Deleted issue with due date
      await createIssue("Deleted Due", now + 2 * DAY, true);

      // Active issue NO due date
      await createIssue("Active No Due", 0, false);
    });

    // Query with hasDueDate=true
    const issues = await ctx.asUser.query(api.issues.listRoadmapIssues, {
      projectId,
      hasDueDate: true,
    });

    // Should ONLY find the active due issue
    // Deleted Due should be filtered by index
    // Active No Due should be filtered by index (gt 0)
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe("Active Due");
  });
});
