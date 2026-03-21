import { endOfWeek, isSameDay, startOfWeek } from "date-fns";
import { type RefObject, useLayoutEffect } from "react";
import type { CalendarEvent } from "../calendar-types";

const MOBILE_HOUR_HEIGHT_PX = 96;
const DESKTOP_HOUR_HEIGHT_PX = 128;
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 640px)";
const DEFAULT_START_HOUR = 8;
const MAX_SCROLL_READY_ATTEMPTS = 4;

/** Returns the first useful hour band to show when a timed calendar view opens. */
export function getCalendarInitialFocusHour(
  events: CalendarEvent[],
  date: Date,
  mode: "day" | "week",
): number {
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

/** Converts a focus hour into the scroll offset used by the timed calendar grid. */
export function getCalendarInitialScrollTop(focusHour: number, isDesktopViewport: boolean): number {
  return focusHour * (isDesktopViewport ? DESKTOP_HOUR_HEIGHT_PX : MOBILE_HOUR_HEIGHT_PX);
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

    const focusHour = getCalendarInitialFocusHour(events, date, mode);
    const targetScrollTop = getCalendarInitialScrollTop(
      focusHour,
      window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches,
    );

    let cancelled = false;
    const frames = new Set<number>();

    const scheduleScroll = (attempt: number) => {
      const frame = window.requestAnimationFrame(() => {
        frames.delete(frame);
        if (cancelled) {
          return;
        }

        const isScrollable = scrollElement.scrollHeight > scrollElement.clientHeight;
        if (!isScrollable && attempt < MAX_SCROLL_READY_ATTEMPTS - 1) {
          scheduleScroll(attempt + 1);
          return;
        }

        scrollElement.scrollTop = targetScrollTop;
      });

      frames.add(frame);
    };

    scheduleScroll(0);

    return () => {
      cancelled = true;
      for (const frame of frames) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [date, events, mode, scrollRef]);
}
