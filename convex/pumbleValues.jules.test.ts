import { convexTest } from "convex-test";
import { beforeEach, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

// Mock safeFetch
const mockSafeFetch = vi.fn();
vi.mock("./lib/safeFetch", () => ({
  safeFetch: (...args: any[]) => mockSafeFetch(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("should return correct envelope structure for pumble mutations", async () => {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  const asUser = asAuthenticatedUser(t, userId);

  // 1. addWebhook
  const addResult = await asUser.mutation(api.pumble.addWebhook, {
    name: "Test Hook",
    webhookUrl: "https://hooks.pumble.com/123",
    events: ["issue.created"],
  });

  expect(addResult).toHaveProperty("webhookId");
  const webhookId = addResult.webhookId;

  // 2. updateWebhook
  const updateResult = await asUser.mutation(api.pumble.updateWebhook, {
    webhookId,
    name: "Updated Hook",
  });
  expect(updateResult).toEqual({ success: true });

  // 3. sendMessage (requires mocking safeFetch)
  mockSafeFetch.mockResolvedValue(new Response("OK", { status: 200 }));

  const sendResult = await asUser.action(api.pumble.sendMessage, {
    webhookId,
    text: "Hello",
  });
  expect(sendResult).toEqual({ success: true });

  // 4. deleteWebhook
  const deleteResult = await asUser.mutation(api.pumble.deleteWebhook, {
    webhookId,
  });
  expect(deleteResult).toEqual({ success: true, deleted: true });
});
