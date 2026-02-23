import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import type { Doc, Id } from "./_generated/dataModel";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchCalendarEvents, batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { getUserName } from "./lib/userUtils";
import { attendanceStatuses } from "./validators";

/**
 * Meeting Attendance Tracking
 * For required meetings - admins/organizers mark who attended, was tardy, or missed
 */

// Helper: Get or create user summary (uses pre-fetched user map)
function getOrCreateUserSummarySync(
  userSummaries: Map<
    string,
    {
      userId: string;
      userName: string;
      totalMeetings: number;
      present: number;
      tardy: number;
      absent: number;
      notMarked: number;
    }
  >,
  attendeeId: Id<"users">,
  userMap: Map<Id<"users">, Doc<"users">>,
): {
  userId: string;
  userName: string;
  totalMeetings: number;
  present: number;
  tardy: number;
  absent: number;
  notMarked: number;
} {
  let summary = userSummaries.get(attendeeId);
  if (!summary) {
    const user = userMap.get(attendeeId);
    summary = {
      userId: attendeeId,
      userName: getUserName(user),
      totalMeetings: 0,
      present: 0,
      tardy: 0,
      absent: 0,
      notMarked: 0,
    };
    userSummaries.set(attendeeId, summary);
  }
  return summary;
}

// Helper: Update summary with attendance status
function updateAttendanceSummary(
  summary: {
    totalMeetings: number;
    present: number;
    tardy: number;
    absent: number;
    notMarked: number;
  },
  attendance: Doc<"meetingAttendance"> | undefined,
): void {
  summary.totalMeetings++;

  if (attendance) {
    if (attendance.status === "present") summary.present++;
    else if (attendance.status === "tardy") summary.tardy++;
    else if (attendance.status === "absent") summary.absent++;
  } else {
    summary.notMarked++;
  }
}

// Mark attendance for an attendee
export const markAttendance = authenticatedMutation({
  args: {
    eventId: v.id("calendarEvents"),
    userId: v.id("users"),
    status: attendanceStatuses,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) throw notFound("event", args.eventId);

    // Only organizer can mark attendance
    if (event.organizerId !== ctx.userId) {
      throw forbidden("organizer");
    }

    // Check if attendance already exists
    const existing = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing attendance
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
        markedBy: ctx.userId,
        markedAt: now,
      });
      return existing._id;
    }

    // Create new attendance record
    const attendanceId = await ctx.db.insert("meetingAttendance", {
      eventId: args.eventId,
      userId: args.userId,
      status: args.status,
      markedBy: ctx.userId,
      markedAt: now,
      notes: args.notes,
    });
    return attendanceId;
  },
});

// Get attendance for an event
export const getAttendance = authenticatedQuery({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    // Only organizer can view attendance
    if (event.organizerId !== ctx.userId) {
      return null;
    }

    // Get all attendance records for this event
    const attendanceRecords = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch all attendee users
    const userMap = await batchFetchUsers(ctx, event.attendeeIds);

    // Build attendees list using pre-fetched data
    const attendees = event.attendeeIds.map((attendeeId) => {
      const user = userMap.get(attendeeId);
      const attendance = attendanceRecords.find((a) => a.userId === attendeeId);

      return {
        userId: attendeeId,
        userName: getUserName(user),
        userEmail: user?.email,
        status: attendance?.status,
        notes: attendance?.notes,
        markedAt: attendance?.markedAt,
      };
    });

    return {
      attendees,
      totalAttendees: event.attendeeIds.length,
      markedCount: attendanceRecords.length,
    };
  },
});

// Get attendance history for a user (for reports)
export const getUserAttendanceHistory = authenticatedQuery({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get attendance records for user
    const attendanceRecords = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch all events
    const eventIds = attendanceRecords.map((r) => r.eventId);
    const eventMap = await batchFetchCalendarEvents(ctx, eventIds);

    // Batch fetch all organizers from events
    const organizerIds = [...eventMap.values()].map((e) => e.organizerId);
    const organizerMap = await batchFetchUsers(ctx, organizerIds);

    // Enrich with pre-fetched data (no N+1!)
    const enriched = pruneNull(
      attendanceRecords.map((record) => {
        const event = eventMap.get(record.eventId);
        if (!event) return null;

        // Filter by date range if specified
        if (args.startDate && event.startTime < args.startDate) return null;
        if (args.endDate && event.startTime > args.endDate) return null;

        const organizer = organizerMap.get(event.organizerId);

        return {
          ...record,
          eventTitle: event.title,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
          organizerName: organizer?.name,
        };
      }),
    );

    // Sort by date
    return enriched.sort((a, b) => b.eventStartTime - a.eventStartTime);
  },
});

// Get attendance summary report (for admins/CEO)
export const getAttendanceReport = authenticatedQuery({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get only required meetings using index (not ALL events!)
    const requiredEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_required", (q) => q.eq("isRequired", true))
      .take(BOUNDED_LIST_LIMIT);

    // Filter by date range
    const requiredMeetings = requiredEvents.filter((event) => {
      if (args.startDate && event.startTime < args.startDate) return false;
      if (args.endDate && event.startTime > args.endDate) return false;
      return true;
    });

    // Batch fetch attendance records only for these meetings (not ALL attendance!)
    const meetingIds = requiredMeetings.map((m) => m._id);
    const attendancePromises = meetingIds.map((eventId) =>
      ctx.db
        .query("meetingAttendance")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .take(BOUNDED_LIST_LIMIT),
    );
    const attendanceArrays = await Promise.all(attendancePromises);
    const allAttendance = attendanceArrays.flat();

    // Batch fetch all unique attendees upfront (avoid N+1!)
    const allAttendeeIds = [
      ...new Set(requiredMeetings.flatMap((m) => m.attendeeIds)),
    ] as Id<"users">[];
    const userMap = await batchFetchUsers(ctx, allAttendeeIds);

    // Build summary by user (using sync helper with pre-fetched data)
    const userSummaries = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalMeetings: number;
        present: number;
        tardy: number;
        absent: number;
        notMarked: number;
      }
    >();

    for (const meeting of requiredMeetings) {
      for (const attendeeId of meeting.attendeeIds) {
        const summary = getOrCreateUserSummarySync(userSummaries, attendeeId, userMap);
        const attendance = allAttendance.find(
          (a) => a.eventId === meeting._id && a.userId === attendeeId,
        );
        updateAttendanceSummary(summary, attendance);
      }
    }

    return {
      totalRequiredMeetings: requiredMeetings.length,
      attendeeSummaries: Array.from(userSummaries.values()).sort((a, b) =>
        a.userName.localeCompare(b.userName),
      ),
    };
  },
});
