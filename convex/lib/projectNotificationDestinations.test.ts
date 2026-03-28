import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "../testUtils";

describe("project notification destinations", () => {
  it("returns false when a project has no external delivery destinations", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    const hasDestinations = await t.query(
      internal.lib.projectNotificationDestinations.hasProjectExternalDestinationsForEvent,
      {
        projectId,
        event: "issue.created",
      },
    );

    expect(hasDestinations).toBe(false);
  });

  it("treats a Slack connection as a deliverable project destination for any issue event", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    await asUser.mutation(api.slack.connectSlack, {
      slackUserId: "U-NOTIFY",
      teamId: "T-NOTIFY",
      teamName: "External Routing",
      accessToken: "xoxb-notify",
      incomingWebhookUrl: "https://hooks.slack.com/services/T/B/ROUTE",
    });

    const hasDestinations = await t.query(
      internal.lib.projectNotificationDestinations.hasProjectExternalDestinationsForEvent,
      {
        projectId,
        event: "comment.created",
      },
    );

    expect(hasDestinations).toBe(true);
  });

  it("respects event-specific Pumble and generic webhook subscriptions", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    await asUser.mutation(api.pumble.addWebhook, {
      name: "Comment Feed",
      webhookUrl: "https://hooks.pumble.com/comment-feed",
      projectId,
      events: ["comment.created"],
    });

    await asUser.mutation(api.webhooks.createWebhook, {
      projectId,
      name: "Assigned Feed",
      url: "https://example.com/assigned",
      events: ["issue.assigned"],
    });

    await expect(
      t.query(internal.lib.projectNotificationDestinations.hasProjectExternalDestinationsForEvent, {
        projectId,
        event: "issue.created",
      }),
    ).resolves.toBe(false);

    await expect(
      t.query(internal.lib.projectNotificationDestinations.hasProjectExternalDestinationsForEvent, {
        projectId,
        event: "comment.created",
      }),
    ).resolves.toBe(true);

    await expect(
      t.query(internal.lib.projectNotificationDestinations.hasProjectExternalDestinationsForEvent, {
        projectId,
        event: "issue.assigned",
      }),
    ).resolves.toBe(true);
  });
});
