import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

// Mock safeFetch to simulate failure
vi.mock("./lib/safeFetch", () => ({
  safeFetch: vi.fn(async (_url: string) => {
    throw new Error("Simulated network error");
  }),
}));

describe("Pumble Error Handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sendIssueNotification logs error on failure", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const projectId = await createTestProject(t, userId);

    // Create an issue
    const { issueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Test Issue",
      description: "Test Description",
      priority: "high",
      type: "bug",
      assigneeId: userId,
    });

    // Add a webhook for this project
    await asUser.mutation(api.pumble.addWebhook, {
      name: "Test Webhook",
      webhookUrl: "https://pumble.com/webhook",
      projectId,
      events: ["issue.created"],
    });

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Trigger notification
    await asUser.action(api.pumble.sendIssueNotification, {
      issueId,
      event: "issue.created",
      userId,
    });

    // Check if error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send Pumble notification"),
    );
  });
});
