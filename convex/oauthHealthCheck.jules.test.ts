import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import * as fetchWithTimeoutModule from "./lib/fetchWithTimeout";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock fetchWithTimeout
vi.mock("./lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
  FetchTimeoutError: class FetchTimeoutError extends Error {
    constructor(timeoutMs: number) {
      super(`Request timed out after ${timeoutMs}ms`);
      this.name = "FetchTimeoutError";
    }
  },
}));

describe("OAuth Health Check", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default mock implementation for fetchWithTimeout
    vi.mocked(fetchWithTimeoutModule.fetchWithTimeout).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("recordHealthCheck", () => {
    it("should record a successful health check", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 100,
      });

      const checks = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(checks).toHaveLength(1);
      expect(checks[0].success).toBe(true);
      expect(checks[0].latencyMs).toBe(100);
    });

    it("should clean up old records exceeding limit", async () => {
      const t = convexTest(schema, modules);

      // MAX_HEALTH_CHECK_RECORDS is 100
      // Insert 105 records
      for (let i = 0; i < 105; i++) {
        await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
          success: true,
          latencyMs: 10,
        });
        // Advance time slightly to ensure ordering
        vi.advanceTimersByTime(1000);
      }

      const checks = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      // Should be capped at 100
      expect(checks).toHaveLength(100);
    });
  });

  describe("getConsecutiveFailureCount", () => {
    it("should return 0 when no failures", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(0);
    });

    it("should count consecutive failures", async () => {
      const t = convexTest(schema, modules);

      // Success
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });
      vi.advanceTimersByTime(1000);

      // Failure 1
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
        error: "Fail 1",
      });
      vi.advanceTimersByTime(1000);

      // Failure 2
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
        error: "Fail 2",
      });
      vi.advanceTimersByTime(1000);

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(2);
    });

    it("should stop counting at first success", async () => {
      const t = convexTest(schema, modules);

      // Failure (oldest)
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
      });
      vi.advanceTimersByTime(1000);

      // Success (stops counting here)
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });
      vi.advanceTimersByTime(1000);

      // Failure (newest)
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(1);
    });
  });

  describe("getHealthStatus", () => {
    it("should return healthy when no records", async () => {
      const t = convexTest(schema, modules);
      const status = await t.query(internal.oauthHealthCheck.getHealthStatus);

      expect(status.isHealthy).toBe(true);
      expect(status.lastCheck).toBeNull();
      expect(status.consecutiveFailures).toBe(0);
    });

    it("should return correct status based on latest check", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
        error: "Error",
      });

      const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
      expect(status.isHealthy).toBe(false);
      expect(status.consecutiveFailures).toBe(1);
      expect(status.lastError).toBe("Error");
    });
  });

  describe("checkGoogleOAuthHealth", () => {
    const setupEnv = () => {
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_ID", "client-id");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_SECRET", "client-secret");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN", "refresh-token");
      vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");
      vi.stubEnv("SLACK_OAUTH_ALERT_WEBHOOK_URL", "https://slack.webhook");
    };

    it("should skip if not configured", async () => {
      const t = convexTest(schema, modules);
      // Ensure env vars are missing
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_ID", "");

      // Capture console logs? Or just ensure no mutation happened
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipped: monitoring not configured"),
      );

      // Verify no records created
      const checks = await t.run(async (ctx) => ctx.db.query("oauthHealthChecks").collect());
      expect(checks).toHaveLength(0);
    });

    it("should record success on happy path", async () => {
      setupEnv();
      const t = convexTest(schema, modules);

      // Mock endpoint check (fetch)
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { location: "https://accounts.google.com/o/oauth2/auth" },
        }),
      );

      // Mock token exchange (fetchWithTimeout)
      vi.mocked(fetchWithTimeoutModule.fetchWithTimeout)
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }))) // Token
        .mockResolvedValueOnce(new Response(JSON.stringify({}))); // User info

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const checks = await t.run(async (ctx) => ctx.db.query("oauthHealthChecks").collect());
      expect(checks).toHaveLength(1);
      expect(checks[0].success).toBe(true);
    });

    it("should record failure on endpoint check failure", async () => {
      setupEnv();
      const t = convexTest(schema, modules);

      // Mock endpoint check failure (404)
      vi.mocked(global.fetch).mockResolvedValue(new Response("Not Found", { status: 404 }));

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const checks = await t.run(async (ctx) => ctx.db.query("oauthHealthChecks").collect());
      expect(checks).toHaveLength(1);
      expect(checks[0].success).toBe(false);
      expect(checks[0].error).toContain("expected 302 redirect");
    });

    it("should record failure on token refresh failure", async () => {
      setupEnv();
      const t = convexTest(schema, modules);

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { location: "https://accounts.google.com/..." },
        }),
      );

      // Mock token failure
      vi.mocked(fetchWithTimeoutModule.fetchWithTimeout).mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
      );

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const checks = await t.run(async (ctx) => ctx.db.query("oauthHealthChecks").collect());
      expect(checks).toHaveLength(1);
      expect(checks[0].success).toBe(false);
      expect(checks[0].error).toContain("Token refresh failed");
    });

    it("should send Slack alert after consecutive failures", async () => {
      setupEnv();
      const t = convexTest(schema, modules);

      // 1. First failure
      vi.mocked(global.fetch).mockResolvedValue(new Response("Error", { status: 500 }));
      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      // 2. Second failure (should trigger alert)
      vi.mocked(global.fetch).mockResolvedValue(new Response("Error", { status: 500 }));

      // Mock Slack response
      const slackMock = vi.fn().mockResolvedValue(new Response("ok"));
      // Reset fetchWithTimeout mock to separate calls
      vi.mocked(fetchWithTimeoutModule.fetchWithTimeout).mockImplementation((url) => {
        if (url.toString().includes("slack")) {
          return slackMock();
        }
        return Promise.resolve(new Response(JSON.stringify({})));
      });

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      expect(slackMock).toHaveBeenCalled();

      const checks = await t.run(async (ctx) => ctx.db.query("oauthHealthChecks").collect());
      expect(checks).toHaveLength(2);
      expect(checks.every((c) => !c.success)).toBe(true);
    });
  });
});
