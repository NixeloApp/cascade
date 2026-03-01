import { useCalendarContext } from "../../calendar-context";
import { CalendarBodyDayCalendar } from "./calendar-body-day-calendar";
import { CalendarBodyDayContent } from "./calendar-body-day-content";
import { CalendarBodyDayEvents } from "./calendar-body-day-events";
import { CalendarBodyMarginDayMargin } from "./calendar-body-margin-day-margin";

/** Day view layout with time grid, events sidebar, and mini calendar. */
export function CalendarBodyDay(): React.ReactElement {
  const { date } = useCalendarContext();
  return (
    <div className="flex divide-x divide-ui-border flex-grow overflow-hidden bg-ui-bg">
      <div className="flex flex-col flex-grow divide-y divide-ui-border overflow-hidden">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="relative flex flex-1">
            <CalendarBodyMarginDayMargin />
            <div className="flex-1 border-l border-ui-border">
              <CalendarBodyDayContent date={date} />
            </div>
          </div>
        </div>
      </div>
      <div className="lg:flex hidden flex-col flex-grow divide-y divide-ui-border max-w-69 bg-ui-bg-secondary/30">
        <CalendarBodyDayCalendar />
        <CalendarBodyDayEvents />
      </div>
    </div>
  );
}
