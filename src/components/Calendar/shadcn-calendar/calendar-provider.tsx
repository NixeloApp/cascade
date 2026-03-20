import { CalendarContext } from "./calendar-context";
import type { CalendarEvent, Mode } from "./calendar-types";

/** Context provider for calendar state and event handlers. */
export function CalendarProvider({
  events,
  mode,
  setMode,
  date,
  setDate,
  calendarIconIsToday = true,
  onAddEvent,
  onEventMove,
  onEventClick,
  children,
}: {
  events: CalendarEvent[];
  mode: Mode;
  setMode: (mode: Mode) => void;
  date: Date;
  setDate: (date: Date) => void;
  calendarIconIsToday?: boolean;
  onAddEvent: (date?: Date) => void;
  onEventMove: (event: CalendarEvent, date: Date) => Promise<void> | void;
  onEventClick: (event: CalendarEvent) => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <CalendarContext.Provider
      value={{
        events,
        mode,
        setMode,
        date,
        setDate,
        calendarIconIsToday,
        onAddEvent,
        onEventMove,
        onEventClick,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}
