import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { DAY, HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Calendar Events Attendance", () => {
  async function createCalendarEvent(
    t: ReturnType<typeof convexTest>,
    organizerId: Id<"users">,
    _organizationId: Id<"organizations">,
    options: {
      title?: string;
      attendeeIds?: Id<"users">[];
      isRequired?: boolean;
      startTime?: number;
      endTime?: number;
    } = {},
  ) {
    return await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("calendarEvents", {
        title: options.title ?? "Test Meeting",
        organizerId,
        attendeeIds: options.attendeeIds ?? [],
        isRequired: options.isRequired ?? false,
        startTime: options.startTime ?? now,
        endTime: options.endTime ?? now + HOUR, // 1 hour
        updatedAt: now,
        // Required fields
        allDay: false,
        eventType: "meeting",
        status: "confirmed",
        isRecurring: false,
      });
    });
  }

  describe("markAttendance", () => {
    it("should mark attendance as organizer", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });

      const eventId = await createCalendarEvent(t, userId, organizationId, {
        title: "Team Meeting",
        attendeeIds: [attendeeId],
        isRequired: true,
      });

      const { attendanceId } = await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId,
        userId: attendeeId,
        status: "present",
        notes: "On time",
      });

      expect(attendanceId).toBeDefined();

      // Verify attendance was recorded
      const attendance = await t.run(async (ctx) => ctx.db.get(attendanceId));
      expect(attendance?.status).toBe("present");
      expect(attendance?.notes).toBe("On time");
    });

    it("should update existing attendance record", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });

      const eventId = await createCalendarEvent(t, userId, organizationId, {
        attendeeIds: [attendeeId],
        isRequired: true,
      });

      // Mark as present first
      const { attendanceId } = await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId,
        userId: attendeeId,
        status: "present",
      });

      // Update to tardy
      const { attendanceId: updatedId } = await asUser.mutation(
        api.calendarEventsAttendance.markAttendance,
        {
          eventId,
          userId: attendeeId,
          status: "tardy",
          notes: "Arrived 15 minutes late",
        },
      );

      // Should return same ID (updated, not created new)
      expect(updatedId).toBe(attendanceId);

      // Verify update
      const attendance = await t.run(async (ctx) => ctx.db.get(attendanceId));
      expect(attendance?.status).toBe("tardy");
      expect(attendance?.notes).toBe("Arrived 15 minutes late");
    });

    it("should reject non-organizer from marking attendance", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);
      const organizerId = await createTestUser(t, { name: "Organizer" });
      const attendeeId = await createTestUser(t, { name: "Attendee", email: "attendee@test.com" });

      const eventId = await createCalendarEvent(t, organizerId, organizationId, {
        attendeeIds: [attendeeId, userId],
        isRequired: true,
      });

      // Non-organizer tries to mark attendance
      const asNonOrganizer = asAuthenticatedUser(t, userId);
      await expect(
        asNonOrganizer.mutation(api.calendarEventsAttendance.markAttendance, {
          eventId,
          userId: attendeeId,
          status: "present",
        }),
      ).rejects.toThrow(/FORBIDDEN|organizer/i);
    });

    it("should reject marking attendance for non-existent event", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      // Create and delete event to get valid non-existent ID
      const eventId = await createCalendarEvent(t, userId, organizationId);
      await t.run(async (ctx) => ctx.db.delete(eventId));

      await expect(
        asUser.mutation(api.calendarEventsAttendance.markAttendance, {
          eventId,
          userId,
          status: "present",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId, organizationId);

      await expect(
        t.mutation(api.calendarEventsAttendance.markAttendance, {
          eventId,
          userId,
          status: "present",
        }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("getAttendance", () => {
    it("should return attendance for organizer", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendee1 = await createTestUser(t, { name: "Attendee 1" });
      const attendee2 = await createTestUser(t, { name: "Attendee 2", email: "att2@test.com" });

      const eventId = await createCalendarEvent(t, userId, organizationId, {
        title: "Team Standup",
        attendeeIds: [attendee1, attendee2],
        isRequired: true,
      });

      // Mark one attendee
      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId,
        userId: attendee1,
        status: "present",
      });

      const result = await asUser.query(api.calendarEventsAttendance.getAttendance, { eventId });

      expect(result).toBeDefined();
      expect(result?.totalAttendees).toBe(2);
      expect(result?.markedCount).toBe(1);
      expect(result?.attendees).toHaveLength(2);

      // Check marked attendee
      const markedAttendee = result?.attendees.find((a) => a.userId === attendee1);
      expect(markedAttendee?.status).toBe("present");

      // Check unmarked attendee
      const unmarkedAttendee = result?.attendees.find((a) => a.userId === attendee2);
      expect(unmarkedAttendee?.status).toBeUndefined();
    });

    it("should return null for non-organizer", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);
      const organizerId = await createTestUser(t, { name: "Organizer" });

      const eventId = await createCalendarEvent(t, organizerId, organizationId, {
        attendeeIds: [userId],
      });

      const asNonOrganizer = asAuthenticatedUser(t, userId);
      const result = await asNonOrganizer.query(api.calendarEventsAttendance.getAttendance, {
        eventId,
      });

      expect(result).toBeNull();
    });

    it("should return null for non-existent event", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      // Create and delete event
      const eventId = await createCalendarEvent(t, userId, organizationId);
      await t.run(async (ctx) => ctx.db.delete(eventId));

      const result = await asUser.query(api.calendarEventsAttendance.getAttendance, { eventId });
      expect(result).toBeNull();
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const eventId = await createCalendarEvent(t, userId, organizationId);

      await expect(
        t.query(api.calendarEventsAttendance.getAttendance, { eventId }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("getUserAttendanceHistory", () => {
    it("should return attendance history for a user", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });

      const now = Date.now();

      // Create events at different times
      const event1 = await createCalendarEvent(t, userId, organizationId, {
        title: "Morning Standup",
        attendeeIds: [attendeeId],
        isRequired: true,
        startTime: now - DAY, // 1 day ago
        endTime: now - DAY + HOUR,
      });

      const event2 = await createCalendarEvent(t, userId, organizationId, {
        title: "Sprint Review",
        attendeeIds: [attendeeId],
        isRequired: true,
        startTime: now - 2 * DAY, // 2 days ago
        endTime: now - 2 * DAY + HOUR,
      });

      // Mark attendance
      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event1,
        userId: attendeeId,
        status: "present",
      });

      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event2,
        userId: attendeeId,
        status: "tardy",
      });

      const history = await asUser.query(api.calendarEventsAttendance.getUserAttendanceHistory, {
        userId: attendeeId,
      });

      expect(history).toHaveLength(2);
      // Should be sorted by date (newest first)
      expect(history[0].eventTitle).toBe("Morning Standup");
      expect(history[0].status).toBe("present");
      expect(history[1].eventTitle).toBe("Sprint Review");
      expect(history[1].status).toBe("tardy");
    });

    it("should filter by date range", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });

      const now = Date.now();
      const oneWeekAgo = now - 7 * DAY;
      const twoWeeksAgo = now - 14 * DAY;

      // Create events at different times
      const recentEvent = await createCalendarEvent(t, userId, organizationId, {
        title: "Recent Meeting",
        attendeeIds: [attendeeId],
        startTime: now - DAY, // 1 day ago
      });

      const oldEvent = await createCalendarEvent(t, userId, organizationId, {
        title: "Old Meeting",
        attendeeIds: [attendeeId],
        startTime: twoWeeksAgo,
      });

      // Mark attendance for both
      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: recentEvent,
        userId: attendeeId,
        status: "present",
      });

      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: oldEvent,
        userId: attendeeId,
        status: "absent",
      });

      // Query only last week
      const history = await asUser.query(api.calendarEventsAttendance.getUserAttendanceHistory, {
        userId: attendeeId,
        startDate: oneWeekAgo,
        endDate: now,
      });

      expect(history).toHaveLength(1);
      expect(history[0].eventTitle).toBe("Recent Meeting");
    });

    it("should return empty array for user with no attendance", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const history = await asUser.query(api.calendarEventsAttendance.getUserAttendanceHistory, {
        userId,
      });

      expect(history).toEqual([]);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      await expect(
        t.query(api.calendarEventsAttendance.getUserAttendanceHistory, { userId }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("getAttendanceReport", () => {
    it("should return summary of attendance for required meetings", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendee1 = await createTestUser(t, { name: "Employee 1" });
      const attendee2 = await createTestUser(t, { name: "Employee 2", email: "emp2@test.com" });

      const now = Date.now();

      // Create required meetings
      const event1 = await createCalendarEvent(t, userId, organizationId, {
        title: "All Hands",
        attendeeIds: [attendee1, attendee2],
        isRequired: true,
        startTime: now - DAY,
      });

      const event2 = await createCalendarEvent(t, userId, organizationId, {
        title: "Team Sync",
        attendeeIds: [attendee1, attendee2],
        isRequired: true,
        startTime: now - 2 * DAY,
      });

      // Create non-required meeting (should not be counted)
      await createCalendarEvent(t, userId, organizationId, {
        title: "Optional Social",
        attendeeIds: [attendee1, attendee2],
        isRequired: false,
        startTime: now - 3 * DAY,
      });

      // Mark attendance
      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event1,
        userId: attendee1,
        status: "present",
      });

      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event1,
        userId: attendee2,
        status: "present",
      });

      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event2,
        userId: attendee1,
        status: "present",
      });

      await asUser.mutation(api.calendarEventsAttendance.markAttendance, {
        eventId: event2,
        userId: attendee2,
        status: "tardy",
      });

      const report = await asUser.query(api.calendarEventsAttendance.getAttendanceReport, {});

      expect(report.totalRequiredMeetings).toBe(2);
      expect(report.attendeeSummaries).toHaveLength(2);

      // Find Employee 1's summary
      const emp1Summary = report.attendeeSummaries.find((s) => s.userName === "Employee 1");
      expect(emp1Summary?.totalMeetings).toBe(2);
      expect(emp1Summary?.present).toBe(2);
      expect(emp1Summary?.tardy).toBe(0);
      expect(emp1Summary?.absent).toBe(0);

      // Find Employee 2's summary
      const emp2Summary = report.attendeeSummaries.find((s) => s.userName === "Employee 2");
      expect(emp2Summary?.totalMeetings).toBe(2);
      expect(emp2Summary?.present).toBe(1);
      expect(emp2Summary?.tardy).toBe(1);
    });

    it("should filter report by date range", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Employee" });

      const now = Date.now();
      const oneWeekAgo = now - 7 * DAY;
      const twoWeeksAgo = now - 14 * DAY;

      // Create events at different times
      await createCalendarEvent(t, userId, organizationId, {
        title: "Recent Required",
        attendeeIds: [attendeeId],
        isRequired: true,
        startTime: now - DAY,
      });

      await createCalendarEvent(t, userId, organizationId, {
        title: "Old Required",
        attendeeIds: [attendeeId],
        isRequired: true,
        startTime: twoWeeksAgo,
      });

      // Query only last week
      const report = await asUser.query(api.calendarEventsAttendance.getAttendanceReport, {
        startDate: oneWeekAgo,
        endDate: now,
      });

      expect(report.totalRequiredMeetings).toBe(1);
    });

    it("should count unmarked attendance as notMarked", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Employee" });

      await createCalendarEvent(t, userId, organizationId, {
        title: "Meeting Without Marking",
        attendeeIds: [attendeeId],
        isRequired: true,
      });

      const report = await asUser.query(api.calendarEventsAttendance.getAttendanceReport, {});

      const summary = report.attendeeSummaries.find((s) => s.userId === attendeeId);
      expect(summary?.notMarked).toBe(1);
      expect(summary?.present).toBe(0);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.calendarEventsAttendance.getAttendanceReport, {})).rejects.toThrow(
        /authenticated/i,
      );
    });
  });
});
