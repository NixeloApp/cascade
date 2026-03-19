import type { TestConvex } from "convex-test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { DAY, HOUR, MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

describe("Bookings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to a known safe time: Monday noon UTC
    // This avoids "midnight" boundary issues where bookings might span across days
    // which is not supported by the simple "bookingFitsSlot" logic
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create a booking page
  async function createBookingPage(
    t: TestConvex<typeof schema>,
    userId: Id<"users">,
    slug: string,
  ) {
    return await t.run(async (ctx) => {
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

  // Helper to set up full availability for a user
  async function setupFullAvailability(t: TestConvex<typeof schema>, userId: Id<"users">) {
    await t.run(async (ctx) => {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ] as const;
      for (const day of days) {
        await ctx.db.insert("availabilitySlots", {
          userId,
          dayOfWeek: day,
          startTime: "00:00",
          endTime: "23:59",
          timezone: "UTC",
          isActive: true,
        });
      }
    });
  }

  it("should create a booking successfully", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    // Host needs workspace context for calendar events to be created
    await createOrganizationAdmin(t, hostId);
    await setupFullAvailability(t, hostId);
    await createBookingPage(t, hostId, "test-page");

    // Booking time: 24 hours from now
    const startTime = Date.now() + DAY;

    const { bookingId } = await t.mutation(api.bookings.createBooking, {
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
    expect(booking.calendarEventId).not.toBeUndefined();
    expect(typeof booking.calendarEventId).toBe("string");

    // Verify calendar event
    const calendarEventId = booking.calendarEventId;
    if (!calendarEventId) throw new Error("Expected calendarEventId to be defined");
    const event = await t.run(async (ctx) => ctx.db.get(calendarEventId));
    expect(event).not.toBeNull();
    expect(event?.title).toContain("Test Page with Guest");
  });

  it("should route booking slots and created bookings to an active OOO delegate host", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "OOO Host" });
    const delegateUserId = await createTestUser(t, { name: "Delegate Host" });

    const { organizationId } = await createOrganizationAdmin(t, hostId);

    await addUserToOrganization(t, organizationId, delegateUserId, hostId);

    const asHost = asAuthenticatedUser(t, hostId);
    const now = Date.now();
    await asHost.mutation(api.outOfOffice.upsert, {
      startsAt: now - DAY,
      endsAt: now + DAY,
      reason: "travel",
      delegateUserId,
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("availabilitySlots", {
        userId: delegateUserId,
        dayOfWeek: "tuesday",
        startTime: "00:00",
        endTime: "23:59",
        timezone: "UTC",
        isActive: true,
      });
    });

    await createBookingPage(t, hostId, "delegate-page");

    const date = new Date("2024-01-02T12:00:00Z").getTime();
    const slots = await t.query(api.bookings.getAvailableSlots, {
      bookingPageSlug: "delegate-page",
      date,
      timezone: "UTC",
    });

    expect(slots.length).toBeGreaterThan(0);

    const bookingStart = slots[0];
    const { bookingId } = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "delegate-page",
      bookerName: "Guest",
      bookerEmail: "guest@example.com",
      startTime: bookingStart,
      timezone: "UTC",
    });

    const booking = await t.run(async (ctx) => ctx.db.get(bookingId));
    expect(booking?.hostId).toBe(delegateUserId);

    const eventId = booking?.calendarEventId;
    if (!eventId) {
      throw new Error("Expected delegated booking to create a calendar event");
    }

    const event = await t.run(async (ctx) => ctx.db.get(eventId));
    expect(event?.organizerId).toBe(delegateUserId);
  });

  it("should prevent overlapping bookings", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    await setupFullAvailability(t, hostId);
    await createBookingPage(t, hostId, "overlap-page");

    // Base booking: T to T+30
    const baseTime = Date.now() + DAY;

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
        startTime: baseTime + 15 * MINUTE,
        timezone: "UTC",
      });
    }, "This time slot is no longer available");

    // Case B: End Overlap (T-15 to T+15)
    await expectThrowsAsync(async () => {
      await t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "overlap-page",
        bookerName: "Guest 3",
        bookerEmail: "guest3@example.com",
        startTime: baseTime - 15 * MINUTE,
        timezone: "UTC",
      });
    }, "This time slot is no longer available");

    // Setup for Containment Test
    const containBaseTime = baseTime + 5 * HOUR; // Far away

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
      startTime: containBaseTime + 10 * MINUTE, // Starts at T+10
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
      startTime: baseTime + 30 * MINUTE, // T+30
      timezone: "UTC",
    });
  });

  it("should validate minimum notice", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    await setupFullAvailability(t, hostId);

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
        startTime: now + HOUR,
        timezone: "UTC",
      });
    }, "Requires at least 24 hours notice");
  });

  it("should resolve OOO delegate per-slot when OOO starts mid-day", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    const delegateId = await createTestUser(t, { name: "Delegate" });

    const { organizationId } = await createOrganizationAdmin(t, hostId);
    await addUserToOrganization(t, organizationId, delegateId, hostId);

    // The code uses new Date(args.date).setHours() which operates in local time.
    // To keep the test deterministic, we construct the date the same way the code does:
    // start with a "day" timestamp and derive slot times from it using setHours.
    // 2024-01-01 (Monday in local CDT) - the fake timer is set to this day at noon.
    const dayBase = new Date("2024-01-01T12:00:00Z"); // matches vi.setSystemTime
    const dayStart = new Date(dayBase);
    dayStart.setHours(0, 0, 0, 0); // start of local day
    const dayStartMs = dayStart.getTime();

    // Determine day of week for local interpretation
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const dayOfWeek = dayNames[dayStart.getDay()];

    // OOO starts at local 11am (mid-day, early enough that slots still fall within UTC 9-5)
    const oooStartDate = new Date(dayStartMs);
    oooStartDate.setHours(11, 0, 0, 0);
    const oooStart = oooStartDate.getTime();
    const oooEnd = oooStart + 2 * DAY;

    const asHost = asAuthenticatedUser(t, hostId);
    await asHost.mutation(api.outOfOffice.upsert, {
      startsAt: oooStart,
      endsAt: oooEnd,
      reason: "travel",
      delegateUserId: delegateId,
    });

    // Use America/Chicago timezone to match local system time, avoiding UTC day-boundary issues.
    const tz = "America/Chicago";

    // Host has availability 8am-5pm local
    await t.run(async (ctx) => {
      await ctx.db.insert("availabilitySlots", {
        userId: hostId,
        dayOfWeek,
        startTime: "08:00",
        endTime: "17:00",
        timezone: tz,
        isActive: true,
      });
    });

    // Delegate has availability 8am-5pm local (same window for simplicity)
    await t.run(async (ctx) => {
      await ctx.db.insert("availabilitySlots", {
        userId: delegateId,
        dayOfWeek,
        startTime: "08:00",
        endTime: "17:00",
        timezone: tz,
        isActive: true,
      });
    });

    await createBookingPage(t, hostId, "midday-ooo");

    const slots = await t.query(api.bookings.getAvailableSlots, {
      bookingPageSlug: "midday-ooo",
      date: dayStartMs,
      timezone: "UTC",
    });

    expect(slots.length).toBeGreaterThan(0);

    // Slots before OOO start should be from host
    const morningSlots = slots.filter((s) => s < oooStart);
    expect(morningSlots.length).toBeGreaterThan(0);

    // Slots at/after OOO start should be from delegate
    const afternoonSlots = slots.filter((s) => s >= oooStart);
    expect(afternoonSlots.length).toBeGreaterThan(0);

    // Verify morning slot maps to host by booking it
    const morningSlot = morningSlots[0];
    const { bookingId: morningBookingId } = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "midday-ooo",
      bookerName: "Morning Guest",
      bookerEmail: "morning@example.com",
      startTime: morningSlot,
      timezone: "UTC",
    });
    const morningBooking = await t.run(async (ctx) => ctx.db.get(morningBookingId));
    expect(morningBooking?.hostId).toBe(hostId);

    // Verify afternoon slot maps to delegate by booking it
    const afternoonSlot = afternoonSlots[0];
    const { bookingId: afternoonBookingId } = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "midday-ooo",
      bookerName: "Afternoon Guest",
      bookerEmail: "afternoon@example.com",
      startTime: afternoonSlot,
      timezone: "UTC",
    });
    const afternoonBooking = await t.run(async (ctx) => ctx.db.get(afternoonBookingId));
    expect(afternoonBooking?.hostId).toBe(delegateId);
  });

  it("should return no slots when OOO is active all day and delegate has no availability", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    const delegateId = await createTestUser(t, { name: "Delegate No Avail" });

    const { organizationId } = await createOrganizationAdmin(t, hostId);
    await addUserToOrganization(t, organizationId, delegateId, hostId);

    // Use a future day to satisfy minimumNotice=0 from current fake time
    const futureDay = new Date("2024-01-02T12:00:00Z");
    futureDay.setHours(0, 0, 0, 0);
    const dayStartMs = futureDay.getTime();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const dayOfWeek = dayNames[futureDay.getDay()];

    // OOO covers the entire day
    const asHost = asAuthenticatedUser(t, hostId);
    await asHost.mutation(api.outOfOffice.upsert, {
      startsAt: dayStartMs - DAY,
      endsAt: dayStartMs + 2 * DAY,
      reason: "vacation",
      delegateUserId: delegateId,
    });

    // Host has availability but is OOO
    await t.run(async (ctx) => {
      await ctx.db.insert("availabilitySlots", {
        userId: hostId,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
        isActive: true,
      });
    });
    // Delegate has NO availability set up

    await createBookingPage(t, hostId, "no-delegate-avail");

    const slots = await t.query(api.bookings.getAvailableSlots, {
      bookingPageSlug: "no-delegate-avail",
      date: dayStartMs,
      timezone: "UTC",
    });

    // All slots should be empty — delegate has no availability
    expect(slots.length).toBe(0);
  });

  it("should validate inactive page", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t, { name: "Host" });
    await setupFullAvailability(t, hostId);

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
        startTime: Date.now() + DAY,
        timezone: "UTC",
      });
    }, "bookingPage"); // Expect not found error for bookingPage
  });
});
