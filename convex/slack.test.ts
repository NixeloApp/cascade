import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Slack integration", () => {
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
});
