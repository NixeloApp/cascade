import { isSameDay, isToday } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarEvent } from "../../calendar-event";
import { CalendarBodyHeader } from "../calendar-body-header";
import { hours } from "./calendar-body-margin-day-margin";

/** Day view content showing hourly grid with events. */
export function CalendarBodyDayContent({ date }: { date: Date }): React.ReactElement {
  const { events } = useCalendarContext();

  const dayEvents = events.filter((event) => isSameDay(event.start, date));
  const today = isToday(date);

  return (
    <Flex direction="column" flex="1" className={cn(today && "bg-brand/[0.02]")}>
      <CalendarBodyHeader date={date} />

      <Flex direction="column" flex="1" className="relative">
        {hours.map((hour) => (
          <Card key={hour} recipe="calendarDayHourRow" />
        ))}

        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </Flex>
    </Flex>
  );
}
