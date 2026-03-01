import { Calendar } from "@/components/ui/Calendar";
import { useCalendarContext } from "../../calendar-context";

/** Mini calendar picker for day view navigation. */
export function CalendarBodyDayCalendar(): React.ReactElement {
  const { date, setDate } = useCalendarContext();
  return (
    <Calendar
      selected={date}
      onSelect={(selected: Date | undefined) => selected && setDate(selected)}
      mode="single"
    />
  );
}
