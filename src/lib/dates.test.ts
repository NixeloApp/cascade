import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  formatDate,
  formatDateCustom,
  formatHours,
  formatRelativeTimeSimple,
  getTodayString,
  isFuture,
  isPast,
} from "./dates";

describe("dates utility functions", () => {
  describe("formatRelativeTimeSimple", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for timestamps within the last minute', () => {
      const timestamp = new Date("2026-01-15T11:59:30Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("Just now");
    });

    it("should return minutes ago for timestamps within the last hour", () => {
      const timestamp = new Date("2026-01-15T11:30:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("30m ago");
    });

    it("should return hours ago for timestamps within the last 24 hours", () => {
      const timestamp = new Date("2026-01-15T09:00:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("3h ago");
    });

    it("should return days ago for timestamps within the last week", () => {
      const timestamp = new Date("2026-01-12T12:00:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("3d ago");
    });

    it("should return weeks ago for timestamps within the last month", () => {
      const timestamp = new Date("2026-01-01T12:00:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("2w ago");
    });

    it("should return absolute date for timestamps older than 30 days", () => {
      const timestamp = new Date("2024-12-01T12:00:00Z").getTime();
      const result = formatRelativeTimeSimple(timestamp);
      expect(result).toBe("Dec 1, 2024");
    });
  });

  describe("formatDate (re-exported from formatting)", () => {
    it("should format timestamp as short date", () => {
      const timestamp = new Date("2026-01-15T12:00:00Z").getTime();
      expect(formatDate(timestamp)).toBe("Jan 15, 2026");
    });

    it("should accept timeZone option for UTC-stable billing dates", () => {
      const timestamp = new Date("2026-01-15T00:00:00Z").getTime();
      expect(
        formatDate(timestamp, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
      ).toBe("Jan 15, 2026");
    });
  });

  describe("formatDateCustom (alias for formatDate)", () => {
    it("should format date with custom options", () => {
      const timestamp = new Date("2026-01-15T12:00:00Z").getTime();
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      expect(formatDateCustom(timestamp, options)).toBe("January 15, 2026");
    });

    it("should format date with short month and weekday", () => {
      const timestamp = new Date("2026-01-15T12:00:00Z").getTime();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };
      expect(formatDateCustom(timestamp, options)).toBe("Thu, Jan 15");
    });
  });

  describe("getTodayString", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return today's date in YYYY-MM-DD format", () => {
      expect(getTodayString()).toBe("2026-01-15");
    });
  });

  describe("daysBetween", () => {
    it("should calculate days between two timestamps", () => {
      const start = new Date("2026-01-01T00:00:00Z").getTime();
      const end = new Date("2026-01-15T00:00:00Z").getTime();
      expect(daysBetween(start, end)).toBe(14);
    });

    it("should return positive number regardless of order", () => {
      const start = new Date("2026-01-15T00:00:00Z").getTime();
      const end = new Date("2026-01-01T00:00:00Z").getTime();
      expect(daysBetween(start, end)).toBe(14);
    });

    it("should return 0 for same day", () => {
      const start = new Date("2026-01-15T08:00:00Z").getTime();
      const end = new Date("2026-01-15T18:00:00Z").getTime();
      expect(daysBetween(start, end)).toBe(0);
    });
  });

  describe("addDays", () => {
    it("should add positive days to a date", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      const result = addDays(date, 5);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-20");
    });

    it("should subtract days with negative number", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      const result = addDays(date, -5);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-10");
    });

    it("should not mutate original date", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      const original = date.getTime();
      addDays(date, 5);
      expect(date.getTime()).toBe(original);
    });
  });

  describe("isPast", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for past timestamps", () => {
      expect(isPast(new Date("2026-01-14T12:00:00Z").getTime())).toBe(true);
    });

    it("should return false for future timestamps", () => {
      expect(isPast(new Date("2026-01-16T12:00:00Z").getTime())).toBe(false);
    });
  });

  describe("isFuture", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for future timestamps", () => {
      expect(isFuture(new Date("2026-01-16T12:00:00Z").getTime())).toBe(true);
    });

    it("should return false for past timestamps", () => {
      expect(isFuture(new Date("2026-01-14T12:00:00Z").getTime())).toBe(false);
    });
  });

  describe("formatHours", () => {
    it("should format hours less than 1 as minutes", () => {
      expect(formatHours(0.5)).toBe("30m");
      expect(formatHours(0.25)).toBe("15m");
    });

    it("should format hours between 1 and 8 with hours and minutes", () => {
      expect(formatHours(1.5)).toBe("1h 30m");
      expect(formatHours(2.25)).toBe("2h 15m");
    });

    it("should format whole hours without minutes", () => {
      expect(formatHours(1)).toBe("1h");
      expect(formatHours(5)).toBe("5h");
    });

    it("should format hours >= 8 as hours only", () => {
      expect(formatHours(8)).toBe("8h");
      expect(formatHours(10)).toBe("10h");
    });
  });
});
