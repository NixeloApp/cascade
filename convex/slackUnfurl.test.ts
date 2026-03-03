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
      teamId: "T-UNFURL",
      teamName: "Unfurl Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/UNFURL",
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-UNFURL",
      url: `https://nixelo.app/issues/${created.key}`,
    });

    expect(result).not.toBeNull();
    expect(result?.title).toContain(created.key);
    expect(result?.text).toContain("Status:");
  });

  it("should return null when url does not contain an issue key", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T-UNFURL-NULL",
      teamName: "Unfurl Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/UNFURLNULL",
    });

    const result = await t.query(internal.slackUnfurl.getIssueUnfurl, {
      teamId: "T-UNFURL-NULL",
      url: "https://nixelo.app/docs/readme",
    });

    expect(result).toBeNull();
  });
});
