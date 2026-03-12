import { endOfWeek, isSameDay, startOfWeek } from "date-fns";
import { type RefObject, useLayoutEffect } from "react";
import type { CalendarEvent } from "../calendar-types";

const MOBILE_HOUR_HEIGHT_PX = 96;
const DESKTOP_HOUR_HEIGHT_PX = 128;
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 640px)";
const DEFAULT_START_HOUR = 8;

function getFocusHour(events: CalendarEvent[], date: Date, mode: "day" | "week"): number {
  const visibleEvents =
    mode === "day"
      ? events.filter((event) => isSameDay(event.start, date))
      : events.filter((event) => {
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
          return event.start >= weekStart && event.start <= weekEnd;
        });

  if (visibleEvents.length === 0) {
    return DEFAULT_START_HOUR;
  }

  const earliestHour = Math.min(...visibleEvents.map((event) => event.start.getHours()));
  return Math.max(0, earliestHour - 1);
}

/** Scrolls day and week calendar grids to the first meaningful working-hours band on mount/update. */
export function useCalendarInitialScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
  events: CalendarEvent[],
  date: Date,
  mode: "day" | "week",
): void {
  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }

    const focusHour = getFocusHour(events, date, mode);
    const hourHeight = window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches
      ? DESKTOP_HOUR_HEIGHT_PX
      : MOBILE_HOUR_HEIGHT_PX;

    const frame = window.requestAnimationFrame(() => {
      scrollElement.scrollTo({
        left: scrollElement.scrollLeft,
        top: focusHour * hourHeight,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [date, events, mode, scrollRef]);
}
