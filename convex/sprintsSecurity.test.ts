import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  addUserToOrganization,
  asAuthenticatedUser,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Sprints Security", () => {
  it("should prevent viewers from creating sprints", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const viewer = await createTestUser(t, { name: "Viewer" });
    const projectId = await createTestProject(t, owner);

    // Get the organization ID from the project
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    // Add viewer to organization first (required by security check)
    await addUserToOrganization(t, project.organizationId, viewer, owner);

    // Add viewer to project with "viewer" role
    await addProjectMember(t, projectId, viewer, "viewer", owner);

    // Authenticate as viewer
    const asViewer = asAuthenticatedUser(t, viewer);

    // Attempt to create sprint
    await expect(
      asViewer.mutation(api.sprints.create, {
        projectId,
        name: "Viewer Sprint",
      }),
    ).rejects.toThrow(/editor|authorized/i);
  });

  it("should prevent viewers from starting sprints", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const viewer = await createTestUser(t, { name: "Viewer" });
    const projectId = await createTestProject(t, owner);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    await addUserToOrganization(t, project.organizationId, viewer, owner);
    await addProjectMember(t, projectId, viewer, "viewer", owner);

    // Create a sprint as owner
    const asOwner = asAuthenticatedUser(t, owner);
    const { sprintId } = await asOwner.mutation(api.sprints.create, {
      projectId,
      name: "Test Sprint",
    });

    // Attempt to start sprint as viewer
    const asViewer = asAuthenticatedUser(t, viewer);
    const startDate = Date.now();
    await expect(
      asViewer.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate: startDate + 2 * WEEK,
      }),
    ).rejects.toThrow(/editor|authorized/i);
  });

  it("should prevent viewers from completing sprints", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const viewer = await createTestUser(t, { name: "Viewer" });
    const projectId = await createTestProject(t, owner);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    await addUserToOrganization(t, project.organizationId, viewer, owner);
    await addProjectMember(t, projectId, viewer, "viewer", owner);

    // Create sprint as owner
    const asOwner = asAuthenticatedUser(t, owner);
    const { sprintId } = await asOwner.mutation(api.sprints.create, {
      projectId,
      name: "Test Sprint",
    });

    // Attempt to complete sprint as viewer
    const asViewer = asAuthenticatedUser(t, viewer);
    await expect(
      asViewer.mutation(api.sprints.completeSprint, {
        sprintId,
      }),
    ).rejects.toThrow(/editor|authorized/i);
  });

  it("should allow editors to perform sprint actions", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const editor = await createTestUser(t, { name: "Editor" });
    const projectId = await createTestProject(t, owner);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    await addUserToOrganization(t, project.organizationId, editor, owner);
    await addProjectMember(t, projectId, editor, "editor", owner);

    const asEditor = asAuthenticatedUser(t, editor);

    // 1. Create sprint
    const { sprintId } = await asEditor.mutation(api.sprints.create, {
      projectId,
      name: "Editor Sprint",
    });
    expect(sprintId).toBeDefined();

    // 2. Start sprint
    const startDate = Date.now();
    await asEditor.mutation(api.sprints.startSprint, {
      sprintId,
      startDate,
      endDate: startDate + 2 * WEEK,
    });

    const activeSprint = await t.run(async (ctx) => ctx.db.get(sprintId));
    expect(activeSprint?.status).toBe("active");

    // 3. Complete sprint
    await asEditor.mutation(api.sprints.completeSprint, {
      sprintId,
    });

    const completedSprint = await t.run(async (ctx) => ctx.db.get(sprintId));
    expect(completedSprint?.status).toBe("completed");
  });
});
