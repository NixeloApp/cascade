/**
 * Card Component
 *
 * Container with elevation and padding variants.
 * Includes CardHeader, CardContent, and CardFooter slots.
 * Use for grouping related content in a visual container.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

const cardVariants = cva("border transition-default", {
  variants: {
    variant: {
      default:
        "bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 border-ui-border-secondary/90 shadow-card",
      elevated:
        "bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/70 border-ui-border-secondary shadow-elevated",
      soft: "bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 border-ui-border-secondary/85 shadow-card",
      interactive:
        "bg-ui-bg-elevated border-ui-border-secondary/90 shadow-card hover:bg-ui-bg-hover hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
      outline:
        "bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/72 border-ui-border-secondary/90 shadow-soft",
      ghost: "bg-transparent border-transparent",
      flat: "bg-linear-to-b from-ui-bg-elevated/98 via-ui-bg-secondary/88 to-ui-bg-soft/78 border-ui-border-secondary/80 shadow-soft",
    },
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded",
      md: "rounded-lg",
      lg: "rounded-container",
      full: "rounded-2xl",
    },
    hoverable: {
      true: "hover:bg-ui-bg-hover hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "none",
    radius: "lg",
    hoverable: false,
  },
});

const cardRecipeVariants = cva("", {
  variants: {
    recipe: {
      // Modal/overlay surfaces
      overlayInset:
        "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-soft/80 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
      commandSection:
        "rounded-2xl border-ui-border-secondary/60 bg-linear-to-b from-ui-bg-soft/70 to-ui-bg-elevated/94 shadow-soft",
      commandIntro:
        "rounded-2xl border-ui-border/70 bg-linear-to-br from-brand-subtle/70 via-ui-bg-soft to-ui-bg-secondary/85 shadow-soft",
      shortcutCategoryHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border-secondary/50 bg-transparent shadow-none",
      shortcutItemRow: "rounded-xl border-ui-border-secondary/60 bg-ui-bg-elevated/70 shadow-none",

      // Page layout surfaces
      pageHeader:
        "rounded-2xl border-ui-border-secondary/82 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card sm:rounded-3xl",
      pageHeaderIndicator:
        "h-1.5 w-1.5 rounded-full border-transparent bg-brand shadow-brand-halo ring-2 ring-brand/8 sm:h-2 sm:w-2",
      documentHeaderShell:
        "border-x-0 border-t-0 rounded-none border-ui-border-secondary/85 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/96 to-ui-bg-soft/84 shadow-soft",
      documentSidebarShell:
        "h-full rounded-none border-x-0 border-y-0 border-l border-ui-border bg-ui-bg-soft shadow-none",
      documentSidebarHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border/30 bg-transparent shadow-none",
      documentSidebarInfoRow:
        "rounded-none border-transparent bg-transparent px-0 py-1 shadow-none",
      documentCommentComposer:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-transparent shadow-none",
      documentTreeRow:
        "rounded-md border-transparent bg-transparent shadow-none hover:bg-ui-bg-hover",
      documentTreeRowSelected: "rounded-md border-transparent bg-brand/10 text-brand shadow-none",
      portalTimelineEntry: "rounded-lg border-ui-border bg-ui-bg-soft shadow-none",
      templateBuiltInTile:
        "h-full border-2 border-transparent bg-linear-to-br from-brand-subtle to-brand-subtle text-left shadow-none hover:border-brand-muted hover:shadow-card-hover",
      templateCustomTile: "bg-ui-bg-secondary shadow-none hover:bg-ui-bg-tertiary",
      dashboardShell:
        "relative overflow-hidden rounded-container border-ui-border/40 bg-linear-to-b from-ui-bg to-ui-bg-secondary/50 shadow-soft",
      dashboardPanel: "border-ui-border-secondary/70 bg-ui-bg/75 shadow-soft",
      dashboardPanelInset:
        "overflow-hidden border-ui-border/50 bg-ui-bg/70 shadow-soft backdrop-blur-sm",
      filterBar:
        "rounded-md border-ui-border-secondary/75 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/94 to-ui-bg-soft/92 shadow-card sm:rounded-2xl",
      timelineItem:
        "rounded-lg border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-ui-bg-secondary/30 hover:shadow-none",
      timeSummary:
        "rounded-xl border-brand-border bg-linear-to-r from-brand-subtle/85 via-brand-subtle/70 to-ui-bg-elevated/96 shadow-none",
      optionTile:
        "rounded-2xl border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/96 to-ui-bg-soft/84 shadow-soft",
      optionTileSelected:
        "rounded-2xl border-brand-border bg-linear-to-b from-brand-subtle/85 via-ui-bg-elevated/98 to-ui-bg-soft/86 shadow-card",
      dragPreview:
        "rounded-lg border-brand bg-brand-subtle px-2 py-2 text-sm text-brand shadow-soft",
      selectionRow:
        "rounded-xl border-transparent bg-transparent shadow-none hover:border-ui-border hover:bg-ui-bg-elevated/80",
      selectionRowSelected:
        "rounded-xl border-brand/20 bg-brand-subtle/60 shadow-none hover:border-brand/25 hover:bg-brand-subtle/70",

      // Landing/showcase surfaces
      showcaseShell:
        "relative overflow-hidden rounded-3xl border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/80 shadow-elevated",
      showcasePanel:
        "rounded-2xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      showcasePanelQuiet:
        "rounded-2xl border-ui-border-secondary/65 bg-linear-to-b from-ui-bg-elevated/94 via-ui-bg-soft/90 to-ui-bg-secondary/76 shadow-soft",
      metricTile:
        "rounded-2xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/94 to-ui-bg-soft/78 shadow-card",
      metricTileInfo:
        "rounded-2xl border-status-info/30 bg-linear-to-b from-status-info-bg via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      metricTileSuccess:
        "rounded-2xl border-status-success/30 bg-linear-to-b from-status-success-bg via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      metricTileAccent:
        "rounded-2xl border-accent-border bg-linear-to-b from-accent-subtle via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      metricTileWarning:
        "rounded-2xl border-status-warning/30 bg-linear-to-b from-status-warning-bg via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      successCallout: "rounded-lg border-status-success/20 bg-status-success-bg shadow-none",
      onboardingFeatureCard:
        "rounded-container border-ui-border bg-ui-bg-soft text-center shadow-none hover:border-ui-border-secondary hover:shadow-card-hover",
      onboardingFeatureIconBrand:
        "rounded-xl border-transparent bg-brand-subtle text-brand shadow-none",
      onboardingFeatureIconSuccess:
        "rounded-xl border-transparent bg-status-success-bg text-status-success shadow-none",
      onboardingFeatureIconWarning:
        "rounded-xl border-transparent bg-status-warning-bg text-status-warning shadow-none",
      onboardingInviteHero:
        "rounded-full border-transparent bg-brand-subtle text-brand shadow-none ring-8 ring-brand/10",
      onboardingInviteHeroBadge:
        "rounded-full border-transparent bg-status-success text-brand-foreground shadow-none ring-4 ring-ui-bg-secondary",
      onboardingInvitePanel: "rounded-container border-ui-border bg-ui-bg-soft shadow-none",
      onboardingInviteBullet:
        "rounded-full border-transparent bg-brand-subtle text-brand shadow-none",
      onboardingRoleCard:
        "rounded-container border-2 border-ui-border bg-ui-bg shadow-none hover:-translate-y-1 hover:border-ui-border-secondary hover:shadow-card-hover",
      onboardingRoleCardSelected:
        "rounded-container border-2 border-brand bg-brand-subtle/50 shadow-card ring-4 ring-brand/10",
      onboardingRoleIndicator:
        "rounded-full border-2 border-ui-border-secondary bg-transparent shadow-none group-hover:border-brand-muted",
      onboardingRoleIndicatorSelected:
        "rounded-full border-transparent bg-brand text-brand-foreground shadow-none",
      onboardingRoleIconShell:
        "rounded-xl border-transparent bg-ui-bg-tertiary text-ui-text-secondary shadow-none group-hover:scale-105 group-hover:bg-brand-subtle group-hover:text-brand",
      onboardingRoleIconShellSelected:
        "rounded-xl border-transparent bg-brand text-brand-foreground shadow-none",
      onboardingHeroCircle:
        "rounded-full border-transparent bg-brand-indigo-track text-brand shadow-none",
      onboardingActionTile:
        "rounded-container border-2 border-ui-border bg-ui-bg text-left shadow-none hover:border-ui-border-secondary hover:shadow-card-hover",
      onboardingActionTileRecommended:
        "rounded-container border-2 border-brand/30 bg-brand-subtle/30 text-left shadow-none hover:shadow-card-hover",
      onboardingActionIconBrand:
        "rounded-lg border-transparent bg-brand-subtle text-brand shadow-none",
      onboardingActionIconNeutral:
        "rounded-lg border-transparent bg-ui-bg-tertiary text-ui-text-secondary shadow-none",
      onboardingMemberFeatureIconBlue:
        "rounded-lg border-transparent bg-palette-blue-bg text-palette-blue shadow-none",
      onboardingMemberFeatureIconSuccess:
        "rounded-lg border-transparent bg-status-success-bg text-status-success shadow-none",
      onboardingMemberFeatureIconWarning:
        "rounded-lg border-transparent bg-status-warning-bg text-status-warning shadow-none",
      onboardingMemberFeatureIconPurple:
        "rounded-lg border-transparent bg-palette-purple-bg text-palette-purple shadow-none",
      onboardingWizardFooter:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-transparent shadow-none",
      onboardingChecklistHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg-soft shadow-none",
      onboardingChecklistHero:
        "rounded-lg border-transparent bg-brand-subtle text-brand shadow-none",
      onboardingChecklistItem:
        "rounded-lg border-transparent bg-ui-bg-soft shadow-none hover:bg-ui-bg-hover",
      onboardingChecklistItemComplete: "rounded-lg border-transparent bg-transparent shadow-none",
      onboardingChecklistStep:
        "rounded-full border-2 border-ui-border-secondary bg-transparent text-ui-text-tertiary shadow-none",
      onboardingChecklistStepComplete:
        "rounded-full border-transparent bg-status-success text-brand-foreground shadow-none",
      onboardingChecklistSuccessIcon:
        "rounded-full border-transparent bg-status-success/20 text-status-success shadow-none",
      authShowcasePanel:
        "rounded-3xl border-ui-border-secondary/60 bg-linear-to-b from-ui-bg-elevated/74 via-ui-bg-elevated/58 to-ui-bg-soft/56 shadow-soft backdrop-blur-sm",
      authFeatureTile: "rounded-2xl border-ui-border-secondary/55 bg-ui-bg-elevated/72 shadow-soft",
      authMobileBrandChip:
        "rounded-full border-ui-border/70 bg-linear-to-r from-ui-bg-elevated/96 via-ui-bg-elevated/94 to-ui-bg-soft/88 shadow-soft",
      authFormShell:
        "relative rounded-3xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 shadow-card",
      authStepIndicator:
        "h-1.5 w-4 rounded-full border-transparent bg-ui-border shadow-none transition-all duration-medium",
      authStepIndicatorActive:
        "h-1.5 w-8 rounded-full border-transparent bg-brand shadow-none transition-all duration-medium",
      authVerificationIcon: "rounded-2xl border-transparent bg-brand-subtle text-brand shadow-none",
      authStrengthSegment:
        "h-1 rounded-full border-transparent bg-ui-border shadow-none transition-colors",
      authStrengthSegmentError:
        "h-1 rounded-full border-transparent bg-status-error shadow-none transition-colors",
      authStrengthSegmentWarning:
        "h-1 rounded-full border-transparent bg-status-warning shadow-none transition-colors",
      authStrengthSegmentSuccess:
        "h-1 rounded-full border-transparent bg-status-success shadow-none transition-colors",

      // Header control surfaces
      controlRail:
        "rounded-full border-ui-border-secondary/70 bg-linear-to-r from-ui-bg-elevated/96 via-ui-bg-elevated/94 to-ui-bg-soft/90 shadow-card backdrop-blur-xl",
      controlStrip:
        "rounded-full border-ui-border-secondary/70 bg-ui-bg-elevated/94 shadow-soft backdrop-blur-sm",
      roadmapRow:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent shadow-none hover:bg-ui-bg-secondary",
      roadmapRowSelected:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-brand-subtle/50 shadow-none ring-1 ring-inset ring-brand-ring/50",
      roadmapTimelineBar: "rounded-full border-transparent shadow-none opacity-80",
      roadmapTimelineBarActive:
        "rounded-full border-transparent shadow-none opacity-100 ring-2 ring-brand-ring",
      roadmapTimelineBarSprint:
        "rounded-full border-transparent bg-accent-ring px-2 text-xs font-medium text-brand-foreground shadow-none",
      roadmapTimelineBarHigh:
        "rounded-full border-transparent bg-status-error px-2 text-xs font-medium text-brand-foreground shadow-none",
      roadmapTimelineBarMedium:
        "rounded-full border-transparent bg-status-warning px-2 text-xs font-medium text-brand-foreground shadow-none",
      roadmapTimelineBarLow:
        "rounded-full border-transparent bg-brand-ring px-2 text-xs font-medium text-brand-foreground shadow-none",
      roadmapMonthHeaderCell:
        "rounded-none border-y-0 border-r-0 border-l border-ui-border bg-transparent px-2 py-0 shadow-none",
      notificationPanelHeader:
        "sticky top-0 rounded-t-lg border-x-0 border-t-0 bg-ui-bg shadow-none",
      notificationPanelSectionHeader:
        "sticky top-0 rounded-none border-x-0 border-t-0 bg-ui-bg-secondary shadow-none",
      notificationPanelFooter: "rounded-b-lg border-x-0 border-b-0 bg-ui-bg-secondary shadow-none",
      notificationRow:
        "rounded-none border-x-0 border-t-0 bg-ui-bg shadow-none hover:bg-ui-bg-secondary focus-within:bg-ui-bg-secondary",
      notificationRowUnread:
        "rounded-none border-x-0 border-t-0 bg-brand-subtle/10 shadow-none hover:bg-ui-bg-secondary focus-within:bg-ui-bg-secondary",
      inboxStatusWarning:
        "rounded border-transparent bg-status-warning-bg text-status-warning-text shadow-none",
      inboxStatusSuccess:
        "rounded border-transparent bg-status-success-bg text-status-success-text shadow-none",
      inboxStatusError:
        "rounded border-transparent bg-status-error-bg text-status-error-text shadow-none",
      inboxStatusNeutral:
        "rounded border-transparent bg-ui-bg-soft text-ui-text-secondary shadow-none",
      bulkActionContent:
        "mx-auto max-w-7xl rounded-none border-transparent bg-transparent px-4 py-3 shadow-none",
      bulkActionDetails:
        "mt-3 rounded-none border-x-0 border-b-0 border-t border-ui-border bg-transparent pt-3 shadow-none",
      activityFeedEntry:
        "rounded-lg border-transparent bg-transparent p-4 shadow-none hover:bg-ui-bg-secondary/30",
      activityFeedEntryCompact:
        "rounded-md border-transparent bg-transparent px-2 py-2 shadow-none hover:bg-ui-bg-secondary/50",
      activityTimelineIcon:
        "rounded-full border-transparent bg-ui-bg text-ui-text-secondary shadow-none",
      projectFeatureStrip: "rounded-2xl border-ui-border/60 bg-ui-bg-soft/80 shadow-none",
      projectKeyTile: "rounded-lg border-brand/20 bg-brand-subtle text-brand shadow-none",
      appHeaderShell:
        "border-x-0 border-t-0 border-b border-ui-border/50 bg-linear-to-b from-ui-bg/95 via-ui-bg/90 to-ui-bg/80 px-3 py-2 shadow-none backdrop-blur-xl sm:px-6 sm:py-3",
      workspaceCockpitChip:
        "rounded-2xl border-ui-border-secondary/70 bg-ui-bg-elevated/95 px-3 py-1.5 shadow-soft",
      sidebarOrgCard: "rounded-2xl border-ui-border-secondary/70 bg-ui-bg-elevated/95 shadow-soft",
      sidebarOrgInitial: "rounded-xl border-brand/15 bg-brand-subtle text-brand shadow-none",
      sidebarShell:
        "h-full border-x-0 border-y-0 border-r border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-sidebar via-ui-bg-sidebar to-ui-bg/96 shadow-card backdrop-blur-xl",
      sidebarHeaderBar:
        "border-x-0 border-t-0 border-b border-ui-border-secondary/70 bg-transparent shadow-none",
      sidebarFooterBar:
        "border-x-0 border-b-0 border-t border-ui-border-secondary/70 bg-transparent shadow-none",
      sidebarNavIcon:
        "rounded-lg border-ui-border/60 bg-ui-bg-soft text-ui-text-tertiary shadow-none",
      sidebarPrimaryNavIcon:
        "rounded-xl border-ui-border/60 bg-ui-bg-soft text-ui-text-tertiary shadow-none",
      sidebarPrimaryNavIconActive:
        "rounded-xl border-brand/20 bg-brand-subtle text-brand shadow-none",
      sidebarSectionIcon:
        "rounded-xl border-ui-border-secondary/70 bg-ui-bg-elevated text-ui-text-tertiary shadow-soft",
      sidebarSectionIconActive: "rounded-xl border-brand/20 bg-brand-subtle text-brand shadow-soft",
      sidebarSectionChildren:
        "rounded-2xl border-ui-border-secondary/60 bg-ui-bg-elevated/70 shadow-soft",
      sidebarTeamBranch: "ml-4 rounded-none border-transparent bg-transparent shadow-none",
      sidebarTeamProjectsRail:
        "ml-6 rounded-none border-x-0 border-y-0 border-l border-ui-border bg-transparent pl-1 shadow-none",
      sidebarTeamStatus:
        "ml-6 rounded-none border-transparent bg-transparent px-3 py-1 shadow-none",
      sidebarTeamLoadMore: "rounded-none border-transparent bg-transparent pl-2 shadow-none",
      assistantPanelHeader:
        "border-x-0 border-t-0 border-b border-ui-border bg-linear-to-r from-brand to-accent shadow-none",
      assistantComposer:
        "border-x-0 border-b-0 border-t border-ui-border bg-ui-bg-secondary p-3 shadow-none sm:p-4",
      chatBubbleAssistant:
        "relative max-w-chat-bubble rounded-lg border-transparent bg-ui-bg-secondary text-ui-text shadow-none md:max-w-chat-bubble-md",
      chatBubbleUser:
        "relative max-w-chat-bubble rounded-lg border-transparent bg-brand text-brand-foreground shadow-none md:max-w-chat-bubble-md",
      landingNavShell:
        "rounded-full border-ui-border-secondary/70 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/96 to-ui-bg-soft/90 shadow-card backdrop-blur-xl",
      landingNavRail:
        "rounded-full border-ui-border/60 bg-linear-to-r from-ui-bg-soft/94 via-ui-bg-elevated/92 to-ui-bg-soft/90 shadow-soft",
      searchDropdown:
        "overflow-hidden rounded-md border-ui-border bg-ui-bg-elevated shadow-elevated",
      searchResultRow:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border-secondary bg-transparent shadow-none hover:bg-ui-bg-secondary focus-within:bg-ui-bg-secondary",
      listFooterBar:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-ui-bg-secondary shadow-none",
      commentThreadItem:
        "rounded-container border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-soft/96 via-ui-bg-soft/92 to-ui-bg-elevated/94 shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      pendingAttachmentRow: "rounded-xl border-ui-border bg-ui-bg-soft shadow-none",
      attachmentRow: "rounded-xl border-ui-border bg-ui-bg-soft shadow-none",
      invoiceEditorLine: "rounded-xl border-ui-border bg-ui-bg-soft shadow-none",
      invoicePreviewSection:
        "overflow-hidden rounded-xl border-ui-border-secondary/70 bg-ui-bg-soft shadow-none",
      invoiceTotalsPanel:
        "rounded-xl border-brand-border bg-linear-to-r from-brand-subtle/70 via-ui-bg-elevated/96 to-ui-bg-soft/88 shadow-none",
      calendarDayCell: "rounded-none border-ui-border bg-ui-bg shadow-none",
      calendarDayCellToday: "rounded-none border-ui-border bg-brand-indigo-track shadow-none",
      calendarDayCellDropTarget:
        "rounded-none border-ui-border bg-brand-subtle shadow-none ring-2 ring-inset ring-brand-ring",
      calendarWeekdayHeaderCell:
        "rounded-none border-transparent bg-transparent px-2 py-2 shadow-none",
      calendarMonthWeekdayHeaderCell:
        "rounded-none border-x-0 border-t-0 border-b border-r border-ui-border bg-transparent px-2 py-1.5 shadow-none last:border-r-0 md:py-2.5",
      calendarMonthDayCell:
        "relative min-h-16 overflow-hidden rounded-none border-x-0 border-t-0 border-b border-r border-ui-border bg-ui-bg shadow-none hover:bg-ui-bg-hover sm:min-h-24 lg:min-h-28 xl:min-h-32",
      calendarMonthDayCellAdjacent:
        "relative min-h-16 overflow-hidden rounded-none border-x-0 border-t-0 border-b border-r border-ui-border bg-ui-bg-secondary/30 shadow-none hover:bg-ui-bg-secondary/50 sm:min-h-24 lg:min-h-28 xl:min-h-32",
      calendarMonthDayCellToday:
        "relative min-h-16 overflow-hidden rounded-none border-x-0 border-t-0 border-b border-r border-ui-border bg-brand-indigo-track shadow-none hover:bg-ui-bg-hover sm:min-h-24 lg:min-h-28 xl:min-h-32",
      calendarDayHourRow:
        "h-24 rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent shadow-none hover:bg-ui-bg-hover/30 sm:h-32",
      calendarDayEventsPanel: "rounded-none border-transparent bg-transparent shadow-none",
      calendarDayEventsHeader: "rounded-none border-transparent bg-transparent shadow-none",
      calendarDayEmptyStateIcon:
        "flex items-center justify-center rounded-full border border-ui-border bg-ui-bg-tertiary shadow-none",
      calendarBodyHeaderBar:
        "sticky top-0 z-10 rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg shadow-none",
      calendarTimeMarginRail:
        "sticky left-0 z-10 w-10 rounded-none border-transparent bg-ui-bg shadow-none sm:w-12",
      calendarTimeMarginSpacer:
        "sticky top-0 left-0 z-20 h-calendar-day-margin rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg shadow-none",
      calendarDayLayoutShell: "rounded-none border-transparent bg-ui-bg shadow-none",
      calendarDayMainPanel: "rounded-none border-transparent bg-transparent shadow-none",
      calendarDayScrollRail: "rounded-none border-transparent bg-transparent shadow-none",
      calendarDayContentRail:
        "rounded-none border-x-0 border-r-0 border-t-0 border-b-0 border-l border-ui-border bg-transparent shadow-none",
      calendarDaySidebarShell:
        "rounded-none border-x-0 border-r-0 border-t-0 border-b-0 border-l border-ui-border bg-ui-bg-secondary/30 shadow-none",
      calendarWeekDayShell:
        "rounded-none border-x-0 border-t-0 border-b-0 border-r border-ui-border bg-transparent shadow-none last:border-r-0",
      calendarWeekActiveDayShell:
        "rounded-none border-x-0 border-t-0 border-b-0 border-r border-ui-border bg-brand-indigo-track shadow-none last:border-r-0",
      calendarEventMonth: "rounded-md border-transparent px-1.5 py-1 shadow-sm",
      calendarEventDay: "rounded-lg border-transparent px-3 py-1.5 shadow-none",
      calendarEventMonthLayout: "w-full flex-col items-start gap-0.5",
      calendarEventDayLayout: "w-full items-center justify-between gap-2",
      calendarViewSwitcherBar:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg shadow-none",
      calendarHeaderShell:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg px-1 py-1 shadow-none sm:px-4 sm:py-4",
      calendarHeaderDateIcon:
        "overflow-hidden rounded-lg border-ui-border bg-ui-bg shadow-none sm:h-14 sm:w-14",
      calendarHeaderDateIconMonth:
        "h-4 w-full rounded-none border-transparent bg-brand px-0 py-0 shadow-none sm:h-6",
      calendarHeaderDateIconDay:
        "w-full flex-1 rounded-none border-transparent bg-transparent px-0 py-0 shadow-none",
      calendarRoadmapShell: "h-full rounded-none border-transparent bg-ui-bg shadow-none",
      calendarRoadmapHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg shadow-none",
      calendarRoadmapTimelineHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg-secondary shadow-none",
      calendarRoadmapItemHeader:
        "w-40 shrink-0 rounded-none border-y-0 border-l-0 border-r border-ui-border bg-transparent px-2 py-2 shadow-none sm:w-48 sm:px-3 sm:py-3 md:w-64",
      calendarRoadmapDateHeader:
        "rounded-none border-y-0 border-r border-l-0 border-ui-border bg-transparent px-2 py-2 shadow-none sm:px-3 sm:py-3",
      calendarRoadmapItemInfo:
        "w-40 shrink-0 rounded-none border-y-0 border-l-0 border-r border-ui-border bg-transparent px-2 py-2 shadow-none sm:w-48 sm:px-3 sm:py-3 md:w-64",
      calendarRoadmapTimelineCell:
        "h-full rounded-none border-y-0 border-r border-l-0 border-ui-border bg-transparent shadow-none",
      calendarRoadmapBarLane:
        "absolute inset-y-0 rounded-none border-transparent bg-transparent px-2 shadow-none",
      kanbanColumnShell:
        "overflow-hidden rounded-container border-ui-border-secondary/70 border-t-2 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft shadow-soft",
      kanbanColumnCollapsedShell:
        "h-full overflow-hidden rounded-container border-ui-border-secondary/70 border-t-2 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft p-2 pb-3 shadow-soft",
      kanbanColumnHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border-secondary/70 bg-ui-bg-elevated/88 p-1.5 shadow-soft sm:p-4",
      kanbanColumnBody: "flex min-h-52 flex-col p-0.75 sm:min-h-56 sm:p-2 lg:min-h-96 lg:p-2.5",
      kanbanSwimlaneContent: "overflow-x-auto px-4 md:px-0",
      kanbanBoardRail:
        "overflow-x-auto overscroll-x-contain snap-x snap-mandatory px-2 pb-3 scroll-px-2 sm:snap-none sm:px-4 lg:px-6",
      kanbanSwimlaneWrapper: "px-4 pb-6 lg:px-6",
      kanbanLoadingColumn: "w-72 border-ui-border bg-ui-bg-soft lg:w-80",
      kanbanLoadingColumnHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border/50 bg-transparent shadow-none",
      sprintWorkloadHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent shadow-none",
      sprintWorkloadRow:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border-secondary bg-transparent shadow-none hover:bg-ui-bg-secondary",
      sprintWorkloadRowBordered:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-transparent shadow-none hover:bg-ui-bg-secondary",
      issueDetailSheetHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg shadow-none",
      issueDetailLayoutShell: "rounded-lg border-ui-border bg-ui-bg-elevated shadow-card",
      issueMetadataRow: "rounded-none border-transparent bg-transparent px-0 py-1 shadow-none",
      eventDetailSection:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-transparent pt-4 shadow-none",
      eventAttendanceRow: "rounded-md border-transparent bg-ui-bg-secondary p-2 shadow-none",
      labelGroupHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-ui-bg-secondary shadow-none hover:bg-ui-bg-tertiary",
      labelGroupRow:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border-secondary bg-transparent shadow-none hover:bg-ui-bg-secondary",
      dependencyRow: "rounded-xl border-ui-border-secondary/70 bg-ui-bg-secondary shadow-none",
      timeTrackerShell: "border-ui-border bg-ui-bg shadow-none",
      timeTrackerHeader:
        "rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent shadow-none",
      timeTrackerEntries:
        "rounded-none border-x-0 border-b-0 border-t border-ui-border bg-ui-bg-secondary shadow-none",
      issueAssigneeFallback:
        "rounded-full border-transparent bg-ui-bg-tertiary text-ui-text-secondary shadow-none",
      issueCard:
        "rounded-container border-ui-border bg-ui-bg-soft p-1.25 shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-ring focus-within:ring-offset-2 sm:p-3",
      issueCardSelected:
        "rounded-container border-brand-indigo-border/60 bg-brand-indigo-track p-1.25 shadow-soft focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-ring focus-within:ring-offset-2 sm:p-3",
      issueCardFocused:
        "rounded-container border-ui-border-focus/50 bg-ui-bg-hover p-1.25 shadow-none ring-1 ring-ui-border-focus/20 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-ring focus-within:ring-offset-2 sm:p-3",
      versionHistoryComparePanel: "rounded-2xl border-brand-ring/40 bg-brand-subtle/20 shadow-none",
      versionHistoryEntry:
        "rounded-container border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-elevated/98 via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-soft",
      versionHistoryEntrySelected:
        "rounded-container border-brand-ring bg-brand-subtle shadow-soft",
      versionHistoryDiffPane: "rounded-xl border-ui-border-secondary/70 bg-ui-bg shadow-none",
      mentionMenu:
        "overflow-hidden rounded-container border-ui-border-secondary bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/70 shadow-lg",
      mentionInputMenu:
        "absolute left-0 top-full z-50 mt-1 min-w-52 max-w-xs overflow-hidden rounded-container border-ui-border-secondary bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/70 shadow-lg",
      floatingWidget: "overflow-hidden rounded-container border-ui-border bg-ui-bg shadow-elevated",
      floatingToolbar:
        "rounded-full border-ui-border/75 bg-ui-bg-elevated/96 shadow-soft backdrop-blur-sm sm:rounded-2xl sm:border-ui-border/70 sm:bg-ui-bg-elevated sm:backdrop-blur-0",
      timerStripActive:
        "rounded-full border-brand-indigo-border/70 bg-linear-to-r from-brand-indigo-track via-brand-indigo-track to-brand-indigo-bg/70 shadow-soft backdrop-blur-sm",
      bulkActionBar:
        "border-x-0 border-b-0 border-t border-ui-border bg-ui-bg-elevated shadow-elevated",
    },
  },
});

type CardRecipe = NonNullable<VariantProps<typeof cardRecipeVariants>["recipe"]>;

function getCardRecipeClassName(recipe: CardRecipe) {
  return cardRecipeVariants({ recipe });
}

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    VariantProps<typeof cardRecipeVariants> {}

/**
 * Card container component for grouping related content.
 *
 * @example
 * // Basic card
 * <Card>Content here</Card>
 *
 * // Hoverable clickable card
 * <Card hoverable onClick={() => {}}>Clickable</Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hoverable = false,
      variant = "default",
      recipe,
      padding,
      radius,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const interactiveProps = onClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick,
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          },
        }
      : {};

    const resolvedVariant = recipe ? "ghost" : variant;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ hoverable, variant: resolvedVariant, padding, radius }),
          cardRecipeVariants({ recipe }),
          className,
        )}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    // Support both structured props and children
    if (children) {
      return (
        <Flex ref={ref} direction="column" gap="xs" className={cn("p-6", className)} {...props}>
          {children}
        </Flex>
      );
    }

    return (
      <Flex
        ref={ref}
        align="center"
        justify="between"
        className={cn("p-4 border-b border-ui-border", className)}
        {...props}
      >
        <Flex direction="column" gap="xs">
          {title && (
            <Typography variant="h4" as="h3" className="text-lg font-semibold">
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="muted" className="text-sm">
              {description}
            </Typography>
          )}
        </Flex>
        {action && <Flex>{action}</Flex>}
      </Flex>
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, color: _color, ...props }, ref) => (
    <Typography
      ref={ref}
      as="h3"
      variant="h4"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </Typography>
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, color: _color, ...props }, ref) => (
  <Typography ref={ref} variant="muted" className={cn("text-sm", className)} {...props}>
    {children}
  </Typography>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

// Alias for backward compatibility
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4", className)} {...props} />,
);
CardBody.displayName = "CardBody";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Flex ref={ref} align="center" className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardBody,
  CardFooter,
  cardVariants,
  cardRecipeVariants,
  getCardRecipeClassName,
};
