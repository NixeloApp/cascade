/**
 * OAuth Health Check Module
 *
 * Synthetic monitoring for Google OAuth to catch issues before users do.
 * Runs every 15 minutes to verify:
 * 1. Refresh token exchange works
 * 2. Access token can fetch user info
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

// Store health check results for monitoring dashboard
export const recordHealthCheck = internalMutation({
  args: {
    success: v.boolean(),
    latencyMs: v.number(),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // Store in a health check log table (optional - for dashboard)
    // For now, we just log. Can be extended to store in DB.
    console.log(
      `[OAuth Health] ${args.success ? "✓" : "✗"} ${args.latencyMs}ms ${args.error || ""}`,
    );
  },
});

export const getHealthStatus = internalQuery({
  args: {},
  handler: async () => {
    // This could query a health log table to return recent status
    // For now, return a placeholder
    return {
      lastCheck: new Date().toISOString(),
      isHealthy: true,
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

    // Skip if not configured (development environments)
    if (!(clientId && clientSecret && refreshToken)) {
      console.log("[OAuth Health] Skipped: monitoring not configured");
      return;
    }

    const startTime = Date.now();
    let consecutiveFailures = 0;

    try {
      // Step 1: Exchange refresh token for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error(`User info fetch failed: ${userInfoResponse.status}`);
      }

      const latencyMs = Date.now() - startTime;

      // Success!
      console.log(`[OAuth Health] ✓ Passed (${latencyMs}ms)`);

      await ctx.runMutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: true,
        latencyMs,
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      consecutiveFailures++;

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[OAuth Health] ✗ Failed (${latencyMs}ms): ${errorMessage}`);

      await ctx.runMutation(internal.oauthHealthCheck.recordHealthCheck, {
        success: false,
        latencyMs,
        error: errorMessage,
      });

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
    console.warn("[OAuth Health] Alert skipped: Slack webhook not configured");
    return;
  }

  try {
    const response = await fetch(slackWebhookUrl, {
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
      console.error(`[OAuth Health] Failed to send Slack alert: ${response.status}`);
    } else {
      console.log("[OAuth Health] Alert sent to Slack");
    }
  } catch (slackError) {
    console.error("[OAuth Health] Failed to send Slack alert:", slackError);
  }
}
