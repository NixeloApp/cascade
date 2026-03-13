import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

/** Navigation buttons for moving between dates (today, prev, next). */
export function CalendarHeaderDateChevrons(): React.ReactElement {
  const { mode, date, setDate } = useCalendarContext();

  function handleDateBackward(): void {
    switch (mode) {
      case "month":
        setDate(subMonths(date, 1));
        break;
      case "week":
        setDate(subWeeks(date, 1));
        break;
      case "day":
        setDate(subDays(date, 1));
        break;
    }
  }

  function handleDateForward(): void {
    switch (mode) {
      case "month":
        setDate(addMonths(date, 1));
        break;
      case "week":
        setDate(addWeeks(date, 1));
        break;
      case "day":
        setDate(addDays(date, 1));
        break;
    }
  }

  return (
    <Flex align="center" gap="xs" gapSm="sm" wrap>
      <Button
        chrome="calendarHeaderControl"
        chromeSize="calendarHeaderPill"
        onClick={() => setDate(new Date())}
      >
        Today
      </Button>
      <Button
        chrome="calendarHeaderControl"
        chromeSize="calendarHeaderIcon"
        onClick={handleDateBackward}
        aria-label="Previous month"
      >
        <ChevronLeft className="min-w-5 min-h-5" />
      </Button>
      <time dateTime={format(date, "yyyy-MM-dd")} className="min-w-16 text-center sm:min-w-35">
        <Typography as="span" variant="calendarHeaderDate">
          <span className="sm:hidden">{format(date, "MMM d")}</span>
          <span className="hidden sm:inline">{format(date, "MMMM d, yyyy")}</span>
        </Typography>
      </time>
      <Button
        chrome="calendarHeaderControl"
        chromeSize="calendarHeaderIcon"
        onClick={handleDateForward}
        aria-label="Next month"
      >
        <ChevronRight className="min-w-5 min-h-5" />
      </Button>
    </Flex>
  );
}
