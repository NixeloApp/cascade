import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

const mockSafeFetch = vi.fn();
vi.mock("./lib/safeFetch", () => ({
  safeFetch: (...args: [string, RequestInit]) => mockSafeFetch(...args),
}));

describe("Slack integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should connect and return sanitized connection metadata", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const { connectionId } = await asUser.mutation(api.slack.connectSlack, {
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
      botUserId: "B123",
      scope: "incoming-webhook,chat:write",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/123",
      incomingWebhookChannel: "#alerts",
    });

    expect(connectionId).toBeDefined();

    const connection = await asUser.query(api.slack.getConnection, {});
    expect(connection?.teamId).toBe("T123");
    expect(connection?.teamName).toBe("Nixelo Team");
    expect(connection?.incomingWebhookChannel).toBe("#alerts");
    expect(connection?.hasIncomingWebhook).toBe(true);
    expect(connection?.hasAccessToken).toBe(true);
  });

  it("should upsert existing connection for the same user", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const first = await asUser.mutation(api.slack.connectSlack, {
      teamId: "T123",
      teamName: "Workspace One",
      accessToken: "xoxb-token-1",
    });
    const second = await asUser.mutation(api.slack.connectSlack, {
      teamId: "T456",
      teamName: "Workspace Two",
      accessToken: "xoxb-token-2",
      incomingWebhookChannel: "#product",
    });

    expect(first.connectionId).toBe(second.connectionId);

    const connection = await asUser.query(api.slack.getConnection, {});
    expect(connection?.teamId).toBe("T456");
    expect(connection?.teamName).toBe("Workspace Two");
    expect(connection?.incomingWebhookChannel).toBe("#product");
  });

  it("should disconnect slack connection", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
    });

    await asUser.mutation(api.slack.disconnectSlack, {});
    const connection = await asUser.query(api.slack.getConnection, {});
    expect(connection).toBeNull();
  });

  it("should send message to incoming webhook for owner", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const { connectionId } = await asUser.mutation(api.slack.connectSlack, {
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/123",
    });

    mockSafeFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const result = await asUser.action(api.slack.sendMessage, {
      connectionId,
      text: "Hello from Nixelo",
    });

    expect(result).toEqual({ success: true });
    expect(mockSafeFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T/B/123",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("should send internal issue notification to project member destinations", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Slack Notify Project",
      key: "SLK",
    });

    const asUser = asAuthenticatedUser(t, userId);
    const { issueId } = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Notify Slack",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/notify",
    });

    mockSafeFetch.mockResolvedValue(new Response("ok", { status: 200 }));
    const result = await t.action(internal.slack.sendIssueNotification, {
      issueId,
      event: "issue.updated",
      userId,
    });

    expect(result).toEqual({ success: true });
    expect(mockSafeFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T/B/notify",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("should schedule slack notification on issue comment creation", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Slack Comment Project",
      key: "SLC",
    });

    const asUser = asAuthenticatedUser(t, userId);
    await asUser.mutation(api.slack.connectSlack, {
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
    // Run finishInProgressScheduledFunctions multiple times to ensure all nested
    // scheduled work completes (sendIssueNotification -> deliverMessageInternal)
    await t.finishInProgressScheduledFunctions();
    await t.finishInProgressScheduledFunctions();

    expect(mockSafeFetch).toHaveBeenCalled();
  });
});
