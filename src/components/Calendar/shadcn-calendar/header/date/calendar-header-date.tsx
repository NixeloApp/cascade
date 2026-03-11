import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useCalendarContext } from "../../calendar-context";
import { CalendarHeaderDateBadge } from "./calendar-header-date-badge";
import { CalendarHeaderDateChevrons } from "./calendar-header-date-chevrons";
import { CalendarHeaderDateIcon } from "./calendar-header-date-icon";

/** Header section displaying current date with navigation controls. */
export function CalendarHeaderDate(): React.ReactElement {
  const { date } = useCalendarContext();
  return (
    <Flex align="center" gap="xs" className="min-w-0 sm:gap-sm">
      <div className="hidden sm:block">
        <CalendarHeaderDateIcon />
      </div>
      <div className="min-w-0">
        <Flex align="center" gap="xs" className="sm:gap-sm">
          <Typography
            variant="h3"
            className="text-sm font-semibold tracking-tight text-ui-text sm:text-lg"
          >
            <span className="sm:hidden">{format(date, "MMM yyyy")}</span>
            <span className="hidden sm:inline">{format(date, "MMMM yyyy")}</span>
          </Typography>
          <CalendarHeaderDateBadge />
        </Flex>
        <CalendarHeaderDateChevrons />
      </div>
    </Flex>
  );
}
