import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

const mockSafeFetch = vi.fn();
vi.mock("./lib/safeFetch", () => ({
  safeFetch: (...args: [string, RequestInit]) => mockSafeFetch(...args),
}));

describe("Slack comment notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules Slack delivery when an issue comment is created", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Slack Comment Project",
      key: "SLC",
    });

    const asUser = asAuthenticatedUser(t, userId);
    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-COMMENT",
      teamId: "T777",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/comment",
    });

    const { issueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Comment hook",
      type: "task",
      priority: "medium",
    });

    mockSafeFetch.mockResolvedValue(new Response("ok", { status: 200 }));
    await asUser.mutation(api.issues.addComment, {
      issueId,
      content: "Trigger comment notification",
    });
    await t.finishAllScheduledFunctions(() => {});

    await vi.waitFor(() => {
      expect(mockSafeFetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/T/B/comment",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("SLC-1: Comment hook"),
        }),
      );
    });
  });
});
