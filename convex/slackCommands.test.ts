import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Slack slash commands", () => {
  it("should create an issue from slash command", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    await createProjectInOrganization(t, userId, organizationId, { name: "Slack Cmd", key: "SLC" });

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T-CMD",
      teamName: "Cmd Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/CREATE",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-CMD",
      text: "create Ship slash command flow",
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Created issue");
  });

  it("should search issues from slash command", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Search Cmd",
      key: "SRC",
    });

    const created = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Improve slash command discoverability",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T-SEARCH",
      teamName: "Search Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/SEARCH",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-SEARCH",
      text: "search discoverability",
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain(created.key);
  });

  it("should assign issue from slash command", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Assign Cmd",
      key: "ASN",
    });
    const assigneeId = await createTestUser(t, {
      name: "Slack Assignee",
      email: "assignee@slack.test",
    });
    await addProjectMember(t, projectId, assigneeId, "editor", userId);

    const created = await asUser.mutation(api.issues.createIssue, {
      projectId,
      title: "Assign via slash command",
      type: "task",
      priority: "medium",
    });

    await asUser.mutation(api.slack.connectSlack, {
      teamId: "T-ASSIGN",
      teamName: "Assign Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/ASSIGN",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-ASSIGN",
      text: `assign ${created.key} Slack Assignee`,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain(`Assigned ${created.key}`);
  });
});
