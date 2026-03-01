/**
 * Calendar Month View
 *
 * Month grid showing all days with event indicators.
 * Supports day cell selection and event overflow display.
 * Includes animated transitions between months.
 */

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarEvent } from "../../calendar-event";

/** Month view grid showing all days with event indicators. */
export function CalendarBodyMonth(): React.ReactElement {
  const { date, events, setDate, setMode } = useCalendarContext();

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const today = new Date();

  const visibleEvents = events.filter(
    (event) =>
      isWithinInterval(event.start, {
        start: calendarStart,
        end: calendarEnd,
      }) || isWithinInterval(event.end, { start: calendarStart, end: calendarEnd }),
  );

  return (
    <div className="flex flex-col flex-grow overflow-hidden bg-ui-bg">
      <div className="hidden md:grid grid-cols-7 bg-ui-bg-secondary/50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-medium uppercase tracking-wide text-ui-text-tertiary border-b border-r border-ui-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthStart.toISOString()}
          className="grid md:grid-cols-7 flex-grow overflow-y-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          {calendarDays.map((day) => {
            const dayEvents = visibleEvents.filter((event) => isSameDay(event.start, day));
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, date);

            return (
              <div
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                className={cn(
                  "relative flex flex-col border-b border-r border-ui-border p-2 min-h-30 cursor-pointer transition-colors duration-default",
                  isCurrentMonth
                    ? "bg-ui-bg hover:bg-ui-bg-hover"
                    : "bg-ui-bg-secondary/30 hidden md:flex hover:bg-ui-bg-secondary/50",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setDate(day);
                  setMode("day");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDate(day);
                    setMode("day");
                  }
                }}
              >
                <div
                  className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-default",
                    isToday
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : isCurrentMonth
                        ? "text-ui-text hover:bg-ui-bg-tertiary"
                        : "text-ui-text-tertiary",
                  )}
                >
                  {format(day, "d")}
                </div>
                <AnimatePresence mode="wait">
                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        className="relative h-auto"
                        month
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <motion.div
                        key={`more-${day.toISOString()}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-medium text-ui-text-tertiary hover:text-brand cursor-pointer transition-colors duration-default mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDate(day);
                          setMode("day");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setDate(day);
                            setMode("day");
                          }
                        }}
                      >
                        +{dayEvents.length - 3} more
                      </motion.div>
                    )}
                  </div>
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
