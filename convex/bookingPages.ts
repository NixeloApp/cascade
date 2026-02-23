import { v } from "convex/values";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, requireOwned, validation } from "./lib/errors";
import { bookingFieldTypes } from "./validators";

/**
 * Booking Pages - Cal.com-style booking page management
 * Create shareable booking links for meetings
 */

// Helper: Build booking page update object from optional fields
function buildBookingPageUpdates(args: {
  title?: string;
  description?: string;
  duration?: number;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  minimumNotice?: number;
  maxBookingsPerDay?: number;
  location?: string;
  locationDetails?: string;
  questions?: Array<{
    label: string;
    type: "text" | "email" | "phone";
    required: boolean;
  }>;
  isActive?: boolean;
  requiresConfirmation?: boolean;
  color?: string;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  if (args.title) updates.title = args.title;
  if (args.description !== undefined) updates.description = args.description;
  if (args.duration) updates.duration = args.duration;
  if (args.bufferTimeBefore !== undefined) updates.bufferTimeBefore = args.bufferTimeBefore;
  if (args.bufferTimeAfter !== undefined) updates.bufferTimeAfter = args.bufferTimeAfter;
  if (args.minimumNotice !== undefined) updates.minimumNotice = args.minimumNotice;
  if (args.maxBookingsPerDay !== undefined) updates.maxBookingsPerDay = args.maxBookingsPerDay;
  if (args.location) updates.location = args.location;
  if (args.locationDetails !== undefined) updates.locationDetails = args.locationDetails;
  if (args.questions !== undefined) updates.questions = args.questions;
  if (args.isActive !== undefined) updates.isActive = args.isActive;
  if (args.requiresConfirmation !== undefined) {
    updates.requiresConfirmation = args.requiresConfirmation;
  }
  if (args.color) updates.color = args.color;

  return updates;
}

// Create a booking page
export const create = authenticatedMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // Minutes
    bufferTimeBefore: v.optional(v.number()),
    bufferTimeAfter: v.optional(v.number()),
    minimumNotice: v.optional(v.number()), // Hours
    maxBookingsPerDay: v.optional(v.number()),
    location: v.union(
      v.literal("phone"),
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("teams"),
      v.literal("in-person"),
      v.literal("custom"),
    ),
    locationDetails: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: bookingFieldTypes,
          required: v.boolean(),
        }),
      ),
    ),
    requiresConfirmation: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug is already taken
    const existing = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw conflict("This booking URL is already taken");
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(args.slug)) {
      throw validation("slug", "Must contain only lowercase letters, numbers, and hyphens");
    }

    const now = Date.now();

    const pageId = await ctx.db.insert("bookingPages", {
      userId: ctx.userId,
      slug: args.slug,
      title: args.title,
      description: args.description,
      duration: args.duration,
      bufferTimeBefore: args.bufferTimeBefore || 0,
      bufferTimeAfter: args.bufferTimeAfter || 0,
      minimumNotice: args.minimumNotice || 24, // Default 24 hours
      maxBookingsPerDay: args.maxBookingsPerDay,
      location: args.location,
      locationDetails: args.locationDetails,
      questions: args.questions,
      isActive: true,
      requiresConfirmation: args.requiresConfirmation ?? false,
      color: args.color || "#3B82F6",
      updatedAt: now,
    });
    return { pageId };
  },
});

/** Retrieves a booking page by slug if active, including host information. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!page?.isActive) return null;

    // Get host info
    const host = await ctx.db.get(page.userId);

    return {
      ...page,
      hostName: host?.name,
      hostEmail: host?.email,
    };
  },
});

// List user's booking pages
export const listMine = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db
      .query("bookingPages")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .take(BOUNDED_LIST_LIMIT);

    return pages;
  },
});

// Update booking page
export const update = authenticatedMutation({
  args: {
    id: v.id("bookingPages"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    bufferTimeBefore: v.optional(v.number()),
    bufferTimeAfter: v.optional(v.number()),
    minimumNotice: v.optional(v.number()),
    maxBookingsPerDay: v.optional(v.number()),
    location: v.optional(
      v.union(
        v.literal("phone"),
        v.literal("zoom"),
        v.literal("meet"),
        v.literal("teams"),
        v.literal("in-person"),
        v.literal("custom"),
      ),
    ),
    locationDetails: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: bookingFieldTypes,
          required: v.boolean(),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
    requiresConfirmation: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    requireOwned(page, ctx.userId, "bookingPage");

    // Build update object using helper
    const updates = buildBookingPageUpdates(args);
    await ctx.db.patch(args.id, updates);
  },
});

// Delete booking page
export const remove = authenticatedMutation({
  args: { id: v.id("bookingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    requireOwned(page, ctx.userId, "bookingPage");

    // Check for active bookings (only need to know if any exist)
    const activeBooking = await ctx.db
      .query("bookings")
      .withIndex("by_booking_page", (q) => q.eq("bookingPageId", args.id))
      .filter((q) => q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")))
      .first();

    if (activeBooking) {
      throw conflict("Cannot delete booking page with active bookings");
    }

    await ctx.db.delete(args.id);
  },
});

// Toggle booking page active status
export const toggleActive = authenticatedMutation({
  args: {
    id: v.id("bookingPages"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    requireOwned(page, ctx.userId, "bookingPage");

    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});
