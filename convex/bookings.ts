import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchBookingPages } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { validate, validateEmail } from "./lib/constrainedValidators";
import { conflict, notFound, rateLimited, requireOwned, validation } from "./lib/errors";
import { DAY, HOUR, MINUTE } from "./lib/timeUtils";
import { bookerAnswers } from "./validators";

/**
 * Bookings - Handle meeting bookings via booking pages
 * Supports confirmation workflow and calendar integration
 */

/** Parse "HH:MM" to minutes since midnight, or null if invalid. */
function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(":");
  if (parts.length !== 2) return null;
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/** Extract day and minutes from DateTimeFormat parts, or null if invalid. */
function extractDayAndMinutes(
  parts: Intl.DateTimeFormatPart[],
): { day: string; minutes: number } | null {
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;
  const day = getPart("weekday")?.toLowerCase();
  const hourStr = getPart("hour");
  const minuteStr = getPart("minute");
  if (!day || !hourStr || !minuteStr) return null;
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { day, minutes: hour * 60 + minute };
}

/** Check if a booking interval fits within a single slot. */
function bookingFitsSlot(
  slot: { dayOfWeek: string; startTime: string; endTime: string; timezone: string },
  startTime: number,
  bookingEnd: number,
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: slot.timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const startInfo = extractDayAndMinutes(formatter.formatToParts(new Date(startTime)));
    const endInfo = extractDayAndMinutes(formatter.formatToParts(new Date(bookingEnd)));
    if (!startInfo || !endInfo) return false;

    if (startInfo.day !== slot.dayOfWeek || endInfo.day !== slot.dayOfWeek) return false;

    const slotStartMinutes = parseTimeToMinutes(slot.startTime);
    const slotEndMinutes = parseTimeToMinutes(slot.endTime);
    if (slotStartMinutes === null || slotEndMinutes === null) return false;

    return startInfo.minutes >= slotStartMinutes && endInfo.minutes <= slotEndMinutes;
  } catch {
    return false;
  }
}

// Helper to check availability
async function validateAvailability(
  ctx: MutationCtx,
  userId: Id<"users">,
  startTime: number,
  durationMinutes: number,
) {
  const slots = await ctx.db
    .query("availabilitySlots")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("isActive"), true))
    .take(BOUNDED_LIST_LIMIT);

  const bookingEnd = startTime + durationMinutes * MINUTE;
  const isCovered = slots.some((slot) => bookingFitsSlot(slot, startTime, bookingEnd));

  if (!isCovered) {
    throw validation("startTime", "Selected time is outside available hours");
  }
}

/** Creates a new booking for a booking page with rate limiting, conflict detection, and optional auto-confirmation. */
export const createBooking = mutation({
  args: {
    bookingPageSlug: v.string(),
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    bookerAnswers: v.optional(bookerAnswers), // Typed array of form answers
    startTime: v.number(), // Unix timestamp
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit by email: 10 bookings per minute per email (prevents spam)
    // Use single atomic mutation to avoid TOCTOU race condition
    if (!process.env.IS_TEST_ENV) {
      try {
        await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
          name: `createBooking:${args.bookerEmail}`,
          config: {
            kind: "token bucket",
            rate: 10,
            period: MINUTE,
            capacity: 3,
          },
          throws: true,
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("Rate limit")) {
          throw rateLimited();
        }
        throw e;
      }
    }

    // Validate input
    validateEmail(args.bookerEmail);
    validate.name(args.bookerName, "bookerName");

    // Get booking page
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.bookingPageSlug))
      .first();

    if (!page?.isActive) {
      throw notFound("bookingPage");
    }

    // Security: Validate that the requested time falls within host's availability
    await validateAvailability(ctx, page.userId, args.startTime, page.duration);

    // Calculate end time
    const endTime = args.startTime + page.duration * MINUTE;

    // Check minimum notice
    const now = Date.now();
    const hoursUntilMeeting = (args.startTime - now) / HOUR;
    if (hoursUntilMeeting < page.minimumNotice) {
      throw validation("startTime", `Requires at least ${page.minimumNotice} hours notice`);
    }

    // Check if slot is still available (only need to find one conflict)
    const conflictingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_host", (q) => q.eq("hostId", page.userId))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
          q.or(
            // New booking starts during existing booking
            q.and(
              q.lte(q.field("startTime"), args.startTime),
              q.gt(q.field("endTime"), args.startTime),
            ),
            // New booking ends during existing booking
            q.and(q.lt(q.field("startTime"), endTime), q.gte(q.field("endTime"), endTime)),
            // New booking completely contains existing booking
            q.and(q.gte(q.field("startTime"), args.startTime), q.lte(q.field("endTime"), endTime)),
          ),
        ),
      )
      .first();

    if (conflictingBooking) {
      throw conflict("This time slot is no longer available");
    }

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      bookingPageId: page._id,
      hostId: page.userId,
      bookerName: args.bookerName,
      bookerEmail: args.bookerEmail,
      bookerPhone: args.bookerPhone,
      bookerAnswers: args.bookerAnswers,
      startTime: args.startTime,
      endTime,
      timezone: args.timezone,
      location: page.location,
      locationDetails: page.locationDetails,
      status: page.requiresConfirmation ? "pending" : "confirmed",
      reminderSent: false,
      updatedAt: now,
    });

    // If auto-confirm, create calendar event
    if (!page.requiresConfirmation) {
      const eventId = await ctx.db.insert("calendarEvents", {
        title: `${page.title} with ${args.bookerName}`,
        description: `Booked via ${args.bookingPageSlug}`,
        startTime: args.startTime,
        endTime,
        allDay: false,
        location: page.locationDetails,
        eventType: "meeting",
        organizerId: page.userId,
        attendeeIds: [],
        externalAttendees: [args.bookerEmail],
        status: "confirmed",
        isRecurring: false,
        meetingUrl: page.location === "zoom" ? page.locationDetails : undefined,
        updatedAt: now,
      });

      // Link booking to calendar event
      await ctx.db.patch(bookingId, { calendarEventId: eventId });
    }

    return { bookingId };
  },
});

/** Generates available time slots for a booking page on a specific date, accounting for existing bookings and availability. */
export const getAvailableSlots = query({
  args: {
    bookingPageSlug: v.string(),
    date: v.number(), // Date to check (start of day timestamp)
    timezone: v.string(), // Booker's timezone
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.bookingPageSlug))
      .first();

    if (!page?.isActive) return [];

    // Get host's availability for this day of week
    const date = new Date(args.date);
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const dayOfWeek = dayNames[date.getDay()];

    const availability = await ctx.db
      .query("availabilitySlots")
      .withIndex("by_user_day", (q) => q.eq("userId", page.userId).eq("dayOfWeek", dayOfWeek))
      .first();

    if (!availability?.isActive) return [];

    // Get existing bookings for this day
    const dayStart = args.date;
    const dayEnd = dayStart + DAY;

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_host", (q) => q.eq("hostId", page.userId))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
          q.gte(q.field("startTime"), dayStart),
          q.lt(q.field("startTime"), dayEnd),
        ),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Generate available slots
    const slots: number[] = [];
    const slotDuration = page.duration; // minutes

    // Parse start and end times
    const [startHour, startMinute] = availability.startTime.split(":").map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const currentTime = new Date(args.date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(args.date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate all possible slots
    while (currentTime.getTime() + slotDuration * MINUTE <= endTime.getTime()) {
      const slotStart = currentTime.getTime();
      const slotEnd = slotStart + slotDuration * MINUTE;

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some((booking) => {
        // Add buffer time
        const bufferedStart = booking.startTime - page.bufferTimeBefore * MINUTE;
        const bufferedEnd = booking.endTime + page.bufferTimeAfter * MINUTE;

        return slotStart < bufferedEnd && slotEnd > bufferedStart;
      });

      // Check minimum notice
      const hoursUntilSlot = (slotStart - Date.now()) / HOUR;

      if (!hasConflict && hoursUntilSlot >= page.minimumNotice) {
        slots.push(slotStart);
      }

      // Move to next slot (15-minute increments)
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  },
});

// List bookings for host
export const listMyBookings = authenticatedQuery({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const bookings = args.status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_host_status", (q) =>
            q
              .eq("hostId", ctx.userId)
              .eq("status", args.status as "pending" | "confirmed" | "cancelled" | "completed"),
          )
          .take(BOUNDED_LIST_LIMIT)
      : await ctx.db
          .query("bookings")
          .withIndex("by_host", (q) => q.eq("hostId", ctx.userId))
          .take(BOUNDED_LIST_LIMIT);

    // Batch fetch booking pages to avoid N+1 queries
    const pageIds = bookings.map((b) => b.bookingPageId);
    const pageMap = await batchFetchBookingPages(ctx, pageIds);

    // Enrich with pre-fetched data (no N+1)
    const enrichedBookings = bookings.map((booking) => {
      const page = pageMap.get(booking.bookingPageId);
      return {
        ...booking,
        pageTitle: page?.title,
        pageSlug: page?.slug,
      };
    });

    return enrichedBookings.sort((a, b) => a.startTime - b.startTime);
  },
});

// Confirm a pending booking
export const confirmBooking = authenticatedMutation({
  args: { id: v.id("bookings") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw notFound("booking", args.id);
    requireOwned(booking, ctx.userId, "booking", "hostId");

    if (booking.status !== "pending") {
      throw validation("status", "Only pending bookings can be confirmed");
    }

    // Create calendar event
    const page = await ctx.db.get(booking.bookingPageId);
    if (!page) throw notFound("bookingPage", booking.bookingPageId);

    const now = Date.now();

    const eventId = await ctx.db.insert("calendarEvents", {
      title: `${page.title} with ${booking.bookerName}`,
      description: `Booked via ${page.slug}`,
      startTime: booking.startTime,
      endTime: booking.endTime,
      allDay: false,
      location: booking.locationDetails,
      eventType: "meeting",
      organizerId: ctx.userId,
      attendeeIds: [],
      externalAttendees: [booking.bookerEmail],
      status: "confirmed",
      isRecurring: false,
      meetingUrl: page.location === "zoom" ? page.locationDetails : undefined,
      updatedAt: now,
    });

    await ctx.db.patch(args.id, {
      status: "confirmed",
      calendarEventId: eventId,
      updatedAt: now,
    });

    return { success: true } as const;
  },
});

// Cancel a booking
export const cancelBooking = authenticatedMutation({
  args: {
    id: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw notFound("booking", args.id);
    requireOwned(booking, ctx.userId, "booking", "hostId");

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw validation("status", "Cannot cancel this booking");
    }

    // Cancel linked calendar event if it exists
    if (booking.calendarEventId) {
      await ctx.db.patch(booking.calendarEventId, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelledBy: "host",
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});
