import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
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
    >
      <span className="hidden sm:inline">Add Event</span>
    </Button>
  );
}
