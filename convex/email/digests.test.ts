import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { sendEmail } from "./index";

// Mock the email provider index to spy on sendEmail
// We need to verify that emails are actually sent (or attempted)
vi.mock("./index", () => ({
  sendEmail: vi.fn(),
}));

describe("Digest Emails", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("should send daily digest when notifications exist", { timeout: 10000 }, async () => {
    const t = convexTest(schema, modules);

    // 1. Create user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        emailNotifications: true,
      });
    });

    // 2. Create preferences (Daily)
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId,
        emailEnabled: true,
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        emailDigest: "daily",
        updatedAt: Date.now(),
      });
    });

    // 3. Create notification (recent)
    await t.run(async (ctx) => {
      await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: "Test Mention",
        message: "You were mentioned",
        isRead: false,
        isDeleted: false,
      });
    });

    // Mock successful email send
    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "mock-id", provider: "mock" });

    // 4. Run action
    const result = await t.action(internal.email.digests.sendDailyDigests, {});

    // Verify
    expect(result).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(sendEmail).toHaveBeenCalledTimes(1);

    // Check arguments
    const callArgs = vi.mocked(sendEmail).mock.calls[0];
    const params = callArgs[1]; // Second arg is params
    expect(params.to).toBe("test@example.com");
    expect(params.subject).toContain("daily digest");
    expect(params.html).toContain("Test Mention");
  });

  it("should not send email when no notifications", { timeout: 15000 }, async () => {
    const t = convexTest(schema, modules);

    // 1. Create user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User 2",
        email: "test2@example.com",
        emailNotifications: true,
      });
    });

    // 2. Create preferences (Daily)
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId,
        emailEnabled: true,
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        emailDigest: "daily",
        updatedAt: Date.now(),
      });
    });

    // No notifications created

    // Mock successful email send (should not be called)
    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "mock-id", provider: "mock" });

    // 3. Run action
    const result = await t.action(internal.email.digests.sendDailyDigests, {});

    // Verify: skipped=1 because user had no notifications to digest
    expect(result).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should send weekly digest", { timeout: 10000 }, async () => {
    const t = convexTest(schema, modules);

    // 1. Create user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User 3",
        email: "test3@example.com",
        emailNotifications: true,
      });
    });

    // 2. Create preferences (Weekly)
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId,
        emailEnabled: true,
        emailMentions: true,
        emailAssignments: true,
        emailComments: true,
        emailStatusChanges: true,
        emailDigest: "weekly",
        updatedAt: Date.now(),
      });
    });

    // 3. Create notification
    await t.run(async (ctx) => {
      await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: "Test Mention Weekly",
        message: "You were mentioned",
        isRead: false,
        isDeleted: false,
      });
    });

    // Mock successful email send
    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "mock-id", provider: "mock" });

    // 4. Run action
    const result = await t.action(internal.email.digests.sendWeeklyDigests, {});

    // Verify
    expect(result).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const callArgs = vi.mocked(sendEmail).mock.calls[0];
    const params = callArgs[1];
    expect(params.to).toBe("test3@example.com");
    expect(params.subject).toContain("weekly digest");
  });
});
