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
import { useState } from "react";
import { getDotColorClass } from "@/components/Calendar/calendar-colors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarEvent } from "../../calendar-event";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Month view grid showing all days with event indicators. */
export function CalendarBodyMonth(): React.ReactElement {
  const { date, events, onAddEvent, onEventMove, setDate, setMode } = useCalendarContext();
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);

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

  function openDay(day: Date): void {
    setDate(day);
    setMode("day");
  }

  function getDayKey(day: Date): string {
    return format(day, "yyyy-MM-dd");
  }

  return (
    <Flex
      direction="column"
      flex="1"
      className="overflow-hidden bg-ui-bg"
      data-testid={TEST_IDS.CALENDAR.GRID}
    >
      <Grid cols={7} className="bg-ui-bg-secondary/50">
        {WEEKDAY_NAMES.map((day) => (
          <Card key={day} recipe="calendarMonthWeekdayHeaderCell" className="text-center">
            <Typography as="span" variant="eyebrow" color="tertiary">
              <span className="md:hidden" aria-hidden="true">
                {day.charAt(0)}
              </span>
              <span className="sr-only md:not-sr-only">{day.slice(0, 3)}</span>
            </Typography>
          </Card>
        ))}
      </Grid>

      <AnimatePresence mode="wait" initial={false}>
        <Flex flex="1" className="overflow-y-auto">
          <motion.div
            key={monthStart.toISOString()}
            className="relative h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <Grid cols={7} className="h-full">
              {calendarDays.map((day) => {
                const dayEvents = visibleEvents.filter((event) => isSameDay(event.start, day));
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, date);
                const dayKey = getDayKey(day);
                const dayCellRecipe = isToday
                  ? "calendarMonthDayCellToday"
                  : isCurrentMonth
                    ? "calendarMonthDayCell"
                    : "calendarMonthDayCellAdjacent";
                const dayBadgeVariant = isToday
                  ? "calendarDayToday"
                  : isCurrentMonth
                    ? "calendarDayCurrent"
                    : "calendarDayMuted";

                return (
                  <Card
                    key={day.toISOString()}
                    recipe={dayCellRecipe}
                    padding="xs"
                    data-testid={TEST_IDS.CALENDAR.DAY_CELL}
                    className={cn(
                      "group",
                      dropTargetDate === dayKey && "ring-2 ring-brand bg-brand-subtle",
                    )}
                    onDragOver={(event) => {
                      if (!draggedEventId) {
                        return;
                      }
                      event.preventDefault();
                      if (dropTargetDate !== dayKey) {
                        setDropTargetDate(dayKey);
                      }
                    }}
                    onDragLeave={() => {
                      if (dropTargetDate === dayKey) {
                        setDropTargetDate(null);
                      }
                    }}
                    onDrop={async (event) => {
                      event.preventDefault();
                      const draggedEvent =
                        dayEvents.find((item) => item.id === draggedEventId) ??
                        visibleEvents.find((item) => item.id === draggedEventId);
                      setDropTargetDate(dayKey);
                      if (draggedEvent) {
                        await onEventMove(draggedEvent, day);
                      }
                      setDraggedEventId(null);
                      setDropTargetDate(null);
                    }}
                    onClick={() => openDay(day)}
                  >
                    {dropTargetDate === dayKey ? (
                      <span
                        data-testid={TEST_IDS.CALENDAR.DAY_CELL_DROP_TARGET}
                        hidden
                        aria-hidden="true"
                      />
                    ) : null}
                    <Flex align="start" justify="between" gap="xs">
                      <Badge variant={dayBadgeVariant} size="calendarDay" shape="pill">
                        {format(day, "d")}
                      </Badge>
                      <Button
                        type="button"
                        chrome="calendarHeaderControl"
                        chromeSize="calendarHeaderIcon"
                        reveal="responsive"
                        aria-label={`Add event for ${format(day, "MMMM d, yyyy")}`}
                        data-testid={TEST_IDS.CALENDAR.QUICK_ADD_DAY}
                        title={`Add event for ${format(day, "MMMM d, yyyy")}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEvent(day);
                        }}
                      >
                        <span aria-hidden="true">+</span>
                      </Button>
                    </Flex>
                    <Flex wrap gap="xs" className="mt-1 md:hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Dot
                          key={`dot-${event.id}`}
                          size="xs"
                          title={event.title}
                          className={getDotColorClass(event.color)}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography as="span" variant="meta" className="leading-none">
                          +{dayEvents.length - 3}
                        </Typography>
                      )}
                    </Flex>
                    <AnimatePresence mode="wait">
                      <div className="mt-1 hidden md:block">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className="mb-1 last:mb-0">
                            <CalendarEvent
                              event={event}
                              className="relative h-auto"
                              month
                              draggable
                              isDragging={draggedEventId === event.id}
                              onDragStart={(dragEvent) => {
                                dragEvent.stopPropagation();
                                dragEvent.dataTransfer?.setData("text/plain", event.id);
                                dragEvent.dataTransfer?.setDragImage(
                                  dragEvent.currentTarget,
                                  16,
                                  16,
                                );
                                setDraggedEventId(event.id);
                                setDropTargetDate(dayKey);
                              }}
                              onDragEnd={() => {
                                setDraggedEventId(null);
                                setDropTargetDate(null);
                              }}
                            />
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <Button
                            asChild
                            chrome="calendarMonthOverflow"
                            chromeSize="calendarMonthOverflow"
                            key={`more-${day.toISOString()}`}
                          >
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDay(day);
                              }}
                            >
                              +{dayEvents.length - 3} more
                            </motion.button>
                          </Button>
                        )}
                      </div>
                    </AnimatePresence>
                  </Card>
                );
              })}
            </Grid>
          </motion.div>
        </Flex>
      </AnimatePresence>
    </Flex>
  );
}
