import { format } from "date-fns";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useCalendarContext } from "../../calendar-context";
import { CalendarHeaderDateBadge } from "./calendar-header-date-badge";
import { CalendarHeaderDateChevrons } from "./calendar-header-date-chevrons";
import { CalendarHeaderDateIcon } from "./calendar-header-date-icon";

export function CalendarHeaderDate(): React.ReactElement {
  const { date } = useCalendarContext();
  return (
    <Flex align="center" gap="md">
      <CalendarHeaderDateIcon />
      <div>
        <Flex align="center" gap="sm">
          <Typography variant="h3" className="text-lg font-semibold tracking-tight text-ui-text">
            {format(date, "MMMM yyyy")}
          </Typography>
          <CalendarHeaderDateBadge />
        </Flex>
        <CalendarHeaderDateChevrons />
      </div>
    </Flex>
  );
}
