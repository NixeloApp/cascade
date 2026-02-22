import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createOrganizationAdmin, createProjectInOrganization, createTestUser } from "./testUtils";

// Mock deliverWebhook to throw for a specific URL
vi.mock("./lib/webhookHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/webhookHelpers")>();
  return {
    ...actual,
    deliverWebhook: vi.fn(
      async (url: string, _payload: string, _event: string, _secret?: string) => {
        if (url === "https://crash.me") {
          throw new Error("Simulated crash");
        }
        return {
          status: "success",
          responseStatus: 200,
          responseBody: "OK",
        };
      },
    ),
  };
});

describe("Webhooks Test/Retry Crash Handling", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("deliverTestWebhook should handle unexpected crashes gracefully", async () => {
    const t = convexTest(schema, modules);

    // Create valid hierarchy
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    const webhookId = await t.run(async (ctx) => {
      return await ctx.db.insert("webhooks", {
        projectId,
        name: "Crash Webhook",
        url: "https://crash.me",
        events: ["ping"],
        isActive: true,
        createdBy: userId,
      });
    });

    // Should NOT throw, but handle the error internally
    // Currently this will throw because we haven't implemented the fix yet
    await t.action(internal.webhooks.deliverTestWebhook, {
      webhookId,
    });

    // Verify execution log status is 'failed' and error is recorded
    const executions = await t.run(async (ctx) => {
      return await ctx.db.query("webhookExecutions").collect();
    });

    expect(executions.length).toBe(1);
    expect(executions[0].status).toBe("failed");
    expect(executions[0].error).toBe("Simulated crash");
  });

  test("retryWebhookDelivery should handle unexpected crashes gracefully", async () => {
    const t = convexTest(schema, modules);

    // Create valid hierarchy
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    const webhookId = await t.run(async (ctx) => {
      return await ctx.db.insert("webhooks", {
        projectId,
        name: "Crash Webhook",
        url: "https://crash.me",
        events: ["ping"],
        isActive: true,
        createdBy: userId,
      });
    });

    // Create an initial execution
    const executionId = await t.run(async (ctx) => {
      return await ctx.db.insert("webhookExecutions", {
        webhookId,
        event: "ping",
        requestPayload: "{}",
        status: "failed",
        attempts: 1,
      });
    });

    // Run retryWebhookDelivery
    // Should NOT throw
    // Currently this will throw because we haven't implemented the fix yet
    await t.action(internal.webhooks.retryWebhookDelivery, {
      executionId,
      webhookId,
    });

    // Verify execution log attempts increased and status/error updated
    const execution = await t.run(async (ctx) => {
      return await ctx.db.get(executionId);
    });

    expect(execution).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    expect(execution!.attempts).toBe(2);
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    expect(execution!.status).toBe("failed");
    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    expect(execution!.error).toBe("Simulated crash");
  });
});
