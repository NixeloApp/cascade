import { cn } from "@/lib/utils";

export type CalendarDayBadgeTone = "current" | "muted" | "today";

export function getMentionBadgeClassName() {
  return "gap-1 align-baseline cursor-pointer border-transparent bg-brand-subtle text-brand";
}

export function getMentionInputBadgeClassName() {
  return "relative inline-block border-transparent bg-ui-bg-secondary px-1 py-0 text-sm font-normal text-ui-text shadow-none";
}

export function getAlertCountBadgeClassName(kind: "inline" | "fab" = "inline") {
  return cn(
    "border-status-error/20 bg-status-error text-brand-foreground shadow-md",
    kind === "fab" && "min-h-6 min-w-6 justify-center px-1.5 text-xs",
  );
}

export function getDashboardTagBadgeClassName() {
  return "border-ui-border/50 bg-ui-bg-tertiary/60 uppercase text-ui-text-secondary";
}

export function getIssueKeyBadgeClassName() {
  return "border-ui-border/50 bg-ui-bg-tertiary/60 font-mono text-ui-text-secondary";
}

export function getSidebarSectionBadgeClassName() {
  return "border-ui-border/60 bg-ui-bg-elevated/80 text-ui-text-secondary shadow-soft uppercase tracking-wider font-semibold";
}

export function getRoadmapTodayBadgeClassName() {
  return "border-status-error/20 bg-status-error text-brand-foreground shadow-sm";
}

export function getRoadmapGroupBadgeClassName() {
  return "border-transparent bg-ui-bg-tertiary text-ui-text-secondary font-medium shadow-none";
}

export function getProjectHeaderKeyBadgeClassName() {
  return "uppercase tracking-wider";
}

export function getCalendarDayBadgeClassName(tone: CalendarDayBadgeTone) {
  return cn(
    "h-6 w-6 justify-center px-0 text-xs shadow-none sm:h-7 sm:w-7 sm:text-sm",
    tone === "today"
      ? "border-transparent bg-brand text-brand-foreground shadow-sm"
      : tone === "muted"
        ? "border-transparent bg-transparent text-ui-text-tertiary"
        : "border-transparent bg-transparent text-ui-text",
  );
}

export function getCalendarHeaderCountBadgeClassName() {
  return "border-ui-border bg-transparent px-1.5 py-0.5 text-xs text-ui-text shadow-none";
}

export function getLandingHeroBadgeClassName() {
  return "border-ui-border/60 bg-ui-bg-elevated/88 px-4 py-2 text-ui-text shadow-soft backdrop-blur-sm hover:border-ui-border-secondary";
}
