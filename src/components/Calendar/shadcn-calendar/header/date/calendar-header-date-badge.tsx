import { isSameMonth } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { useCalendarContext } from "../../calendar-context";

/** Badge showing event count for the current month. */
export function CalendarHeaderDateBadge(): React.ReactElement | null {
  const { events, date } = useCalendarContext();
  const monthEvents = events.filter((event) => isSameMonth(event.start, date));

  if (!monthEvents.length) return null;
  return (
    <Badge variant="calendarHeaderCount" size="calendarHeaderCount" className="whitespace-nowrap">
      {monthEvents.length} events
    </Badge>
  );
}
