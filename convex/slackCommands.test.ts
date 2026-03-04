import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
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
      slackUserId: "U-CREATE",
      teamId: "T-CMD",
      teamName: "Cmd Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/CREATE",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-CMD",
      callerSlackUserId: "U-CREATE",
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
      slackUserId: "U-SEARCH",
      teamId: "T-SEARCH",
      teamName: "Search Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/SEARCH",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-SEARCH",
      callerSlackUserId: "U-SEARCH",
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
      slackUserId: "U-ASSIGN",
      teamId: "T-ASSIGN",
      teamName: "Assign Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/ASSIGN",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-ASSIGN",
      callerSlackUserId: "U-ASSIGN",
      text: `assign ${created.key} Slack Assignee`,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain(`Assigned ${created.key}`);
  });

  it("should reject slash command when Slack user is not linked", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);
    await createProjectInOrganization(t, userId, organizationId, {
      name: "Linked Cmd",
      key: "LNK",
    });

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-LINKED",
      teamId: "T-LINKED",
      teamName: "Linked Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/LINKED",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-LINKED",
      callerSlackUserId: "U-OTHER",
      text: "create Should fail",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("not connected");
  });

  it("should pick a writable project when first membership is viewer", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId } = await createTestContext(t);
    const slackUserId = await createTestUser(t, {
      name: "Slack Viewer+Editor",
      email: "slack-viewer-editor@test.dev",
    });
    const asSlackUser = asAuthenticatedUser(t, slackUserId);

    const viewerProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Viewer Project",
      key: "VWP",
    });
    const editorProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Editor Project",
      key: "EDP",
    });

    await addProjectMember(t, viewerProjectId, slackUserId, "viewer", userId);
    await addProjectMember(t, editorProjectId, slackUserId, "editor", userId);

    await asSlackUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-MIXED",
      teamId: "T-MIXED",
      teamName: "Mixed Team",
      accessToken: "xoxb-test",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/MIXED",
    });

    const result = await t.mutation(internal.slackCommandsCore.executeCommand, {
      teamId: "T-MIXED",
      callerSlackUserId: "U-MIXED",
      text: "create should land in editor project",
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Created issue EDP-");
  });
});
