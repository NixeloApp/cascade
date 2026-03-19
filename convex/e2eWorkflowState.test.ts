import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("e2e workflow state updates", () => {
  it("updates and clears WIP limits for seeded-style projects in E2E orgs", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, workspaceId, teamId, asUser } = await createTestContext(t, {
      email: "screenshots-test@inbox.mailtrap.io",
    });

    const orgSlug = "nixelo-e2e-workflow";
    await t.run(async (ctx) => {
      await ctx.db.patch(organizationId, { slug: orgSlug });
    });

    const { projectId } = await asUser.mutation(api.projects.createProject, {
      name: "Demo Project",
      key: "DEMO",
      description: "Demo project for screenshot visual review",
      isPublic: false,
      boardType: "kanban",
      organizationId,
      workspaceId,
      teamId,
    });

    const updated = await t.mutation(internal.e2e.updateProjectWorkflowStateInternal, {
      orgSlug,
      projectKey: "DEMO",
      stateId: "todo",
      wipLimit: 1,
    });

    expect(updated.success).toBe(true);
    expect(updated.projectId).toBe(projectId);
    expect(updated.workflowStates?.find((state) => state.id === "todo")?.wipLimit).toBe(1);

    const cleared = await t.mutation(internal.e2e.updateProjectWorkflowStateInternal, {
      orgSlug,
      projectKey: "DEMO",
      stateId: "todo",
      wipLimit: null,
    });

    expect(cleared.success).toBe(true);
    expect(cleared.workflowStates?.find((state) => state.id === "todo")?.wipLimit).toBeUndefined();
  });
});
