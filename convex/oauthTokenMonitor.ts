/**
 * OAuth Token Health Monitoring
 *
 * Monitors the health of user OAuth tokens (Google Calendar connections).
 * Runs periodically to:
 * 1. Check token status: healthy, expiring_soon, expired, invalid, missing
 * 2. Auto-refresh expiring tokens before they expire
 * 3. Report aggregated health statistics
 *
 * This complements the synthetic health check (oauthHealthCheck.ts) by
 * monitoring actual user tokens rather than a monitoring token.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { BOUNDED_DELETE_BATCH, BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { encrypt } from "./lib/encryption";
import { getGoogleClientId, getGoogleClientSecret, isGoogleOAuthConfigured } from "./lib/env";
import { MINUTE } from "./lib/timeUtils";

// Token status types
export type TokenStatus = "healthy" | "expiring_soon" | "expired" | "invalid" | "missing";

// Token expiration thresholds
const EXPIRING_SOON_THRESHOLD = 30 * MINUTE; // 30 minutes before expiry
const REFRESH_THRESHOLD = 15 * MINUTE; // Auto-refresh if expiring within 15 minutes

/**
 * Check the health of a single calendar connection's tokens
 */
export const checkConnectionTokenHealth = internalQuery({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ status: TokenStatus; needsRefresh: boolean; expiresAt?: number }> => {
    const connection = await ctx.db.get(args.connectionId);

    if (!connection) {
      return { status: "missing", needsRefresh: false };
    }

    // Check if tokens exist
    if (!connection.accessToken) {
      return { status: "missing", needsRefresh: false };
    }

    const now = Date.now();
    const expiresAt = connection.expiresAt;

    // If no expiration time, assume token is valid (some OAuth providers don't return expires_in)
    if (!expiresAt) {
      return { status: "healthy", needsRefresh: false, expiresAt };
    }

    // Check if expired
    if (expiresAt < now) {
      return {
        status: "expired",
        needsRefresh: !!connection.refreshToken, // Can refresh if we have a refresh token
        expiresAt,
      };
    }

    // Check if expiring soon
    if (expiresAt < now + EXPIRING_SOON_THRESHOLD) {
      return {
        status: "expiring_soon",
        needsRefresh: !!connection.refreshToken,
        expiresAt,
      };
    }

    return { status: "healthy", needsRefresh: false, expiresAt };
  },
});

/**
 * Get all calendar connections that need token refresh
 */
export const getConnectionsNeedingRefresh = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const refreshThreshold = now + REFRESH_THRESHOLD;

    // Get connections with expiring tokens using index (bounded for safety)
    // Use expiresAt index and then filter by refreshToken
    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", refreshThreshold))
      .filter((q) => q.neq(q.field("refreshToken"), undefined))
      .take(BOUNDED_DELETE_BATCH);

    return connections.map((c) => ({
      _id: c._id,
      userId: c.userId,
      provider: c.provider,
      expiresAt: c.expiresAt,
    }));
  },
});

/**
 * Refresh a token for a calendar connection
 */
export const refreshConnectionToken = internalAction({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Check if OAuth is configured before calling throwing getters
    if (!isGoogleOAuthConfigured()) {
      return { success: false, error: "Google OAuth not configured" };
    }

    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();

    // Get decrypted refresh token
    const tokens = await ctx.runMutation(internal.googleCalendar.getDecryptedTokens, {
      connectionId: args.connectionId,
    });

    if (!tokens?.refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    try {
      // Exchange refresh token for new access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = (await tokenResponse.json().catch(() => ({}))) as {
          error?: string;
          error_description?: string;
        };
        return {
          success: false,
          error: errorData.error_description || errorData.error || `HTTP ${tokenResponse.status}`,
        };
      }

      const newTokens = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };

      // Calculate new expiration time
      const expiresAt = newTokens.expires_in ? Date.now() + newTokens.expires_in * 1000 : undefined;

      // Encrypt and store the new access token
      const encryptedAccessToken = await encrypt(newTokens.access_token);
      const encryptedRefreshToken = newTokens.refresh_token
        ? await encrypt(newTokens.refresh_token)
        : undefined;

      await ctx.runMutation(internal.oauthTokenMonitor.updateConnectionTokens, {
        connectionId: args.connectionId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Update connection tokens (internal only)
 */
export const updateConnectionTokens = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      accessToken: args.accessToken,
      updatedAt: Date.now(),
    };

    if (args.refreshToken) {
      updates.refreshToken = args.refreshToken;
    }
    if (args.expiresAt !== undefined) {
      updates.expiresAt = args.expiresAt;
    }

    await ctx.db.patch(args.connectionId, updates);
  },
});

/**
 * Record token health check result
 */
export const recordTokenHealthCheck = internalMutation({
  args: {
    totalConnections: v.number(),
    healthyCount: v.number(),
    expiringSoonCount: v.number(),
    expiredCount: v.number(),
    invalidCount: v.number(),
    missingCount: v.number(),
    refreshedCount: v.number(),
    refreshFailedCount: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthTokenHealthChecks", {
      ...args,
      timestamp: Date.now(),
    });

    // Clean up old records (keep last 100)
    // Fetch 150 to check if cleanup is needed, then delete excess
    const oldRecords = await ctx.db
      .query("oauthTokenHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .take(150);

    if (oldRecords.length > 100) {
      for (const record of oldRecords.slice(100)) {
        await ctx.db.delete(record._id);
      }
    }
  },
});

/**
 * Get token health statistics
 */
export const getTokenHealthStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const latestCheck = await ctx.db
      .query("oauthTokenHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .first();

    if (!latestCheck) {
      return {
        lastCheck: null,
        stats: null,
      };
    }

    return {
      lastCheck: new Date(latestCheck.timestamp).toISOString(),
      stats: {
        totalConnections: latestCheck.totalConnections,
        healthyCount: latestCheck.healthyCount,
        expiringSoonCount: latestCheck.expiringSoonCount,
        expiredCount: latestCheck.expiredCount,
        invalidCount: latestCheck.invalidCount,
        missingCount: latestCheck.missingCount,
        refreshedCount: latestCheck.refreshedCount,
        refreshFailedCount: latestCheck.refreshFailedCount,
        healthPercentage:
          latestCheck.totalConnections > 0
            ? Math.round((latestCheck.healthyCount / latestCheck.totalConnections) * 100)
            : 100,
      },
    };
  },
});

/**
 * Main token health check action
 * Called by cron job to monitor all user tokens
 */
export const performTokenHealthCheck = internalAction({
  args: {
    autoRefresh: v.optional(v.boolean()), // Default: true
  },
  handler: async (ctx, args): Promise<void> => {
    const startTime = Date.now();
    const autoRefresh = args.autoRefresh ?? true;

    // Get all calendar connections
    const connections = await ctx.runQuery(internal.oauthTokenMonitor.getAllConnections);

    const stats = {
      totalConnections: connections.length,
      healthyCount: 0,
      expiringSoonCount: 0,
      expiredCount: 0,
      invalidCount: 0,
      missingCount: 0,
      refreshedCount: 0,
      refreshFailedCount: 0,
    };

    // Check each connection's token health
    for (const connection of connections) {
      const health = await ctx.runQuery(internal.oauthTokenMonitor.checkConnectionTokenHealth, {
        connectionId: connection._id,
      });

      switch (health.status) {
        case "healthy":
          stats.healthyCount++;
          break;
        case "expiring_soon":
          stats.expiringSoonCount++;
          // Auto-refresh expiring tokens
          if (autoRefresh && health.needsRefresh) {
            const refreshResult = await ctx.runAction(
              internal.oauthTokenMonitor.refreshConnectionToken,
              { connectionId: connection._id },
            );
            if (refreshResult.success) {
              stats.refreshedCount++;
              stats.healthyCount++; // Now healthy after refresh
              stats.expiringSoonCount--; // No longer expiring
            } else {
              stats.refreshFailedCount++;
              console.warn(
                `[Token Monitor] Failed to refresh token for connection ${connection._id}: ${refreshResult.error}`,
              );
            }
          }
          break;
        case "expired":
          stats.expiredCount++;
          // Try to refresh expired tokens if we have a refresh token
          if (autoRefresh && health.needsRefresh) {
            const refreshResult = await ctx.runAction(
              internal.oauthTokenMonitor.refreshConnectionToken,
              { connectionId: connection._id },
            );
            if (refreshResult.success) {
              stats.refreshedCount++;
              stats.healthyCount++;
              stats.expiredCount--;
            } else {
              stats.refreshFailedCount++;
            }
          }
          break;
        case "invalid":
          stats.invalidCount++;
          break;
        case "missing":
          stats.missingCount++;
          break;
      }
    }

    const durationMs = Date.now() - startTime;

    // Record the health check results
    await ctx.runMutation(internal.oauthTokenMonitor.recordTokenHealthCheck, {
      ...stats,
      durationMs,
    });

    console.log(
      `[Token Monitor] Checked ${stats.totalConnections} connections in ${durationMs}ms: ` +
        `${stats.healthyCount} healthy, ${stats.expiringSoonCount} expiring, ` +
        `${stats.expiredCount} expired, ${stats.refreshedCount} refreshed`,
    );
  },
});

/**
 * Get all calendar connections (for monitoring)
 * Bounded to BOUNDED_LIST_LIMIT for safety - if you have more connections,
 * consider pagination or increasing the limit.
 */
export const getAllConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calendarConnections").take(BOUNDED_LIST_LIMIT);
  },
});
