import { Flex } from "@/components/ui/Flex";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { useCalendarContext } from "../../calendar-context";
import { calendarModeIconMap } from "../../calendar-mode-icon-map";
import type { Mode } from "../../calendar-types";
import { calendarModes } from "../../calendar-types";

function isMode(value: string): value is Mode {
  return calendarModes.some((modeOption) => modeOption === value);
}

/** Toggle group for switching between day/week/month calendar views. */
export function CalendarHeaderActionsMode(): React.ReactElement {
  const { mode, setMode } = useCalendarContext();

  return (
    <SegmentedControl
      value={mode}
      variant="calendarMode"
      size="calendarMode"
      width="fill"
      onValueChange={(value) => {
        if (isMode(value)) setMode(value);
      }}
    >
      {calendarModes.map((modeValue) => (
        <SegmentedControlItem
          key={modeValue}
          value={modeValue}
          data-testid={`calendar-mode-${modeValue}`}
          width="fill"
        >
          <Flex as="span" inline align="center" gap="xs">
            {calendarModeIconMap[modeValue]}
            <span className="hidden sm:inline">
              {modeValue.charAt(0).toUpperCase() + modeValue.slice(1)}
            </span>
          </Flex>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
