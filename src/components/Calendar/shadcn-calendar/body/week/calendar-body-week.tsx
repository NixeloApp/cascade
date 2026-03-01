import { addDays, startOfWeek } from "date-fns";
import { useCalendarContext } from "../../calendar-context";
import { CalendarBodyDayContent } from "../day/calendar-body-day-content";
import { CalendarBodyMarginDayMargin } from "../day/calendar-body-margin-day-margin";

/** Week view showing 7 days side-by-side with time grid. */
export function CalendarBodyWeek(): React.ReactElement {
  const { date } = useCalendarContext();

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex divide-x divide-ui-border flex-grow overflow-hidden bg-ui-bg">
      <div className="flex flex-col flex-grow divide-y divide-ui-border overflow-hidden">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="relative flex flex-1 flex-col md:flex-row">
            <CalendarBodyMarginDayMargin className="hidden md:block" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="flex flex-1 border-r border-ui-border last:border-r-0 md:border-r"
              >
                <CalendarBodyMarginDayMargin className="block md:hidden" />
                <CalendarBodyDayContent date={day} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
