import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useCalendarContext } from "../../calendar-context";

/** Calendar icon widget showing month and day number. */
export function CalendarHeaderDateIcon(): React.ReactElement {
  const { calendarIconIsToday, date: calendarDate } = useCalendarContext();
  const date = calendarIconIsToday ? new Date() : calendarDate;
  return (
    <Card recipe="calendarHeaderDateIcon" className="h-10 w-10 sm:w-14">
      <Flex direction="column" align="start" className="h-full w-full">
        <Card recipe="calendarHeaderDateIconMonth">
          <Flex align="center" justify="center" className="h-full w-full">
            <Typography variant="calendarHeaderMonth">{format(date, "MMM")}</Typography>
          </Flex>
        </Card>
        <Card recipe="calendarHeaderDateIconDay">
          <Flex align="center" justify="center" className="h-full w-full">
            <Typography variant="calendarHeaderDay">{format(date, "dd")}</Typography>
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
}
