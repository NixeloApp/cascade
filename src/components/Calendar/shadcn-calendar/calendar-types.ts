export type CalendarEvent = {
  id: string;
  title: string;
  color: string;
  start: Date;
  end: Date;
};

export type NixeloCalendarEvent = CalendarEvent & {
  convexId: string;
  eventType: string;
};

export const calendarModes = ["day", "week", "month"] as const;
export type Mode = (typeof calendarModes)[number];

export type CalendarProps = {
  events: CalendarEvent[];
  mode: Mode;
  setMode: (mode: Mode) => void;
  date: Date;
  setDate: (date: Date) => void;
  calendarIconIsToday?: boolean;
  onAddEvent: (date?: Date) => void;
  onEventMove: (event: CalendarEvent, date: Date) => Promise<void> | void;
  onEventClick: (event: CalendarEvent) => void;
};

export type CalendarContextType = CalendarProps;
