import { format, isSameDay, isSameMonth } from "date-fns";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Typography } from "@/components/ui/Typography";
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

  const topPosition = startHour * 128 + (startMinutes / 60) * 128;
  const duration = endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
  const height = (duration / 60) * 128;

  return {
    left,
    width,
    top: `${topPosition}px`,
    height: `${height}px`,
  };
}

export function CalendarEvent({
  event,
  month = false,
  className,
}: {
  event: CalendarEventType;
  month?: boolean;
  className?: string;
}): React.ReactElement {
  const { events, onEventClick, date } = useCalendarContext();
  const style = month ? {} : calculateEventPosition(event, events);

  const isEventInCurrentMonth = isSameMonth(event.start, date);
  const animationKey = `${event.id}-${isEventInCurrentMonth ? "current" : "adjacent"}`;
  const colors = getEventColorClasses(event.color);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          tabIndex={0}
          className={cn(
            month ? "px-2 py-0.5 rounded-secondary" : "px-3 py-1.5 rounded-lg",
            "truncate cursor-pointer transition-all duration-medium",
            colors.bg,
            colors.hover,
            colors.border,
            !month && "absolute",
            className,
          )}
          style={style}
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
            className={cn(
              "flex flex-col w-full",
              colors.text,
              month && "flex-row items-center justify-between",
            )}
            layout="position"
          >
            <Typography variant="p" className={cn("font-bold truncate", month && "text-xs")}>
              {event.title}
            </Typography>
            <Typography variant="small" className={cn("text-sm", month && "text-xs")}>
              <time dateTime={event.start.toISOString()}>{format(event.start, "h:mm a")}</time>
              <span className={cn("mx-1", month && "hidden")} aria-hidden="true">
                -
              </span>
              <time dateTime={event.end.toISOString()} className={cn(month && "hidden")}>
                {format(event.end, "h:mm a")}
              </time>
            </Typography>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
