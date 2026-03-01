import { CalendarBody } from "./body/calendar-body";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarProps } from "./calendar-types";
import { CalendarHeaderActions } from "./header/actions/calendar-header-actions";
import { CalendarHeaderActionsAdd } from "./header/actions/calendar-header-actions-add";
import { CalendarHeaderActionsMode } from "./header/actions/calendar-header-actions-mode";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarHeaderDate } from "./header/date/calendar-header-date";

/** Main calendar component with header, body, and provider. */
export function ShadcnCalendar({
  events,
  mode,
  setMode,
  date,
  setDate,
  calendarIconIsToday = true,
  onAddEvent,
  onEventClick,
}: CalendarProps): React.ReactElement {
  return (
    <CalendarProvider
      events={events}
      mode={mode}
      setMode={setMode}
      date={date}
      setDate={setDate}
      calendarIconIsToday={calendarIconIsToday}
      onAddEvent={onAddEvent}
      onEventClick={onEventClick}
    >
      <CalendarHeader>
        <CalendarHeaderDate />
        <CalendarHeaderActions>
          <CalendarHeaderActionsMode />
          <CalendarHeaderActionsAdd />
        </CalendarHeaderActions>
      </CalendarHeader>
      <CalendarBody />
    </CalendarProvider>
  );
}
