
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser, createOrganizationAdmin, createProjectInOrganization, asAuthenticatedUser } from "./testUtils";
import type { Id } from "./_generated/dataModel";

describe("Project Restore", () => {
  it("should cascade restore issues when project is restored", async () => {
    const t = convexTest(schema, modules);

    // Setup user
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    // Create project using helper (returns Id<"projects">)
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "TEST",
      boardType: "kanban"
    });

    const asUser = asAuthenticatedUser(t, userId);

    // Create an issue
    const issueId = await asUser.mutation(api.issues.create, {
      title: "Test Issue",
      type: "task",
      projectId,
      description: "Test description",
      priority: "medium"
    });

    // Verify initial state
    const initialProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    expect(initialProject?.isDeleted).toBeFalsy();

    // Soft delete
    await asUser.mutation(api.projects.softDeleteProject, { projectId });

    const deletedProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    expect(deletedProject?.isDeleted).toBe(true);

    // Restore
    await asUser.mutation(api.projects.restoreProject, { projectId });

    const restoredProject = await t.run(async (ctx) => await ctx.db.get(projectId));
    expect(restoredProject?.isDeleted).toBeFalsy();
  });
});
