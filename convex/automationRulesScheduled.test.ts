import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "./testUtils";

describe("automationRules scheduled triggers", () => {
  it("should execute stale_in_status action on issues in target status past cutoff", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Get the project's workflow states
    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const todoState = project?.workflowStates.find((s) => s.category === "todo");
    if (!todoState) throw new Error("No todo state found");

    // Create a rule: if issue in backlog for 3+ days, set priority to high
    await t.run(async (ctx) => {
      await ctx.db.insert("automationRules", {
        projectId,
        name: "Escalate stale todo",
        isActive: true,
        trigger: "stale_in_status",
        triggerValue: JSON.stringify({ statusId: todoState.id, days: 3 }),
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
        createdBy: userId,
        updatedAt: Date.now(),
        executionCount: 0,
      });
    });

    // Create an issue in backlog, updated 5 days ago
    const issueId = await createTestIssue(t, projectId, userId, { title: "Stale issue" });
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        status: todoState.id,
        updatedAt: Date.now() - 5 * DAY,
      });
    });

    // Run scheduled triggers
    const result = await t.mutation(internal.automationRules.processScheduledTriggers, {});

    expect(result.executed).toBe(1);

    // Verify priority was changed
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issue?.priority).toBe("high");
  });

  it("should skip issues that are not past the stale cutoff", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const todoState = project?.workflowStates.find((s) => s.category === "todo");
    if (!todoState) throw new Error("No todo state found");

    await t.run(async (ctx) => {
      await ctx.db.insert("automationRules", {
        projectId,
        name: "Escalate stale todo",
        isActive: true,
        trigger: "stale_in_status",
        triggerValue: JSON.stringify({ statusId: todoState.id, days: 7 }),
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
        createdBy: userId,
        updatedAt: Date.now(),
        executionCount: 0,
      });
    });

    // Issue updated 3 days ago — within the 7-day window
    const issueId = await createTestIssue(t, projectId, userId, { title: "Recent issue" });
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        status: todoState.id,
        updatedAt: Date.now() - 3 * DAY,
      });
    });

    const result = await t.mutation(internal.automationRules.processScheduledTriggers, {});

    expect(result.executed).toBe(0);
  });

  it("should skip inactive rules", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    const todoState = project?.workflowStates.find((s) => s.category === "todo");
    if (!todoState) throw new Error("No todo state found");

    // Create an INACTIVE rule
    await t.run(async (ctx) => {
      await ctx.db.insert("automationRules", {
        projectId,
        name: "Disabled rule",
        isActive: false,
        trigger: "stale_in_status",
        triggerValue: JSON.stringify({ statusId: todoState.id, days: 1 }),
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
        createdBy: userId,
        updatedAt: Date.now(),
        executionCount: 0,
      });
    });

    const issueId = await createTestIssue(t, projectId, userId, { title: "Old issue" });
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        status: todoState.id,
        updatedAt: Date.now() - 10 * DAY,
      });
    });

    const result = await t.mutation(internal.automationRules.processScheduledTriggers, {});

    expect(result.executed).toBe(0);
  });
});
