import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Availability", () => {
  describe("setDayAvailability", () => {
    it("should create availability slot for a day", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slotId = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
      });

      expect(slotId).toBeDefined();

      const slot = await t.run(async (ctx) => ctx.db.get(slotId));
      expect(slot?.userId).toBe(userId);
      expect(slot?.dayOfWeek).toBe("monday");
      expect(slot?.startTime).toBe("09:00");
      expect(slot?.endTime).toBe("17:00");
      expect(slot?.isActive).toBe(true);
    });

    it("should update existing slot for the same day", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slotId1 = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
      });

      const slotId2 = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "10:00",
        endTime: "18:00",
        timezone: "Europe/London",
      });

      // Should return the same ID (updated, not created new)
      expect(slotId2).toBe(slotId1);

      const slot = await t.run(async (ctx) => ctx.db.get(slotId1));
      expect(slot?.startTime).toBe("10:00");
      expect(slot?.endTime).toBe("18:00");
      expect(slot?.timezone).toBe("Europe/London");
    });

    it("should reject invalid time format", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.availability.setDayAvailability, {
          dayOfWeek: "monday",
          startTime: "9:00", // Invalid: single digit hour
          endTime: "17:00",
          timezone: "America/New_York",
        }),
      ).rejects.toThrow(/time/i);
    });

    it("should reject invalid hour value", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.availability.setDayAvailability, {
          dayOfWeek: "monday",
          startTime: "09:00",
          endTime: "25:00", // Invalid: hour > 23
          timezone: "America/New_York",
        }),
      ).rejects.toThrow(/time/i);
    });

    it("should allow setting slot as inactive", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slotId = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
        isActive: false,
      });

      const slot = await t.run(async (ctx) => ctx.db.get(slotId));
      expect(slot?.isActive).toBe(false);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.availability.setDayAvailability, {
          dayOfWeek: "monday",
          startTime: "09:00",
          endTime: "17:00",
          timezone: "America/New_York",
        }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("setDefaultWorkingHours", () => {
    it("should create Mon-Fri 9-5 slots with defaults", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.availability.setDefaultWorkingHours, {
        timezone: "America/New_York",
      });

      const slots = await asUser.query(api.availability.getMyAvailability, {});

      expect(slots.length).toBe(5);
      expect(slots.map((s) => s.dayOfWeek)).toEqual([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ]);

      for (const slot of slots) {
        expect(slot.startTime).toBe("09:00");
        expect(slot.endTime).toBe("17:00");
        expect(slot.isActive).toBe(true);
      }
    });

    it("should use custom start/end times", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.availability.setDefaultWorkingHours, {
        timezone: "America/New_York",
        startTime: "08:00",
        endTime: "16:00",
      });

      const slots = await asUser.query(api.availability.getMyAvailability, {});

      for (const slot of slots) {
        expect(slot.startTime).toBe("08:00");
        expect(slot.endTime).toBe("16:00");
      }
    });

    it("should update existing slots when called again", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // First call
      await asUser.mutation(api.availability.setDefaultWorkingHours, {
        timezone: "America/New_York",
      });

      // Second call with different times
      await asUser.mutation(api.availability.setDefaultWorkingHours, {
        timezone: "Europe/London",
        startTime: "10:00",
        endTime: "18:00",
      });

      const slots = await asUser.query(api.availability.getMyAvailability, {});

      // Should still have 5 slots (updated, not duplicated)
      expect(slots.length).toBe(5);

      for (const slot of slots) {
        expect(slot.timezone).toBe("Europe/London");
        expect(slot.startTime).toBe("10:00");
      }
    });
  });

  describe("getMyAvailability", () => {
    it("should return empty array when no slots exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slots = await asUser.query(api.availability.getMyAvailability, {});

      expect(slots).toEqual([]);
    });

    it("should return slots sorted by day of week", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create slots in random order
      await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "friday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "wednesday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      const slots = await asUser.query(api.availability.getMyAvailability, {});

      expect(slots.map((s) => s.dayOfWeek)).toEqual(["monday", "wednesday", "friday"]);
    });
  });

  describe("getUserAvailability", () => {
    it("should return active slots for a user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create active and inactive slots
      await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
        isActive: true,
      });

      await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "tuesday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
        isActive: false,
      });

      // Public query - no auth required
      const slots = await t.query(api.availability.getUserAvailability, { userId });

      // Should only return active slots
      expect(slots.length).toBe(1);
      expect(slots[0].dayOfWeek).toBe("monday");
    });

    it("should return empty array for user with no active slots", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const slots = await t.query(api.availability.getUserAvailability, { userId });

      expect(slots).toEqual([]);
    });
  });

  describe("toggleSlot", () => {
    it("should toggle slot active status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slotId = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      // Toggle off
      await asUser.mutation(api.availability.toggleSlot, {
        slotId,
        isActive: false,
      });

      let slot = await t.run(async (ctx) => ctx.db.get(slotId));
      expect(slot?.isActive).toBe(false);

      // Toggle on
      await asUser.mutation(api.availability.toggleSlot, {
        slotId,
        isActive: true,
      });

      slot = await t.run(async (ctx) => ctx.db.get(slotId));
      expect(slot?.isActive).toBe(true);
    });

    it("should reject toggling another user's slot", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const slotId = await asUser1.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      await expect(
        asUser2.mutation(api.availability.toggleSlot, {
          slotId,
          isActive: false,
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });

  describe("removeSlot", () => {
    it("should delete availability slot", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const slotId = await asUser.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      await asUser.mutation(api.availability.removeSlot, { slotId });

      const slot = await t.run(async (ctx) => ctx.db.get(slotId));
      expect(slot).toBeNull();
    });

    it("should reject deleting another user's slot", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const slotId = await asUser1.mutation(api.availability.setDayAvailability, {
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      });

      await expect(asUser2.mutation(api.availability.removeSlot, { slotId })).rejects.toThrow(
        /FORBIDDEN/i,
      );
    });
  });
});
