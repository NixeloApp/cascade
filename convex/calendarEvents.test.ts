import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY, HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("calendarEvents", () => {
  describe("create", () => {
    it("should create a calendar event", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Team Meeting",
        startTime: now + 3600000, // 1 HOUR from now
        endTime: now + 7200000, // 2 HOURs from now
        allDay: false,
        eventType: "meeting",
      });

      expect(eventId).toBeDefined();

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("Team Meeting");
      expect(event?.eventType).toBe("meeting");
      expect(event?.status).toBe("confirmed");
      expect(event?.organizerId).toBe(userId);
    });

    it("should reject event where endTime is before startTime", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      await expect(
        asUser.mutation(api.calendarEvents.create, {
          title: "Invalid Event",
          startTime: now + 7200000,
          endTime: now + 3600000, // Before start time
          allDay: false,
          eventType: "meeting",
        }),
      ).rejects.toThrow(/End time must be after start time/);
    });

    it("should create event with all optional fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Full Featured Event",
        description: "A detailed description",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        location: "Conference Room A",
        eventType: "meeting",
        attendeeIds: [attendeeId],
        externalAttendees: ["external@example.com"],
        status: "tentative",
        isRecurring: true,
        recurrenceRule: "FREQ=WEEKLY;COUNT=4",
        meetingUrl: "https://meet.example.com/abc",
        notes: "Bring laptop",
        isRequired: true,
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.description).toBe("A detailed description");
      expect(event?.location).toBe("Conference Room A");
      expect(event?.attendeeIds).toContain(attendeeId);
      expect(event?.externalAttendees).toContain("external@example.com");
      expect(event?.status).toBe("tentative");
      expect(event?.isRecurring).toBe(true);
      expect(event?.meetingUrl).toBe("https://meet.example.com/abc");
    });
  });

  describe("get", () => {
    it("should return event for organizer", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "My Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "personal",
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("My Event");
      expect(event?.organizerName).toBeDefined();
    });

    it("should return event for attendee", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee" });
      const asOrganizer = asAuthenticatedUser(t, organizerId);
      const asAttendee = asAuthenticatedUser(t, attendeeId);

      const now = Date.now();
      const eventId = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Team Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      const event = await asAttendee.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("Team Event");
    });

    it("should return null for non-participant", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const otherUserId = await createTestUser(t, { name: "Other" });
      const asOrganizer = asAuthenticatedUser(t, organizerId);
      const asOther = asAuthenticatedUser(t, otherUserId);

      const now = Date.now();
      const eventId = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Private Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "personal",
      });

      const event = await asOther.query(api.calendarEvents.get, { id: eventId });
      expect(event).toBeNull();
    });
  });

  describe("update", () => {
    it("should allow organizer to update event", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Original Title",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        title: "Updated Title",
        location: "New Location",
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.title).toBe("Updated Title");
      expect(event?.location).toBe("New Location");
    });

    it("should reject update from non-organizer", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee" });
      const asOrganizer = asAuthenticatedUser(t, organizerId);
      const asAttendee = asAuthenticatedUser(t, attendeeId);

      const now = Date.now();
      const eventId = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Team Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      await expect(
        asAttendee.mutation(api.calendarEvents.update, {
          id: eventId,
          title: "Hijacked Event",
        }),
      ).rejects.toThrow(/Only the event organizer/);
    });

    it("should validate times on update", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "meeting",
      });

      await expect(
        asUser.mutation(api.calendarEvents.update, {
          id: eventId,
          startTime: now + 7200000,
          endTime: now + 3600000, // Before new start
        }),
      ).rejects.toThrow(/End time must be after start time/);
    });
  });

  describe("remove", () => {
    it("should allow organizer to delete event", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "To Delete",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "personal",
      });

      await asUser.mutation(api.calendarEvents.remove, { id: eventId });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).toBeNull();
    });

    it("should reject delete from non-organizer", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee" });
      const asOrganizer = asAuthenticatedUser(t, organizerId);
      const asAttendee = asAuthenticatedUser(t, attendeeId);

      const now = Date.now();
      const eventId = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Protected Event",
        startTime: now + 3600000,
        endTime: now + 7200000,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      await expect(asAttendee.mutation(api.calendarEvents.remove, { id: eventId })).rejects.toThrow(
        /Only the event organizer/,
      );
    });
  });

  describe("listByDateRange", () => {
    it("should return events in date range", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      // Create events at different times
      await asUser.mutation(api.calendarEvents.create, {
        title: "Event 1",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Event 2",
        startTime: now + 2 * DAY,
        endTime: now + 2 * DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Event Outside Range",
        startTime: now + 10 * DAY,
        endTime: now + 10 * DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.listByDateRange, {
        startDate: now,
        endDate: now + 5 * DAY,
      });

      expect(events.length).toBe(2);
      expect(events.map((e) => e.title)).toContain("Event 1");
      expect(events.map((e) => e.title)).toContain("Event 2");
      expect(events.map((e) => e.title)).not.toContain("Event Outside Range");
    });

    it("should only show events user is part of", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2" });
      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const now = Date.now();

      await asUser1.mutation(api.calendarEvents.create, {
        title: "User 1 Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "personal",
      });

      await asUser2.mutation(api.calendarEvents.create, {
        title: "User 2 Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "personal",
      });

      const user1Events = await asUser1.query(api.calendarEvents.listByDateRange, {
        startDate: now,
        endDate: now + 5 * DAY,
      });

      expect(user1Events.length).toBe(1);
      expect(user1Events[0].title).toBe("User 1 Event");
    });
  });

  describe("listMine", () => {
    it("should return user's events with default date range", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      await asUser.mutation(api.calendarEvents.create, {
        title: "Upcoming Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {});
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.map((e) => e.title)).toContain("Upcoming Event");
    });

    it("should exclude cancelled events by default", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {});
      expect(events.map((e) => e.title)).not.toContain("Cancelled Event");
    });

    it("should include cancelled events when requested", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {
        includeCompleted: true,
      });
      expect(events.map((e) => e.title)).toContain("Cancelled Event");
    });

    it("should include events where user is attendee", async () => {
      const t = convexTest(schema, modules);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee" });
      const asOrganizer = asAuthenticatedUser(t, organizerId);
      const asAttendee = asAuthenticatedUser(t, attendeeId);

      const now = Date.now();

      await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Invited Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      const attendeeEvents = await asAttendee.query(api.calendarEvents.listMine, {});
      expect(attendeeEvents.map((e) => e.title)).toContain("Invited Event");
    });
  });

  describe("getUpcoming", () => {
    it("should return events in next 7 DAYs", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      await asUser.mutation(api.calendarEvents.create, {
        title: "Tomorrow Event",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Next Week Event",
        startTime: now + 10 * DAY, // Outside 7 DAY window
        endTime: now + 10 * DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events.map((e) => e.title)).toContain("Tomorrow Event");
      expect(events.map((e) => e.title)).not.toContain("Next Week Event");
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      // Create multiple events
      for (let i = 0; i < 5; i++) {
        await asUser.mutation(api.calendarEvents.create, {
          title: `Event ${i + 1}`,
          startTime: now + (i + 1) * HOUR,
          endTime: now + (i + 2) * HOUR,
          allDay: false,
          eventType: "meeting",
        });
      }

      const events = await asUser.query(api.calendarEvents.getUpcoming, { limit: 3 });
      expect(events.length).toBe(3);
    });

    it("should exclude cancelled events", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Upcoming",
        startTime: now + DAY,
        endTime: now + DAY + 3600000,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events.map((e) => e.title)).not.toContain("Cancelled Upcoming");
    });

    it("should sort events by start time", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();

      // Create in reverse order
      await asUser.mutation(api.calendarEvents.create, {
        title: "Third",
        startTime: now + 3 * HOUR,
        endTime: now + 4 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "First",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Second",
        startTime: now + 2 * HOUR,
        endTime: now + 3 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events[0].title).toBe("First");
      expect(events[1].title).toBe("Second");
      expect(events[2].title).toBe("Third");
    });
  });

  describe("event types", () => {
    it("should support all event types", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const types = ["meeting", "deadline", "timeblock", "personal"] as const;

      for (const eventType of types) {
        const eventId = await asUser.mutation(api.calendarEvents.create, {
          title: `${eventType} event`,
          startTime: now + 3600000,
          endTime: now + 7200000,
          allDay: false,
          eventType,
        });

        const event = await asUser.query(api.calendarEvents.get, { id: eventId });
        expect(event?.eventType).toBe(eventType);
      }
    });
  });

  describe("all-DAY events", () => {
    it("should handle all-DAY events", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const toDAY = new Date();
      toDAY.setHours(0, 0, 0, 0);
      const startOfDay = toDAY.getTime();
      const endOfDay = startOfDay + DAY - 1;

      const eventId = await asUser.mutation(api.calendarEvents.create, {
        title: "All Day Event",
        startTime: startOfDay,
        endTime: endOfDay,
        allDay: true,
        eventType: "personal",
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.allDay).toBe(true);
    });
  });
});
