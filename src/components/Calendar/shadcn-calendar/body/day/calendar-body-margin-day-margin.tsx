import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

export const hours = Array.from({ length: 24 }, (_, i) => i);

/** Hour labels margin column for day/week views. */
export function CalendarBodyMarginDayMargin(): React.ReactElement {
  return (
    <Card recipe="calendarTimeMarginRail">
      <Card recipe="calendarTimeMarginSpacer" />
      <Flex direction="column" className="sticky left-0 z-10 w-full">
        {hours.map((hour) => (
          <div key={hour} className="relative h-24 first:mt-0 sm:h-32">
            {hour !== 0 && (
              <Typography
                as="time"
                variant="calendarTimeLabel"
                dateTime={`${String(hour).padStart(2, "0")}:00`}
                className="absolute -top-2 left-1 sm:left-2"
              >
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </Typography>
            )}
          </div>
        ))}
      </Flex>
    </Card>
  );
}
