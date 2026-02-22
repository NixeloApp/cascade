
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "../testUtils";

describe("Zoom Integration DB", () => {
  const setup = async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    return { t, userId, asUser };
  };

  it("should store and update connection", async () => {
    const { t, userId } = await setup();

    // Initial store
    const connectionId = await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "access_token_1",
      refreshToken: "refresh_token_1",
      expiresAt: Date.now() + 3600000,
      scope: "meeting:write",
    });

    const connection = await t.run(async (ctx) => await ctx.db.get(connectionId));
    expect(connection).toMatchObject({
      userId,
      provider: "zoom",
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "access_token_1",
      isActive: true,
    });

    // Update existing
    const newExpiresAt = Date.now() + 7200000;
    const updatedId = await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123", // Same account ID
      providerEmail: "zoom@example.com",
      accessToken: "access_token_2",
      refreshToken: "refresh_token_2",
      expiresAt: newExpiresAt,
      scope: "meeting:write meeting:read",
    });

    expect(updatedId).toEqual(connectionId); // Should be same ID

    const updated = await t.run(async (ctx) => await ctx.db.get(connectionId));
    expect(updated).toMatchObject({
      accessToken: "access_token_2",
      refreshToken: "refresh_token_2",
      expiresAt: newExpiresAt,
      scope: "meeting:write meeting:read",
      isActive: true,
    });
  });

  it("should check connection status", async () => {
    const { t, userId, asUser } = await setup();

    // Not connected initially
    const status1 = await asUser.query(api.integrations.zoomDb.isConnected);
    expect(status1).toEqual({ connected: false });

    // Store connection
    await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
      scope: "scope",
    });

    // Connected
    const status2 = await asUser.query(api.integrations.zoomDb.isConnected);
    expect(status2).toEqual({
      connected: true,
      email: "zoom@example.com",
    });
  });

  it("should disconnect", async () => {
    const { t, userId, asUser } = await setup();

    // Store connection
    const connectionId = await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
      scope: "scope",
    });

    // Disconnect
    const result = await asUser.mutation(api.integrations.zoomDb.disconnect);
    expect(result).toEqual({ success: true });

    // Verify inactive in DB
    const connection = await t.run(async (ctx) => await ctx.db.get(connectionId));
    expect(connection?.isActive).toBe(false);

    // Verify isConnected returns false
    const status = await asUser.query(api.integrations.zoomDb.isConnected);
    expect(status).toEqual({ connected: false });
  });

  it("should update tokens", async () => {
    const { t, userId } = await setup();

    const connectionId = await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "old_access",
      refreshToken: "old_refresh",
      expiresAt: 1000,
      scope: "scope",
    });

    const newExpiresAt = 2000;
    await t.mutation(internal.integrations.zoomDb.updateTokens, {
      connectionId,
      accessToken: "new_access",
      refreshToken: "new_refresh",
      expiresAt: newExpiresAt,
    });

    const connection = await t.run(async (ctx) => await ctx.db.get(connectionId));
    expect(connection).toMatchObject({
      accessToken: "new_access",
      refreshToken: "new_refresh",
      expiresAt: newExpiresAt,
    });
  });

  it("should update last used timestamp", async () => {
    const { t, userId } = await setup();

    const connectionId = await t.mutation(internal.integrations.zoomDb.storeConnection, {
      userId,
      providerAccountId: "zoom_user_123",
      providerEmail: "zoom@example.com",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: 1000,
      scope: "scope",
    });

    const before = Date.now();
    await t.mutation(internal.integrations.zoomDb.updateLastUsed, { connectionId });
    const after = Date.now();

    const connection = await t.run(async (ctx) => await ctx.db.get(connectionId));
    expect(connection?.lastUsedAt).toBeGreaterThanOrEqual(before);
    expect(connection?.lastUsedAt).toBeLessThanOrEqual(after);
  });
});
