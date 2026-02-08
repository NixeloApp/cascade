import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useCalendarContext } from "../../calendar-context";

export function CalendarHeaderDateIcon(): React.ReactElement {
  const { calendarIconIsToday, date: calendarDate } = useCalendarContext();
  const date = calendarIconIsToday ? new Date() : calendarDate;
  return (
    <Flex direction="column" align="start" className="size-14 overflow-hidden rounded-lg border">
      <Flex align="center" justify="center" className="h-6 w-full bg-brand">
        <Typography
          variant="small"
          className="text-center text-xs font-semibold text-brand-foreground uppercase"
        >
          {format(date, "MMM")}
        </Typography>
      </Flex>
      <Flex align="center" justify="center" className="w-full flex-1">
        <Typography variant="p" className="text-lg font-bold">
          {format(date, "dd")}
        </Typography>
      </Flex>
    </Flex>
  );
}
