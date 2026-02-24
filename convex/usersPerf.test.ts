import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Users Performance Optimization", () => {
  it("should correctly count issues ignoring deleted ones", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const projectId = await createTestProject(t, userId);

    // Create 5 active issues assigned to user
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        t.run(async (ctx) => {
          const project = await ctx.db.get(projectId);
          if (!project) throw new Error("Project not found");
          if (!project.workspaceId || !project.teamId)
            throw new Error("Project missing workspace or team");
          await ctx.db.insert("issues", {
            projectId,
            organizationId: project.organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `ACTIVE-${i}`,
            title: `Active Issue ${i}`,
            status: "todo",
            priority: "medium",
            type: "task",
            reporterId: userId,
            assigneeId: userId,
            updatedAt: Date.now(),
            labels: [],
            order: i,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
          });
        }),
      ),
    );

    // Create 3 deleted issues assigned to user
    await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        t.run(async (ctx) => {
          const project = await ctx.db.get(projectId);
          if (!project) throw new Error("Project not found");
          if (!project.workspaceId || !project.teamId)
            throw new Error("Project missing workspace or team");
          await ctx.db.insert("issues", {
            projectId,
            organizationId: project.organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `DELETED-${i}`,
            title: `Deleted Issue ${i}`,
            status: "todo",
            priority: "medium",
            type: "task",
            reporterId: userId,
            assigneeId: userId,
            updatedAt: Date.now(),
            labels: [],
            order: i,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
            isDeleted: true,
            deletedAt: Date.now(),
            deletedBy: userId,
          });
        }),
      ),
    );

    // Create 2 done issues (active)
    await Promise.all(
      Array.from({ length: 2 }, (_, i) =>
        t.run(async (ctx) => {
          const project = await ctx.db.get(projectId);
          if (!project) throw new Error("Project not found");
          if (!project.workspaceId || !project.teamId)
            throw new Error("Project missing workspace or team");
          await ctx.db.insert("issues", {
            projectId,
            organizationId: project.organizationId,
            workspaceId: project.workspaceId,
            teamId: project.teamId,
            key: `DONE-${i}`,
            title: `Done Issue ${i}`,
            status: "done",
            priority: "medium",
            type: "task",
            reporterId: userId,
            assigneeId: userId,
            updatedAt: Date.now(),
            labels: [],
            order: i,
            linkedDocuments: [],
            attachments: [],
            embedding: [],
          });
        }),
      ),
    );

    // Create 1 done issue (deleted)
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");
      if (!project.workspaceId || !project.teamId)
        throw new Error("Project missing workspace or team");
      await ctx.db.insert("issues", {
        projectId,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId,
        teamId: project.teamId,
        key: "DONE-DELETED",
        title: "Done Deleted Issue",
        status: "done",
        priority: "medium",
        type: "task",
        reporterId: userId,
        assigneeId: userId,
        updatedAt: Date.now(),
        labels: [],
        order: 10,
        linkedDocuments: [],
        attachments: [],
        embedding: [],
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: userId,
      });
    });

    // Check stats
    const stats = await asUser.query(api.users.getUserStats, { userId });

    // Expected:
    // Created: 5 (active) + 2 (done) = 7. (Deleted ones should be ignored)
    // Assigned: 5 (active) + 2 (done) = 7.
    // Completed: 2 (done). (Deleted done issue ignored)

    expect(stats.issuesCreated).toBe(7);
    expect(stats.issuesAssigned).toBe(7);
    expect(stats.issuesCompleted).toBe(2);
  });
});
