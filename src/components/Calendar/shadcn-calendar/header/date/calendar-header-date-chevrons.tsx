import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

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
    <Flex align="center" gap="sm">
      <Button
        variant="outline"
        className="h-7 px-3 text-xs font-medium border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default"
        onClick={() => setDate(new Date())}
      >
        Today
      </Button>
      <Button
        variant="outline"
        className="h-7 w-7 p-1 border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default"
        onClick={handleDateBackward}
        aria-label="Previous month"
      >
        <ChevronLeft className="min-w-5 min-h-5" />
      </Button>
      <time
        dateTime={date.toISOString().split("T")[0]}
        className="min-w-35 text-center font-medium text-ui-text"
      >
        {format(date, "MMMM d, yyyy")}
      </time>
      <Button
        variant="outline"
        className="h-7 w-7 p-1 border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default"
        onClick={handleDateForward}
        aria-label="Next month"
      >
        <ChevronRight className="min-w-5 min-h-5" />
      </Button>
    </Flex>
  );
}
