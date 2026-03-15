import { useRef } from "react";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { useCalendarInitialScroll } from "../use-calendar-initial-scroll";
import { CalendarBodyDayCalendar } from "./calendar-body-day-calendar";
import { CalendarBodyDayContent } from "./calendar-body-day-content";
import { CalendarBodyDayEvents } from "./calendar-body-day-events";
import { CalendarBodyMarginDayMargin } from "./calendar-body-margin-day-margin";

/** Day view layout with time grid, events sidebar, and mini calendar. */
export function CalendarBodyDay(): React.ReactElement {
  const { date, events } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useCalendarInitialScroll(scrollRef, events, date, "day");

  return (
    <Flex flex="1" className="overflow-hidden bg-ui-bg">
      <Card recipe="calendarDayMainPanel" className="overflow-hidden">
        <Flex direction="column" flex="1" className="overflow-hidden">
          <Flex ref={scrollRef} direction="column" flex="1" className="overflow-y-auto">
            <Flex flex="1" className="relative">
              <CalendarBodyMarginDayMargin />
              <div
                className={cn(getCardRecipeClassName("calendarDayContentRail"), "overflow-hidden")}
              >
                <CalendarBodyDayContent date={date} />
              </div>
            </Flex>
          </Flex>
        </Flex>
      </Card>
      <div className="hidden lg:block">
        <Card recipe="calendarDaySidebarShell" className="max-w-69 overflow-hidden">
          <Flex direction="column" flex="1" className="overflow-hidden">
            <CalendarBodyDayCalendar />
            <FlexItem flex="1" className="overflow-y-auto">
              <CalendarBodyDayEvents />
            </FlexItem>
          </Flex>
        </Card>
      </div>
    </Flex>
  );
}
