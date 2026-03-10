import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
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
    <Flex align="center" gap="xs" className="flex-wrap sm:flex-nowrap sm:gap-sm">
      <Button
        variant="outline"
        className="h-7 rounded-full px-2.5 text-xs font-medium border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default sm:px-3"
        onClick={() => setDate(new Date())}
      >
        Today
      </Button>
      <Button
        variant="outline"
        className="h-7 w-7 rounded-full p-1 border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default"
        onClick={handleDateBackward}
        aria-label="Previous month"
      >
        <ChevronLeft className="min-w-5 min-h-5" />
      </Button>
      <time
        dateTime={date.toISOString().split("T")[0]}
        className="min-w-28 text-center text-sm font-medium text-ui-text sm:min-w-35 sm:text-base"
      >
        <span className="sm:hidden">{format(date, "MMM d")}</span>
        <span className="hidden sm:inline">{format(date, "MMMM d, yyyy")}</span>
      </time>
      <Button
        variant="outline"
        className="h-7 w-7 rounded-full p-1 border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default"
        onClick={handleDateForward}
        aria-label="Next month"
      >
        <ChevronRight className="min-w-5 min-h-5" />
      </Button>
    </Flex>
  );
}
