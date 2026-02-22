/**
 * Zoom Video Integration
 *
 * OAuth flow and meeting management for Zoom video conferencing.
 * Based on Cal.com's zoomvideo integration pattern.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";

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
 */
export const getAuthUrl = action({
  args: {
    redirectUri: v.string(),
  },
  handler: async (_ctx, args) => {
    const clientId = process.env.ZOOM_CLIENT_ID;
    if (!clientId) {
      throw new Error("ZOOM_CLIENT_ID not configured");
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: args.redirectUri,
      scope: "meeting:write meeting:read user:read",
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

    const response = await fetch(ZOOM_TOKEN_URL, {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
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

    const response = await fetch(ZOOM_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: args.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
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
    const response = await fetch(`${ZOOM_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
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
 * Store Zoom connection after OAuth callback
 */
export const storeConnection = internalMutation({
  args: {
    userId: v.id("users"),
    providerAccountId: v.string(),
    providerEmail: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing connection
    const existing = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "zoom"))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: args.providerAccountId,
        providerEmail: args.providerEmail,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("videoConnections", {
      userId: args.userId,
      provider: "zoom",
      providerAccountId: args.providerAccountId,
      providerEmail: args.providerEmail,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scope: args.scope,
      isActive: true,
      updatedAt: now,
    });
  },
});

/**
 * Handle OAuth callback - exchange code and store connection
 */
export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<{ connectionId: Id<"videoConnections">; email: string }> => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
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

    // Store connection
    const connectionId: Id<"videoConnections"> = await ctx.runMutation(
      internal.integrations.zoom.storeConnection,
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

    // Get user's Zoom connection
    const connection = await ctx.runQuery(internal.integrations.zoom.getConnection, {
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

      // Update stored tokens
      await ctx.runMutation(internal.integrations.zoom.updateTokens, {
        connectionId: connection._id,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
      });

      accessToken = refreshed.accessToken;
    }

    // Create meeting via Zoom API
    const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Zoom meeting: ${error}`);
    }

    const data = (await response.json()) as ZoomMeetingResponse;

    // Update last used timestamp
    await ctx.runMutation(internal.integrations.zoom.updateLastUsed, {
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

/**
 * Get user's Zoom connection (internal query)
 */
export const getConnection = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "zoom"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

/**
 * Update stored tokens after refresh
 */
export const updateTokens = internalMutation({
  args: {
    connectionId: v.id("videoConnections"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update last used timestamp
 */
export const updateLastUsed = internalMutation({
  args: {
    connectionId: v.id("videoConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastUsedAt: Date.now(),
    });
  },
});

/**
 * Disconnect Zoom (deactivate connection)
 */
export const disconnect = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "zoom"))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Check if user has connected Zoom
 */
export const isConnected = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("videoConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "zoom"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      connected: !!connection,
      email: connection?.providerEmail,
    };
  },
});
