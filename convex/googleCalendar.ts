import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { decrypt, encrypt } from "./lib/encryption";
import { notFound } from "./lib/errors";
import { syncDirections } from "./validators";

/** Connect a Google Calendar account via OAuth. Encrypts tokens before storage. Called from HTTP action. */
export const connectGoogleInternal = internalMutation({
  args: {
    userId: v.id("users"),
    providerAccountId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncDirection: v.optional(syncDirections),
  },
  returns: v.object({ success: v.literal(true), connectionId: v.id("calendarConnections") }),
  handler: async (ctx, args) => {
    const { userId, ...connectionArgs } = args;

    // Encrypt tokens before storage
    const encryptedAccessToken = await encrypt(connectionArgs.accessToken);
    const encryptedRefreshToken = connectionArgs.refreshToken
      ? await encrypt(connectionArgs.refreshToken)
      : undefined;

    // Check if connection already exists for this provider
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", "google"))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: connectionArgs.providerAccountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: connectionArgs.expiresAt,
        syncDirection: connectionArgs.syncDirection || "bidirectional",
        updatedAt: now,
      });
      return { success: true, connectionId: existing._id } as const;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("calendarConnections", {
      userId,
      provider: "google",
      providerAccountId: connectionArgs.providerAccountId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: connectionArgs.expiresAt,
      syncDirection: connectionArgs.syncDirection || "bidirectional",
      syncEnabled: true,
      lastSyncAt: undefined,
      updatedAt: now,
    });
    return { success: true, connectionId } as const;
  },
});

/** Connect Google Calendar for the authenticated user via OAuth callback. Encrypts and stores tokens. */
export const connectGoogle = authenticatedMutation({
  args: {
    providerAccountId: v.string(), // Google email
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncDirection: v.optional(syncDirections),
  },
  returns: v.object({ success: v.literal(true), connectionId: v.id("calendarConnections") }),
  handler: async (ctx, args) => {
    // Encrypt tokens before storage
    const encryptedAccessToken = await encrypt(args.accessToken);
    const encryptedRefreshToken = args.refreshToken ? await encrypt(args.refreshToken) : undefined;

    // Check if connection already exists for this provider
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: args.providerAccountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return { success: true, connectionId: existing._id } as const;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("calendarConnections", {
      userId: ctx.userId,
      provider: "google",
      providerAccountId: args.providerAccountId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt,
      syncEnabled: true,
      syncDirection: args.syncDirection ?? "bidirectional",
      lastSyncAt: undefined,
      updatedAt: now,
    });
    return { success: true, connectionId } as const;
  },
});

/** Get the current user's Google Calendar connection status without exposing tokens. */
export const getConnection = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection) return null;

    // Return connection without exposing tokens to frontend
    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      userId: connection.userId,
      provider: connection.provider,
      providerAccountId: connection.providerAccountId,
      expiresAt: connection.expiresAt,
      syncEnabled: connection.syncEnabled,
      syncDirection: connection.syncDirection,
      lastSyncAt: connection.lastSyncAt,
      updatedAt: connection.updatedAt,
      // Don't expose tokens to frontend
      hasAccessToken: !!connection.accessToken,
      hasRefreshToken: !!connection.refreshToken,
    };
  },
});

/** Retrieve decrypted OAuth tokens for a calendar connection. Internal use only for sync processes. */
export const getDecryptedTokens = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    return {
      accessToken: await decrypt(connection.accessToken),
      refreshToken: connection.refreshToken ? await decrypt(connection.refreshToken) : undefined,
      expiresAt: connection.expiresAt,
    };
  },
});

/** Disconnect and delete the current user's Google Calendar connection. */
export const disconnectGoogle = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
    return { success: true } as const;
  },
});

/** Update sync preferences (enabled/direction) for the current user's Google Calendar connection. */
export const updateSyncSettings = authenticatedMutation({
  args: {
    syncEnabled: v.optional(v.boolean()),
    syncDirection: v.optional(syncDirections),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection) {
      throw notFound("calendarConnection");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.syncEnabled !== undefined) updates.syncEnabled = args.syncEnabled;
    if (args.syncDirection !== undefined) updates.syncDirection = args.syncDirection;

    await ctx.db.patch(connection._id, updates);
    return { success: true } as const;
  },
});

/** Store a refreshed OAuth access token. Called by the backend sync process after token renewal. */
export const refreshToken = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    newAccessToken: v.string(),
    newRefreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw notFound("calendarConnection", args.connectionId);

    // Encrypt new tokens before storage
    const encryptedAccessToken = await encrypt(args.newAccessToken);
    const encryptedRefreshToken = args.newRefreshToken
      ? await encrypt(args.newRefreshToken)
      : connection.refreshToken;

    await ctx.db.patch(args.connectionId, {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/** Update the lastSyncAt timestamp for a calendar connection after a successful sync. */
export const markSynced = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** List all calendar provider connections for the current user. */
export const listConnections = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);
  },
});

/** Import Google Calendar events into Nixelo calendar. Respects sync direction settings. */
export const syncFromGoogle = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    events: v.array(
      v.object({
        googleEventId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        allDay: v.boolean(),
        location: v.optional(v.string()),
        attendees: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw notFound("calendarConnection", args.connectionId);

    if (!connection.syncEnabled || connection.syncDirection === "export") {
      return { imported: 0 };
    }

    const now = Date.now();

    // Insert all events in parallel
    await Promise.all(
      args.events.map((event) =>
        ctx.db.insert("calendarEvents", {
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          allDay: event.allDay,
          location: event.location,
          eventType: "meeting",
          organizerId: connection.userId,
          attendeeIds: [], // Would need to map external emails to user IDs
          externalAttendees: event.attendees,
          status: "confirmed",
          isRecurring: false,
          updatedAt: now,
        }),
      ),
    );

    await ctx.db.patch(args.connectionId, {
      lastSyncAt: now,
      updatedAt: now,
    });

    return { imported: args.events.length };
  },
});

/** Get calendar events updated since the last sync, for export to Google Calendar. */
export const getEventsToSync = authenticatedQuery({
  args: {
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get connection
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection?.syncEnabled || connection.syncDirection === "import") {
      return [];
    }

    // Get user's events since last sync
    const sinceTime = args.since ?? connection.lastSyncAt ?? 0;

    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_organizer", (q) => q.eq("organizerId", ctx.userId))
      .filter((q) => q.gte(q.field("updatedAt"), sinceTime))
      .take(BOUNDED_LIST_LIMIT);
  },
});
