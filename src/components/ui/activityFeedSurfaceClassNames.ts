import { cn } from "@/lib/utils";

export function getActivityFeedEmptyStateClassName() {
  return "max-w-full";
}

export function getActivityFeedContainerClassName() {
  return "relative";
}

export function getActivityFeedRailClassName() {
  return "absolute bottom-6 left-3 top-6 w-px bg-ui-border";
}

export function getActivityFeedEntryClassName() {
  return "relative";
}

export function getActivityFeedIconShellClassName(compact: boolean) {
  return compact ? "relative z-10 size-5 shrink-0" : "relative z-10 size-6 shrink-0";
}

export function getActivityFeedIconCenterClassName() {
  return "h-full";
}

export function getActivityFeedContentClassName() {
  return "min-w-0";
}

export function getActivityFeedMessageClassName() {
  return "m-0";
}

export function getActivityFeedActionColorClassName(action: string) {
  switch (action) {
    case "created":
      return "text-status-success";
    case "updated":
      return "text-ui-text";
    case "commented":
      return "text-accent";
    case "assigned":
      return "text-status-warning";
    case "linked":
    case "unlinked":
      return "text-ui-text";
    default:
      return "text-ui-text-secondary";
  }
}

export function getActivityFeedIssueLinkClassName() {
  return cn("ml-1", "font-mono text-brand");
}

export function getActivityFeedDetailClassName() {
  return "mt-1 truncate text-ui-text-secondary";
}

export function getActivityFeedTimestampClassName() {
  return "shrink-0 text-ui-text-tertiary";
}
