/**
 * OAuth Health Check Module
 *
 * Synthetic monitoring for Google OAuth to catch issues before users do.
 * Runs every 15 minutes to verify:
 * 1. OAuth endpoint is available and redirects correctly (catches nginx/routing issues)
 * 2. Refresh token exchange works
 * 3. Access token can fetch user info
 *
 * Required environment variables:
 * - OAUTH_MONITOR_GOOGLE_CLIENT_ID
 * - OAUTH_MONITOR_GOOGLE_CLIENT_SECRET
 * - OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN (from OAuth Playground)
 * - SLACK_OAUTH_ALERT_WEBHOOK_URL (optional)
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { fetchWithTimeout } from "./lib/fetchWithTimeout";
import { logger } from "./lib/logger";
import {
  CONSECUTIVE_FAILURE_WINDOW,
  FETCH_BUFFER_MULTIPLIER,
  MAX_HEALTH_CHECK_RECORDS,
} from "./lib/queryLimits";

// Store health check results for monitoring dashboard
export const recordHealthCheck = internalMutation({
  args: {
    success: v.boolean(),
    latencyMs: v.number(),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Persist to database for tracking consecutive failures
    await ctx.db.insert("oauthHealthChecks", {
      success: args.success,
      latencyMs: args.latencyMs,
      error: args.error,
      errorCode: args.errorCode,
      timestamp: Date.now(),
    });

    logger.info(
      `[OAuth Health] ${args.success ? "✓" : "✗"} ${args.latencyMs}ms ${args.error || ""}`,
    );

    // Clean up old records (keep last MAX_HEALTH_CHECK_RECORDS)
    // Fetch with buffer to check if cleanup is needed
    const fetchBuffer = MAX_HEALTH_CHECK_RECORDS * FETCH_BUFFER_MULTIPLIER;
    const recentChecks = await ctx.db
      .query("oauthHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .take(fetchBuffer);

    if (recentChecks.length > MAX_HEALTH_CHECK_RECORDS) {
      const toDelete = recentChecks.slice(MAX_HEALTH_CHECK_RECORDS);
      for (const check of toDelete) {
        await ctx.db.delete(check._id);
      }
    }
  },
});

// Get count of consecutive failures from most recent checks
export const getConsecutiveFailureCount = internalQuery({
  args: {},
  handler: async (ctx): Promise<number> => {
    const recentChecks = await ctx.db
      .query("oauthHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .take(CONSECUTIVE_FAILURE_WINDOW);

    let consecutiveFailures = 0;
    for (const check of recentChecks) {
      if (!check.success) {
        consecutiveFailures++;
      } else {
        break; // Stop counting at first success
      }
    }
    return consecutiveFailures;
  },
});

export const getHealthStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const latestCheck = await ctx.db
      .query("oauthHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .first();

    if (!latestCheck) {
      return {
        lastCheck: null,
        isHealthy: true, // No checks yet, assume healthy
        consecutiveFailures: 0,
      };
    }

    const consecutiveFailures = await ctx.db
      .query("oauthHealthChecks")
      .withIndex("by_timestamp")
      .order("desc")
      .take(CONSECUTIVE_FAILURE_WINDOW);

    let failureCount = 0;
    for (const check of consecutiveFailures) {
      if (!check.success) {
        failureCount++;
      } else {
        break;
      }
    }

    return {
      lastCheck: new Date(latestCheck.timestamp).toISOString(),
      isHealthy: latestCheck.success,
      consecutiveFailures: failureCount,
      lastError: latestCheck.error,
    };
  },
});

/**
 * Main health check action
 * Called by cron job every 15 minutes
 */
export const checkGoogleOAuthHealth = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const clientId = process.env.OAUTH_MONITOR_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.OAUTH_MONITOR_GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN;
    const convexSiteUrl = process.env.CONVEX_SITE_URL;

    // Skip if not configured (development environments)
    if (!(clientId && clientSecret && refreshToken)) {
      logger.info("[OAuth Health] Skipped: monitoring not configured");
      return;
    }

    const startTime = Date.now();

    try {
      // Step 0: Verify OAuth endpoint is accessible (catches nginx/routing issues)
      if (convexSiteUrl) {
        const endpointResponse = await fetchWithTimeout(`${convexSiteUrl}/google/auth`, {
          method: "GET",
          redirect: "manual", // Don't follow redirects
        });

        // Should be a 302 redirect to Google
        if (endpointResponse.status !== 302) {
          throw new Error(
            `OAuth endpoint check failed: expected 302 redirect, got ${endpointResponse.status}`,
          );
        }

        const location = endpointResponse.headers.get("location");
        if (!location?.includes("accounts.google.com")) {
          throw new Error(`OAuth endpoint check failed: redirect doesn't point to Google OAuth`);
        }

        logger.info("[OAuth Health] ✓ Endpoint check passed");
      }

      // Step 1: Exchange refresh token for access token
      const tokenResponse = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = (await tokenResponse.json().catch(() => ({}))) as {
          error?: string;
          error_description?: string;
        };
        throw new Error(
          `Token refresh failed: ${errorData.error_description || errorData.error || tokenResponse.status}`,
        );
      }

      const tokens = (await tokenResponse.json()) as { access_token: string };
      const accessToken = tokens.access_token;

      // Step 2: Verify access token works by fetching user info
      const userInfoResponse = await fetchWithTimeout(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        throw new Error(`User info fetch failed: ${userInfoResponse.status}`);
      }

      const latencyMs = Date.now() - startTime;

      // Success!
      logger.info(`[OAuth Health] ✓ Passed (${latencyMs}ms)`);

      await ctx.runMutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs,
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`[OAuth Health] ✗ Failed (${latencyMs}ms): ${errorMessage}`);

      await ctx.runMutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs,
        error: errorMessage,
      });

      // Query consecutive failures from database
      const consecutiveFailures = await ctx.runQuery(
        internal.oauthHealthCheck.getConsecutiveFailureCount,
      );

      // Send alert after 2 consecutive failures
      if (consecutiveFailures >= 2) {
        await sendSlackAlert(errorMessage);
      }
    }
  },
});

/**
 * Send alert to Slack
 */
async function sendSlackAlert(errorMessage: string): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_OAUTH_ALERT_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    logger.warn("[OAuth Health] Alert skipped: Slack webhook not configured");
    return;
  }

  try {
    const response = await fetchWithTimeout(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "🚨 *OAuth Health Check Alert*",
        attachments: [
          {
            color: "danger",
            title: "Google OAuth Health Check Failed",
            text: errorMessage,
            fields: [
              {
                title: "Service",
                value: "Nixelo",
                short: true,
              },
              {
                title: "Time",
                value: new Date().toISOString(),
                short: true,
              },
            ],
            footer: "OAuth Monitor",
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.error(`[OAuth Health] Failed to send Slack alert: ${response.status}`);
    } else {
      logger.info("[OAuth Health] Alert sent to Slack");
    }
  } catch (slackError) {
    logger.error("[OAuth Health] Failed to send Slack alert:", { error: slackError });
  }
}
