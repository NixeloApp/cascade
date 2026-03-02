import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Automation Rules Concurrency", () => {
  // This test ensures that when multiple automation rules trigger simultaneously
  // (e.g., both adding labels), they don't overwrite each other's changes due to
  // race conditions. The fix involves sequential execution and state accumulation.
  it("should correctly apply multiple label additions from different rules", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Create Rule 1: Add "label1"
    await asUser.mutation(api.automationRules.create, {
      projectId,
      name: "Add Label 1",
      trigger: "issue_created",
      actionType: "add_label",
      actionValue: { type: "add_label", label: "label1" },
    });

    // Create Rule 2: Add "label2"
    await asUser.mutation(api.automationRules.create, {
      projectId,
      name: "Add Label 2",
      trigger: "issue_created",
      actionType: "add_label",
      actionValue: { type: "add_label", label: "label2" },
    });

    // Create Issue
    const { issueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Concurrency Test Issue",
      type: "task",
      priority: "medium",
    });

    // Execute rules (internal mutation)
    await t.mutation(internal.automationRules.executeRules, {
      projectId,
      issueId,
      trigger: "issue_created",
    });

    // Verify issue has BOTH labels
    const issue = await asUser.query(api.issues.getIssue, { id: issueId });
    const labelNames = issue?.labels.map((l) => l.name);

    expect(labelNames).toContain("label1");
    expect(labelNames).toContain("label2");
  });
});
