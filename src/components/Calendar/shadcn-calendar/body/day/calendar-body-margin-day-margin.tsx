import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";

export const hours = Array.from({ length: 24 }, (_, i) => i);

/** Hour labels margin column for day/week views. */
export function CalendarBodyMarginDayMargin({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <Flex direction="column" className={cn("sticky left-0 z-10 w-10 bg-ui-bg sm:w-12", className)}>
      <div className="sticky top-0 left-0 h-calendar-day-margin bg-ui-bg z-20 border-b border-ui-border" />
      <Flex direction="column" className="sticky left-0 z-10 w-10 bg-ui-bg sm:w-12">
        {hours.map((hour) => (
          <div key={hour} className="relative h-24 first:mt-0 sm:h-32">
            {hour !== 0 && (
              <time
                dateTime={`${String(hour).padStart(2, "0")}:00`}
                className="absolute -top-2 left-1 text-xs text-ui-text-secondary sm:left-2"
              >
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </time>
            )}
          </div>
        ))}
      </Flex>
    </Flex>
  );
}
