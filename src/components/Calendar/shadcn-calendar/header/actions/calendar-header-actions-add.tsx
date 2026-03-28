import { Button } from "@/components/ui/Button";
import { getCalendarAddButtonClassName } from "@/components/ui/buttonSurfaceClassNames";
import { Inline } from "@/components/ui/Inline";
import { Plus } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { useCalendarContext } from "../../calendar-context";

/** Button to add a new calendar event. */
export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      variant="unstyled"
      size="content"
      onClick={() => onAddEvent()}
      aria-label="Add event"
      leftIcon={<Plus />}
      data-testid={TEST_IDS.CALENDAR.CREATE_EVENT_BUTTON}
      className={getCalendarAddButtonClassName()}
    >
      <Inline className="hidden sm:inline">Add Event</Inline>
    </Button>
  );
}
