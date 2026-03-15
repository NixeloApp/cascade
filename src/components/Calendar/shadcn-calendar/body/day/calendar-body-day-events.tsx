import { isSameDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { CalendarDays } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { DOT_COLOR_CLASSES, type EventColor } from "../../../calendar-colors";

import { useCalendarContext } from "../../calendar-context";

/** List of events for the current day in day view sidebar. */
export function CalendarBodyDayEvents(): React.ReactElement {
  const { events, date, onEventClick } = useCalendarContext();
  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  if (!dayEvents.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No events today"
        description="Your schedule is clear"
        size="compact"
        surface="bare"
      />
    );
  }

  return (
    <Card recipe="calendarDayEventsPanel" padding="xs">
      <Stack gap="xs">
        <div className={cn(getCardRecipeClassName("calendarDayEventsHeader"), "p-2")}>
          <Typography variant="eyebrow" color="tertiary">
            Events
          </Typography>
        </div>
        {dayEvents.map((event) => (
          <Button
            key={event.id}
            data-testid={TEST_IDS.CALENDAR.EVENT_ITEM}
            chrome="calendarSidebarEvent"
            chromeSize="calendarSidebarEvent"
            onClick={() => onEventClick(event)}
          >
            <Flex as="span" align="center" gap="sm">
              <Dot
                className={DOT_COLOR_CLASSES[event.color as EventColor] || DOT_COLOR_CLASSES.blue}
              />
              <Typography as="span" variant="small" className="truncate">
                {event.title}
              </Typography>
            </Flex>
          </Button>
        ))}
      </Stack>
    </Card>
  );
}
