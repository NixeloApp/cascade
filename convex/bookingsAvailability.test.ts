import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";

import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Booking Availability Security", () => {
  it("should enforce availability constraints", async () => {
    const t = convexTest(schema, modules);
    const hostId = await createTestUser(t);
    const asHost = asAuthenticatedUser(t, hostId);

    // 1. Setup Booking Page
    await asHost.mutation(api.bookingPages.create, {
      slug: "availability-test",
      title: "Availability Test",
      duration: 60, // 1 hour
      location: "zoom",
      minimumNotice: 0,
      requiresConfirmation: false,
    });

    // 2. Set Availability: Monday 09:00 - 17:00 UTC only
    await asHost.mutation(api.availability.setDayAvailability, {
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "17:00",
      timezone: "UTC",
      isActive: true,
    });

    // 3. Calculate a Sunday timestamp (next Sunday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;

    const nextSunday = new Date(now);
    nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(10, 0, 0, 0); // 10:00 AM UTC
    const sundayTimestamp = nextSunday.getTime();

    // 4. Attempt to book on Sunday (Expect Failure)
    // The previous vulnerability allowed this. Now it should fail.
    await expect(
      t.mutation(api.bookings.createBooking, {
        bookingPageSlug: "availability-test",
        bookerName: "Attacker",
        bookerEmail: "attacker@example.com",
        startTime: sundayTimestamp,
        timezone: "UTC",
      }),
    ).rejects.toThrow("Selected time is outside available hours");

    // 5. Test VALID booking (Monday 10:00 AM)
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
    // If today is Monday, this logic might jump to next week or today depending on time?
    // Let's ensure we pick a future Monday 10:00 AM

    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(10, 0, 0, 0); // 10:00 AM UTC

    // Ensure it's in the future (minimum notice check might fail if 'now' is close to Monday 10am)
    // But minimumNotice is 0.
    // However, createBooking checks: hoursUntilMeeting < page.minimumNotice
    // (args.startTime - now) / HOUR
    // If we book for *next* Monday it's definitely future.

    const mondayTimestamp = nextMonday.getTime();

    const result = await t.mutation(api.bookings.createBooking, {
      bookingPageSlug: "availability-test",
      bookerName: "Valid User",
      bookerEmail: "valid@example.com",
      startTime: mondayTimestamp,
      timezone: "UTC",
    });

    expect(result.bookingId).toBeDefined();
  });
});
