import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

/** Renders day header with date and optional "today" indicator. */
export function CalendarBodyHeader({
  date,
  onlyDay = false,
}: {
  date: Date;
  onlyDay?: boolean;
}): React.ReactElement {
  const isToday = isSameDay(date, new Date());
  const dayBadgeVariant = isToday ? "calendarDayToday" : "calendarDayCurrent";

  return (
    <Card recipe="calendarBodyHeaderBar" padding="xs">
      <Flex align="center" justify="center" gap="xs">
        <Typography variant="eyebrow" color={isToday ? "brand" : "tertiary"}>
          {format(date, "EEE")}
        </Typography>
        {!onlyDay && (
          <Badge variant={dayBadgeVariant} size="calendarDay" shape="pill">
            {format(date, "d")}
          </Badge>
        )}
      </Flex>
    </Card>
  );
}
