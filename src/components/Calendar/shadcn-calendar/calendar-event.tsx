/**
 * Calendar Event Block
 *
 * Renders individual event blocks in calendar grid.
 * Handles event positioning and overlap calculation.
 * Supports animated transitions and keyboard navigation.
 */

import { format, isSameDay, isSameMonth } from "date-fns";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { getCardRecipeClassName } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { getEventColorClasses } from "../calendar-colors";
import { useCalendarContext } from "./calendar-context";
import type { CalendarEvent as CalendarEventType } from "./calendar-types";

interface EventPosition {
  left: string;
  width: string;
  top: string;
  height: string;
}

function getOverlappingEvents(
  currentEvent: CalendarEventType,
  events: CalendarEventType[],
): CalendarEventType[] {
  return events.filter((event) => {
    if (event.id === currentEvent.id) return false;
    return (
      currentEvent.start < event.end &&
      currentEvent.end > event.start &&
      isSameDay(currentEvent.start, event.start)
    );
  });
}

function calculateEventPosition(
  event: CalendarEventType,
  allEvents: CalendarEventType[],
): EventPosition {
  const overlappingEvents = getOverlappingEvents(event, allEvents);
  const group = [event, ...overlappingEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  const position = group.indexOf(event);
  const width = `${100 / (overlappingEvents.length + 1)}%`;
  const left = `${(position * 100) / (overlappingEvents.length + 1)}%`;

  const startHour = event.start.getHours();
  const startMinutes = event.start.getMinutes();

  let endHour = event.end.getHours();
  let endMinutes = event.end.getMinutes();

  if (!isSameDay(event.start, event.end)) {
    endHour = 23;
    endMinutes = 59;
  }

  const topPosition = startHour + startMinutes / 60;
  const duration = endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
  const height = duration / 60;

  return {
    left,
    width,
    top: `calc(${topPosition} * var(--calendar-hour-height))`,
    height: `calc(${height} * var(--calendar-hour-height))`,
  };
}

/** Individual event block rendered in calendar grid. */
export function CalendarEvent({
  event,
  month = false,
  className,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: {
  event: CalendarEventType;
  month?: boolean;
  className?: string;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
}): React.ReactElement {
  const { events, onEventClick, date } = useCalendarContext();
  const style = month ? {} : calculateEventPosition(event, events);
  const eventRecipe = month ? "calendarEventMonth" : "calendarEventDay";
  const eventLayoutRecipe = month ? "calendarEventMonthLayout" : "calendarEventDayLayout";

  const isEventInCurrentMonth = isSameMonth(event.start, date);
  const animationKey = `${event.id}-${isEventInCurrentMonth ? "current" : "adjacent"}`;
  const colors = getEventColorClasses(event.color);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          tabIndex={0}
          data-testid={TEST_IDS.CALENDAR.EVENT_ITEM}
          data-dragging={isDragging ? "true" : undefined}
          draggable={draggable}
          className={cn(
            getCardRecipeClassName(eventRecipe),
            "truncate cursor-pointer transition-all duration-medium",
            colors.bg,
            colors.hover,
            colors.border,
            isDragging && "opacity-60 shadow-card",
            !month && "absolute",
            className,
          )}
          style={style}
          onDragStartCapture={onDragStart}
          onDragEndCapture={onDragEnd}
          onClick={(e) => {
            e.stopPropagation();
            onEventClick(event);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onEventClick(event);
            }
          }}
          initial={{
            opacity: 0,
            y: -3,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: {
              duration: 0.15,
              ease: "easeOut",
            },
          }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
            opacity: {
              duration: 0.2,
              ease: "linear",
            },
            layout: {
              duration: 0.2,
              ease: "easeOut",
            },
          }}
          layoutId={`event-${animationKey}-${month ? "month" : "day"}`}
        >
          <motion.div
            className={cn(getCardRecipeClassName(eventLayoutRecipe), colors.text)}
            layout="position"
          >
            <Typography variant={month ? "calendarEventTitleMonth" : "calendarEventTitle"}>
              {event.title}
            </Typography>
            {!month && (
              <Typography variant="calendarEventTime">
                <time dateTime={event.start.toISOString()}>{format(event.start, "h:mm a")}</time>
                <span className="mx-1" aria-hidden="true">
                  -
                </span>
                <time dateTime={event.end.toISOString()}>{format(event.end, "h:mm a")}</time>
              </Typography>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
