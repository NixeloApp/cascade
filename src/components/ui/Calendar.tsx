import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps): React.ReactElement {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-ui-bg-elevated rounded-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-1",
        caption_label: "text-sm font-semibold text-ui-text",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover transition-colors duration-fast absolute left-1",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover transition-colors duration-fast absolute right-1",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-ui-text-tertiary rounded-md w-9 font-medium text-calendar-weekday uppercase tracking-wide",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-brand-subtle [&:has([aria-selected])]:bg-brand-subtle first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-ui-text hover:bg-ui-bg-hover hover:text-ui-text transition-colors duration-fast aria-selected:opacity-100",
        ),
        range_end: "day-range-end",
        selected:
          "bg-brand text-brand-foreground hover:bg-brand-hover hover:text-brand-foreground focus:bg-brand focus:text-brand-foreground rounded-md",
        today:
          "bg-ui-bg-soft text-ui-text font-semibold ring-1 ring-inset ring-ui-border-subtle rounded-md",
        outside:
          "day-outside text-ui-text-tertiary aria-selected:bg-brand-subtle aria-selected:text-ui-text-secondary",
        disabled: "text-ui-text-tertiary opacity-50 cursor-not-allowed",
        range_middle: "aria-selected:bg-brand-subtle aria-selected:text-brand-subtle-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
