import { format } from "date-fns";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useCalendarContext } from "../../calendar-context";

/** Calendar icon widget showing month and day number. */
export function CalendarHeaderDateIcon(): React.ReactElement {
  const { calendarIconIsToday, date: calendarDate } = useCalendarContext();
  const date = calendarIconIsToday ? new Date() : calendarDate;
  return (
    <Card recipe="calendarHeaderDateIcon" className="size-10 sm:w-14">
      <Flex direction="column" align="start" className="h-full w-full">
        <div className={getCardRecipeClassName("calendarHeaderDateIconMonth")}>
          <Flex align="center" justify="center" className="h-full w-full">
            <Typography variant="eyebrow" as="span" className="text-center text-brand-foreground">
              {format(date, "MMM")}
            </Typography>
          </Flex>
        </div>
        <div className={getCardRecipeClassName("calendarHeaderDateIconDay")}>
          <Flex align="center" justify="center" className="h-full w-full">
            <Typography as="span" variant="h5" className="sm:hidden">
              {format(date, "dd")}
            </Typography>
            <Typography as="span" variant="h4" className="hidden sm:inline">
              {format(date, "dd")}
            </Typography>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}
