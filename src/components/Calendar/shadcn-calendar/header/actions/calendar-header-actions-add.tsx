import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { useCalendarContext } from "../../calendar-context";

/** Button to add a new calendar event. */
export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      chrome="calendarHeaderAdd"
      chromeSize="calendarHeaderAdd"
      onClick={() => onAddEvent()}
      aria-label="Add event"
      leftIcon={<Plus />}
      data-testid={TEST_IDS.CALENDAR.CREATE_EVENT_BUTTON}
    >
      <span className="hidden sm:inline">Add Event</span>
    </Button>
  );
}
