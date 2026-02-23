import { v } from "convex/values";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { requireOwned, validation } from "./lib/errors";

/**
 * Availability Slots - Manage when users are available for bookings
 * Cal.com-style availability management
 */

// Set availability for a specific day
export const setDayAvailability = authenticatedMutation({
  args: {
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    ),
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    timezone: v.string(), // "America/New_York"
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = ctx.userId;

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!(timeRegex.test(args.startTime) && timeRegex.test(args.endTime))) {
      throw validation("time", "Invalid time format. Use HH:MM (24-hour)");
    }

    // Check if slot already exists for this day
    const existing = await ctx.db
      .query("availabilitySlots")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("dayOfWeek", args.dayOfWeek))
      .first();

    if (existing) {
      // Update existing slot
      await ctx.db.patch(existing._id, {
        startTime: args.startTime,
        endTime: args.endTime,
        timezone: args.timezone,
        isActive: args.isActive ?? true,
      });
      return { slotId: existing._id };
    } else {
      // Create new slot
      const slotId = await ctx.db.insert("availabilitySlots", {
        userId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
        timezone: args.timezone,
        isActive: args.isActive ?? true,
      });
      return { slotId };
    }
  },
});

// Set default working hours (Mon-Fri 9-5)
export const setDefaultWorkingHours = authenticatedMutation({
  args: {
    timezone: v.string(),
    startTime: v.optional(v.string()), // Default "09:00"
    endTime: v.optional(v.string()), // Default "17:00"
  },
  handler: async (ctx, args) => {
    const userId = ctx.userId;

    const startTime = args.startTime || "09:00";
    const endTime = args.endTime || "17:00";

    const workdays: Array<
      "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
    > = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    // Fetch all existing slots in parallel
    const existingSlots = await Promise.all(
      workdays.map((day) =>
        ctx.db
          .query("availabilitySlots")
          .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("dayOfWeek", day))
          .first(),
      ),
    );

    // Upsert all slots in parallel
    await Promise.all(
      workdays.map((day, i) => {
        const existing = existingSlots[i];
        if (existing) {
          return ctx.db.patch(existing._id, {
            startTime,
            endTime,
            timezone: args.timezone,
            isActive: true,
          });
        }
        return ctx.db.insert("availabilitySlots", {
          userId,
          dayOfWeek: day,
          startTime,
          endTime,
          timezone: args.timezone,
          isActive: true,
        });
      }),
    );
  },
});

// Get user's availability schedule
export const getMyAvailability = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const slots = await ctx.db
      .query("availabilitySlots")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    return slots.sort((a, b) => {
      const dayOrder = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    });
  },
});

/** Gets another user's active availability slots for booking purposes. */
export const getUserAvailability = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("availabilitySlots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(BOUNDED_LIST_LIMIT);

    return slots.sort((a, b) => {
      const dayOrder = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    });
  },
});

// Toggle availability on/off
export const toggleSlot = authenticatedMutation({
  args: {
    slotId: v.id("availabilitySlots"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.slotId);
    requireOwned(slot, ctx.userId, "availabilitySlot");

    await ctx.db.patch(args.slotId, { isActive: args.isActive });
  },
});

// Delete an availability slot
export const removeSlot = authenticatedMutation({
  args: { slotId: v.id("availabilitySlots") },
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.slotId);
    requireOwned(slot, ctx.userId, "availabilitySlot");

    await ctx.db.delete(args.slotId);
  },
});
