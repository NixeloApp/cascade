import { isSameDay } from "date-fns";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { DOT_COLOR_CLASSES, type EventColor } from "../../../calendar-colors";

import { useCalendarContext } from "../../calendar-context";

export function CalendarBodyDayEvents(): React.ReactElement {
  const { events, date, onEventClick } = useCalendarContext();
  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  if (!dayEvents.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-ui-bg-tertiary flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-ui-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <Typography variant="p" className="text-sm font-medium text-ui-text-secondary">
          No events today
        </Typography>
        <Typography variant="small" className="text-xs text-ui-text-tertiary mt-1">
          Your schedule is clear
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <Typography
        variant="small"
        className="text-xs font-medium uppercase tracking-wide text-ui-text-tertiary px-2 py-1"
      >
        Events
      </Typography>
      <div className="flex flex-col gap-0.5">
        {dayEvents.map((event) => (
          <button
            type="button"
            key={event.id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-secondary cursor-pointer text-left hover:bg-ui-bg-hover transition-colors duration-default group"
            onClick={() => onEventClick(event)}
          >
            <div
              className={cn(
                "size-2 rounded-full shrink-0",
                DOT_COLOR_CLASSES[event.color as EventColor] || DOT_COLOR_CLASSES.blue,
              )}
            />
            <Typography
              variant="p"
              className="text-sm font-medium text-ui-text-secondary group-hover:text-ui-text truncate transition-colors duration-default"
            >
              {event.title}
            </Typography>
          </button>
        ))}
      </div>
    </div>
  );
}
