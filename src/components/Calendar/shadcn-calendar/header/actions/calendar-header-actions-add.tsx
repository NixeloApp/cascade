import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

/** Button to add a new calendar event. */
export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      size="sm"
      className="h-9 rounded-xl bg-brand px-3 text-brand-foreground"
      onClick={() => onAddEvent()}
    >
      <Plus />
      <span className="hidden sm:inline">Add Event</span>
      <span className="sm:hidden">Add</span>
    </Button>
  );
}
