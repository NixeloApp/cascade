import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Users Performance Optimization (Shared Projects)", () => {
  it("should correctly count issues in shared projects only", async () => {
    const t = convexTest(schema, modules);

    // User A (Viewer)
    const userA = await createTestUser(t);
    const asUserA = asAuthenticatedUser(t, userA);

    // User B (Target)
    const userB = await createTestUser(t);

    // Create Organization for User A
    const { organizationId: orgA } = await createOrganizationAdmin(t, userA);

    // Project 1 (Shared) - Created by A
    const project1 = await createProjectInOrganization(t, userA, orgA);

    // Add User B to Project 1
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId: project1,
        userId: userB,
        role: "viewer",
        addedBy: userA,
      });
      // Also add User B to organization members so they are "in" the org
      await ctx.db.insert("organizationMembers", {
        organizationId: orgA,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // Create Organization for User B
    const { organizationId: orgB } = await createOrganizationAdmin(t, userB);

    // Project 2 (Private to B) - Created by B
    const project2 = await createProjectInOrganization(t, userB, orgB);
    // User A is NOT in Project 2

    // Helper to create issue
    const createIssue = async (
      projectId: Id<"projects">,
      title: string,
      status: string,
      reporter: Id<"users">,
      assignee: Id<"users">,
    ) => {
      await t.run(async (ctx) => {
        const p = await ctx.db.get(projectId);
        if (!p) throw new Error("Project missing");
        await ctx.db.insert("issues", {
          projectId,
          organizationId: p.organizationId,
          // biome-ignore lint/style/noNonNullAssertion: testing convenience
          workspaceId: p.workspaceId!,
          // biome-ignore lint/style/noNonNullAssertion: testing convenience
          teamId: p.teamId!,
          key: `KEY-${Date.now()}-${Math.random()}`,
          title,
          status,
          priority: "medium",
          type: "task",
          reporterId: reporter,
          assigneeId: assignee,
          updatedAt: Date.now(),
          labels: [],
          order: 0,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });
    };

    // Create Issue in Project 1 (Shared) - Reported by B, Assigned to B
    await createIssue(project1, "Shared Active", "todo", userB, userB);

    // Create Issue in Project 1 (Shared) - Reported by B, Assigned to B, DONE
    await createIssue(project1, "Shared Done", "done", userB, userB);

    // Create Issue in Project 2 (Private) - Reported by B, Assigned to B
    await createIssue(project2, "Private Active", "todo", userB, userB);

    // User A views User B's stats
    const stats = await asUserA.query(api.users.getUserStats, { userId: userB });

    // Expected:
    // User A only shares Project 1 with User B.
    // Issues in Project 1:
    //   1. Active
    //   2. Done
    // Total Created: 2
    // Total Assigned: 2
    // Total Completed: 1

    // Issues in Project 2 are IGNORED.

    expect(stats.issuesCreated).toBe(2);
    expect(stats.issuesAssigned).toBe(2);
    expect(stats.issuesCompleted).toBe(1);

    // User B is in Project 1 (shared) and Project 2 (private).
    // countProjects logic returns count of projects in allowedProjectIds.
    // allowedProjectIds = [Project 1] (because A is only in Project 1).
    // User B membership in Project 1 matches.
    expect(stats.projects).toBe(1);
  });
});
