import { DAY, HOUR, MINUTE, SECOND } from "@convex/shared/time";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateForInput,
  formatDateTime,
  formatDuration,
  formatDurationHuman,
  formatDurationMs,
  formatFileSize,
  formatHours,
  formatNumber,
  formatRelativeTime,
  formatTime,
  formatTimeForInput,
  parseDuration,
} from "./formatting";

describe("formatting utilities", () => {
  describe("formatDuration", () => {
    it("should format zero seconds", () => {
      expect(formatDuration(0)).toBe("00:00:00");
    });

    it("should format seconds only", () => {
      expect(formatDuration(45)).toBe("00:00:45");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration(150)).toBe("00:02:30");
    });

    it("should format hours, minutes, and seconds", () => {
      expect(formatDuration(3661)).toBe("01:01:01");
    });

    it("should handle large values", () => {
      expect(formatDuration(36000)).toBe("10:00:00");
      expect(formatDuration(86399)).toBe("23:59:59");
    });

    it("should pad single digits with zeros", () => {
      expect(formatDuration(3723)).toBe("01:02:03");
    });
  });

  describe("formatDurationMs", () => {
    it("should convert milliseconds to formatted duration", () => {
      expect(formatDurationMs(0)).toBe("00:00:00");
      expect(formatDurationMs(SECOND)).toBe("00:00:01");
      expect(formatDurationMs(MINUTE)).toBe("00:01:00");
      expect(formatDurationMs(HOUR)).toBe("01:00:00");
    });

    it("should floor milliseconds", () => {
      expect(formatDurationMs(1500)).toBe("00:00:01");
      expect(formatDurationMs(1999)).toBe("00:00:01");
    });
  });

  describe("formatHours", () => {
    it("should format seconds to decimal hours", () => {
      expect(formatHours(3600)).toBe("1.00");
      expect(formatHours(5400)).toBe("1.50");
      expect(formatHours(9000)).toBe("2.50");
    });

    it("should respect decimal precision", () => {
      expect(formatHours(3700, 0)).toBe("1");
      expect(formatHours(3700, 1)).toBe("1.0");
      expect(formatHours(3700, 3)).toBe("1.028");
    });

    it("should handle zero", () => {
      expect(formatHours(0)).toBe("0.00");
    });
  });

  describe("formatDate", () => {
    it("should format timestamp to date string", () => {
      const timestamp = new Date("2026-01-15T12:00:00Z").getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/Jan\s+15,?\s+2026/);
    });

    it("should accept custom options", () => {
      const timestamp = new Date("2026-06-20T12:00:00Z").getTime();
      const result = formatDate(timestamp, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      expect(result).toMatch(/Saturday/);
      expect(result).toMatch(/June/);
      expect(result).toMatch(/20/);
    });
  });

  describe("formatTime", () => {
    it("should format timestamp to time string", () => {
      // Use a fixed timezone-independent approach
      const date = new Date();
      date.setHours(14, 30, 0, 0);
      const result = formatTime(date.getTime());
      expect(result).toMatch(/2:30\s*PM/i);
    });

    it("should accept custom options", () => {
      const date = new Date();
      date.setHours(9, 5, 30, 0);
      const result = formatTime(date.getTime(), {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      expect(result).toMatch(/09:05:30/);
    });
  });

  describe("formatDateTime", () => {
    it("should combine date and time formatting", () => {
      // Use a local date to avoid timezone issues
      const date = new Date();
      date.setFullYear(2026, 0, 15); // Jan 15, 2026
      date.setHours(14, 30, 0, 0);
      const result = formatDateTime(date.getTime());
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/at/);
      expect(result).toMatch(/2:30/i);
    });
  });

  describe("formatCurrency", () => {
    it("should format USD by default", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("should format different currencies", () => {
      expect(formatCurrency(1234.56, "EUR")).toMatch(/€|EUR/);
      expect(formatCurrency(1234.56, "GBP")).toMatch(/£|GBP/);
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should handle negative values", () => {
      expect(formatCurrency(-100)).toBe("-$100.00");
    });

    it("should handle null/undefined currency", () => {
      expect(formatCurrency(100, "")).toBe("$100.00");
    });
  });

  describe("formatDateForInput", () => {
    it("should format date for HTML date input", () => {
      const timestamp = new Date("2026-01-15T12:00:00Z").getTime();
      expect(formatDateForInput(timestamp)).toBe("2026-01-15");
    });

    it("should pad single digit months and days", () => {
      const timestamp = new Date("2026-03-05T12:00:00Z").getTime();
      expect(formatDateForInput(timestamp)).toBe("2026-03-05");
    });
  });

  describe("formatTimeForInput", () => {
    it("should format time for HTML time input", () => {
      const date = new Date();
      date.setHours(14, 30, 0, 0);
      expect(formatTimeForInput(date.getTime())).toBe("14:30");
    });

    it("should pad single digit hours and minutes", () => {
      const date = new Date();
      date.setHours(9, 5, 0, 0);
      expect(formatTimeForInput(date.getTime())).toBe("09:05");
    });

    it("should handle midnight", () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      expect(formatTimeForInput(date.getTime())).toBe("00:00");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should format seconds ago", () => {
      const timestamp = Date.now() - 30 * SECOND;
      expect(formatRelativeTime(timestamp)).toMatch(/30 seconds ago/);
    });

    it("should format minutes ago", () => {
      const timestamp = Date.now() - 5 * MINUTE;
      expect(formatRelativeTime(timestamp)).toMatch(/5 minutes ago/);
    });

    it("should format hours ago", () => {
      const timestamp = Date.now() - 3 * HOUR;
      expect(formatRelativeTime(timestamp)).toMatch(/3 hours ago/);
    });

    it("should format days ago", () => {
      const timestamp = Date.now() - 2 * DAY;
      expect(formatRelativeTime(timestamp)).toMatch(/2 days ago/);
    });

    it("should format months ago", () => {
      const timestamp = Date.now() - 45 * DAY;
      expect(formatRelativeTime(timestamp)).toMatch(/month/);
    });

    it("should format years ago", () => {
      const timestamp = Date.now() - 400 * DAY;
      expect(formatRelativeTime(timestamp)).toMatch(/year/);
    });

    it("should format future times", () => {
      const timestamp = Date.now() + 2 * DAY;
      expect(formatRelativeTime(timestamp)).toMatch(/in 2 days/);
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500.0 B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1048576)).toBe("1.0 MB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1073741824)).toBe("1.0 GB");
    });

    it("should format terabytes", () => {
      expect(formatFileSize(1099511627776)).toBe("1.0 TB");
    });

    it("should handle zero", () => {
      expect(formatFileSize(0)).toBe("0.0 B");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with thousands separator", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should handle small numbers", () => {
      expect(formatNumber(42)).toBe("42");
      expect(formatNumber(999)).toBe("999");
    });

    it("should handle zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("should handle negative numbers", () => {
      expect(formatNumber(-1234)).toBe("-1,234");
    });
  });

  describe("parseDuration", () => {
    it("should parse colon format (HH:MM)", () => {
      expect(parseDuration("1:30")).toBe(5400);
      expect(parseDuration("01:30")).toBe(5400);
      expect(parseDuration("2:00")).toBe(7200);
      expect(parseDuration("0:45")).toBe(2700);
    });

    it("should reject invalid colon format", () => {
      expect(parseDuration("1:60")).toBeNull(); // 60 minutes invalid
      expect(parseDuration("1:99")).toBeNull();
    });

    it("should parse hour-minute format", () => {
      expect(parseDuration("1h30m")).toBe(5400);
      expect(parseDuration("1h 30m")).toBe(5400);
      expect(parseDuration("2h")).toBe(7200);
      expect(parseDuration("30m")).toBe(1800);
    });

    it("should parse decimal hours", () => {
      expect(parseDuration("1.5")).toBe(5400);
      expect(parseDuration("1.5h")).toBe(5400);
      expect(parseDuration("0.5")).toBe(1800);
      expect(parseDuration("2.25h")).toBe(8100);
    });

    it("should parse minutes only with suffix", () => {
      expect(parseDuration("90m")).toBe(5400);
      expect(parseDuration("45m")).toBe(2700);
    });

    it("should handle whitespace", () => {
      expect(parseDuration("  1:30  ")).toBe(5400);
      expect(parseDuration("  1h 30m  ")).toBe(5400);
    });

    it("should be case insensitive", () => {
      expect(parseDuration("1H30M")).toBe(5400);
      expect(parseDuration("1H 30M")).toBe(5400);
    });

    it("should return null for empty input", () => {
      expect(parseDuration("")).toBeNull();
      expect(parseDuration("   ")).toBeNull();
    });

    it("should return null for invalid input", () => {
      expect(parseDuration("abc")).toBeNull();
      expect(parseDuration("1:2:3")).toBeNull();
    });
  });

  describe("formatDurationHuman", () => {
    it("should format hours and minutes", () => {
      expect(formatDurationHuman(5400)).toBe("1h 30m");
      expect(formatDurationHuman(9000)).toBe("2h 30m");
    });

    it("should format hours only", () => {
      expect(formatDurationHuman(3600)).toBe("1h");
      expect(formatDurationHuman(7200)).toBe("2h");
    });

    it("should format minutes only", () => {
      expect(formatDurationHuman(1800)).toBe("30m");
      expect(formatDurationHuman(2700)).toBe("45m");
    });

    it("should handle zero", () => {
      expect(formatDurationHuman(0)).toBe("0m");
    });

    it("should ignore seconds", () => {
      expect(formatDurationHuman(3661)).toBe("1h 1m");
      expect(formatDurationHuman(59)).toBe("0m");
    });
  });
});
