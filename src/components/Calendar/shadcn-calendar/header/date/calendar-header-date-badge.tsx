import { isSameMonth } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { getCalendarHeaderCountBadgeClassName } from "@/components/ui/badgeSurfaceClassNames";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";

/** Badge showing event count for the current month. */
export function CalendarHeaderDateBadge(): React.ReactElement | null {
  const { events, date } = useCalendarContext();
  const monthEvents = events.filter((event) => isSameMonth(event.start, date));

  if (!monthEvents.length) return null;
  return (
    <Badge
      variant="outline"
      className={cn(getCalendarHeaderCountBadgeClassName(), "whitespace-nowrap")}
    >
      {monthEvents.length} events
    </Badge>
  );
}
