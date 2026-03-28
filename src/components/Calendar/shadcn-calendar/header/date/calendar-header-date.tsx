import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { useCalendarContext } from "../../calendar-context";
import { CalendarHeaderDateBadge } from "./calendar-header-date-badge";
import { CalendarHeaderDateChevrons } from "./calendar-header-date-chevrons";
import { CalendarHeaderDateIcon } from "./calendar-header-date-icon";

/** Header section displaying current date with navigation controls. */
export function CalendarHeaderDate(): React.ReactElement {
  const { date } = useCalendarContext();
  return (
    <Flex align="center" gap="xs" gapSm="sm" className="min-w-0">
      <div className="hidden sm:block">
        <CalendarHeaderDateIcon />
      </div>
      <div className="min-w-0" data-testid={TEST_IDS.CALENDAR.HEADER_DATE}>
        <Flex align="center" gap="xs" gapSm="sm">
          <Typography as="p" variant="label" className="sm:hidden">
            {format(date, "MMM yyyy")}
          </Typography>
          <Typography as="p" variant="h4" className="hidden sm:block">
            {format(date, "MMMM yyyy")}
          </Typography>
          <CalendarHeaderDateBadge />
        </Flex>
        <CalendarHeaderDateChevrons />
      </div>
    </Flex>
  );
}
