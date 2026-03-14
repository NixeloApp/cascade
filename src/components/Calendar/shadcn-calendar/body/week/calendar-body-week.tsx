import { addDays, isSameDay, startOfWeek } from "date-fns";
import { useLayoutEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useCalendarContext } from "../../calendar-context";
import { CalendarBodyDayContent } from "../day/calendar-body-day-content";
import { CalendarBodyMarginDayMargin } from "../day/calendar-body-margin-day-margin";
import { useCalendarInitialScroll } from "../use-calendar-initial-scroll";

/** Week view showing 7 days side-by-side with time grid. */
export function CalendarBodyWeek(): React.ReactElement {
  const { date, events } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef<HTMLDivElement>(null);
  const prevDateRef = useRef<string | null>(null);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeDateString = `${date.toDateString()}-${events.length}`;

  useCalendarInitialScroll(scrollRef, events, date, "week");

  useLayoutEffect(() => {
    // Only scroll when the active day changes (not every render)
    if (prevDateRef.current === activeDateString) {
      return;
    }
    prevDateRef.current = activeDateString;

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
  }, [activeDateString]);

  return (
    <Flex flex="1" className="overflow-hidden bg-ui-bg">
      <Card recipe="calendarDayMainPanel" className="overflow-hidden">
        <Flex direction="column" flex="1" className="overflow-hidden">
          <Flex ref={scrollRef} flex="1" className="overflow-auto">
            <Flex flex="1" className="relative min-w-full">
              <div className="hidden md:block">
                <CalendarBodyMarginDayMargin />
              </div>
              {weekDays.map((day) => {
                const isActiveDay = isSameDay(day, date);
                const dayShellRecipe = isActiveDay
                  ? "calendarWeekActiveDayShell"
                  : "calendarWeekDayShell";

                return (
                  <FlexItem
                    key={day.toISOString()}
                    ref={isActiveDay ? activeDayRef : undefined}
                    flexMd="1"
                    shrink={false}
                    className="w-56 sm:w-64 md:w-auto"
                  >
                    <Card recipe={dayShellRecipe} className="h-full">
                      <div className="block md:hidden">
                        <CalendarBodyMarginDayMargin />
                      </div>
                      <CalendarBodyDayContent date={day} />
                    </Card>
                  </FlexItem>
                );
              })}
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
