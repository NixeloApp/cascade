import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

/** Button to add a new calendar event. */
export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      className="flex items-center gap-1 bg-brand text-brand-foreground"
      onClick={() => onAddEvent()}
    >
      <Plus />
      Add Event
    </Button>
  );
}
