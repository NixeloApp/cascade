import type { TestConvex } from "convex-test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Booking Return Types", () => {
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

  it("should return success object for booking pages mutations", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Create a booking page
    const { pageId } = await asUser.mutation(api.bookingPages.create, {
      slug: "test-page-returns",
      title: "Test Page Returns",
      duration: 30,
      location: "zoom",
    });

    // Test update
    const updateResult = await asUser.mutation(api.bookingPages.update, {
      id: pageId,
      title: "Updated Title",
    });
    expect(updateResult).toEqual({ success: true });

    // Test toggleActive
    const toggleResult = await asUser.mutation(api.bookingPages.toggleActive, {
      id: pageId,
      isActive: false,
    });
    expect(toggleResult).toEqual({ success: true });

    // Test remove
    const removeResult = await asUser.mutation(api.bookingPages.remove, {
      id: pageId,
    });
    expect(removeResult).toEqual({ success: true, deleted: true });
  });

  it("should return success object for bookings mutations", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t);
    const asHost = asAuthenticatedUser(t, hostId);

    // Setup availability for the host so booking validation passes
    await setupFullAvailability(t, hostId);

    // Create a booking page
    const { pageId } = await asHost.mutation(api.bookingPages.create, {
      slug: "test-booking-returns",
      title: "Test Booking Returns",
      duration: 30,
      location: "zoom",
      minimumNotice: 0,
      requiresConfirmation: true, // Pending status
    });

    // Create a booking (doesn't require auth to create, but we can use host for simplicity or unauth)
    // createBooking is public or authed? Let's check.
    // createBooking is just `mutation`, so public.
    const { bookingId } = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "test-booking-returns",
      bookerName: "Test Booker",
      bookerEmail: "test@example.com",
      startTime: Date.now() + 2 * DAY,
      timezone: "UTC",
    });

    // Test confirm (requires auth as host)
    const confirmResult = await asHost.mutation(api.bookings.confirmBooking, {
      id: bookingId,
    });
    expect(confirmResult).toEqual({ success: true });

    // Test cancel (requires auth as host)
    const cancelResult = await asHost.mutation(api.bookings.cancelBooking, {
      id: bookingId,
      reason: "Changed my mind",
    });
    expect(cancelResult).toEqual({ success: true });
  });
});
