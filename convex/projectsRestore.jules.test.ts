import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Project Restore", () => {
  it("should cascade restore issues when project is restored", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

    // 1. Create a project
    const projectId = await asUser.mutation(api.projects.createProject, {
      name: "Restore Test Project",
      key: "RESTORE",
      isPublic: false,
      boardType: "kanban",
      organizationId,
      workspaceId,
      teamId,
    });

    // 2. Create an issue in the project
    const issueId = await asUser.mutation(api.issues.create, {
      title: "Test Issue",
      type: "task",
      priority: "medium",
      projectId,
      description: "An issue to test cascade restore",
    });

    // Verify initial state
    const initialProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    const initialIssue = await t.run(async (ctx) => await ctx.db.get(issueId));
    expect(initialProject?.isDeleted).toBeFalsy();
    expect(initialIssue?.isDeleted).toBeFalsy();

    // 3. Soft delete the project
    await asUser.mutation(api.projects.softDeleteProject, { projectId });

    // Verify deletion cascaded
    const deletedProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    const deletedIssue = await t.run(async (ctx) => await ctx.db.get(issueId));
    expect(deletedProject?.isDeleted).toBe(true);
    expect(deletedIssue?.isDeleted).toBe(true);

    // 4. Restore the project
    await asUser.mutation(api.projects.restoreProject, { projectId });

    // Verify restoration cascaded
    const restoredProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    const restoredIssue = await t.run(async (ctx) => await ctx.db.get(issueId));

    expect(restoredProject?.isDeleted).toBeFalsy();
    expect(restoredIssue?.isDeleted).toBeFalsy();
  });
});
