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

// Shared test fixtures
const JAN_15_NOON = new Date("2026-01-15T12:00:00Z").getTime();
const JAN_15_MIDNIGHT = new Date("2026-01-15T00:00:00Z").getTime();
const JAN_1_NOON = new Date("2026-01-01T12:00:00Z").getTime();
const DEC_1_2024 = new Date("2024-12-01T12:00:00Z").getTime();
const JAN_14_NOON = new Date("2026-01-14T12:00:00Z").getTime();
const JAN_16_NOON = new Date("2026-01-16T12:00:00Z").getTime();
const JAN_12_NOON = new Date("2026-01-12T12:00:00Z").getTime();

function useFakeNow() {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

describe("dates utility functions", () => {
  describe("formatRelativeTimeSimple", () => {
    useFakeNow();

    it('should return "Just now" for timestamps within the last minute', () => {
      const timestamp = new Date("2026-01-15T11:59:30Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("Just now");
    });

    it("should return minutes ago", () => {
      const timestamp = new Date("2026-01-15T11:30:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("30m ago");
    });

    it("should return hours ago", () => {
      const timestamp = new Date("2026-01-15T09:00:00Z").getTime();
      expect(formatRelativeTimeSimple(timestamp)).toBe("3h ago");
    });

    it("should return days ago", () => {
      expect(formatRelativeTimeSimple(JAN_12_NOON)).toBe("3d ago");
    });

    it("should return weeks ago", () => {
      expect(formatRelativeTimeSimple(JAN_1_NOON)).toBe("2w ago");
    });

    it("should return absolute date for old timestamps", () => {
      expect(formatRelativeTimeSimple(DEC_1_2024)).toBe("Dec 1, 2024");
    });

    it("should return absolute date for future timestamps", () => {
      expect(formatRelativeTimeSimple(JAN_16_NOON)).toBe("Jan 16, 2026");
    });
  });

  describe("formatDate", () => {
    it("should format as short date", () => {
      expect(formatDate(JAN_15_NOON)).toBe("Jan 15, 2026");
    });

    it("should accept timeZone option for UTC-stable dates", () => {
      expect(
        formatDate(JAN_15_MIDNIGHT, {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }),
      ).toBe("Jan 15, 2026");
    });
  });

  describe("formatDateCustom", () => {
    it("should format with custom options", () => {
      expect(
        formatDateCustom(JAN_15_NOON, { year: "numeric", month: "long", day: "numeric" }),
      ).toBe("January 15, 2026");
    });

    it("should format with weekday", () => {
      expect(
        formatDateCustom(JAN_15_NOON, { weekday: "short", month: "short", day: "numeric" }),
      ).toBe("Thu, Jan 15");
    });
  });

  describe("getTodayString", () => {
    useFakeNow();

    it("should return today in YYYY-MM-DD format", () => {
      expect(getTodayString()).toBe("2026-01-15");
    });
  });

  describe("daysBetween", () => {
    it("should calculate days", () => {
      expect(daysBetween(JAN_1_NOON, JAN_15_NOON)).toBe(14);
    });

    it("should be order-independent", () => {
      expect(daysBetween(JAN_15_NOON, JAN_1_NOON)).toBe(14);
    });

    it("should return 0 for same day", () => {
      const morning = new Date("2026-01-15T08:00:00Z").getTime();
      const evening = new Date("2026-01-15T18:00:00Z").getTime();
      expect(daysBetween(morning, evening)).toBe(0);
    });
  });

  describe("addDays", () => {
    it("should add days", () => {
      const result = addDays(new Date("2026-01-15T12:00:00Z"), 5);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-20");
    });

    it("should subtract days", () => {
      const result = addDays(new Date("2026-01-15T12:00:00Z"), -5);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-10");
    });

    it("should not mutate original", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      const original = date.getTime();
      addDays(date, 5);
      expect(date.getTime()).toBe(original);
    });
  });

  describe("isPast / isFuture", () => {
    useFakeNow();

    it("isPast returns true for past", () => {
      expect(isPast(JAN_14_NOON)).toBe(true);
    });

    it("isPast returns false for future", () => {
      expect(isPast(JAN_16_NOON)).toBe(false);
    });

    it("isFuture returns true for future", () => {
      expect(isFuture(JAN_16_NOON)).toBe(true);
    });

    it("isFuture returns false for past", () => {
      expect(isFuture(JAN_14_NOON)).toBe(false);
    });
  });

  describe("formatHours", () => {
    it("formats sub-hour as minutes", () => {
      expect(formatHours(0.5)).toBe("30m");
    });

    it("formats hours with minutes", () => {
      expect(formatHours(1.5)).toBe("1h 30m");
    });

    it("formats whole hours", () => {
      expect(formatHours(1)).toBe("1h");
      expect(formatHours(5)).toBe("5h");
    });

    it("formats >= 8h as hours only", () => {
      expect(formatHours(8)).toBe("8h");
      expect(formatHours(10)).toBe("10h");
    });
  });
});
