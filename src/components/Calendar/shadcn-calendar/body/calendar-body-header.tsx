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
    <div className="sticky top-0 z-10 flex w-full items-center justify-center gap-1 py-1.5 bg-ui-bg border-b border-ui-border sm:gap-1.5 sm:py-2.5">
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
            "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-7 sm:w-7",
            isToday ? "bg-brand text-brand-foreground" : "text-ui-text",
          )}
        >
          {format(date, "d")}
        </span>
      )}
    </div>
  );
}
