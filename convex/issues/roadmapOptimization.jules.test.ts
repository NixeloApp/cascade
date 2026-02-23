import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("listRoadmapIssues ordering", () => {
  test("should fetch NEWEST issues by default (repro: currently fetches oldest)", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create 105 issues
    // Issue 0 is oldest, Issue 104 is newest
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      for (let i = 0; i < 105; i++) {
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: `PROJ-${i + 1}`,
          title: `Issue ${i}`,
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          updatedAt: Date.now() + i * 1000, // Ensure increasing timestamps if relevant
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
        });
      }
    });

    // Query roadmap issues (default limit is 100)
    const issues = await asUser.query(api.issues.queries.listRoadmapIssues, {
      projectId,
    });

    expect(issues.length).toBe(100);

    // CURRENT BEHAVIOR (BUG): Returns 0 to 99 (oldest)
    // EXPECTED BEHAVIOR (FIX): Should return 5 to 104 (newest)

    // We check if the NEWEST issue (104) is present.
    const hasNewest = issues.some((i) => i.title === "Issue 104");
    const hasOldest = issues.some((i) => i.title === "Issue 0");

    // For reproduction, we assert the current buggy behavior
    console.log("Has Issue 104 (newest):", hasNewest);
    console.log("Has Issue 0 (oldest):", hasOldest);

    // If bug exists: hasNewest is false, hasOldest is true
    // If fixed: hasNewest is true, hasOldest is false (assuming limit cuts off oldest)
    expect(hasNewest).toBe(true);
    expect(hasOldest).toBe(false);
  });
});
