import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";

export const hours = Array.from({ length: 24 }, (_, i) => i);

export function CalendarBodyMarginDayMargin({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <Flex direction="column" className={cn("sticky left-0 w-12 bg-ui-bg z-10", className)}>
      <div className="sticky top-0 left-0 h-calendar-day-margin bg-ui-bg z-20 border-b border-ui-border" />
      <Flex direction="column" className="sticky left-0 w-12 bg-ui-bg z-10">
        {hours.map((hour) => (
          <div key={hour} className="relative h-32 first:mt-0">
            {hour !== 0 && (
              <time
                dateTime={`${String(hour).padStart(2, "0")}:00`}
                className="absolute text-xs text-ui-text-secondary -top-2.5 left-2"
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
