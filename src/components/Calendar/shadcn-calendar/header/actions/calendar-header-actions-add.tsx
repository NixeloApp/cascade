import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

/** Button to add a new calendar event. */
export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      size="sm"
      className="h-7 w-7 rounded-full bg-brand px-0 text-brand-foreground sm:h-9 sm:w-auto sm:rounded-xl sm:px-3"
      onClick={() => onAddEvent()}
      aria-label="Add event"
    >
      <Plus />
      <span className="hidden sm:inline">Add Event</span>
    </Button>
  );
}
