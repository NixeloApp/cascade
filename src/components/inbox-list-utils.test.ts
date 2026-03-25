import { describe, expect, it } from "vitest";
import {
  buildCustomSnoozeTimestamp,
  formatInboxSourceLabel,
  getDefaultCustomSnoozeDateValue,
} from "./inbox-list-utils";

describe("inbox-list-utils", () => {
  describe("getDefaultCustomSnoozeDateValue", () => {
    it("returns the next local day in input format", () => {
      expect(getDefaultCustomSnoozeDateValue(new Date(2026, 2, 25, 9, 30).getTime())).toBe(
        "2026-03-26",
      );
    });
  });

  describe("buildCustomSnoozeTimestamp", () => {
    it("returns noon local time for a valid future date", () => {
      const now = new Date(2026, 2, 25, 9, 30).getTime();
      const timestamp = buildCustomSnoozeTimestamp("2026-03-27", now);

      expect(timestamp).not.toBeNull();

      const snoozeDate = new Date(timestamp ?? 0);
      expect(snoozeDate.getFullYear()).toBe(2026);
      expect(snoozeDate.getMonth()).toBe(2);
      expect(snoozeDate.getDate()).toBe(27);
      expect(snoozeDate.getHours()).toBe(12);
    });

    it("rejects invalid or non-future dates", () => {
      const now = new Date(2026, 2, 25, 9, 30).getTime();

      expect(buildCustomSnoozeTimestamp("2026-03-25", now)).toBeNull();
      expect(buildCustomSnoozeTimestamp("2026-02-30", now)).toBeNull();
      expect(buildCustomSnoozeTimestamp("bad-date", now)).toBeNull();
    });
  });

  describe("formatInboxSourceLabel", () => {
    it("prefers explicit source details when present", () => {
      expect(
        formatInboxSourceLabel({
          source: "email",
          sourceEmail: "sender@example.com",
        }),
      ).toBe("Received via email from sender@example.com");

      expect(
        formatInboxSourceLabel({
          source: "api",
          sourceEmail: "hooks@example.com",
        }),
      ).toBe("Submitted via API by hooks@example.com");

      expect(
        formatInboxSourceLabel({
          source: "form",
        }),
      ).toBe("Submitted from form");
    });

    it("falls back to the creator name for in-app submissions", () => {
      expect(
        formatInboxSourceLabel({
          source: "in_app",
          createdByUser: { name: "Alex Rivera" },
        }),
      ).toBe("Submitted by Alex Rivera");

      expect(
        formatInboxSourceLabel({
          source: "in_app",
          createdByUser: null,
        }),
      ).toBe("Submitted in app");
    });
  });
});
