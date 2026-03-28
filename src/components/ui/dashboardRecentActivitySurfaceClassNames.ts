import { getIssueKeyBadgeClassName } from "./badgeSurfaceClassNames";

export function getDashboardRecentActivityScrollAreaClassName() {
  return "relative max-h-96 overflow-y-auto pr-2 scrollbar-subtle";
}

export function getDashboardRecentActivityRailClassName() {
  return "absolute bottom-4 left-4 top-4 w-px bg-ui-border/60";
}

export function getDashboardRecentActivityItemClassName() {
  return "relative px-2 py-2";
}

export function getDashboardRecentActivityAvatarShellClassName() {
  return "relative z-10 bg-ui-bg";
}

export function getDashboardRecentActivityContentClassName() {
  return "min-w-0";
}

export function getDashboardRecentActivityIssueKeyClassName() {
  return `${getIssueKeyBadgeClassName()} w-fit`;
}
