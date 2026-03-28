import { cn } from "@/lib/utils";
import { getCardRecipeClassName } from "./Card";

export function getAnalyticsRecentActivityListClassName() {
  return "relative";
}

export function getAnalyticsRecentActivityRailClassName() {
  return "absolute left-4 top-4 bottom-4 w-px bg-ui-border";
}

export function getAnalyticsRecentActivityItemClassName() {
  return cn(getCardRecipeClassName("timelineItem"), "p-3");
}

export function getAnalyticsRecentActivityAvatarClassName() {
  return "relative z-10";
}

export function getAnalyticsRecentActivityContentClassName() {
  return "min-w-0";
}

export function getAnalyticsRecentActivityMetadataClassName() {
  return "mt-1.5";
}
