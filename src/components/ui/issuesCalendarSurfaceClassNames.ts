import { cn } from "@/lib/utils";

type PriorityLegendTone = "highest" | "high" | "medium" | "low" | "lowest";

export function getIssuesCalendarPriorityLegendDotClassName(priority: PriorityLegendTone) {
  switch (priority) {
    case "highest":
      return "bg-status-error";
    case "high":
      return "bg-status-warning";
    case "medium":
      return "bg-accent-ring";
    case "low":
      return "bg-brand-ring";
    case "lowest":
      return "bg-ui-text-secondary";
  }
}

export function getIssuesCalendarDayCellHeightClassName() {
  return "min-h-32 md:min-h-24";
}

export function getIssuesCalendarEmptyDayCellClassName() {
  return cn(getIssuesCalendarDayCellHeightClassName(), "bg-ui-bg-secondary");
}

export function getIssuesCalendarDayCellClassName() {
  return cn("group transition-colors", getIssuesCalendarDayCellHeightClassName());
}

export function getIssuesCalendarIssueRowClassName() {
  return "w-full";
}

export function getIssuesCalendarIssueContentClassName() {
  return "min-w-0";
}

export function getIssuesCalendarIssueTypeIconClassName() {
  return "shrink-0";
}

export function getIssuesCalendarIssueTitleClassName() {
  return "truncate";
}

export function getIssuesCalendarShellClassName() {
  return "overflow-auto";
}

export function getIssuesCalendarContentClassName() {
  return "m-3 sm:m-6";
}

export function getIssuesCalendarNavigationClassName() {
  return "w-full sm:w-auto sm:justify-start";
}

export function getIssuesCalendarNavigationButtonClassName() {
  return "size-11 sm:size-8";
}

export function getIssuesCalendarMonthLabelClassName() {
  return "w-full text-center sm:min-w-48";
}

export function getIssuesCalendarGridViewportClassName() {
  return "overflow-x-auto";
}

export function getIssuesCalendarGridCardClassName() {
  return "min-w-160 overflow-hidden";
}

export function getIssuesCalendarWeekdayHeaderRowClassName() {
  return "border-b border-ui-border bg-ui-bg-secondary";
}

export function getIssuesCalendarWeekdayLabelClassName() {
  return "text-center";
}
