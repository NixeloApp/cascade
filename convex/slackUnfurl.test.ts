import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Slack unfurl", () => {
  it("should return issue unfurl payload for connected team", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Unfurl Project",
      key: "UNF",
    });

    const created = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Slack unfurl coverage",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-UNFURL",
      teamId: "T-UNFURL",
      teamName: "Unfurl Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/UNFURL",
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-UNFURL",
      callerSlackUserId: "U-UNFURL",
      issueKey: created.key,
      url: `https://nixelo.app/issues/${created.key}`,
    });

    expect(result).not.toBeNull();
    expect(result?.title).toContain(created.key);
    expect(result?.text).toContain("Status:");
  });

  it("should return null when issue key does not resolve to an issue", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-UNFURL-NULL",
      teamId: "T-UNFURL-NULL",
      teamName: "Unfurl Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/UNFURLNULL",
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-UNFURL-NULL",
      callerSlackUserId: "U-UNFURL-NULL",
      issueKey: "DOC-123",
      url: "https://nixelo.app/docs/readme",
    });

    expect(result).toBeNull();
  });

  it("should return null when Slack user is not linked to connection", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Unfurl Scope",
      key: "USC",
    });

    const created = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Hidden from other Slack users",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-UNFURL-AUTH",
      teamId: "T-UNFURL-AUTH",
      teamName: "Unfurl Auth Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/UNFURLAUTH",
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-UNFURL-AUTH",
      callerSlackUserId: "U-UNFURL-OTHER",
      issueKey: created.key,
      url: `https://nixelo.app/issues/${created.key}`,
    });

    expect(result).toBeNull();
  });

  it("should ignore malformed connections that are missing slackUserId", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Malformed Unfurl",
      key: "MUF",
    });

    const created = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Malformed Slack connection should not unfurl",
      type: "task",
      priority: "medium",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("slackConnections", {
        userId,
        teamId: "T-MALFORMED-UNFURL",
        teamName: "Malformed Team",
        accessToken: "encrypted-token",
        isActive: true,
        messagesSent: 0,
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-MALFORMED-UNFURL",
      callerSlackUserId: "U-ANY",
      issueKey: created.key,
      url: `https://nixelo.app/issues/${created.key}`,
    });

    expect(result).toBeNull();
  });
});
