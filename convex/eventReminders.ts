/**
 * Event Reminders
 *
 * Manages scheduled reminders for calendar events.
 * Supports email, push, and in-app notification types.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";

const reminderTypes = v.union(v.literal("email"), v.literal("push"), v.literal("in_app"));

// Default reminder options (in minutes)
export const DEFAULT_REMINDER_OPTIONS = [15, 30, 60, 1440] as const; // 15min, 30min, 1hr, 1day

/**
 * Create a reminder for a calendar event
 */
export const create = authenticatedMutation({
  args: {
    eventId: v.id("calendarEvents"),
    reminderType: reminderTypes,
    minutesBefore: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the event
    const event = await ctx.db.get(args.eventId);
    if (!event) throw notFound("event", args.eventId);

    // Check if user is organizer or attendee
    const isOrganizer = event.organizerId === ctx.userId;
    const isAttendee = event.attendeeIds.includes(ctx.userId);
    if (!isOrganizer && !isAttendee) {
      throw forbidden("set reminders for events you're not part of");
    }

    // Check for existing reminder with same type
    const existing = await ctx.db
      .query("eventReminders")
      .withIndex("by_event_user_type", (q) =>
        q
          .eq("eventId", args.eventId)
          .eq("userId", ctx.userId)
          .eq("reminderType", args.reminderType),
      )
      .first();

    if (existing) {
      // Update existing reminder
      const scheduledFor = event.startTime - args.minutesBefore * 60 * 1000;
      await ctx.db.patch(existing._id, {
        minutesBefore: args.minutesBefore,
        scheduledFor,
        sent: false,
        sentAt: undefined,
      });
      return existing._id;
    }

    // Calculate scheduled time
    const scheduledFor = event.startTime - args.minutesBefore * 60 * 1000;

    // Create the reminder
    const reminderId = await ctx.db.insert("eventReminders", {
      eventId: args.eventId,
      userId: ctx.userId,
      reminderType: args.reminderType,
      minutesBefore: args.minutesBefore,
      scheduledFor,
      sent: false,
    });

    return reminderId;
  },
});

/**
 * Create default reminders for a new event (called when event is created)
 */
export const createDefaultReminders = internalMutation({
  args: {
    eventId: v.id("calendarEvents"),
    userId: v.id("users"),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Create default 15-minute email reminder
    const scheduledFor = args.startTime - 15 * 60 * 1000;

    // Only create if event is in the future
    if (scheduledFor > Date.now()) {
      await ctx.db.insert("eventReminders", {
        eventId: args.eventId,
        userId: args.userId,
        reminderType: "email",
        minutesBefore: 15,
        scheduledFor,
        sent: false,
      });
    }
  },
});

/**
 * Get reminders for an event
 */
export const listByEvent = authenticatedQuery({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return [];

    // Check access
    const isOrganizer = event.organizerId === ctx.userId;
    const isAttendee = event.attendeeIds.includes(ctx.userId);
    if (!isOrganizer && !isAttendee) return [];

    // Get reminders for this user only
    const reminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    return reminders;
  },
});

/**
 * Get all upcoming reminders for current user
 */
export const listUpcoming = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Get unsent reminders scheduled within the next week
    const reminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("sent"), false),
          q.gte(q.field("scheduledFor"), now),
          q.lte(q.field("scheduledFor"), oneWeekFromNow),
        ),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Enrich with event data
    const enriched = await Promise.all(
      reminders.map(async (reminder) => {
        const event = await ctx.db.get(reminder.eventId);
        return {
          ...reminder,
          event: event
            ? {
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                meetingUrl: event.meetingUrl,
              }
            : null,
        };
      }),
    );

    return enriched.filter((r) => r.event !== null);
  },
});

/**
 * Delete a reminder
 */
export const remove = authenticatedMutation({
  args: {
    reminderId: v.id("eventReminders"),
  },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) throw notFound("reminder", args.reminderId);

    // Only owner can delete their reminder
    if (reminder.userId !== ctx.userId) {
      throw forbidden("delete other users' reminders");
    }

    await ctx.db.delete(args.reminderId);
  },
});

/**
 * Remove all reminders for an event (called when event is deleted)
 */
export const removeAllForEvent = internalMutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(BOUNDED_LIST_LIMIT);

    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }
  },
});

/**
 * Process due reminders (called by cron job)
 * Sends notifications for reminders that are due
 */
export const processDueReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Get reminders that are due (scheduled time has passed, not yet sent)
    // Add 1 minute buffer to avoid edge cases
    const dueReminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_scheduled_unsent", (q) => q.eq("sent", false))
      .filter((q) => q.lte(q.field("scheduledFor"), now))
      .take(100); // Process up to 100 at a time

    let processed = 0;
    let skipped = 0;

    for (const reminder of dueReminders) {
      // Get the event
      const event = await ctx.db.get(reminder.eventId);
      if (!event) {
        // Event was deleted, remove reminder
        await ctx.db.delete(reminder._id);
        skipped++;
        continue;
      }

      // Skip if event has already started or is cancelled
      if (event.startTime < now || event.status === "cancelled") {
        await ctx.db.patch(reminder._id, { sent: true, sentAt: now });
        skipped++;
        continue;
      }

      // Get user
      const user = await ctx.db.get(reminder.userId);
      if (!user) {
        await ctx.db.delete(reminder._id);
        skipped++;
        continue;
      }

      // Send based on reminder type
      if (reminder.reminderType === "email" && user.email) {
        // Schedule email notification
        await ctx.scheduler.runAfter(0, internal.email.notifications.sendEventReminder, {
          userId: reminder.userId,
          eventId: reminder.eventId,
          minutesBefore: reminder.minutesBefore,
        });
      } else if (reminder.reminderType === "in_app") {
        // Create in-app notification
        await ctx.db.insert("notifications", {
          userId: reminder.userId,
          type: "calendar_reminder",
          title: `Upcoming: ${event.title}`,
          message: `Starting in ${reminder.minutesBefore} minutes`,
          isRead: false,
        });
      }
      // Push notifications would be handled separately via web push API

      // Mark as sent
      await ctx.db.patch(reminder._id, { sent: true, sentAt: now });
      processed++;
    }

    return { processed, skipped };
  },
});

/**
 * Update event reminders when event time changes
 */
export const updateForEventTimeChange = internalMutation({
  args: {
    eventId: v.id("calendarEvents"),
    newStartTime: v.number(),
  },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("sent"), false))
      .take(BOUNDED_LIST_LIMIT);

    for (const reminder of reminders) {
      const newScheduledFor = args.newStartTime - reminder.minutesBefore * 60 * 1000;
      await ctx.db.patch(reminder._id, { scheduledFor: newScheduledFor });
    }
  },
});
