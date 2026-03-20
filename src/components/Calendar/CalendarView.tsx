import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
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
  const [createEventDate, setCreateEventDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<Id<"calendarEvents"> | null>(null);
  const { mutate: updateEvent } = useAuthenticatedMutation(api.calendarEvents.update);

  const { startDate, endDate } = getDateRange(date, mode);

  const userScopedEvents = useAuthenticatedQuery(
    api.calendarEvents.listByDateRange,
    teamId || workspaceId || organizationId
      ? "skip"
      : {
          startDate,
          endDate,
          projectId,
        },
  );
  const organizationScopedEvents = useAuthenticatedQuery(
    api.calendarEvents.listByOrganizationDateRange,
    organizationId && !workspaceId && !teamId
      ? {
          organizationId,
          startDate,
          endDate,
        }
      : "skip",
  );
  const workspaceScopedEvents = useAuthenticatedQuery(
    api.calendarEvents.listByWorkspaceDateRange,
    workspaceId && !teamId
      ? {
          workspaceId,
          startDate,
          endDate,
        }
      : "skip",
  );
  const teamScopedEvents = useAuthenticatedQuery(
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
  const events: NixeloCalendarEvent[] = (rawEvents ?? []).map((rawEvent) => {
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

  function handleEventClick(event: NixeloCalendarEvent): void {
    setSelectedEventId(extractConvexId(event));
  }

  function handleAddEvent(requestedDate?: Date): void {
    setCreateEventDate(requestedDate ?? date);
    setShowCreateModal(true);
  }

  async function handleEventMove(event: NixeloCalendarEvent, requestedDate: Date): Promise<void> {
    const movedTimes = getMovedEventTimes(event, requestedDate);
    if (!movedTimes) {
      return;
    }

    try {
      await updateEvent({
        id: extractConvexId(event),
        startTime: movedTimes.startTime,
        endTime: movedTimes.endTime,
      });
      showSuccess(
        `Event moved to ${formatDate(movedTimes.startTime, {
          month: "short",
          day: "numeric",
        })}`,
      );
    } catch (error) {
      showError(error, "Failed to move event");
    }
  }

  return (
    <Flex direction="column" className="h-full" data-calendar>
      <ShadcnCalendar
        events={events}
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        onAddEvent={handleAddEvent}
        onEventMove={handleEventMove}
        onEventClick={handleEventClick}
      />

      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultDate={createEventDate}
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

export function getMovedEventTimes(
  event: CalendarEvent,
  requestedDate: Date,
): { startTime: number; endTime: number } | null {
  if (isSameDay(event.start, requestedDate)) {
    return null;
  }

  const nextStart = new Date(requestedDate);
  nextStart.setHours(
    event.start.getHours(),
    event.start.getMinutes(),
    event.start.getSeconds(),
    event.start.getMilliseconds(),
  );

  const durationMs = event.end.getTime() - event.start.getTime();
  return {
    startTime: nextStart.getTime(),
    endTime: nextStart.getTime() + durationMs,
  };
}

function pickScopeColor(scopeId: string): EventColor {
  let hash = 0;
  for (const char of scopeId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return PALETTE_COLORS[hash % PALETTE_COLORS.length] ?? "blue";
}
