import { createContext, useContext } from "react";
import type { CalendarContextType } from "./calendar-types";

export const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

/** Hook to access calendar context (date, events, mode). */
export function useCalendarContext(): CalendarContextType {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendarContext must be used within a CalendarProvider");
  }
  return context;
}
