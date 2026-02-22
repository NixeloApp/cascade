/**
 * Zoom Video Integration
 *
 * OAuth flow and meeting management for Zoom video conferencing.
 * Based on Cal.com's zoomvideo integration pattern.
 *
 * Note: Database operations (mutations/queries) are in zoomDb.ts
 * because this file uses "use node" for crypto APIs.
 */
"use node";

import { createHmac, randomBytes } from "node:crypto";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { logger } from "../lib/logger";

// ============================================================================
// OAuth CSRF Protection
// ============================================================================

/** Generate a CSRF-safe state token */
function generateOAuthState(userId: string): string {
  const secret = process.env.ZOOM_CLIENT_SECRET;
  if (!secret) throw new Error("ZOOM_CLIENT_SECRET not configured");

  const timestamp = Date.now().toString();
  const nonce = randomBytes(8).toString("hex");
  const data = `${userId}:${timestamp}:${nonce}`;
  const signature = createHmac("sha256", secret).update(data).digest("hex").slice(0, 16);

  return Buffer.from(`${data}:${signature}`).toString("base64url");
}

/** Validate CSRF state token */
function validateOAuthState(state: string, userId: string): boolean {
  const secret = process.env.ZOOM_CLIENT_SECRET;
  if (!secret) return false;

  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;

    const [stateUserId, timestamp, _nonce, signature] = parts;

    // Check userId matches
    if (stateUserId !== userId) return false;

    // Check not expired (10 minutes)
    const ts = Number.parseInt(timestamp, 10);
    if (Number.isNaN(ts) || Date.now() - ts > 10 * 60 * 1000) return false;

    // Verify signature
    const data = `${stateUserId}:${timestamp}:${_nonce}`;
    const expectedSignature = createHmac("sha256", secret).update(data).digest("hex").slice(0, 16);

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

// ============================================================================
// Zoom API Response Types
// ============================================================================

/** Response from Zoom OAuth token endpoint */
interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

/** Response from Zoom user info endpoint */
interface ZoomUserInfoResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

/** Response from Zoom create meeting endpoint */
interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  password?: string;
  start_url: string;
}

// Zoom OAuth endpoints
const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

/**
 * Generate OAuth authorization URL for Zoom
 * Requires authentication for CSRF protection
 */
export const getAuthUrl = action({
  args: {
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication for CSRF protection
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const clientId = process.env.ZOOM_CLIENT_ID;
    if (!clientId) {
      throw new Error("ZOOM_CLIENT_ID not configured");
    }

    // Generate CSRF state token
    const state = generateOAuthState(userId);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: args.redirectUri,
      scope: "meeting:write meeting:read user:read",
      state,
    });

    return `${ZOOM_AUTH_URL}?${params.toString()}`;
  },
});

/**
 * Exchange OAuth code for access token
 */
export const exchangeCodeForToken = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scope: string;
  }> => {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Zoom OAuth credentials not configured");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    let response: Response;
    try {
      response = await fetchWithTimeout(
        ZOOM_TOKEN_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: args.code,
            redirect_uri: args.redirectUri,
          }),
        },
        10000,
      );
    } catch (error) {
      logger.error("Zoom OAuth exchange failed", { error, redirectUri: args.redirectUri });
      throw new Error("Failed to exchange Zoom OAuth code. Please try again.");
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unknown error (failed to read response body)";
      }
      logger.error("Zoom OAuth exchange returned error", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to exchange code: ${errorText}`);
    }

    const data = (await response.json()) as ZoomTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  },
});

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = internalAction({
  args: {
    refreshToken: v.string(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> => {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Zoom OAuth credentials not configured");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    let response: Response;
    try {
      response = await fetchWithTimeout(
        ZOOM_TOKEN_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: args.refreshToken,
          }),
        },
        10000,
      );
    } catch (error) {
      logger.error("Zoom token refresh failed", { error });
      throw new Error("Failed to refresh Zoom token. Please try again.");
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unknown error (failed to read response body)";
      }
      logger.error("Zoom token refresh returned error", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const data = (await response.json()) as ZoomTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  },
});

/**
 * Get Zoom user info
 */
export const getUserInfo = internalAction({
  args: {
    accessToken: v.string(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }> => {
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${ZOOM_API_BASE}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${args.accessToken}`,
          },
        },
        10000,
      );
    } catch (error) {
      logger.error("Zoom user info fetch failed", { error });
      throw new Error("Failed to get Zoom user info. Please try again.");
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unknown error (failed to read response body)";
      }
      logger.error("Zoom user info fetch returned error", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to get user info: ${errorText}`);
    }

    const data = (await response.json()) as ZoomUserInfoResponse;
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  },
});

/**
 * Handle OAuth callback - exchange code and store connection
 */
export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args): Promise<{ connectionId: Id<"videoConnections">; email: string }> => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate CSRF state
    if (!validateOAuthState(args.state, userId)) {
      throw new Error("Invalid or expired OAuth state. Please try again.");
    }

    // Exchange code for tokens
    const tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      scope: string;
    } = await ctx.runAction(internal.integrations.zoom.exchangeCodeForToken, {
      code: args.code,
      redirectUri: args.redirectUri,
    });

    // Get user info
    const userInfo: { id: string; email: string; firstName: string; lastName: string } =
      await ctx.runAction(internal.integrations.zoom.getUserInfo, {
        accessToken: tokens.accessToken,
      });

    // Store connection (in zoomDb.ts)
    const connectionId: Id<"videoConnections"> = await ctx.runMutation(
      internal.integrations.zoomDb.storeConnection,
      {
        userId,
        providerAccountId: userInfo.id,
        providerEmail: userInfo.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
        scope: tokens.scope,
      },
    );

    return {
      connectionId,
      email: userInfo.email,
    };
  },
});

/**
 * Create a Zoom meeting
 */
export const createMeeting = action({
  args: {
    topic: v.string(),
    startTime: v.number(), // Unix timestamp in ms
    duration: v.number(), // Minutes
    agenda: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    meetingId: string;
    joinUrl: string;
    password: string;
    hostUrl: string;
  }> => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's Zoom connection (from zoomDb.ts)
    const connection = await ctx.runQuery(internal.integrations.zoomDb.getConnection, {
      userId,
    });

    if (!connection) {
      throw new Error("Zoom not connected. Please connect your Zoom account first.");
    }

    // Check if token needs refresh
    let accessToken = connection.accessToken;
    if (connection.expiresAt && connection.expiresAt < Date.now() + 5 * 60 * 1000) {
      // Token expires in less than 5 minutes, refresh it
      if (!connection.refreshToken) {
        throw new Error("Zoom token expired and no refresh token available. Please reconnect.");
      }

      const refreshed = await ctx.runAction(internal.integrations.zoom.refreshAccessToken, {
        refreshToken: connection.refreshToken,
      });

      // Update stored tokens (in zoomDb.ts)
      await ctx.runMutation(internal.integrations.zoomDb.updateTokens, {
        connectionId: connection._id,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
      });

      accessToken = refreshed.accessToken;
    }

    // Create meeting via Zoom API
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${ZOOM_API_BASE}/users/me/meetings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            topic: args.topic,
            type: 2, // Scheduled meeting
            start_time: new Date(args.startTime).toISOString(),
            duration: args.duration,
            timezone: "UTC",
            agenda: args.agenda,
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: true,
              waiting_room: false,
              auto_recording: "none",
            },
          }),
        },
        15000,
      ); // Slightly longer timeout for creation
    } catch (error) {
      logger.error("Zoom meeting creation failed", { error, topic: args.topic });
      throw new Error("Failed to create Zoom meeting. Please try again.");
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unknown error (failed to read response body)";
      }
      logger.error("Zoom meeting creation returned error", {
        status: response.status,
        error: errorText,
        topic: args.topic,
      });
      throw new Error(`Failed to create Zoom meeting: ${errorText}`);
    }

    const data = (await response.json()) as ZoomMeetingResponse;

    // Update last used timestamp (in zoomDb.ts)
    await ctx.runMutation(internal.integrations.zoomDb.updateLastUsed, {
      connectionId: connection._id,
    });

    return {
      meetingId: String(data.id),
      joinUrl: data.join_url,
      password: data.password || "",
      hostUrl: data.start_url,
    };
  },
});
