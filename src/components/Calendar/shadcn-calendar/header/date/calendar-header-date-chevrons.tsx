import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns";
import { Button } from "@/components/ui/Button";
import { getCalendarControlButtonClassName } from "@/components/ui/buttonSurfaceClassNames";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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
        variant="unstyled"
        size="content"
        onClick={() => setDate(new Date())}
        data-testid={TEST_IDS.CALENDAR.TODAY_BUTTON}
        className={getCalendarControlButtonClassName("pill")}
      >
        Today
      </Button>
      <Button
        variant="unstyled"
        size="content"
        onClick={handleDateBackward}
        aria-label="Previous month"
        data-testid={TEST_IDS.CALENDAR.PREV_BUTTON}
        className={getCalendarControlButtonClassName("icon")}
      >
        <ChevronLeft className="min-size-5 min-" />
      </Button>
      <time dateTime={format(date, "yyyy-MM-dd")} className="min-w-16 text-center sm:min-w-35">
        <Typography as="span" variant="label" className="sm:hidden">
          {format(date, "MMM d")}
        </Typography>
        <Typography as="span" variant="h5" className="hidden sm:inline">
          {format(date, "MMMM d, yyyy")}
        </Typography>
      </time>
      <Button
        variant="unstyled"
        size="content"
        onClick={handleDateForward}
        aria-label="Next month"
        data-testid={TEST_IDS.CALENDAR.NEXT_BUTTON}
        className={getCalendarControlButtonClassName("icon")}
      >
        <ChevronRight className="min-size-5 min-" />
      </Button>
    </Flex>
  );
}
