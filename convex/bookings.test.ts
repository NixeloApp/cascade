import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser, expectThrowsAsync } from "./testUtils";

describe("Bookings", () => {
  // Helper to create a booking page
  async function createBookingPage(t: any, userId: any, slug: string) {
    return await t.run(async (ctx: any) => {
      const pageId = await ctx.db.insert("bookingPages", {
        userId,
        slug,
        title: "Test Page",
        duration: 30, // 30 minutes
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        minimumNotice: 0, // No minimum notice for simpler testing
        location: "zoom",
        isActive: true,
        requiresConfirmation: false,
        color: "#000000",
        updatedAt: Date.now(),
      });
      return pageId;
    });
  }

  it("should create a booking successfully", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    await createBookingPage(t, hostId, "test-page");

    // Booking time: 24 hours from now
    const startTime = Date.now() + 24 * 60 * 60 * 1000;

    const bookingId = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "test-page",
      bookerName: "Guest",
      bookerEmail: "guest@example.com",
      startTime,
      timezone: "UTC",
    });

    const booking = await t.run(async (ctx) => ctx.db.get(bookingId));
    expect(booking).not.toBeNull();
    if (!booking) throw new Error("Booking not found");

    expect(booking.status).toBe("confirmed");
    expect(booking.calendarEventId).toBeDefined();

    // Verify calendar event
    if (!booking.calendarEventId) throw new Error("Expected calendarEventId to be defined");
    const event = await t.run(async (ctx) => ctx.db.get(booking.calendarEventId));
    expect(event).not.toBeNull();
    expect(event?.title).toContain("Test Page with Guest");
  });

  it("should prevent overlapping bookings", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    await createBookingPage(t, hostId, "overlap-page");

    // Base booking: T to T+30
    const baseTime = Date.now() + 24 * 60 * 60 * 1000;

    // Create first booking
    await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "overlap-page",
      bookerName: "Guest 1",
      bookerEmail: "guest1@example.com",
      startTime: baseTime,
      timezone: "UTC",
    });

    // Case A: Start Overlap (T+15 to T+45)
    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "overlap-page",
        bookerName: "Guest 2",
        bookerEmail: "guest2@example.com",
        startTime: baseTime + 15 * 60 * 1000,
        timezone: "UTC",
      });
    }, "This time slot is no longer available");

    // Case B: End Overlap (T-15 to T+15)
    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "overlap-page",
        bookerName: "Guest 3",
        bookerEmail: "guest3@example.com",
        startTime: baseTime - 15 * 60 * 1000,
        timezone: "UTC",
      });
    }, "This time slot is no longer available");

    // Setup for Containment Test
    const containBaseTime = baseTime + 5 * 60 * 60 * 1000; // Far away

    // Create a short duration page for the "inner" booking
    await t.run(async (ctx) => {
      return await ctx.db.insert("bookingPages", {
        userId: hostId,
        slug: "short-page",
        title: "Short Page",
        duration: 10, // 10 minutes
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        minimumNotice: 0,
        location: "zoom",
        isActive: true,
        requiresConfirmation: false,
        color: "#000000",
        updatedAt: Date.now(),
      });
    });

    // Create the "inner" booking (existing booking) 10:10 - 10:20
    await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "short-page",
      bookerName: "Inner Guest",
      bookerEmail: "inner@example.com",
      startTime: containBaseTime + 10 * 60 * 1000, // Starts at T+10
      timezone: "UTC",
    });

    // Try to create "outer" booking (new booking) on regular page 10:00 - 10:30
    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "overlap-page",
        bookerName: "Outer Guest",
        bookerEmail: "outer@example.com",
        startTime: containBaseTime, // Starts at T, ends at T+30
        timezone: "UTC",
      });
    }, "This time slot is no longer available");

    // Case E: Boundary Success (Starts exactly at end of existing booking)
    // Existing booking ends at baseTime + 30 mins.
    await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "overlap-page",
      bookerName: "Guest 4",
      bookerEmail: "guest4@example.com",
      startTime: baseTime + 30 * 60 * 1000, // T+30
      timezone: "UTC",
    });
  });

  it("should validate minimum notice", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });

    await t.run(async (ctx) => {
      await ctx.db.insert("bookingPages", {
        userId: hostId,
        slug: "notice-page",
        title: "Notice Page",
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        minimumNotice: 24, // 24 hours notice required
        location: "zoom",
        isActive: true,
        requiresConfirmation: false,
        color: "#000000",
        updatedAt: Date.now(),
      });
    });

    const now = Date.now();
    // Try booking 1 hour from now
    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "notice-page",
        bookerName: "Guest",
        bookerEmail: "guest@example.com",
        startTime: now + 60 * 60 * 1000,
        timezone: "UTC",
      });
    }, "Requires at least 24 hours notice");
  });

  it("should validate inactive page", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });

    await t.run(async (ctx) => {
      await ctx.db.insert("bookingPages", {
        userId: hostId,
        slug: "inactive-page",
        title: "Inactive Page",
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        minimumNotice: 0,
        location: "zoom",
        isActive: false, // Inactive
        requiresConfirmation: false,
        color: "#000000",
        updatedAt: Date.now(),
      });
    });

    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "inactive-page",
        bookerName: "Guest",
        bookerEmail: "guest@example.com",
        startTime: Date.now() + 24 * 60 * 60 * 1000,
        timezone: "UTC",
      });
    }, "bookingPage"); // Expect not found error for bookingPage
  });
});
