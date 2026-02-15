import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";
import { deliverWebhook } from "./lib/webhookHelpers"; // Import the mocked function

// Mock deliverWebhook to throw for a specific URL
vi.mock("./lib/webhookHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/webhookHelpers")>();
  return {
    ...actual,
    deliverWebhook: vi.fn(async (url: string, payload: string, event: string, secret?: string) => {
      if (url === "https://crash.me") {
        throw new Error("Simulated crash");
      }
      return {
        status: "success",
        responseStatus: 200,
        responseBody: "OK",
      };
    }),
  };
});

describe("Webhooks Crash Reproduction", () => {
  it("should continue to deliver subsequent webhooks even if one crashes", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    // Create a crashing webhook
    await asUser.mutation(api.webhooks.createWebhook, {
      projectId,
      name: "Crash Webhook",
      url: "https://crash.me",
      events: ["test.event"],
    });

    // Create a normal webhook
    await asUser.mutation(api.webhooks.createWebhook, {
      projectId,
      name: "Normal Webhook",
      url: "https://success.me",
      events: ["test.event"],
    });

    // Mock console.error to avoid noise but verify it was called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Trigger the event
    // Should NOT throw now because we catch the error inside trigger
    await t.action(internal.webhooks.trigger, {
      projectId,
      event: "test.event",
      payload: { message: "hello" },
    });

    // Verify that deliverWebhook was called TWICE (once for crash, once for success)
    expect(deliverWebhook).toHaveBeenCalledTimes(2);

    // Check args to ensure both URLs were processed
    expect(deliverWebhook).toHaveBeenCalledWith(
      "https://crash.me",
      expect.any(String),
      "test.event",
      undefined
    );
    expect(deliverWebhook).toHaveBeenCalledWith(
      "https://success.me",
      expect.any(String),
      "test.event",
      undefined
    );

    // Verify that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Webhook delivery failed for"),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
