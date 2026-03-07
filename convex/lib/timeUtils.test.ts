import { describe, expect, it } from "vitest";
import {
  DAY,
  HOUR,
  MINUTE,
  MONTH,
  roundToDay,
  roundToHour,
  roundToInterval,
  roundToMinute,
  SECOND,
  WEEK,
} from "./timeUtils";

describe("time utilities", () => {
  describe("time constants", () => {
    it("should have correct values for time constants", () => {
      expect(SECOND).toBe(1_000);
      expect(MINUTE).toBe(60 * SECOND);
      expect(HOUR).toBe(60 * MINUTE);
      expect(DAY).toBe(24 * HOUR);
      expect(WEEK).toBe(7 * DAY);
      expect(MONTH).toBe(30 * DAY);
    });

    it("should maintain relationship between constants", () => {
      expect(MINUTE).toBe(60 * SECOND);
      expect(HOUR).toBe(60 * MINUTE);
      expect(DAY).toBe(24 * HOUR);
      expect(WEEK).toBe(7 * DAY);
    });
  });

  describe("roundToInterval", () => {
    it("should round down to interval boundary", () => {
      // 1500ms rounded to 1000ms interval = 1000ms
      expect(roundToInterval(1500, SECOND)).toBe(SECOND);
      // 2999ms rounded to 1000ms interval = 2000ms
      expect(roundToInterval(2999, SECOND)).toBe(2 * SECOND);
    });

    it("should return same value if already on boundary", () => {
      expect(roundToInterval(2 * SECOND, SECOND)).toBe(2 * SECOND);
      expect(roundToInterval(0, SECOND)).toBe(0);
    });

    it("should work with larger intervals", () => {
      const timestamp = 1705312345000; // Some arbitrary timestamp
      const rounded = roundToInterval(timestamp, HOUR);
      expect(rounded % HOUR).toBe(0);
      expect(rounded).toBeLessThanOrEqual(timestamp);
      expect(timestamp - rounded).toBeLessThan(HOUR);
    });
  });

  describe("roundToMinute", () => {
    it("should round to start of minute", () => {
      // 12:34:45.678 should round to 12:34:00.000
      const timestamp = new Date("2026-01-15T12:34:45.678Z").getTime();
      const rounded = roundToMinute(timestamp);
      const roundedDate = new Date(rounded);

      expect(roundedDate.getUTCSeconds()).toBe(0);
      expect(roundedDate.getUTCMilliseconds()).toBe(0);
      expect(roundedDate.getUTCMinutes()).toBe(34);
    });

    it("should not change if already at minute boundary", () => {
      const timestamp = new Date("2026-01-15T12:34:00.000Z").getTime();
      expect(roundToMinute(timestamp)).toBe(timestamp);
    });
  });

  describe("roundToHour", () => {
    it("should round to start of hour", () => {
      // 12:34:45.678 should round to 12:00:00.000
      const timestamp = new Date("2026-01-15T12:34:45.678Z").getTime();
      const rounded = roundToHour(timestamp);
      const roundedDate = new Date(rounded);

      expect(roundedDate.getUTCMinutes()).toBe(0);
      expect(roundedDate.getUTCSeconds()).toBe(0);
      expect(roundedDate.getUTCMilliseconds()).toBe(0);
      expect(roundedDate.getUTCHours()).toBe(12);
    });

    it("should not change if already at hour boundary", () => {
      const timestamp = new Date("2026-01-15T12:00:00.000Z").getTime();
      expect(roundToHour(timestamp)).toBe(timestamp);
    });
  });

  describe("roundToDay", () => {
    it("should round to start of day (midnight UTC)", () => {
      // 2026-01-15 12:34:45.678 should round to 2026-01-15 00:00:00.000
      const timestamp = new Date("2026-01-15T12:34:45.678Z").getTime();
      const rounded = roundToDay(timestamp);
      const roundedDate = new Date(rounded);

      expect(roundedDate.getUTCHours()).toBe(0);
      expect(roundedDate.getUTCMinutes()).toBe(0);
      expect(roundedDate.getUTCSeconds()).toBe(0);
      expect(roundedDate.getUTCMilliseconds()).toBe(0);
      expect(roundedDate.getUTCDate()).toBe(15);
    });

    it("should not change if already at day boundary", () => {
      const timestamp = new Date("2026-01-15T00:00:00.000Z").getTime();
      expect(roundToDay(timestamp)).toBe(timestamp);
    });

    it("should handle late night times correctly", () => {
      // 23:59:59 should still round to same day's midnight
      const timestamp = new Date("2026-01-15T23:59:59.999Z").getTime();
      const rounded = roundToDay(timestamp);
      const roundedDate = new Date(rounded);

      expect(roundedDate.getUTCDate()).toBe(15);
      expect(roundedDate.getUTCHours()).toBe(0);
    });
  });
});
