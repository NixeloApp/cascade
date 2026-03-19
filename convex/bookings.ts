/**
 * Bookings Management
 *
 * Meeting booking system with availability validation.
 * Handles booking creation, confirmation, and cancellation.
 * Integrates with calendar events and rate limiting.
 */

import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchBookingPages } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { validate, validateEmail } from "./lib/constrainedValidators";
import { conflict, notFound, rateLimited, requireOwned, validation } from "./lib/errors";
import {
  getActiveOutOfOfficeDelegateUserId,
  getOutOfOfficeDelegateForRange,
} from "./lib/outOfOffice";
import { DAY, HOUR, MINUTE } from "./lib/timeUtils";
import { getUserWorkspaceContext } from "./lib/workspaceAccess";
import { bookerAnswers } from "./validators";

/**
 * Bookings - Handle meeting bookings via booking pages
 * Supports confirmation workflow and calendar integration
 */

async function enforceBookingRateLimit(ctx: MutationCtx, email: string): Promise<void> {
  if (process.env.IS_TEST_ENV) return;

  try {
    await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
      name: `createBooking:${email}`,
      config: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },
      throws: true,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Rate limit")) {
      throw rateLimited();
    }
    throw e;
  }
}

function assertMinimumNotice(startTime: number, minimumNotice: number): void {
  const hoursUntilMeeting = (startTime - Date.now()) / HOUR;
  if (hoursUntilMeeting < minimumNotice) {
    throw validation("startTime", `Requires at least ${minimumNotice} hours notice`);
  }
}

async function findConflictingBooking(
  ctx: MutationCtx,
  hostId: Id<"users">,
  startTime: number,
  endTime: number,
) {
  return ctx.db
    .query("bookings")
    .withIndex("by_host", (q) => q.eq("hostId", hostId))
    .filter((q) =>
      q.and(
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
        q.or(
          q.and(q.lte(q.field("startTime"), startTime), q.gt(q.field("endTime"), startTime)),
          q.and(q.lt(q.field("startTime"), endTime), q.gte(q.field("endTime"), endTime)),
          q.and(q.gte(q.field("startTime"), startTime), q.lte(q.field("endTime"), endTime)),
        ),
      ),
    )
    .first();
}

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
    await enforceBookingRateLimit(ctx, args.bookerEmail);

    validateEmail(args.bookerEmail);
    validate.name(args.bookerName, "bookerName");

    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.bookingPageSlug))
      .first();

    if (!page?.isActive) {
      throw notFound("bookingPage");
    }

    const endTime = args.startTime + page.duration * MINUTE;

    const effectiveHostId =
      (await getOutOfOfficeDelegateForRange(ctx, page.userId, args.startTime, endTime)) ??
      page.userId;

    await validateAvailability(ctx, effectiveHostId, args.startTime, page.duration);
    const now = Date.now();

    assertMinimumNotice(args.startTime, page.minimumNotice);

    const conflictingBooking = await findConflictingBooking(
      ctx,
      effectiveHostId,
      args.startTime,
      endTime,
    );
    if (conflictingBooking) {
      throw conflict("This time slot is no longer available");
    }

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      bookingPageId: page._id,
      hostId: effectiveHostId,
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

    // If auto-confirm, create calendar event (if host has workspace context)
    if (!page.requiresConfirmation) {
      const workspaceContext = await getUserWorkspaceContext(ctx, effectiveHostId);
      if (workspaceContext) {
        const eventId = await ctx.db.insert("calendarEvents", {
          organizationId: workspaceContext.organizationId,
          workspaceId: workspaceContext.workspaceId,
          title: `${page.title} with ${args.bookerName}`,
          description: `Booked via ${args.bookingPageSlug}`,
          startTime: args.startTime,
          endTime,
          allDay: false,
          location: page.locationDetails,
          eventType: "meeting",
          organizerId: effectiveHostId,
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
    const pageUserId = page.userId;

    // Pre-fetch the host user and delegate user once to avoid per-slot DB lookups.
    // OOO is resolved per-slot using in-memory timestamp checks.
    const hostUser = await ctx.db.get(pageUserId);
    const hostOOO = hostUser?.outOfOffice;
    let delegateUser: typeof hostUser = null;
    if (hostOOO?.delegateUserId && hostOOO.delegateUserId !== pageUserId) {
      delegateUser = await ctx.db.get(hostOOO.delegateUserId);
    }

    /**
     * Resolve the effective host for a given slot timestamp.
     * If the host is OOO at that moment and has a valid delegate, use the delegate.
     */
    function resolveHostForSlot(slotTime: number): Id<"users"> {
      if (hostOOO && delegateUser && hostOOO.startsAt <= slotTime && hostOOO.endsAt >= slotTime) {
        return delegateUser._id;
      }
      return pageUserId;
    }

    // Determine which hosts are relevant for the day (host, delegate, or both)
    const dayStart = args.date;
    const dayEnd = dayStart + DAY;
    const hostIds = new Set<string>();
    // Check a few sample points across the day to find which hosts appear
    for (let t = dayStart; t < dayEnd; t += HOUR) {
      hostIds.add(resolveHostForSlot(t));
    }
    hostIds.add(resolveHostForSlot(dayEnd - 1));

    // Pre-fetch availability and bookings for all relevant hosts
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

    const availabilityByHost = new Map<
      string,
      { startTime: string; endTime: string; isActive: boolean }
    >();
    const bookingsByHost = new Map<string, Array<{ startTime: number; endTime: number }>>();

    for (const hostId of hostIds) {
      const availability = await ctx.db
        .query("availabilitySlots")
        .withIndex("by_user_day", (q) =>
          q.eq("userId", hostId as Id<"users">).eq("dayOfWeek", dayOfWeek),
        )
        .first();

      if (availability?.isActive) {
        availabilityByHost.set(hostId, availability);
      }

      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_host", (q) => q.eq("hostId", hostId as Id<"users">))
        .filter((q) =>
          q.and(
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
            q.gte(q.field("startTime"), dayStart),
            q.lt(q.field("startTime"), dayEnd),
          ),
        )
        .take(BOUNDED_LIST_LIMIT);

      bookingsByHost.set(hostId, bookings);
    }

    // If the primary host (non-OOO case) has no availability at all, bail early
    // unless a delegate covers part of the day
    if (availabilityByHost.size === 0) return [];

    // Find the widest availability window across all hosts to iterate slots
    let earliestStart = 24 * 60;
    let latestEnd = 0;
    for (const avail of availabilityByHost.values()) {
      const [sh, sm] = avail.startTime.split(":").map(Number);
      const [eh, em] = avail.endTime.split(":").map(Number);
      earliestStart = Math.min(earliestStart, sh * 60 + sm);
      latestEnd = Math.max(latestEnd, eh * 60 + em);
    }

    // Generate available slots
    const slots: number[] = [];
    const slotDuration = page.duration; // minutes

    const currentTime = new Date(args.date);
    currentTime.setHours(Math.floor(earliestStart / 60), earliestStart % 60, 0, 0);

    const endTime = new Date(args.date);
    endTime.setHours(Math.floor(latestEnd / 60), latestEnd % 60, 0, 0);

    while (currentTime.getTime() + slotDuration * MINUTE <= endTime.getTime()) {
      const slotStart = currentTime.getTime();
      const slotEnd = slotStart + slotDuration * MINUTE;

      // Resolve which host owns this slot based on OOO status at slot time
      const effectiveHostId = resolveHostForSlot(slotStart);
      const hostAvailability = availabilityByHost.get(effectiveHostId);

      // Skip if this host has no availability on this day
      if (!hostAvailability) {
        currentTime.setMinutes(currentTime.getMinutes() + 15);
        continue;
      }

      // Check slot is within this host's availability window
      const [aStartH, aStartM] = hostAvailability.startTime.split(":").map(Number);
      const [aEndH, aEndM] = hostAvailability.endTime.split(":").map(Number);
      const availStart = new Date(args.date);
      availStart.setHours(aStartH, aStartM, 0, 0);
      const availEnd = new Date(args.date);
      availEnd.setHours(aEndH, aEndM, 0, 0);

      if (slotStart < availStart.getTime() || slotEnd > availEnd.getTime()) {
        currentTime.setMinutes(currentTime.getMinutes() + 15);
        continue;
      }

      // Check if slot conflicts with existing bookings for the effective host
      const hostBookings = bookingsByHost.get(effectiveHostId) ?? [];
      const hasConflict = hostBookings.some((booking) => {
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

    // Create calendar event (if host has workspace context)
    const page = await ctx.db.get(booking.bookingPageId);
    if (!page) throw notFound("bookingPage", booking.bookingPageId);

    const now = Date.now();
    let calendarEventId: Id<"calendarEvents"> | undefined;

    const workspaceContext = await getUserWorkspaceContext(ctx, ctx.userId);
    if (workspaceContext) {
      calendarEventId = await ctx.db.insert("calendarEvents", {
        organizationId: workspaceContext.organizationId,
        workspaceId: workspaceContext.workspaceId,
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
    }

    await ctx.db.patch(args.id, {
      status: "confirmed",
      calendarEventId,
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
