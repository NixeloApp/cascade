/**
 * OAuth Token Monitor Tests
 *
 * Tests for the token health monitoring system that tracks
 * user OAuth token status and auto-refreshes expiring tokens.
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { HOUR, MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("OAuth Token Monitor", () => {
  async function createCalendarConnection(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    options: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    } = {},
  ) {
    return await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("calendarConnections", {
        userId,
        provider: "google",
        providerAccountId: "test@gmail.com",
        accessToken: options.accessToken ?? "encrypted_access_token",
        refreshToken: options.refreshToken ?? "encrypted_refresh_token",
        expiresAt: options.expiresAt ?? now + HOUR,
        syncEnabled: true,
        syncDirection: "bidirectional",
        lastSyncAt: undefined,
        updatedAt: now,
      });
    });
  }

  describe("checkConnectionTokenHealth", () => {
    it("should return 'healthy' for valid non-expired token", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Test User" });

      // Token expires in 1 hour
      const connectionId = await createCalendarConnection(t, userId, {
        expiresAt: Date.now() + HOUR,
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId,
      });

      expect(health.status).toBe("healthy");
      expect(health.needsRefresh).toBe(false);
    });

    it("should return 'expiring_soon' for token expiring within 30 minutes", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Expiring User" });

      // Token expires in 20 minutes
      const connectionId = await createCalendarConnection(t, userId, {
        expiresAt: Date.now() + 20 * MINUTE,
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId,
      });

      expect(health.status).toBe("expiring_soon");
      expect(health.needsRefresh).toBe(true);
    });

    it("should return 'expired' for past expiration time", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Expired User" });

      // Token expired 1 hour ago
      const connectionId = await createCalendarConnection(t, userId, {
        expiresAt: Date.now() - HOUR,
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId,
      });

      expect(health.status).toBe("expired");
      expect(health.needsRefresh).toBe(true);
    });

    it("should return 'missing' for non-existent connection", async () => {
      const t = convexTest(schema, modules);

      // Create a real connection then delete it to get a valid-looking but non-existent ID
      const userId = await createTestUser(t, { name: "Temp User" });
      const tempConnectionId = await createCalendarConnection(t, userId);
      await t.run(async (ctx) => {
        await ctx.db.delete(tempConnectionId);
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId: tempConnectionId,
      });

      expect(health.status).toBe("missing");
      expect(health.needsRefresh).toBe(false);
    });

    it("should return 'missing' when no access token", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "No Token User" });

      const connectionId = await createCalendarConnection(t, userId, {
        accessToken: "", // Empty token
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId,
      });

      expect(health.status).toBe("missing");
    });

    it("should return needsRefresh=false when no refresh token available", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "No Refresh User" });

      // Create connection without refresh token
      const connectionId = await t.run(async (ctx) => {
        const now = Date.now();
        return await ctx.db.insert("calendarConnections", {
          userId,
          provider: "google",
          providerAccountId: "test@gmail.com",
          accessToken: "encrypted_access_token",
          refreshToken: undefined, // No refresh token
          expiresAt: now - HOUR, // Expired
          syncEnabled: true,
          syncDirection: "bidirectional",
          lastSyncAt: undefined,
          updatedAt: now,
        });
      });

      const health = await t.query(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId,
      });

      expect(health.status).toBe("expired");
      expect(health.needsRefresh).toBe(false); // Can't refresh without refresh token
    });
  });

  describe("getConnectionsNeedingRefresh", () => {
    it("should return empty array when no connections exist", async () => {
      const t = convexTest(schema, modules);

      const connections = await t.query(
        internal.oauthTokenMonitor.getConnectionsNeedingRefresh,
        {},
      );

      expect(connections).toEqual([]);
    });

    it("should return connections expiring within threshold", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Refresh User" });

      // Connection expiring in 10 minutes (within 15 min threshold)
      await createCalendarConnection(t, userId, {
        expiresAt: Date.now() + 10 * MINUTE,
      });

      // Connection expiring in 2 hours (not within threshold)
      await createCalendarConnection(t, userId, {
        expiresAt: Date.now() + 2 * HOUR,
      });

      const connections = await t.query(
        internal.oauthTokenMonitor.getConnectionsNeedingRefresh,
        {},
      );

      expect(connections).toHaveLength(1);
    });
  });

  describe("getAllConnections", () => {
    it("should return all calendar connections", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User One" });
      const user2 = await createTestUser(t, { name: "User Two" });

      await createCalendarConnection(t, user1);
      await createCalendarConnection(t, user2);

      const connections = await t.query(internal.oauthTokenMonitor.getAllConnections, {});

      expect(connections).toHaveLength(2);
    });
  });

  describe("recordTokenHealthCheck", () => {
    it("should record health check results", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthTokenMonitor.recordTokenHealthCheck, {
        totalConnections: 10,
        healthyCount: 8,
        expiringSoonCount: 1,
        expiredCount: 1,
        invalidCount: 0,
        missingCount: 0,
        refreshedCount: 2,
        refreshFailedCount: 0,
        durationMs: 150,
      });

      const stats = await t.query(internal.oauthTokenMonitor.getTokenHealthStats, {});

      expect(stats.lastCheck).toBeTruthy();
      expect(stats.stats).toBeTruthy();
      expect(stats.stats?.totalConnections).toBe(10);
      expect(stats.stats?.healthyCount).toBe(8);
      expect(stats.stats?.healthPercentage).toBe(80);
    });

    it("should cleanup old records keeping last 100", async () => {
      const t = convexTest(schema, modules);

      // Insert 105 records
      for (let i = 0; i < 105; i++) {
        await t.mutation(internal.oauthTokenMonitor.recordTokenHealthCheck, {
          totalConnections: i,
          healthyCount: i,
          expiringSoonCount: 0,
          expiredCount: 0,
          invalidCount: 0,
          missingCount: 0,
          refreshedCount: 0,
          refreshFailedCount: 0,
          durationMs: 100,
        });
      }

      // Check only 100 remain
      const allRecords = await t.run(async (ctx) => {
        return await ctx.db.query("oauthTokenHealthChecks").collect();
      });

      expect(allRecords.length).toBeLessThanOrEqual(100);
    });
  });

  describe("getTokenHealthStats", () => {
    it("should return null stats when no checks recorded", async () => {
      const t = convexTest(schema, modules);

      const stats = await t.query(internal.oauthTokenMonitor.getTokenHealthStats, {});

      expect(stats.lastCheck).toBeNull();
      expect(stats.stats).toBeNull();
    });

    it("should calculate health percentage correctly", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthTokenMonitor.recordTokenHealthCheck, {
        totalConnections: 4,
        healthyCount: 3,
        expiringSoonCount: 0,
        expiredCount: 1,
        invalidCount: 0,
        missingCount: 0,
        refreshedCount: 0,
        refreshFailedCount: 0,
        durationMs: 50,
      });

      const stats = await t.query(internal.oauthTokenMonitor.getTokenHealthStats, {});

      expect(stats.stats?.healthPercentage).toBe(75); // 3/4 = 75%
    });

    it("should return 100% when no connections", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.oauthTokenMonitor.recordTokenHealthCheck, {
        totalConnections: 0,
        healthyCount: 0,
        expiringSoonCount: 0,
        expiredCount: 0,
        invalidCount: 0,
        missingCount: 0,
        refreshedCount: 0,
        refreshFailedCount: 0,
        durationMs: 10,
      });

      const stats = await t.query(internal.oauthTokenMonitor.getTokenHealthStats, {});

      expect(stats.stats?.healthPercentage).toBe(100);
    });
  });
});
