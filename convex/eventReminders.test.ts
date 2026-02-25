import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { HOUR, MINUTE, SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Event Reminders", () => {
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

  describe("create", () => {
    it("should create a reminder for event organizer", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId);

      const { reminderId } = await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      expect(reminderId).toBeDefined();

      const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
      expect(reminder?.reminderType).toBe("email");
      expect(reminder?.minutesBefore).toBe(15);
      expect(reminder?.sent).toBe(false);
    });

    it("should create a reminder for event attendee", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee", email: "attendee@test.com" });

      const eventId = await createCalendarEvent(t, organizerId, {
        attendeeIds: [attendeeId],
      });

      const asAttendee = asAuthenticatedUser(t, attendeeId);
      const { reminderId } = await asAttendee.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "in_app",
        minutesBefore: 30,
      });

      expect(reminderId).toBeDefined();
    });

    it("should reject reminder from non-participant", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });

      const eventId = await createCalendarEvent(t, organizerId);

      const asOutsider = asAuthenticatedUser(t, outsiderId);
      await expect(
        asOutsider.mutation(api.eventReminders.create, {
          eventId,
          reminderType: "email",
          minutesBefore: 15,
        }),
      ).rejects.toThrow(/set reminders for events you're not part of/);
    });

    it("should update existing reminder instead of creating duplicate", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId);

      // Create first reminder
      const { reminderId: reminderId1 } = await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      // Create second reminder with same type - should update
      const { reminderId: reminderId2 } = await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 30,
      });

      expect(reminderId2).toBe(reminderId1);

      const reminder = await t.run(async (ctx) => ctx.db.get(reminderId1));
      expect(reminder?.minutesBefore).toBe(30);
    });
  });

  describe("createDefaultReminders", () => {
    it("should create default 15-minute email reminder", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const now = Date.now();
      const startTime = now + HOUR; // 1 hour from now
      const eventId = await createCalendarEvent(t, userId, { startTime });

      await t.mutation(internal.eventReminders.createDefaultReminders, {
        eventId,
        userId,
        startTime,
      });

      const reminders = await t.run(async (ctx) => {
        return await ctx.db
          .query("eventReminders")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
      });

      expect(reminders).toHaveLength(1);
      expect(reminders[0].reminderType).toBe("email");
      expect(reminders[0].minutesBefore).toBe(15);
    });

    it("should not create reminder for past events", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const startTime = Date.now() - MINUTE; // 1 minute ago
      const eventId = await createCalendarEvent(t, userId, { startTime });

      await t.mutation(internal.eventReminders.createDefaultReminders, {
        eventId,
        userId,
        startTime,
      });

      const reminders = await t.run(async (ctx) => {
        return await ctx.db
          .query("eventReminders")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
      });

      expect(reminders).toHaveLength(0);
    });
  });

  describe("listByEvent", () => {
    it("should return reminders for event participant", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId);

      await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      const reminders = await asUser.query(api.eventReminders.listByEvent, {
        eventId,
      });

      expect(reminders).toHaveLength(1);
    });

    it("should return empty for non-participant", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });

      const eventId = await createCalendarEvent(t, organizerId);

      const asOutsider = asAuthenticatedUser(t, outsiderId);
      const reminders = await asOutsider.query(api.eventReminders.listByEvent, {
        eventId,
      });

      expect(reminders).toHaveLength(0);
    });
  });

  describe("remove", () => {
    it("should delete own reminder", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId);
      const { reminderId } = await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      await asUser.mutation(api.eventReminders.remove, { reminderId });

      const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
      expect(reminder).toBeNull();
    });

    it("should reject deleting other user's reminder", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const eventId = await createCalendarEvent(t, user1Id, {
        attendeeIds: [user2Id],
      });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const { reminderId } = await asUser1.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      const asUser2 = asAuthenticatedUser(t, user2Id);
      await expect(asUser2.mutation(api.eventReminders.remove, { reminderId })).rejects.toThrow(
        /delete other users' reminders/,
      );
    });
  });

  describe("processDueReminders", () => {
    it("should process due reminders and create notifications", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const now = Date.now();
      const startTime = now + HOUR; // 1 hour from now
      const eventId = await createCalendarEvent(t, userId, { startTime });

      // Create an in-app reminder that is already due
      await t.run(async (ctx) => {
        await ctx.db.insert("eventReminders", {
          eventId,
          userId,
          reminderType: "in_app",
          minutesBefore: 15,
          scheduledFor: now - SECOND, // 1 second ago (due)
          sent: false,
        });
      });

      const result = await t.mutation(internal.eventReminders.processDueReminders, {});

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);

      // Check notification was created
      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("calendar_reminder");
    });

    it("should skip cancelled events", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const now = Date.now();
      const startTime = now + HOUR;
      const eventId = await createCalendarEvent(t, userId, {
        startTime,
        status: "cancelled",
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("eventReminders", {
          eventId,
          userId,
          reminderType: "in_app",
          minutesBefore: 15,
          scheduledFor: now - SECOND,
          sent: false,
        });
      });

      const result = await t.mutation(internal.eventReminders.processDueReminders, {});

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
    });

    it("should delete reminders for deleted events", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const now = Date.now();
      const startTime = now + HOUR;

      // Create a real event then delete it
      const eventId = await createCalendarEvent(t, userId, { startTime });

      const reminderId = await t.run(async (ctx) => {
        return await ctx.db.insert("eventReminders", {
          eventId,
          userId,
          reminderType: "in_app",
          minutesBefore: 15,
          scheduledFor: now - SECOND,
          sent: false,
        });
      });

      // Delete the event
      await t.run(async (ctx) => {
        await ctx.db.delete(eventId);
      });

      const result = await t.mutation(internal.eventReminders.processDueReminders, {});

      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);

      // Reminder should be deleted
      const reminder = await t.run(async (ctx) => ctx.db.get(reminderId));
      expect(reminder).toBeNull();
    });
  });

  describe("removeAllForEvent", () => {
    it("should remove all reminders when event is deleted", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const eventId = await createCalendarEvent(t, user1Id, {
        attendeeIds: [user2Id],
      });

      // Create reminders for both users
      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      await asUser1.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      await asUser2.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "in_app",
        minutesBefore: 30,
      });

      // Remove all reminders
      await t.mutation(internal.eventReminders.removeAllForEvent, { eventId });

      const reminders = await t.run(async (ctx) => {
        return await ctx.db
          .query("eventReminders")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
      });

      expect(reminders).toHaveLength(0);
    });
  });

  describe("updateForEventTimeChange", () => {
    it("should update scheduled times when event is rescheduled", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const now = Date.now();
      const originalStartTime = now + HOUR; // 1 hour
      const eventId = await createCalendarEvent(t, userId, {
        startTime: originalStartTime,
      });

      await asUser.mutation(api.eventReminders.create, {
        eventId,
        reminderType: "email",
        minutesBefore: 15,
      });

      // Reschedule event to 2 hours from now
      const newStartTime = now + 2 * HOUR;
      await t.mutation(internal.eventReminders.updateForEventTimeChange, {
        eventId,
        newStartTime,
      });

      const reminders = await t.run(async (ctx) => {
        return await ctx.db
          .query("eventReminders")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
      });

      expect(reminders).toHaveLength(1);
      // New scheduled time should be 15 minutes before new start time
      const expectedScheduledFor = newStartTime - 15 * MINUTE;
      expect(reminders[0].scheduledFor).toBe(expectedScheduledFor);
    });
  });
});
