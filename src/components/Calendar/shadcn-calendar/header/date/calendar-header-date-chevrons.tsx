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
    <Flex align="center" gap="xs" className="flex-wrap gap-1 sm:flex-nowrap sm:gap-sm">
      <Button
        variant="outline"
        className="h-6 rounded-full border-ui-border px-2 text-xs font-medium transition-colors duration-default hover:border-ui-border-secondary hover:bg-ui-bg-hover sm:h-7 sm:px-3"
        onClick={() => setDate(new Date())}
      >
        Today
      </Button>
      <Button
        variant="outline"
        className="h-6 w-6 rounded-full border-ui-border p-0.5 transition-colors duration-default hover:border-ui-border-secondary hover:bg-ui-bg-hover sm:h-7 sm:w-7 sm:p-1"
        onClick={handleDateBackward}
        aria-label="Previous month"
      >
        <ChevronLeft className="min-w-5 min-h-5" />
      </Button>
      <time
        dateTime={date.toISOString().split("T")[0]}
        className="min-w-20 text-center text-xs font-medium text-ui-text sm:min-w-35 sm:text-base"
      >
        <span className="sm:hidden">{format(date, "MMM d")}</span>
        <span className="hidden sm:inline">{format(date, "MMMM d, yyyy")}</span>
      </time>
      <Button
        variant="outline"
        className="h-6 w-6 rounded-full border-ui-border p-0.5 transition-colors duration-default hover:border-ui-border-secondary hover:bg-ui-bg-hover sm:h-7 sm:w-7 sm:p-1"
        onClick={handleDateForward}
        aria-label="Next month"
      >
        <ChevronRight className="min-w-5 min-h-5" />
      </Button>
    </Flex>
  );
}
