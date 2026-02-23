import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Users Stats Performance", () => {
  it("should correctly count completed issues for another user in shared project", async () => {
    const t = convexTest(schema, modules);

    // User 1: Viewer
    const viewerId = await createTestUser(t, { name: "Viewer" });
    const asViewer = asAuthenticatedUser(t, viewerId);

    // User 2: Target
    const targetId = await createTestUser(t, { name: "Target" });

    // Create Organization (Viewer is owner)
    const { organizationId } = await createOrganizationAdmin(t, viewerId);

    // Add Target to Organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: targetId,
        role: "member",
        addedBy: viewerId,
      });
    });

    // Create Project shared by both
    const projectId = await createProjectInOrganization(t, viewerId, organizationId);

    // Add Target to Project
    await addProjectMember(t, projectId, targetId, "viewer", viewerId);

    // Create issues assigned to Target
    // 10 Active (Todo)
    // 5 Completed (Done)

    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      // 10 Active
      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          ctx.db.insert("issues", {
            projectId,
            organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `TODO-${i}`,
            title: `Todo ${i}`,
            status: "todo",
            priority: "medium",
            type: "task",
            reporterId: viewerId,
            assigneeId: targetId,
            updatedAt: Date.now(),
            labels: [],
            order: i,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
            searchContent: "",
          }),
        ),
      );

      // 5 Completed
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          ctx.db.insert("issues", {
            projectId,
            organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `DONE-${i}`,
            title: `Done ${i}`,
            status: "done",
            priority: "medium",
            type: "task",
            reporterId: viewerId,
            assigneeId: targetId,
            updatedAt: Date.now(),
            labels: [],
            order: i + 10,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
            searchContent: "",
          }),
        ),
      );
    });

    // Query stats as Viewer looking at Target
    const stats = await asViewer.query(api.users.getUserStats, { userId: targetId });

    // Issues Assigned: 10 + 5 = 15
    // Issues Completed: 5
    expect(stats.issuesAssigned).toBe(15);
    expect(stats.issuesCompleted).toBe(5);
  });
});
