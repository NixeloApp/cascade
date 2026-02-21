import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Google Calendar Integration", () => {
  it("should connect, sync, and disconnect Google Calendar", async () => {
    const t = convexTest(schema, modules);
    register(t);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // 1. Connect Google Calendar
    const connectionId = await asUser.mutation(api.googleCalendar.connectGoogle, {
      providerAccountId: "google-user-123",
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      expiresAt: Date.now() + 3600000,
      syncDirection: "bidirectional",
    });

    expect(connectionId).toBeDefined();

    // Verify connection exists and tokens are not exposed
    const connection = await asUser.query(api.googleCalendar.getConnection, {});
    expect(connection).not.toBeNull();
    expect(connection?.providerAccountId).toBe("google-user-123");
    expect(connection?.hasAccessToken).toBe(true);
    expect(connection?.hasRefreshToken).toBe(true);
    // Ensure tokens are not returned in public API
    expect((connection as any).accessToken).toBeUndefined();

    // Verify tokens are encrypted in DB
    const rawConnection = await t.run(async (ctx) => ctx.db.get(connectionId));
    expect(rawConnection?.accessToken).not.toBe("access-token-123");
    expect(rawConnection?.refreshToken).not.toBe("refresh-token-123");

    // Verify internal decryption works
    const decrypted = await t.mutation(internal.googleCalendar.getDecryptedTokens, {
      connectionId,
    });
    expect(decrypted?.accessToken).toBe("access-token-123");
    expect(decrypted?.refreshToken).toBe("refresh-token-123");

    // 2. Sync events from Google
    const now = Date.now();
    const events = [
      {
        googleEventId: "evt-1",
        title: "Meeting 1",
        description: "Discuss project",
        startTime: now,
        endTime: now + 3600000,
        allDay: false,
        location: "Room A",
        attendees: ["user@example.com"],
      },
      {
        googleEventId: "evt-2",
        title: "All Day Event",
        startTime: now + 86400000,
        endTime: now + 86400000 * 2,
        allDay: true,
      },
    ];

    const syncResult = await t.mutation(api.googleCalendar.syncFromGoogle, {
      connectionId,
      events,
    });

    expect(syncResult.imported).toBe(2);

    // Verify events in DB
    const dbEvents = await t.run(async (ctx) =>
      ctx.db
        .query("calendarEvents")
        .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
        .collect(),
    );

    expect(dbEvents).toHaveLength(2);
    const meeting = dbEvents.find((e) => e.title === "Meeting 1");
    expect(meeting).toBeDefined();
    expect(meeting?.description).toBe("Discuss project");
    expect(meeting?.location).toBe("Room A");
    expect(meeting?.externalAttendees).toEqual(["user@example.com"]);

    // 3. Disconnect
    await asUser.mutation(api.googleCalendar.disconnectGoogle, {});

    // Verify connection is gone
    const connectionAfterDisconnect = await asUser.query(api.googleCalendar.getConnection, {});
    expect(connectionAfterDisconnect).toBeNull();

    const rawConnectionAfter = await t.run(async (ctx) => ctx.db.get(connectionId));
    expect(rawConnectionAfter).toBeNull();
  });

  it("should respect sync direction", async () => {
    const t = convexTest(schema, modules);
    register(t);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Connect with export-only sync
    const connectionId = await asUser.mutation(api.googleCalendar.connectGoogle, {
      providerAccountId: "google-user-456",
      accessToken: "token",
      syncDirection: "export",
    });

    const events = [
      {
        googleEventId: "evt-3",
        title: "Should Not Import",
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        allDay: false,
      },
    ];

    const result = await t.mutation(api.googleCalendar.syncFromGoogle, {
      connectionId,
      events,
    });

    expect(result.imported).toBe(0);

    const dbEvents = await t.run(async (ctx) =>
      ctx.db
        .query("calendarEvents")
        .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
        .collect(),
    );
    expect(dbEvents).toHaveLength(0);
  });
});
