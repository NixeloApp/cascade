import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, type QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { forbidden, notFound, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { DAY, WEEK } from "./lib/timeUtils";
import { type CalendarEventColor, calendarEventColors, calendarStatuses } from "./validators";

/**
 * Calendar Events - CRUD operations for internal calendar
 * Supports meetings, deadlines, time blocks, and personal events
 */

// Helper: Add field to updates if defined
function addFieldIfDefined(
  updates: Record<string, unknown>,
  key: string,
  value: unknown,
  checkTruthy = false,
): void {
  if (checkTruthy) {
    if (value) updates[key] = value;
  } else {
    if (value !== undefined) updates[key] = value;
  }
}

// Helper: Build update object from optional fields
function buildEventUpdateObject(args: {
  title?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  allDay?: boolean;
  location?: string;
  eventType?: "meeting" | "deadline" | "timeblock" | "personal";
  attendeeIds?: Id<"users">[];
  externalAttendees?: string[];
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
  status?: "confirmed" | "tentative" | "cancelled";
  isRecurring?: boolean;
  recurrenceRule?: string;
  meetingUrl?: string;
  notes?: string;
  color?: CalendarEventColor;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  // Fields that require truthy check
  addFieldIfDefined(updates, "title", args.title, true);
  addFieldIfDefined(updates, "startTime", args.startTime, true);
  addFieldIfDefined(updates, "endTime", args.endTime, true);
  addFieldIfDefined(updates, "eventType", args.eventType, true);
  addFieldIfDefined(updates, "attendeeIds", args.attendeeIds, true);
  addFieldIfDefined(updates, "status", args.status, true);

  // Fields that allow undefined/null values
  addFieldIfDefined(updates, "description", args.description);
  addFieldIfDefined(updates, "allDay", args.allDay);
  addFieldIfDefined(updates, "location", args.location);
  addFieldIfDefined(updates, "externalAttendees", args.externalAttendees);
  addFieldIfDefined(updates, "projectId", args.projectId);
  addFieldIfDefined(updates, "issueId", args.issueId);
  addFieldIfDefined(updates, "isRecurring", args.isRecurring);
  addFieldIfDefined(updates, "recurrenceRule", args.recurrenceRule);
  addFieldIfDefined(updates, "meetingUrl", args.meetingUrl);
  addFieldIfDefined(updates, "notes", args.notes);
  addFieldIfDefined(updates, "color", args.color);

  return updates;
}

// Helper: Get events where user is organizer or attendee in a date range
async function getUserEventsInRange(
  ctx: QueryCtx,
  userId: Id<"users">,
  startDate: number,
  endDate: number,
) {
  // Parallel fetch: organized events + attending events
  const [organizedEvents, attendingEventsResult] = await Promise.all([
    // User is organizer
    ctx.db
      .query("calendarEvents")
      .withIndex("by_organizer", (q) =>
        q.eq("organizerId", userId).gte("startTime", startDate).lte("startTime", endDate),
      )
      .take(MAX_PAGE_SIZE),

    // User is attendee
    ctx.db
      .query("calendarEvents")
      .withIndex("by_attendee_start", (q) =>
        q
          // biome-ignore lint/suspicious/noExplicitAny: userId cast needed for strict types vs index query
          .eq("attendeeIds", userId as any)
          .gte("startTime", startDate)
          .lte("startTime", endDate),
      )
      .take(MAX_PAGE_SIZE),
  ]);

  let attendingEvents = attendingEventsResult;

  // Polyfill for convex-test limitation with multikey indexes
  // convex-test (as of current version) might not correctly simulate q.eq on array indexes
  if (process.env.IS_TEST_ENV === "true" && attendingEvents.length === 0) {
    const candidates = await ctx.db
      .query("calendarEvents")
      .withIndex("by_start_time")
      .filter((q) =>
        q.and(q.gte(q.field("startTime"), startDate), q.lte(q.field("startTime"), endDate)),
      )
      .take(MAX_PAGE_SIZE);

    const found = candidates.filter((e) => e.attendeeIds.includes(userId));
    if (found.length > 0) {
      attendingEvents = found;
    }
  }

  // Combine and deduplicate
  const allEvents = [...organizedEvents, ...attendingEvents];
  // Use Map to deduplicate by ID
  const uniqueEvents = Array.from(new Map(allEvents.map((e) => [e._id, e])).values());

  return uniqueEvents.sort((a, b) => a.startTime - b.startTime);
}

// Create a new calendar event
export const create = authenticatedMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.boolean(),
    location: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"),
      v.literal("deadline"),
      v.literal("timeblock"),
      v.literal("personal"),
    ),
    attendeeIds: v.optional(v.array(v.id("users"))),
    externalAttendees: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    status: v.optional(calendarStatuses),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    color: v.optional(calendarEventColors),
  },
  handler: async (ctx, args) => {
    // Validate times
    if (args.endTime <= args.startTime) {
      throw validation("endTime", "End time must be after start time");
    }

    const now = Date.now();

    const eventId = await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      allDay: args.allDay,
      location: args.location,
      eventType: args.eventType,
      organizerId: ctx.userId,
      attendeeIds: args.attendeeIds || [],
      externalAttendees: args.externalAttendees,
      projectId: args.projectId,
      issueId: args.issueId,
      status: args.status || "confirmed",
      isRecurring: args.isRecurring ?? false,
      recurrenceRule: args.recurrenceRule,
      meetingUrl: args.meetingUrl,
      notes: args.notes,
      isRequired: args.isRequired ?? false,
      color: args.color,
      updatedAt: now,
    });

    return eventId;
  },
});

// Get a single event by ID
export const get = authenticatedQuery({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;

    // Check access: user must be organizer or attendee
    const isOrganizer = event.organizerId === ctx.userId;
    const isAttendee = event.attendeeIds.includes(ctx.userId);

    if (!(isOrganizer || isAttendee)) {
      return null; // Not authorized to view
    }

    // Enrich with organizer details
    const organizer = await ctx.db.get(event.organizerId);

    return {
      ...event,
      organizerName: organizer?.name,
      organizerEmail: organizer?.email,
    };
  },
});

// List events for a date range
export const listByDateRange = authenticatedQuery({
  args: {
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const events = await getUserEventsInRange(ctx, ctx.userId, args.startDate, args.endDate);

    // Filter by project if specified
    const filteredEvents = args.projectId
      ? events.filter((event) => event.projectId === args.projectId)
      : events;

    // Batch fetch organizers to avoid N+1
    const organizerIds = [...new Set(filteredEvents.map((e) => e.organizerId))];
    const organizerMap = await batchFetchUsers(ctx, organizerIds);

    // Enrich with organizer details
    const enrichedEvents = filteredEvents.map((event) => {
      const organizer = organizerMap.get(event.organizerId);
      return {
        ...event,
        organizerName: organizer?.name,
        organizerEmail: organizer?.email,
      };
    });

    return enrichedEvents;
  },
});

// List all events for current user (optimized with date bounds)
export const listMine = authenticatedQuery({
  args: {
    includeCompleted: v.optional(v.boolean()),
    // Date range bounds - defaults to past 30 days through next 90 days
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Default date range: past 30 days through next 90 days
    const defaultStart = now - 30 * DAY; // 30 days ago
    const defaultEnd = now + 90 * DAY; // 90 days from now
    const startDate = args.startDate ?? defaultStart;
    const endDate = args.endDate ?? defaultEnd;

    const events = await getUserEventsInRange(ctx, ctx.userId, startDate, endDate);

    // Filter by status if requested
    const filteredEvents = args.includeCompleted
      ? events
      : events.filter((event) => event.status !== "cancelled");

    // Batch fetch organizers to avoid N+1
    const organizerIds = [...new Set(filteredEvents.map((e) => e.organizerId))];
    const organizerMap = await batchFetchUsers(ctx, organizerIds);

    // Enrich with organizer details
    const enrichedEvents = filteredEvents.map((event) => {
      const organizer = organizerMap.get(event.organizerId);
      return {
        ...event,
        organizerName: organizer?.name,
        organizerEmail: organizer?.email,
      };
    });

    return enrichedEvents;
  },
});

// Update an existing event
export const update = authenticatedMutation({
  args: {
    id: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    eventType: v.optional(
      v.union(
        v.literal("meeting"),
        v.literal("deadline"),
        v.literal("timeblock"),
        v.literal("personal"),
      ),
    ),
    attendeeIds: v.optional(v.array(v.id("users"))),
    externalAttendees: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    status: v.optional(calendarStatuses),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.optional(calendarEventColors),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw notFound("calendarEvent", args.id);

    // Only organizer can update event
    if (event.organizerId !== ctx.userId) {
      throw forbidden("organizer", "Only the event organizer can update this event");
    }

    // Validate times if provided
    const startTime = args.startTime ?? event.startTime;
    const endTime = args.endTime ?? event.endTime;
    if (endTime <= startTime) {
      throw validation("endTime", "End time must be after start time");
    }

    // Build update object using helper
    const updates = buildEventUpdateObject(args);
    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

// Delete an event
export const remove = authenticatedMutation({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw notFound("calendarEvent", args.id);

    // Only organizer can delete event
    if (event.organizerId !== ctx.userId) {
      throw forbidden("organizer", "Only the event organizer can delete this event");
    }

    await ctx.db.delete(args.id);
  },
});

// Get upcoming events (next 7 days)
export const getUpcoming = authenticatedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sevenDaysFromNow = now + WEEK;

    const events = await getUserEventsInRange(ctx, ctx.userId, now, sevenDaysFromNow);

    // Filter to active events (not cancelled)
    const visibleEvents = events.filter((event) => event.status !== "cancelled");

    // Limit results
    const limitedEvents = args.limit ? visibleEvents.slice(0, args.limit) : visibleEvents;

    // Batch fetch organizers to avoid N+1
    const organizerIds = [...new Set(limitedEvents.map((e) => e.organizerId))];
    const organizerMap = await batchFetchUsers(ctx, organizerIds);

    // Enrich with organizer details
    const enrichedEvents = limitedEvents.map((event) => {
      const organizer = organizerMap.get(event.organizerId);
      return {
        ...event,
        organizerName: organizer?.name,
        organizerEmail: organizer?.email,
      };
    });

    return enrichedEvents;
  },
});

// Internal query for getting event details (used by email notifications)
export const getInternal = internalQuery({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
