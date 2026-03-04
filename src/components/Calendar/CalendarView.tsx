import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { CreateEventModal } from "./CreateEventModal";
import { type EventColor, PALETTE_COLORS } from "./calendar-colors";
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

/**
 * Main calendar view with day/week/month modes and event management.
 */
interface CalendarViewProps {
  organizationId?: Id<"organizations">;
  workspaceId?: Id<"workspaces">;
  projectId?: Id<"projects">;
  teamId?: Id<"teams">;
  colorByScope?: "workspace" | "team";
}

/**
 * Main calendar view with day/week/month modes and event management.
 */
export function CalendarView({
  organizationId,
  workspaceId,
  projectId,
  teamId,
  colorByScope,
}: CalendarViewProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"calendarEvents"> | null>(null);

  const { startDate, endDate } = getDateRange(date, mode);

  const userScopedEvents = useQuery(
    api.calendarEvents.listByDateRange,
    teamId || workspaceId || organizationId
      ? "skip"
      : {
          startDate,
          endDate,
          projectId,
        },
  );
  const organizationScopedEvents = useQuery(
    api.calendarEvents.listByOrganizationDateRange,
    organizationId && !workspaceId && !teamId
      ? {
          organizationId,
          startDate,
          endDate,
        }
      : "skip",
  );
  const workspaceScopedEvents = useQuery(
    api.calendarEvents.listByWorkspaceDateRange,
    workspaceId && !teamId
      ? {
          workspaceId,
          startDate,
          endDate,
        }
      : "skip",
  );
  const teamScopedEvents = useQuery(
    api.calendarEvents.listByTeamDateRange,
    teamId
      ? {
          teamId,
          startDate,
          endDate,
        }
      : "skip",
  );

  const rawEvents = teamId
    ? teamScopedEvents
    : workspaceId
      ? workspaceScopedEvents
      : organizationId
        ? organizationScopedEvents
        : userScopedEvents;
  const events: CalendarEvent[] = (rawEvents ?? []).map((rawEvent) => {
    const base = toCalendarEvent(rawEvent);
    const scopeId =
      colorByScope === "workspace"
        ? rawEvent.workspaceId
        : colorByScope === "team"
          ? rawEvent.teamId
          : undefined;

    if (!scopeId) {
      return base;
    }

    return {
      ...base,
      color: pickScopeColor(scopeId.toString()),
    };
  });

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
        projectId={projectId}
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

function pickScopeColor(scopeId: string): EventColor {
  let hash = 0;
  for (const char of scopeId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return PALETTE_COLORS[hash % PALETTE_COLORS.length] ?? "blue";
}
