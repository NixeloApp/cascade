import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { safeFetch } from "./lib/safeFetch";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

vi.mock("./lib/safeFetch", () => ({
  safeFetch: vi.fn(async (url: string) => {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }),
}));

describe("Pumble Security", () => {
  it("addWebhook requires valid pumble.com URL", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Valid URL
    await asUser.mutation(api.pumble.addWebhook, {
      name: "Valid",
      webhookUrl: "https://pumble.com/webhook",
      events: ["issue.created"],
    });

    // Valid Subdomain
    await asUser.mutation(api.pumble.addWebhook, {
      name: "Valid Subdomain",
      webhookUrl: "https://api.pumble.com/webhook",
      events: ["issue.created"],
    });

    // Invalid Domain
    await expect(async () => {
      await asUser.mutation(api.pumble.addWebhook, {
        name: "Invalid",
        webhookUrl: "https://evil.com/pumble.com",
        events: ["issue.created"],
      });
    }).rejects.toThrow("Invalid Pumble webhook URL");

    // Invalid Subdomain
    await expect(async () => {
      await asUser.mutation(api.pumble.addWebhook, {
        name: "Invalid",
        webhookUrl: "https://fake-pumble.com/webhook",
        events: ["issue.created"],
      });
    }).rejects.toThrow("Invalid Pumble webhook URL");
  });

  it("sendMessage uses safeFetch", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const webhookId = await asUser.mutation(api.pumble.addWebhook, {
      name: "Valid",
      webhookUrl: "https://pumble.com/webhook",
      events: ["issue.created"],
    });

    await asUser.action(api.pumble.sendMessage, {
      webhookId,
      text: "Hello",
    });

    expect(safeFetch).toHaveBeenCalledWith(
      "https://pumble.com/webhook",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
