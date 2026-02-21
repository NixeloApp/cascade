import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { CONSECUTIVE_FAILURE_WINDOW, MAX_HEALTH_CHECK_RECORDS } from "./lib/queryLimits";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock fetchWithTimeout
vi.mock("./lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

describe("OAuth Health Check", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  describe("recordHealthCheck", () => {
    it("should record a successful health check", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 100,
      });

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        success: true,
        latencyMs: 100,
      });
    });

    it("should clean up old records", async () => {
      const t = convexTest(schema, modules);

      // Insert MAX + 5 records
      for (let i = 0; i < MAX_HEALTH_CHECK_RECORDS + 5; i++) {
        await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
          success: true,
          latencyMs: 10,
        });
      }

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records.length).toBeLessThanOrEqual(MAX_HEALTH_CHECK_RECORDS);
    });
  });

  describe("getConsecutiveFailureCount", () => {
    it("should return 0 when last check was successful", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount, {});
      expect(count).toBe(0);
    });

    it("should return correct count of recent failures", async () => {
      const t = convexTest(schema, modules);

      // Insert success
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });

      // Insert 3 failures
      for (let i = 0; i < 3; i++) {
        await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
          success: false,
          latencyMs: 10,
          error: "Failed",
        });
      }

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount, {});
      expect(count).toBe(3);
    });

    it("should stop counting at first success", async () => {
      const t = convexTest(schema, modules);

      // Old failure
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
      });
      // Success barrier
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 10,
      });
      // New failures
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
      });
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount, {});
      expect(count).toBe(2);
    });
  });

  describe("getHealthStatus", () => {
    it("should return healthy if no checks exist", async () => {
      const t = convexTest(schema, modules);
      const status = await t.query(internal.oauthHealthCheck.getHealthStatus, {});
      expect(status.isHealthy).toBe(true);
      expect(status.lastCheck).toBeNull();
    });

    it("should return status from latest check", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 10,
        error: "Last error",
      });

      const status = await t.query(internal.oauthHealthCheck.getHealthStatus, {});
      expect(status.isHealthy).toBe(false);
      expect(status.lastError).toBe("Last error");
      expect(status.consecutiveFailures).toBe(1);
    });
  });

  describe("checkGoogleOAuthHealth", () => {
    it("should perform health check successfully", async () => {
      const t = convexTest(schema, modules);

      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_ID", "client-id");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_SECRET", "client-secret");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN", "refresh-token");
      vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");

      // Mock endpoint check (fetch)
      global.fetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Map([["location", "https://accounts.google.com/o/oauth2/auth"]]),
      });

      // Mock fetchWithTimeout
      const { fetchWithTimeout } = await import("./lib/fetchWithTimeout");
      (fetchWithTimeout as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "access-token" }),
        }) // Token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        }); // User info

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth, {});

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(true);
    });

    it("should record failure when token refresh fails", async () => {
      const t = convexTest(schema, modules);

      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_ID", "client-id");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_SECRET", "client-secret");
      vi.stubEnv("OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN", "refresh-token");
      vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");

      global.fetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Map([["location", "https://accounts.google.com/o/oauth2/auth"]]),
      });

      const { fetchWithTimeout } = await import("./lib/fetchWithTimeout");
      (fetchWithTimeout as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "invalid_grant" }),
      });

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth, {});

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(false);
      expect(records[0].error).toContain("Token refresh failed");
    });
  });
});
