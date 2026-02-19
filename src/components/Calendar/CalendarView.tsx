import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { ShadcnCalendar } from "./shadcn-calendar/calendar";
import { extractConvexId, toCalendarEvent } from "./shadcn-calendar/calendar-adapter";
import type { CalendarEvent, Mode, NixeloCalendarEvent } from "./shadcn-calendar/calendar-types";

function getDateRange(date: Date, mode: Mode): { startDate: number; endDate: number } {
  switch (mode) {
    case "day":
      return {
        startDate: startOfDay(date).getTime(),
        endDate: endOfDay(date).getTime(),
      };
    case "week":
      return {
        startDate: startOfWeek(date, { weekStartsOn: 1 }).getTime(),
        endDate: endOfWeek(date, { weekStartsOn: 1 }).getTime(),
      };
    case "month": {
      const ms = startOfMonth(date);
      const me = endOfMonth(date);
      // Include overflow weeks visible in the month grid
      return {
        startDate: startOfWeek(ms, { weekStartsOn: 1 }).getTime(),
        endDate: endOfWeek(me, { weekStartsOn: 1 }).getTime(),
      };
    }
  }
}

export function CalendarView(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"calendarEvents"> | null>(null);

  const { startDate, endDate } = getDateRange(date, mode);

  const rawEvents = useQuery(api.calendarEvents.listByDateRange, {
    startDate,
    endDate,
  });

  const events: CalendarEvent[] = (rawEvents ?? []).map(toCalendarEvent);

  function handleEventClick(event: CalendarEvent): void {
    setSelectedEventId(extractConvexId(event as NixeloCalendarEvent));
  }

  return (
    <Flex direction="column" className="h-full" data-calendar>
      <ShadcnCalendar
        events={events}
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        onAddEvent={() => setShowCreateModal(true)}
        onEventClick={handleEventClick}
      />

      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultDate={date}
      />

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          open={true}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
        />
      )}
    </Flex>
  );
}
