import { cn } from "@/lib/utils";

export function getAuthLinkButtonClassName(muted = false) {
  return muted
    ? "text-sm text-ui-text-tertiary hover:text-ui-text-secondary hover:underline active:scale-100"
    : "text-sm font-medium text-brand-ring hover:text-brand-muted hover:underline active:scale-100";
}

export function getAiAssistantFabButtonClassName() {
  return "fixed z-30 group rounded-full bg-linear-to-r from-brand to-accent text-brand-foreground shadow-lg hover:scale-110 hover:shadow-xl focus-visible:ring-brand-ring";
}

export function getAiPrimaryActionButtonClassName() {
  return "w-full touch-manipulation bg-linear-to-r from-brand to-accent text-brand-foreground shadow-sm hover:from-brand-hover hover:to-accent-hover hover:shadow-md focus-visible:ring-brand-ring sm:h-11";
}

export function getFramedCompactPillButtonClassName() {
  return "h-8 rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/94 px-3 text-sm text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getFramedRoundIconButtonClassName() {
  return "h-9 w-9 rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/94 text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getFramedSearchTriggerButtonClassName() {
  return "h-10 w-full min-w-0 justify-center rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/94 px-2.5 text-sm text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text sm:justify-between sm:px-3";
}

export function getQuietRoundIconButtonClassName() {
  return "h-9 w-9 rounded-full border border-transparent bg-transparent text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text";
}

export function getQuietCompactPillButtonClassName() {
  return "h-8 rounded-full border border-transparent bg-transparent px-3 text-sm text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text";
}

export function getNotificationFilterButtonClassName(active: boolean) {
  return active
    ? "h-7 rounded-full border border-ui-border-secondary/80 bg-ui-bg px-3 text-sm text-ui-text shadow-card hover:border-ui-border-secondary hover:bg-ui-bg-hover"
    : "h-7 rounded-full border border-transparent bg-transparent px-3 text-sm text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text";
}

export function getListRowButtonClassName(active = false) {
  return active
    ? "w-full justify-start rounded-none px-3 py-2 text-left text-sm bg-ui-bg-hover text-ui-text shadow-none"
    : "w-full justify-start rounded-none px-3 py-2 text-left text-sm bg-transparent text-ui-text shadow-none hover:bg-ui-bg-hover focus:bg-ui-bg-hover";
}

export function getSectionToggleButtonClassName() {
  return "w-full min-h-0 justify-between rounded-none";
}

export function getFullOverlayDismissButtonClassName() {
  return "fixed inset-0 z-40 h-auto w-auto cursor-default rounded-none bg-ui-bg-overlay p-0 text-transparent shadow-none hover:bg-ui-bg-overlay lg:hidden";
}

export function getDocumentHeaderToggleButtonClassName(isPublic: boolean) {
  return isPublic
    ? "min-h-0 rounded-lg border border-status-success/30 bg-status-success-bg px-2.5 py-1.5 text-status-success-text shadow-none hover:bg-status-success-bg/80"
    : "min-h-0 rounded-lg border border-ui-border bg-transparent px-2.5 py-1.5 text-ui-text-secondary shadow-none hover:border-ui-border-secondary hover:text-ui-text";
}

export function getDocumentHeaderActionButtonClassName(tone: "neutral" | "accent") {
  return cn(
    "min-h-0 rounded-lg border px-2 py-1.5 shadow-none sm:px-3",
    tone === "neutral"
      ? "border-ui-border bg-transparent text-ui-text-secondary hover:border-ui-border-secondary hover:text-ui-text"
      : "border-ui-border bg-transparent text-ui-text-secondary hover:border-brand-border hover:bg-brand-subtle hover:text-brand disabled:opacity-50",
  );
}

export function getFilterTriggerButtonClassName(isActive: boolean) {
  return cn(
    "h-6 rounded-full px-2 text-xs sm:h-9 sm:rounded-xl sm:px-3 sm:text-sm",
    isActive
      ? "border border-brand/15 bg-brand-subtle/78 text-brand shadow-none hover:bg-brand-subtle sm:border-brand/10 sm:bg-brand-subtle"
      : "border border-ui-border/45 bg-transparent text-ui-text-secondary shadow-none hover:border-ui-border/60 hover:bg-ui-bg-hover/72 sm:border-ui-border/55 sm:bg-ui-bg-elevated/86 sm:hover:bg-ui-bg-hover/80",
  );
}

export function getCalendarControlButtonClassName(kind: "pill" | "icon") {
  return kind === "pill"
    ? "h-6 rounded-full border border-ui-border bg-transparent px-2 text-xs text-ui-text shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover sm:h-7 sm:px-3"
    : "h-6 w-6 rounded-full border border-ui-border bg-transparent p-0.5 text-ui-text shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover sm:h-7 sm:w-7 sm:p-1";
}

export function getCalendarAddButtonClassName() {
  return "h-6 w-6 rounded-full bg-brand p-0 text-brand-foreground shadow-none hover:bg-brand-hover sm:h-9 sm:w-auto sm:rounded-xl sm:px-3";
}

export function getCalendarSidebarEventButtonClassName() {
  return "h-auto w-full justify-start rounded-lg px-2 py-1.5 text-left text-sm text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getCalendarMonthOverflowButtonClassName() {
  return "rounded-none p-0 text-xs font-medium text-ui-text-tertiary hover:text-brand";
}

export function getCalendarIssueButtonClassName() {
  return "w-full rounded-md px-1.5 py-1.5 text-xs text-ui-text shadow-none hover:bg-ui-bg-hover";
}

export function getToolbarButtonClassName(active: boolean, kind: "icon" | "control" = "icon") {
  const size = kind === "icon" ? "h-7 w-7 rounded-md p-0" : "h-7 rounded-md px-1.5 text-sm";
  return active
    ? `${size} bg-brand-subtle text-brand shadow-none hover:bg-brand-subtle/90`
    : `${size} bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text`;
}

export function getLandingBrandButtonClassName() {
  return "rounded-full px-0 py-0 text-ui-text hover:opacity-80";
}

export function getLandingNavButtonClassName() {
  return "h-auto rounded-full px-4 py-2 text-sm text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getLandingThemeButtonClassName() {
  return "h-9 w-9 rounded-full border border-ui-border/60 bg-ui-bg-elevated/92 text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text sm:h-10 sm:w-10";
}

export function getLandingPrimaryButtonClassName() {
  return "rounded-full bg-linear-to-r from-brand to-landing-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-foreground shadow-soft hover:-translate-y-px hover:bg-brand-hover hover:shadow-card focus-visible:ring-brand-ring sm:px-5 sm:py-2.5";
}

export function getBrandSubtleActionButtonClassName() {
  return "w-full border border-brand/10 bg-brand-subtle text-brand shadow-none hover:bg-brand-subtle/70 focus-visible:ring-brand-ring";
}

export function getFooterLinkButtonClassName() {
  return "rounded-none px-0 py-0 text-sm text-ui-text-tertiary hover:text-ui-text";
}

export function getFooterSocialButtonClassName() {
  return "rounded-none p-0 text-ui-text-tertiary hover:text-ui-text";
}

export function getSwimlaneHeaderButtonClassName() {
  return "h-auto w-full justify-start rounded-xl bg-transparent px-4 py-2 text-left text-sm text-ui-text-secondary shadow-none hover:bg-ui-bg-hover";
}

export function getSprintPresetButtonClassName(selected: boolean) {
  return selected
    ? "h-auto flex-col items-start justify-start rounded-lg border border-brand bg-ui-bg-secondary px-3 py-3 text-left text-sm text-ui-text shadow-none"
    : "h-auto flex-col items-start justify-start rounded-lg border border-ui-border-secondary bg-ui-bg px-3 py-3 text-left text-sm text-ui-text shadow-none hover:border-ui-border-hover";
}

export function getStopTimerButtonClassName() {
  return "h-8 rounded-full border border-transparent bg-transparent px-3 text-sm text-brand-indigo-text hover:bg-brand-indigo-bg/10 hover:text-brand-indigo-text";
}

export function getStartTimerButtonClassName() {
  return "h-10 rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/94 px-4 text-sm text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getReactionPillButtonClassName(active: boolean) {
  return active
    ? "rounded-full border border-brand-border bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand-subtle-foreground shadow-none hover:bg-brand-subtle/90"
    : "rounded-full border border-ui-border bg-ui-bg-soft px-2 py-0.5 text-xs font-medium text-ui-text-secondary shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover";
}

export function getSelectableRoundIconButtonClassName(selected = false) {
  return cn(getQuietRoundIconButtonClassName(), selected && "ring-2 ring-brand ring-offset-1");
}

export function getDocumentTreeRowButtonClassName(muted = false) {
  return muted
    ? "h-auto w-full justify-start rounded-none border-transparent bg-transparent px-2 py-1.5 text-left text-ui-text-tertiary shadow-none hover:bg-ui-bg-hover"
    : "h-auto w-full justify-start rounded-none border-transparent bg-transparent px-2 py-1.5 text-left text-ui-text-secondary shadow-none hover:bg-ui-bg-hover";
}

export function getDocumentTreeDisclosureButtonClassName() {
  return "size-5 rounded-sm p-0.5 text-ui-text-tertiary hover:bg-ui-bg-hover hover:text-ui-text";
}

export function getIssueCardOverlayButtonClassName() {
  return "absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring";
}

export function getMobileTouchWideButtonClassName() {
  return "w-full touch-manipulation sm:h-11";
}

export function getMobileTouchTargetButtonClassName() {
  return "min-h-11 min-w-11 sm:min-h-0 sm:min-w-0";
}

export function getSubtleGhostActionButtonClassName() {
  return "text-ui-text-secondary hover:bg-ui-bg-tertiary hover:text-ui-text";
}

export function getRoadmapTimelineMilestoneButtonClassName() {
  return "relative h-full w-full rounded-none p-0 text-ui-text shadow-none hover:bg-transparent";
}

export function getRoadmapTimelineResizeHandleButtonClassName(edge: "left" | "right") {
  return edge === "left"
    ? "absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-full bg-ui-bg-elevated/50 p-0 text-ui-text-tertiary shadow-none hover:bg-ui-bg-elevated/60"
    : "absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-full bg-ui-bg-elevated/50 p-0 text-ui-text-tertiary shadow-none hover:bg-ui-bg-elevated/60";
}

export function getRoadmapTimelineBarButtonClassName() {
  return "h-full w-full rounded-none px-2 text-ui-text shadow-none hover:bg-transparent";
}

export function getRoadmapGroupButtonClassName() {
  return "h-auto w-full rounded-none border border-ui-border bg-ui-bg-secondary/60 px-4 text-left text-ui-text shadow-none hover:bg-ui-bg-secondary/80";
}

export function getRoadmapSubtaskToggleButtonClassName() {
  return "size-4 rounded-none p-0 text-ui-text-tertiary shadow-none hover:text-ui-text";
}

export function getRoadmapIssueLinkButtonClassName(selected: boolean) {
  return selected
    ? "truncate rounded-none p-0 text-left text-sm font-medium text-brand-hover shadow-none hover:text-brand-hover"
    : "truncate rounded-none p-0 text-left text-sm font-medium text-ui-text shadow-none hover:text-brand-hover";
}
