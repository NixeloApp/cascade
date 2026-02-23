import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

// Mock safeFetch
const mockSafeFetch = vi.fn();
vi.mock("./lib/safeFetch", () => ({
  safeFetch: (...args: any[]) => mockSafeFetch(...args),
}));

describe("Pumble Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addWebhook", () => {
    it("should allow valid pumble webhook URL", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);
      const { organizationId } = await createOrganizationAdmin(t, userId);
      const projectId = await createProjectInOrganization(t, userId, organizationId);

      const { webhookId } = await asUser.mutation(api.pumble.addWebhook, {
        name: "Test Hook",
        webhookUrl: "https://hooks.pumble.com/123456",
        projectId,
        events: ["issue.created"],
      });

      expect(webhookId).toBeDefined();

      const webhook = await t.run(async (ctx) => await ctx.db.get(webhookId));
      expect(webhook?.webhookUrl).toBe("https://hooks.pumble.com/123456");
      expect(webhook?.isActive).toBe(true);
    });

    it("should allow subdomain pumble webhook URL", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.pumble.addWebhook, {
        name: "Subdomain Hook",
        webhookUrl: "https://my-company.pumble.com/hooks/123",
        events: ["issue.created"],
      });

      expect(webhookId).toBeDefined();
    });

    it("should reject invalid webhook URL", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(async () => {
        await asUser.mutation(api.pumble.addWebhook, {
          name: "Bad Hook",
          webhookUrl: "https://google.com/hooks",
          events: ["issue.created"],
        });
      }).rejects.toThrow("Invalid Pumble webhook URL");

      await expect(async () => {
        await asUser.mutation(api.pumble.addWebhook, {
          name: "Bad Hook 2",
          webhookUrl: "not-a-url",
          events: ["issue.created"],
        });
      }).rejects.toThrow("Invalid Pumble webhook URL");
    });

    it("should check project access if projectId provided", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const otherUserId = await createTestUser(t);

      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      const projectId = await createProjectInOrganization(t, ownerId, organizationId);

      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      // Other user (not member) cannot add webhook to project
      await expect(async () => {
        await asOtherUser.mutation(api.pumble.addWebhook, {
          name: "Hacker Hook",
          webhookUrl: "https://hooks.pumble.com/123",
          projectId,
          events: ["issue.created"],
        });
      }).rejects.toThrow("Not authorized"); // forbidden()
    });
  });

  describe("sendMessage", () => {
    it("should send message via safeFetch", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.pumble.addWebhook, {
        name: "Test Hook",
        webhookUrl: "https://hooks.pumble.com/send-message-test",
        events: ["issue.created"],
      });

      mockSafeFetch.mockResolvedValueOnce(new Response("OK", { status: 200 }));

      // Send message using authenticated user (so getWebhook succeeds)
      const result = await asUser.action(api.pumble.sendMessage, {
        webhookId,
        text: "Hello World",
        title: "Test Title",
        color: "#ff0000",
      });

      expect(result).toEqual({ success: true });

      expect(mockSafeFetch).toHaveBeenCalledWith(
        "https://hooks.pumble.com/send-message-test",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("Hello World"),
        }),
      );

      // Verify body content
      const callArgs = mockSafeFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.attachments[0].title).toBe("Test Title");
      expect(body.attachments[0].text).toBe("Hello World");
      expect(body.attachments[0].color).toBe("#ff0000");
    });

    it("should handle Pumble API errors", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.pumble.addWebhook, {
        name: "Test Hook",
        webhookUrl: "https://hooks.pumble.com/error-test",
        events: ["issue.created"],
      });

      mockSafeFetch.mockResolvedValueOnce(new Response("Bad Request", { status: 400 }));

      await expect(async () => {
        await asUser.action(api.pumble.sendMessage, {
          webhookId,
          text: "Fail me",
        });
      }).rejects.toThrow("Pumble API error: 400 Bad Request");

      // Check if stats updated with error
      const webhook = await t.run(async (ctx) => await ctx.db.get(webhookId));
      expect(webhook?.lastError).toContain("Pumble API error");
    });

    it("should fail if webhook not found or not owned by user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const otherUserId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);
      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      const { webhookId } = await asUser.mutation(api.pumble.addWebhook, {
        name: "User 1 Hook",
        webhookUrl: "https://hooks.pumble.com/user1",
        events: ["issue.created"],
      });

      // User 2 tries to use User 1's webhook
      // Expect getWebhook to throw forbidden or return null -> notFound
      // Actually getWebhook throws forbidden if not owner
      await expect(async () => {
        await asOtherUser.action(api.pumble.sendMessage, {
          webhookId,
          text: "Hacked",
        });
      }).rejects.toThrow("Not authorized");
    });
  });

  describe("sendIssueNotification", () => {
    it("should fail when called without user context (bug reproduction)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);
      const projectId = await createProjectInOrganization(t, userId, organizationId);

      // Create issue
      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Bug Issue",
        description: "Testing notification",
      });

      // User adds a webhook
      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.pumble.addWebhook, {
        name: "Notify Me",
        webhookUrl: "https://hooks.pumble.com/notify",
        projectId,
        events: ["issue.created"],
      });

      // Simulate scheduler call (unauthenticated)
      // This action calls listWebhooks which checks ctx.userId
      // It should fail because ctx.userId is missing
      await expect(async () => {
        await t.action(api.pumble.sendIssueNotification, {
          issueId,
          event: "issue.created",
          userId, // pass userId as arg, but ctx.userId is separate
        });
      }).rejects.toThrow(/Unauthenticated|Not authorized/i);
    });

    it("should send notification when called by authenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);
      const projectId = await createProjectInOrganization(t, userId, organizationId);

      const issueId = await createTestIssue(t, projectId, userId, {
        title: "Happy Path Issue",
        description: "Testing notification",
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.pumble.addWebhook, {
        name: "Notify Me",
        webhookUrl: "https://hooks.pumble.com/notify-success",
        projectId,
        events: ["issue.created"],
      });

      mockSafeFetch.mockResolvedValue(new Response("OK", { status: 200 }));

      // Authenticated call
      await asUser.action(api.pumble.sendIssueNotification, {
        issueId,
        event: "issue.created",
        userId,
      });

      // Should have called safeFetch
      expect(mockSafeFetch).toHaveBeenCalledWith(
        "https://hooks.pumble.com/notify-success",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });
  });
});
