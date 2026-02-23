import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Public Issue Access Vulnerability", () => {
  it("should NOT allow unauthenticated users to access issues in public projects", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t, { name: "Owner", email: "owner@example.com" });
    const assigneeId = await createTestUser(t, { name: "Assignee", email: "victim@example.com" });

    // Create a public project
    const projectId = await createTestProject(t, ownerId, {
      name: "Public Project",
      key: "PUB",
      isPublic: true,
    });

    const asOwner = asAuthenticatedUser(t, ownerId);

    // Create an issue assigned to the victim
    const issueId = await asOwner.mutation(api.issues.create, {
      projectId,
      title: "Sensitive Issue",
      description: "This issue contains sensitive info",
      type: "task",
      priority: "high",
      assigneeId,
    });

    // Get the issue key
    const issue = await asOwner.query(api.issues.getIssue, { id: issueId });
    if (!issue) {
      throw new Error("Failed to create issue");
    }
    const issueKey = issue.key;

    // Simulate an unauthenticated request to getByKey
    // Note: convex-test t.query() runs without authentication by default unless asUser is used
    const publicIssue = await t.query(api.issues.queries.getByKey, { key: issueKey });

    // Assert that the issue is NOT accessible
    expect(publicIssue).toBeNull();
  });
});
