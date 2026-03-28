import { cn } from "@/lib/utils";
import { getAlertCountBadgeClassName } from "./badgeSurfaceClassNames";
import {
  getNotificationFilterButtonClassName,
  getQuietRoundIconButtonClassName,
} from "./buttonSurfaceClassNames";

export function getNotificationCenterBodyClassName() {
  return "min-h-0 flex-1 overflow-y-auto p-0 scrollbar-subtle";
}

export function getNotificationCenterPanelClassName() {
  return "max-h-popover-panel w-full max-w-dialog-mobile sm:w-96";
}

export function getNotificationCenterFooterActionClassName() {
  return "w-full justify-center gap-2";
}

export function getNotificationCenterFooterClassName(hasOrganizationRoute: boolean) {
  return hasOrganizationRoute ? "bg-ui-bg" : undefined;
}

export function getNotificationCenterFilterClassName(isActive: boolean) {
  return cn("shrink-0", getNotificationFilterButtonClassName(isActive));
}

export function getNotificationCenterHeaderClassName() {
  return "sticky top-0 z-10 bg-ui-bg";
}

export function getNotificationCenterTriggerClassName() {
  return cn("relative", getQuietRoundIconButtonClassName());
}

export function getNotificationCenterUnreadBadgeClassName() {
  return cn(
    getAlertCountBadgeClassName(),
    "absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 animate-scale-in",
  );
}

export function getNotificationCenterContentClassName() {
  return "h-full";
}

export function getNotificationCenterEmptyStateClassName() {
  return "min-h-56 px-6 py-10";
}

export function getNotificationCenterGroupClassName() {
  return "animate-fade-in";
}

export function getNotificationCenterGroupHeaderClassName() {
  return "sticky top-0 z-10 border-b border-ui-border-secondary/60 bg-ui-bg px-4 py-2.5";
}

export function getNotificationCenterGroupListClassName() {
  return "divide-y divide-ui-border";
}
