/**
 * Tests for Video Connections functionality
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Video Connections", () => {
  describe("list", () => {
    it("should return empty list when no connections exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const connections = await asUser.query(api.videoConnections.list, {});

      expect(connections).toHaveLength(0);
    });

    it("should list active video connections", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Insert a test video connection
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId,
          provider: "zoom",
          providerAccountId: "test-zoom-account",
          providerEmail: "test@zoom.example.com",
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
          expiresAt: Date.now() + 3600000, // 1 hour from now
          scope: "meeting:write meeting:read",
          isActive: true,
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const connections = await asUser.query(api.videoConnections.list, {});

      expect(connections).toHaveLength(1);
      expect(connections[0].provider).toBe("zoom");
      expect(connections[0].email).toBe("test@zoom.example.com");
    });

    it("should not list inactive connections", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Insert an inactive video connection
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId,
          provider: "zoom",
          providerAccountId: "test-zoom-account",
          providerEmail: "test@zoom.example.com",
          accessToken: "test-access-token",
          isActive: false,
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const connections = await asUser.query(api.videoConnections.list, {});

      expect(connections).toHaveLength(0);
    });
  });

  describe("isProviderConnected", () => {
    it("should return false when not connected", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const result = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });

      expect(result.connected).toBe(false);
      expect(result.email).toBeUndefined();
    });

    it("should return true when connected", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Insert a test video connection
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId,
          provider: "zoom",
          providerAccountId: "test-zoom-account",
          providerEmail: "connected@zoom.example.com",
          accessToken: "test-access-token",
          isActive: true,
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const result = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });

      expect(result.connected).toBe(true);
      expect(result.email).toBe("connected@zoom.example.com");
    });

    it("should check specific provider only", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Insert a Zoom connection
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId,
          provider: "zoom",
          providerAccountId: "test-zoom-account",
          providerEmail: "test@zoom.example.com",
          accessToken: "test-access-token",
          isActive: true,
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Check Zoom - should be connected
      const zoomResult = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });
      expect(zoomResult.connected).toBe(true);

      // Check Google Meet - should not be connected
      const googleResult = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "google_meet",
      });
      expect(googleResult.connected).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("should disconnect a video provider", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Insert a test video connection
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId,
          provider: "zoom",
          providerAccountId: "test-zoom-account",
          providerEmail: "test@zoom.example.com",
          accessToken: "test-access-token",
          isActive: true,
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Verify connected
      let result = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });
      expect(result.connected).toBe(true);

      // Disconnect
      await asUser.mutation(api.videoConnections.disconnect, { provider: "zoom" });

      // Verify disconnected
      result = await asUser.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });
      expect(result.connected).toBe(false);
    });

    it("should not affect other users connections", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Insert connections for both users
      await t.run(async (ctx) => {
        await ctx.db.insert("videoConnections", {
          userId: user1,
          provider: "zoom",
          providerAccountId: "user1-zoom",
          providerEmail: "user1@zoom.example.com",
          accessToken: "token1",
          isActive: true,
          updatedAt: Date.now(),
        });
        await ctx.db.insert("videoConnections", {
          userId: user2,
          provider: "zoom",
          providerAccountId: "user2-zoom",
          providerEmail: "user2@zoom.example.com",
          accessToken: "token2",
          isActive: true,
          updatedAt: Date.now(),
        });
      });

      // User 1 disconnects
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.videoConnections.disconnect, { provider: "zoom" });

      // User 1 should be disconnected
      const result1 = await asUser1.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });
      expect(result1.connected).toBe(false);

      // User 2 should still be connected
      const asUser2 = asAuthenticatedUser(t, user2);
      const result2 = await asUser2.query(api.videoConnections.isProviderConnected, {
        provider: "zoom",
      });
      expect(result2.connected).toBe(true);
    });
  });
});
