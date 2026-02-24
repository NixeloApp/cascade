
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext, createTestUser } from "./testUtils";
import { HOUR, MINUTE, SECOND } from "./lib/timeUtils";

describe("Event Reminders Email Sending", () => {
  it("should schedule email reminder for organizer", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await createTestContext(t);

    const now = Date.now();
    const startTime = now + HOUR;

    // Create event
    const eventId = await t.run(async (ctx) => {
      return await ctx.db.insert("calendarEvents", {
        organizerId: userId,
        title: "Test Event",
        startTime,
        endTime: startTime + HOUR,
        attendeeIds: [],
        allDay: false,
        eventType: "meeting",
        isRecurring: false,
        status: "confirmed",
        updatedAt: now,
      });
    });

    // Create due email reminder
    const reminderId = await t.run(async (ctx) => {
      return await ctx.db.insert("eventReminders", {
        eventId,
        userId,
        reminderType: "email",
        minutesBefore: 15,
        scheduledFor: now - SECOND, // Due
        sent: false,
      });
    });

    // Run processDueReminders
    await t.mutation(internal.eventReminders.processDueReminders, {});

    // Check _scheduled_functions
    const scheduledJobs = await t.run(async (ctx) => {
      return await ctx.db.system.query("_scheduled_functions").collect();
    });

    expect(scheduledJobs).toHaveLength(1);
    expect(scheduledJobs[0].name).toBe("email/notifications:sendEventReminder");
    expect(scheduledJobs[0].args).toEqual([{
      eventId,
      userId,
      minutesBefore: 15,
    }]);

    // Verify reminder marked as sent
    const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
    expect(reminder?.sent).toBe(true);
  });

  it("should schedule email reminder for attendee", async () => {
    const t = convexTest(schema, modules);
    const organizerId = await createTestUser(t, { name: "Organizer" });
    const attendeeId = await createTestUser(t, { name: "Attendee", email: "attendee@test.com" });

    const now = Date.now();
    const startTime = now + HOUR;

    // Create event with attendee
    const eventId = await t.run(async (ctx) => {
      return await ctx.db.insert("calendarEvents", {
        organizerId: organizerId,
        title: "Test Event",
        startTime,
        endTime: startTime + HOUR,
        attendeeIds: [attendeeId],
        allDay: false,
        eventType: "meeting",
        isRecurring: false,
        status: "confirmed",
        updatedAt: now,
      });
    });

    // Create due email reminder for attendee
    const reminderId = await t.run(async (ctx) => {
      return await ctx.db.insert("eventReminders", {
        eventId,
        userId: attendeeId,
        reminderType: "email",
        minutesBefore: 30,
        scheduledFor: now - SECOND, // Due
        sent: false,
      });
    });

    // Run processDueReminders
    await t.mutation(internal.eventReminders.processDueReminders, {});

    // Check _scheduled_functions
    const scheduledJobs = await t.run(async (ctx) => {
      return await ctx.db.system.query("_scheduled_functions").collect();
    });

    expect(scheduledJobs).toHaveLength(1);
    expect(scheduledJobs[0].name).toBe("email/notifications:sendEventReminder");
    expect(scheduledJobs[0].args).toEqual([{
      eventId,
      userId: attendeeId,
      minutesBefore: 30,
    }]);

    // Verify reminder marked as sent
    const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
    expect(reminder?.sent).toBe(true);
  });

  it("should not schedule email reminder if user has no email", async () => {
    const t = convexTest(schema, modules);
    // Create user without email
    const userId = await createTestUser(t, { name: "No Email User" });

    // Explicitly unset email just in case createTestUser adds a default one (though default is usually undefined unless specified)
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { email: undefined });
    });

    const now = Date.now();
    const startTime = now + HOUR;

    // Create event
    const eventId = await t.run(async (ctx) => {
      return await ctx.db.insert("calendarEvents", {
        organizerId: userId,
        title: "Test Event",
        startTime,
        endTime: startTime + HOUR,
        attendeeIds: [],
        allDay: false,
        eventType: "meeting",
        isRecurring: false,
        status: "confirmed",
        updatedAt: now,
      });
    });

    // Create due email reminder
    const reminderId = await t.run(async (ctx) => {
      return await ctx.db.insert("eventReminders", {
        eventId,
        userId,
        reminderType: "email",
        minutesBefore: 15,
        scheduledFor: now - SECOND, // Due
        sent: false,
      });
    });

    // Run processDueReminders
    const result = await t.mutation(internal.eventReminders.processDueReminders, {});
    expect(result.processed).toBe(1);

    // Check _scheduled_functions - should be empty
    const scheduledJobs = await t.run(async (ctx) => {
      return await ctx.db.system.query("_scheduled_functions").collect();
    });

    expect(scheduledJobs).toHaveLength(0);

    // Verify reminder marked as sent (because we process it even if we can't send email, to avoid getting stuck)
    const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
    expect(reminder?.sent).toBe(true);
  });
});
