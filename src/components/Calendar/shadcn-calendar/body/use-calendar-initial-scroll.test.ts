import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../calendar-types";
import {
  getCalendarInitialFocusHour,
  getCalendarInitialScrollTop,
} from "./use-calendar-initial-scroll";

describe("getCalendarInitialFocusHour", () => {
  const weekDate = new Date("2026-03-21T12:00:00");

  it("falls back to working hours when there are no visible events", () => {
    expect(getCalendarInitialFocusHour([], weekDate, "week")).toBe(8);
  });

  it("anchors one hour before the earliest visible day event", () => {
    const events: CalendarEvent[] = [
      {
        id: "evt-1",
        title: "Sprint Planning",
        color: "blue",
        start: new Date("2026-03-21T09:00:00"),
        end: new Date("2026-03-21T10:00:00"),
      },
      {
        id: "evt-2",
        title: "Design Review",
        color: "purple",
        start: new Date("2026-03-21T13:00:00"),
        end: new Date("2026-03-21T14:00:00"),
      },
    ];

    expect(getCalendarInitialFocusHour(events, weekDate, "day")).toBe(8);
    expect(getCalendarInitialFocusHour(events, weekDate, "week")).toBe(8);
  });
});

describe("getCalendarInitialScrollTop", () => {
  it("uses the mobile hour height below the desktop breakpoint", () => {
    expect(getCalendarInitialScrollTop(8, false)).toBe(768);
  });

  it("uses the desktop hour height at larger viewports", () => {
    expect(getCalendarInitialScrollTop(8, true)).toBe(1024);
  });
});
