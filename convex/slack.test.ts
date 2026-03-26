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
      slackUserId: "U-CONNECT",
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
      botUserId: "B123",
      scope: "incoming-webhook,chat:write",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/123",
      incomingWebhookChannel: "#alerts",
    });

    expect(connectionId).not.toBeUndefined();
    expect(typeof connectionId).toBe("string");

    const connection = await asUser.query(api.slack.getConnection, {});
    expect(connection?.teamId).toBe("T123");
    expect(connection?.teamName).toBe("Nixelo Team");
    expect(connection?.incomingWebhookChannel).toBe("#alerts");
    expect(connection?.hasIncomingWebhook).toBe(true);
    expect(connection?.hasAccessToken).toBe(true);

    await t.finishAllScheduledFunctions(() => {});
  });

  it("should upsert existing connection for the same user", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const first = await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-FIRST",
      teamId: "T123",
      teamName: "Workspace One",
      accessToken: "xoxb-token-1",
    });
    const second = await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-SECOND",
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

    await t.finishAllScheduledFunctions(() => {});
  });

  it("should disconnect slack connection", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-DISCONNECT",
      teamId: "T123",
      teamName: "Nixelo Team",
      accessToken: "xoxb-test-token",
    });

    await asUser.mutation(api.slack.disconnectSlack, {});
    const connection = await asUser.query(api.slack.getConnection, {});
    expect(connection).toBeNull();

    await t.finishAllScheduledFunctions(() => {});
  });

  it("should send message to incoming webhook for owner", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const { connectionId } = await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-SEND",
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

    await t.finishAllScheduledFunctions(() => {});
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
      slackUserId: "U-NOTIFY",
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

    await t.finishAllScheduledFunctions(() => {});
  });

  it("deactivates malformed connections that are missing slackUserId", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await createTestContext(t);

    const connectionId = await t.run(async (ctx) =>
      ctx.db.insert("slackConnections", {
        userId,
        teamId: "T-MALFORMED",
        teamName: "Malformed Team",
        accessToken: "encrypted-token",
        incomingWebhookUrl: "https://hooks.slack.com/services/T/B/malformed",
        isActive: true,
        messagesSent: 0,
        updatedAt: Date.now(),
      }),
    );

    const result = await t.mutation(internal.slack.disableConnectionsMissingSlackUserId, {
      cursor: null,
    });

    expect(result.deactivated).toBe(1);
    const connection = await t.run(async (ctx) => ctx.db.get(connectionId));
    expect(connection?.isActive).toBe(false);
    expect(connection?.lastError).toContain("requires reconnect");

    await t.finishAllScheduledFunctions(() => {});
  });
});
