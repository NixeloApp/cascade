import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

/** Renders day header with date and optional "today" indicator. */
export function CalendarBodyHeader({
  date,
  onlyDay = false,
}: {
  date: Date;
  onlyDay?: boolean;
}): React.ReactElement {
  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex items-center justify-center gap-1.5 py-2.5 w-full sticky top-0 bg-ui-bg z-10 border-b border-ui-border">
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isToday ? "text-brand" : "text-ui-text-tertiary",
        )}
      >
        {format(date, "EEE")}
      </span>
      {!onlyDay && (
        <span
          className={cn(
            "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
            isToday ? "bg-brand text-brand-foreground" : "text-ui-text",
          )}
        >
          {format(date, "d")}
        </span>
      )}
    </div>
  );
}
