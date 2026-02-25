import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { DAY, HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Event Reminders - listUpcoming", () => {
  async function createCalendarEvent(
    t: ReturnType<typeof convexTest>,
    organizerId: Id<"users">,
    options: {
      title?: string;
      startTime?: number;
      endTime?: number;
      attendeeIds?: Id<"users">[];
      status?: "confirmed" | "tentative" | "cancelled";
    } = {},
  ) {
    return await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("calendarEvents", {
        organizerId,
        title: options.title ?? "Test Event",
        startTime: options.startTime ?? now + HOUR, // 1 hour from now
        endTime: options.endTime ?? now + 2 * HOUR, // 2 hours from now
        attendeeIds: options.attendeeIds ?? [],
        allDay: false,
        eventType: "meeting",
        isRecurring: false,
        status: options.status ?? "confirmed",
        updatedAt: now,
      });
    });
  }

  it("should return upcoming reminders within the next week", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await createTestContext(t);

    const now = Date.now();
    // Event in 2 days
    const startTime = now + 2 * DAY;
    const eventId = await createCalendarEvent(t, userId, { startTime });

    // Create reminder 15 mins before (so scheduledFor is now + 2 days - 15 mins, which is < 1 week)
    const { reminderId } = await asUser.mutation(api.eventReminders.create, {
      eventId,
      reminderType: "email",
      minutesBefore: 15,
    });

    const upcoming = await asUser.query(api.eventReminders.listUpcoming, {});
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]._id).toBe(reminderId);
    expect(upcoming[0].event).not.toBeNull();
    expect(upcoming[0].event?.startTime).toBe(startTime);
  });

  it("should filter out past, distant future, and sent reminders", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await createTestContext(t);

    const now = Date.now();

    // 1. Past reminder (scheduled 1 hour ago)
    // Create event starting now, reminder 1 hour before -> scheduled 1 hour ago
    const pastEventId = await createCalendarEvent(t, userId, { startTime: now });
    await asUser.mutation(api.eventReminders.create, {
      eventId: pastEventId,
      reminderType: "email",
      minutesBefore: 60,
    });

    // 2. Distant future reminder (scheduled 8 days from now)
    // Create event in 9 days, reminder 1 day before -> scheduled 8 days from now
    const distantEventId = await createCalendarEvent(t, userId, { startTime: now + 9 * DAY });
    await asUser.mutation(api.eventReminders.create, {
      eventId: distantEventId,
      reminderType: "email",
      minutesBefore: 24 * 60, // 1 day
    });

    // 3. Sent reminder (scheduled tomorrow but sent)
    const sentEventId = await createCalendarEvent(t, userId, { startTime: now + 1 * DAY });
    const { reminderId: sentReminderId } = await asUser.mutation(api.eventReminders.create, {
      eventId: sentEventId,
      reminderType: "email",
      minutesBefore: 15,
    });
    // Manually mark as sent
    await t.run(async (ctx) => {
      await ctx.db.patch(sentReminderId, { sent: true });
    });

    const upcoming = await asUser.query(api.eventReminders.listUpcoming, {});
    expect(upcoming).toHaveLength(0);
  });

  it("should filter out reminders for deleted events", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await createTestContext(t);

    const now = Date.now();
    const startTime = now + 2 * DAY;
    const eventId = await createCalendarEvent(t, userId, { startTime });

    await asUser.mutation(api.eventReminders.create, {
      eventId,
      reminderType: "email",
      minutesBefore: 15,
    });

    // Delete the event
    await t.run(async (ctx) => {
      await ctx.db.delete(eventId);
    });

    const upcoming = await asUser.query(api.eventReminders.listUpcoming, {});
    expect(upcoming).toHaveLength(0);
  });
});
