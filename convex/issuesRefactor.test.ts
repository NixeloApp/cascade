import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Refactor Issues Smart Queries", () => {
  it("listByProjectSmart should return enriched issues grouped by status", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Create issues in different statuses
    const { issueId: issue1 } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Todo Issue",
      type: "task",
      priority: "medium",
    });
    // Default status is usually the first one (todo)

    const { issueId: issue2Id } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "InProgress Issue",
      type: "task",
      priority: "high",
    });
    // Move to inprogress
    await asUser.mutation(api.issues.updateStatus, {
      issueId: issue2Id,
      newStatus: "inprogress",
      newOrder: 0,
    });

    const result = await asUser.query(api.issues.listByProjectSmart, {
      projectId,
    });

    expect(result.issuesByStatus).toBeDefined();
    expect(result.workflowStates).toBeDefined();

    const todoIssues = result.issuesByStatus.todo;
    const inprogressIssues = result.issuesByStatus.inprogress;

    expect(todoIssues).toBeDefined();
    expect(inprogressIssues).toBeDefined();

    expect(todoIssues.length).toBe(1);
    expect(todoIssues[0].title).toBe("Todo Issue");
    // Check enrichment (reporter)
    expect(todoIssues[0].reporter).not.toBeNull();
    expect(todoIssues[0].reporter?.name).toBeDefined();

    expect(inprogressIssues.length).toBe(1);
    expect(inprogressIssues[0].title).toBe("InProgress Issue");
  });

  it("listByTeamSmart should return enriched issues grouped by status", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Get the team associated with the project
    const project = await asUser.query(api.projects.getProject, { id: projectId });
    const teamId = project?.teamId;
    expect(teamId).toBeDefined();

    if (!teamId) return;

    // Ensure user is in the team
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    });

    // Create issues
    const { issueId: issue1 } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Team Issue Todo",
      type: "task",
      priority: "medium",
    });

    const { issueId: issue2Id } = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Team Issue InProgress",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.issues.updateStatus, {
      issueId: issue2Id,
      newStatus: "inprogress",
      newOrder: 0,
    });

    const result = await asUser.query(api.issues.listByTeamSmart, {
      teamId,
    });

    if (Array.isArray(result)) {
      throw new Error("Expected result to be an object, but got an array");
    }

    expect(result.issuesByStatus).toBeDefined();

    const todoIssues = result.issuesByStatus.todo;
    const inprogressIssues = result.issuesByStatus.inprogress;

    expect(todoIssues).toBeDefined();
    expect(inprogressIssues).toBeDefined();

    expect(todoIssues.length).toBe(1);
    expect(todoIssues[0].title).toBe("Team Issue Todo");
    expect(todoIssues[0].reporter).not.toBeNull();

    expect(inprogressIssues.length).toBe(1);
    expect(inprogressIssues[0].title).toBe("Team Issue InProgress");
  });
});
