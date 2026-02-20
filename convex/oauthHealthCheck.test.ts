
import { convexTest } from "convex-test";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { MAX_HEALTH_CHECK_RECORDS } from "./lib/queryLimits";

describe("OAuth Health Check", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  describe("recordHealthCheck", () => {
    it("should store a health check record", async () => {
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 123,
      });

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        success: true,
        latencyMs: 123,
      });
    });

    it("should clean up old records when limit is exceeded", async () => {
      // Insert MAX + 5 records
      const totalRecords = MAX_HEALTH_CHECK_RECORDS + 5;

      // We need to insert them sequentially to ensure timestamps are different if the logic relies on it,
      // but t.run is fast. Let's just insert them.
      // The implementation sorts by timestamp desc.

      for (let i = 0; i < totalRecords; i++) {
        await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
            success: true,
            latencyMs: i,
        });
      }

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(MAX_HEALTH_CHECK_RECORDS);

      // The newest records should be kept. The loop inserts with increasing latencyMs.
      // The last inserted one has latencyMs = totalRecords - 1.
      // So we expect latencyMs from 5 to totalRecords - 1.

      const latencies = records.map(r => r.latencyMs).sort((a, b) => a - b);
      expect(latencies[0]).toBe(5);
      expect(latencies[latencies.length - 1]).toBe(totalRecords - 1);
    });
  });

  describe("getConsecutiveFailureCount", () => {
    it("should return 0 when no records exist", async () => {
      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(0);
    });

    it("should return correct count of consecutive failures", async () => {
      // Insert: success, failure, failure, failure
      // We insert in order of time (implied by execution order if t.run uses Date.now, but recordHealthCheck uses Date.now())
      // However, t.mutation calls are sequential.
      // recordHealthCheck uses Date.now().
      // To ensure order, we can rely on sequential execution.

      // Oldest: Success
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 100,
      });

      // Newer: Failure 1
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Fail 1",
      });

      // Newer: Failure 2
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Fail 2",
      });

      // Newest: Failure 3
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Fail 3",
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(3);
    });

    it("should return 0 if the latest record is a success", async () => {
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
      });

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 100,
      });

      const count = await t.query(internal.oauthHealthCheck.getConsecutiveFailureCount);
      expect(count).toBe(0);
    });
  });

  describe("getHealthStatus", () => {
    it("should return healthy status when no records exist", async () => {
      const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
      expect(status).toEqual({
        lastCheck: null,
        isHealthy: true,
        consecutiveFailures: 0,
      });
    });

    it("should return status based on latest record", async () => {
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs: 100,
      });

      const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
      expect(status.isHealthy).toBe(true);
      expect(status.consecutiveFailures).toBe(0);
      expect(status.lastCheck).toBeDefined();
    });

    it("should report failures correctly", async () => {
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Some error",
      });

      const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
      expect(status.isHealthy).toBe(false);
      expect(status.consecutiveFailures).toBe(1);
      expect(status.lastError).toBe("Some error");
    });
  });

  describe("checkGoogleOAuthHealth", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.OAUTH_MONITOR_GOOGLE_CLIENT_ID = "test-client-id";
      process.env.OAUTH_MONITOR_GOOGLE_CLIENT_SECRET = "test-secret";
      process.env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN = "test-refresh-token";
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.restoreAllMocks();
    });

    it("should skip if not configured", async () => {
      delete process.env.OAUTH_MONITOR_GOOGLE_CLIENT_ID;
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipped: monitoring not configured"),
      );
    });

    it("should record success when APIs work", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "new-token" }),
      } as Response);

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2); // Token + UserInfo
    });

    it("should record failure when token refresh fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "invalid_grant" }),
      } as Response);

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(false);
      expect(records[0].error).toContain("Token refresh failed");
    });

    it("should record failure when user info fetch fails", async () => {
      // First call (token) succeeds
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "new-token" }),
        } as Response)
        // Second call (user info) fails
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as Response);

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      const records = await t.run(async (ctx) => {
        return await ctx.db.query("oauthHealthChecks").collect();
      });

      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(false);
      expect(records[0].error).toContain("User info fetch failed");
    });

    it("should send Slack alert after consecutive failures", async () => {
      process.env.SLACK_OAUTH_ALERT_WEBHOOK_URL = "https://slack.com/webhook";

      const fetchSpy = vi.spyOn(global, "fetch");

      // Mock failures for health check
      // We need to run it 3 times.
      // 1. Fail -> 1 consecutive
      // 2. Fail -> 2 consecutive -> Alert
      // 3. Fail -> 3 consecutive -> Alert

      // We can just manually insert records to simulate previous failures
      // But the action calls getConsecutiveFailureCount internally.
      // So we can insert 2 failure records first.

      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Fail 1",
      });
      await t.mutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs: 100,
        error: "Fail 2",
      });

      // Now run the action and it should fail and trigger alert
      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: "invalid_grant" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth);

      // Verify Slack alert was sent
      // Check that the last call was to the Slack webhook
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
      expect(lastCall[0]).toBe("https://slack.com/webhook");
      expect(lastCall[1]?.body).toContain("OAuth Health Check Alert");
    });
  });
});
