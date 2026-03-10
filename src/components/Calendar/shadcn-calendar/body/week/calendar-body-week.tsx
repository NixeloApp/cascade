import { addDays, startOfWeek } from "date-fns";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarBodyDayContent } from "../day/calendar-body-day-content";
import { CalendarBodyMarginDayMargin } from "../day/calendar-body-margin-day-margin";
import { useCalendarInitialScroll } from "../use-calendar-initial-scroll";

/** Week view showing 7 days side-by-side with time grid. */
export function CalendarBodyWeek(): React.ReactElement {
  const { date, events } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useCalendarInitialScroll(scrollRef, events, date, "week");

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    const activeDayElement = activeDayRef.current;
    if (!(scrollElement && activeDayElement)) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollElement.scrollTo({
        left: Math.max(0, activeDayElement.offsetLeft - 40),
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  });

  return (
    <div className="flex divide-x divide-ui-border flex-grow overflow-hidden bg-ui-bg">
      <div className="flex flex-col flex-grow divide-y divide-ui-border overflow-hidden">
        <div ref={scrollRef} className="flex flex-1 overflow-auto">
          <div className="relative flex min-w-full flex-1">
            <CalendarBodyMarginDayMargin className="hidden md:block" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                ref={day.toDateString() === date.toDateString() ? activeDayRef : undefined}
                className={cn(
                  "flex w-56 shrink-0 border-r border-ui-border last:border-r-0 sm:w-64 md:w-auto md:flex-1",
                  day.toDateString() === date.toDateString() && "bg-brand/[0.02]",
                )}
              >
                <CalendarBodyMarginDayMargin className="block md:hidden" />
                <CalendarBodyDayContent date={day} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
