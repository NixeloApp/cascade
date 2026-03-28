import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "../testUtils";

const mockSafeFetch = vi.fn();

vi.mock("../lib/dns", () => ({
  resolveDNS: vi.fn(async (hostname: string) => {
    if (hostname === "example.com") {
      return ["93.184.216.34"];
    }
    return [];
  }),
}));

vi.mock("../lib/safeFetch", () => ({
  safeFetch: (...args: [string, RequestInit]) => mockSafeFetch(...args),
}));

async function createRoutingFixtures() {
  const t = convexTest(schema, modules);
  const { userId, organizationId, asUser } = await createTestContext(t);
  const projectId = await createProjectInOrganization(t, userId, organizationId, {
    name: "External Routing Project",
    key: "XRT",
  });

  return { t, userId, projectId, asUser };
}

async function getDeliveryState(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  webhookId: Id<"webhooks">,
) {
  return await t.run(async (ctx) => {
    const slackConnection =
      (await ctx.db.query("slackConnections").collect()).find(
        (connection) => connection.userId === userId,
      ) ?? null;
    const pumbleWebhook =
      (await ctx.db.query("pumbleWebhooks").collect()).find(
        (webhook) => webhook.userId === userId,
      ) ?? null;
    const executions = (await ctx.db.query("webhookExecutions").collect()).filter(
      (execution) => execution.webhookId === webhookId,
    );

    return { executions, pumbleWebhook, slackConnection };
  });
}

describe("external issue notification routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSafeFetch.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("routes issue.created through Slack, Pumble, and generic webhooks", async () => {
    const { t, userId, projectId, asUser } = await createRoutingFixtures();

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-ROUTING",
      teamId: "T-ROUTING",
      teamName: "Routing Team",
      accessToken: "xoxb-routing",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/CREATED",
    });

    await asUser.mutation(api.pumble.addWebhook, {
      name: "Pumble Project Feed",
      webhookUrl: "https://api.pumble.com/webhook",
      projectId,
      events: ["issue.created"],
    });

    const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
      projectId,
      name: "Project Webhook",
      url: "https://example.com/webhook",
      events: ["issue.created"],
    });

    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Route issue creation",
      type: "task",
      priority: "medium",
    });

    await t.action(internal.issues.externalNotifications.processIssueEvent, {
      issueId,
      event: "issue.created",
      actorId: userId,
    });

    const { executions, pumbleWebhook, slackConnection } = await getDeliveryState(
      t,
      userId,
      webhookId,
    );

    expect(slackConnection?.messagesSent).toBe(1);
    expect(pumbleWebhook?.messagesSent).toBe(1);
    expect(executions).toHaveLength(1);
    expect(executions[0]?.event).toBe("issue.created");
    expect(executions[0]?.status).toBe("success");

    const requestPayload = JSON.parse(executions[0]?.requestPayload ?? "{}") as {
      event?: string;
      payload?: {
        issue?: { key?: string; title?: string };
        project?: { id?: string };
      };
    };
    expect(requestPayload.event).toBe("issue.created");
    expect(requestPayload.payload?.issue?.key).toBe("XRT-1");
    expect(requestPayload.payload?.issue?.title).toBe("Route issue creation");
    expect(requestPayload.payload?.project?.id).toBe(projectId);

    expect(mockSafeFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T/B/CREATED",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockSafeFetch).toHaveBeenCalledWith(
      "https://api.pumble.com/webhook",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockSafeFetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("routes comment.created and includes the comment text in webhook payloads", async () => {
    const { t, userId, projectId, asUser } = await createRoutingFixtures();

    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Route comment creation",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-COMMENT",
      teamId: "T-COMMENT",
      teamName: "Comment Team",
      accessToken: "xoxb-comment",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/COMMENT",
    });

    await asUser.mutation(api.pumble.addWebhook, {
      name: "Pumble Comment Feed",
      webhookUrl: "https://api.pumble.com/comment-webhook",
      projectId,
      events: ["comment.created"],
    });

    const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
      projectId,
      name: "Comment Webhook",
      url: "https://example.com/comment-webhook",
      events: ["comment.created"],
    });

    await t.action(internal.issues.externalNotifications.processIssueEvent, {
      issueId,
      event: "comment.created",
      actorId: userId,
      commentText: "Customer asked for a tighter follow-up window.",
    });

    const { executions, pumbleWebhook, slackConnection } = await getDeliveryState(
      t,
      userId,
      webhookId,
    );

    expect(slackConnection?.messagesSent).toBe(1);
    expect(pumbleWebhook?.messagesSent).toBe(1);
    expect(executions).toHaveLength(1);
    expect(executions[0]?.event).toBe("comment.created");

    const requestPayload = JSON.parse(executions[0]?.requestPayload ?? "{}") as {
      payload?: {
        comment?: { text?: string } | null;
      };
    };
    expect(requestPayload.payload?.comment?.text).toBe(
      "Customer asked for a tighter follow-up window.",
    );
  });
});
