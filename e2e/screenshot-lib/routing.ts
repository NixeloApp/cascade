/**
 * Screenshot routing — maps page identifiers to spec folders and filenames.
 *
 * Contains the pattern tables that determine where each screenshot is saved
 * (spec folder, filename suffix, modal spec slug) based on the page ID.
 */

import { ROUTES } from "../../convex/shared/routes";
import { routePattern } from "../utils/routes";
import type { CaptureTarget } from "./config";
import { PAGE_TO_SPEC_FOLDER } from "./config";

// ---------------------------------------------------------------------------
// Dynamic page patterns (regex → spec folder + filename suffix)
// ---------------------------------------------------------------------------

export const DYNAMIC_PAGE_PATTERNS: Array<[RegExp, string, string]> = [
  [/^empty-workspaces$/, "27-workspaces", "-empty"],
  [/^empty-my-issues$/, "20-my-issues", "-empty"],
  // Public pages with suffixes
  [/^public-verify-2fa$/, "02-signin", "-verify-2fa"],
  [/^public-signup-verify$/, "03-signup", "-verify"],
  [/^public-forgot-password-reset$/, "04-forgot-password", "-reset"],
  // Dashboard modals
  [/^filled-dashboard-omnibox$/, "04-dashboard", "-omnibox"],
  [/^filled-dashboard-customize-modal$/, "04-dashboard", "-customize-modal"],
  [/^filled-dashboard-advanced-search-modal$/, "04-dashboard", "-advanced-search-modal"],
  [/^filled-dashboard-shortcuts-modal$/, "04-dashboard", "-shortcuts-modal"],
  [/^filled-dashboard-time-entry-modal$/, "04-dashboard", "-time-entry-modal"],
  [/^filled-dashboard-loading-skeletons$/, "04-dashboard", "-loading-skeletons"],
  // Project & issue modals
  [/^filled-projects-create-project-modal$/, "05-projects", "-create-project-modal"],
  [/^filled-issues-side-panel$/, "19-issues", "-side-panel"],
  [/^filled-issues-search-filtered$/, "19-issues", "-search-filtered"],
  [/^filled-issues-search-empty$/, "19-issues", "-search-empty"],
  [/^filled-issues-filter-active$/, "19-issues", "-filter-active"],
  [/^filled-issues-create-modal$/, "19-issues", "-create-modal"],
  [/^filled-issues-loading$/, "19-issues", "-loading"],
  [/^filled-my-issues-filter-active$/, "20-my-issues", "-filter-active"],
  [/^filled-my-issues-filtered-empty$/, "20-my-issues", "-filtered-empty"],
  [/^filled-my-issues-loading$/, "20-my-issues", "-loading"],
  // Workspace modals
  [/^filled-workspaces-create-workspace-modal$/, "27-workspaces", "-create-workspace-modal"],
  [/^filled-workspaces-search-empty$/, "27-workspaces", "-search-empty"],
  [/^filled-workspace-create-team-modal$/, "28-workspace-detail", "-create-team-modal"],
  [/^filled-time-tracking-burn-rate$/, "22-time-tracking", "-burn-rate"],
  [/^filled-time-tracking-rates$/, "22-time-tracking", "-rates"],
  [/^filled-time-tracking-empty$/, "22-time-tracking", "-empty"],
  [/^filled-time-tracking-all-time$/, "22-time-tracking", "-all-time"],
  [/^filled-time-tracking-truncated$/, "22-time-tracking", "-truncated"],
  [/^filled-time-tracking-manual-entry-modal$/, "22-time-tracking", "-manual-entry-modal"],
  // Settings pages
  [/^filled-settings-profile-avatar-upload-modal$/, "12-settings", "-profile-avatar-upload-modal"],
  [/^filled-settings-profile-cover-upload-modal$/, "12-settings", "-profile-cover-upload-modal"],
  [/^filled-settings-integrations$/, "12-settings", "-integrations"],
  [/^filled-settings-admin$/, "12-settings", "-admin"],
  [/^filled-settings-notifications$/, "12-settings", "-notifications"],
  [/^filled-settings-security$/, "12-settings", "-security"],
  [/^filled-settings-apikeys$/, "12-settings", "-api-keys"],
  [/^filled-settings-preferences$/, "12-settings", "-preferences"],
  [/^filled-settings-offline$/, "12-settings", "-offline"],
  [
    /^filled-settings-notifications-permission-denied$/,
    "12-settings",
    "-notifications-permission-denied",
  ],
  // Notifications
  [/^filled-notification-popover$/, "21-notifications", "-popover"],
  [/^filled-notification-snooze-popover$/, "21-notifications", "-snooze-popover"],
  [/^filled-notifications-archived$/, "21-notifications", "-archived"],
  [/^filled-notifications-filter-active$/, "21-notifications", "-filter-active"],
  [/^filled-notifications-inbox-empty$/, "21-notifications", "-inbox-empty"],
  [/^filled-notifications-archived-empty$/, "21-notifications", "-archived-empty"],
  [/^filled-notifications-mark-all-read-loading$/, "21-notifications", "-mark-all-read-loading"],
  [/^filled-notifications-unread-overflow$/, "21-notifications", "-unread-overflow"],
  // Documents
  [/^empty-documents-templates$/, "09-documents", "-templates-empty"],
  [/^filled-documents-templates$/, "09-documents", "-templates"],
  [/^filled-documents-search-filtered$/, "09-documents", "-search-filtered"],
  [/^filled-documents-search-empty$/, "09-documents", "-search-empty"],
  // Meetings
  [/^filled-meetings-detail$/, "30-meetings", "-detail"],
  [/^filled-meetings-transcript-search$/, "30-meetings", "-transcript-search"],
  [/^filled-meetings-memory-lens$/, "30-meetings", "-memory-lens"],
  [/^filled-meetings-processing$/, "30-meetings", "-processing"],
  [/^filled-meetings-filter-empty$/, "30-meetings", "-filter-empty"],
  [/^filled-meetings-schedule-dialog$/, "30-meetings", "-schedule-dialog"],
  // Outreach
  [/^filled-outreach-sequences$/, "41-outreach", "-sequences"],
  [/^filled-outreach-contacts$/, "41-outreach", "-contacts"],
  [/^filled-outreach-mailboxes$/, "41-outreach", "-mailboxes"],
  [/^filled-outreach-analytics$/, "41-outreach", "-analytics"],
  [/^filled-outreach-contact-dialog$/, "41-outreach", "-contact-dialog"],
  [/^filled-outreach-import-dialog$/, "41-outreach", "-import-dialog"],
  [/^filled-outreach-sequence-dialog$/, "41-outreach", "-sequence-dialog"],
  [/^filled-outreach-enroll-dialog$/, "41-outreach", "-enroll-dialog"],
  [/^filled-outreach-mailbox-disconnect-confirm$/, "41-outreach", "-mailbox-disconnect-confirm"],
  // Misc filled states
  [/^filled-project-tree$/, "29-team-detail", "-project-tree"],
  [/^filled-mobile-hamburger$/, "04-dashboard", "-mobile-hamburger"],
  // Project board
  [/^filled-project-.+-board$/, "06-board", ""],
  [/^filled-project-.+-create-issue-modal$/, "06-board", "-create-issue-modal"],
  [
    /^filled-project-.+-create-issue-draft-restoration$/,
    "06-board",
    "-create-issue-draft-restoration",
  ],
  // Project backlog
  [/^filled-project-.+-backlog$/, "07-backlog", ""],
  // Project sprints
  [/^filled-project-.+-sprints$/, "18-sprints", ""],
  [/^filled-project-.+-sprints-burndown$/, "18-sprints", "-burndown"],
  [/^filled-project-.+-sprints-burnup$/, "18-sprints", "-burnup"],
  [/^filled-project-.+-sprints-completion-modal$/, "18-sprints", "-completion-modal"],
  [/^filled-project-.+-sprints-date-overlap-warning$/, "18-sprints", "-date-overlap-warning"],
  [/^filled-project-.+-sprints-workload$/, "18-sprints", "-workload"],
  // Issue detail
  [/^filled-issue-/, "08-issue", ""],
  [/^filled-project-.+-issue-detail-modal$/, "08-issue", "-detail-modal"],
  [
    /^filled-project-.+-issue-detail-modal-inline-editing$/,
    "08-issue",
    "-detail-modal-inline-editing",
  ],
  [/^filled-project-.+-import-export-modal$/, "06-board", "-import-export-modal"],
  [/^filled-project-.+-import-export-modal-import$/, "06-board", "-import-export-modal-import"],
  // Board interactive states
  [/^filled-project-.+-board-swimlane-(\w+)$/, "06-board", "-swimlane-$1"],
  [/^filled-project-.+-board-column-collapsed$/, "06-board", "-column-collapsed"],
  [/^filled-project-.+-board-empty-column$/, "06-board", "-empty-column"],
  [/^filled-project-.+-board-wip-limit-warning$/, "06-board", "-wip-limit-warning"],
  [/^filled-project-.+-board-filter-active$/, "06-board", "-filter-active"],
  [/^filled-project-.+-board-display-properties$/, "06-board", "-display-properties"],
  [/^filled-project-.+-board-peek-mode$/, "06-board", "-peek-mode"],
  [/^filled-project-.+-board-sprint-selector$/, "06-board", "-sprint-selector"],
  [
    /^filled-project-.+-create-issue-duplicate-detection$/,
    "06-board",
    "-create-issue-duplicate-detection",
  ],
  [/^filled-project-.+-create-issue-create-another$/, "06-board", "-create-issue-create-another"],
  [/^filled-project-.+-create-issue-validation$/, "06-board", "-create-issue-validation"],
  [/^filled-project-.+-create-issue-success-toast$/, "06-board", "-create-issue-success-toast"],
  // Document editor
  [/^filled-document-editor$/, "10-editor", ""],
  [/^filled-document-editor-move-dialog$/, "10-editor", "-move-dialog"],
  [/^filled-document-editor-markdown-preview-modal$/, "10-editor", "-markdown-preview-modal"],
  [/^filled-document-editor-favorite$/, "10-editor", "-favorite"],
  [/^filled-document-editor-sidebar-favorites$/, "10-editor", "-sidebar-favorites"],
  [/^filled-document-editor-locked$/, "10-editor", "-locked"],
  [/^filled-document-editor-rich-blocks$/, "10-editor", "-rich-blocks"],
  [/^filled-document-editor-color-picker$/, "10-editor", "-color-picker"],
  [/^filled-document-editor-slash-menu$/, "10-editor", "-slash-menu"],
  [/^filled-document-editor-floating-toolbar$/, "10-editor", "-floating-toolbar"],
  [/^filled-document-editor-mention-popover$/, "10-editor", "-mention-popover"],
  // Calendar views
  [/^filled-project-.+-calendar$/, "11-calendar", ""],
  [/^filled-calendar-(day|week|month)$/, "11-calendar", "-$1"],
  [/^filled-calendar-event-modal$/, "11-calendar", "-event-modal"],
  [/^filled-calendar-create-event-modal$/, "11-calendar", "-create-event-modal"],
  [/^filled-calendar-drag-and-drop$/, "11-calendar", "-drag-and-drop"],
  [/^filled-calendar-quick-add$/, "11-calendar", "-quick-add"],
  // Org and project analytics, members, settings
  [/^filled-org-analytics-sparse-data$/, "24-org-analytics", "-sparse-data"],
  [/^filled-org-analytics-no-activity$/, "24-org-analytics", "-no-activity"],
  [/^filled-project-.+-analytics-sparse-data$/, "13-analytics", "-sparse-data"],
  [/^filled-project-.+-analytics-no-activity$/, "13-analytics", "-no-activity"],
  [/^filled-project-.+-analytics$/, "13-analytics", ""],
  [/^filled-project-.+-members$/, "17-members", ""],
  [/^filled-project-.+-members-confirm-dialog$/, "17-members", "-confirm-dialog"],
  [
    /^filled-project-.+-settings-delete-alert-dialog$/,
    "12-settings",
    "-project-delete-alert-dialog",
  ],
  [/^filled-project-.+-settings$/, "12-settings", "-project"],
  // Workspace sub-pages (specific patterns before catch-all)
  [/^filled-workspace-.+-backlog$/, "28-workspace-detail", "-backlog"],
  [/^filled-workspace-.+-calendar$/, "28-workspace-detail", "-calendar"],
  [/^filled-workspace-.+-sprints$/, "28-workspace-detail", "-sprints"],
  [/^filled-workspace-.+-dependencies$/, "28-workspace-detail", "-dependencies"],
  [/^filled-workspace-.+-wiki$/, "28-workspace-detail", "-wiki"],
  [/^filled-workspace-.+-settings$/, "28-workspace-detail", "-settings"],
  [/^filled-workspace-.+$/, "28-workspace-detail", ""],
  // Team sub-pages (specific patterns before catch-all)
  [/^filled-team-.+-board$/, "29-team-detail", "-board"],
  [/^filled-team-.+-calendar$/, "29-team-detail", "-calendar"],
  [/^filled-team-.+-wiki$/, "29-team-detail", "-wiki"],
  [/^filled-team-.+-settings$/, "29-team-detail", "-settings"],
  [/^filled-team-.+$/, "29-team-detail", ""],
  // Project roadmap, activity, billing, timesheet, inbox
  [/^filled-project-.+-roadmap$/, "35-roadmap", ""],
  [/^filled-project-.+-roadmap-timeline-selector$/, "35-roadmap", "-timeline-selector"],
  [/^filled-project-.+-roadmap-grouped$/, "35-roadmap", "-grouped"],
  [/^filled-project-.+-roadmap-detail$/, "35-roadmap", "-detail"],
  [/^filled-project-.+-roadmap-empty$/, "35-roadmap", "-empty"],
  [/^filled-project-.+-roadmap-milestone$/, "35-roadmap", "-milestone"],
  [/^filled-project-.+-activity$/, "36-activity", ""],
  [/^filled-project-.+-billing$/, "37-billing", ""],
  [/^filled-project-.+-timesheet$/, "38-timesheet", ""],
  [/^filled-project-.+-inbox-closed$/, "39-project-inbox", "-closed"],
  [/^filled-project-.+-inbox-bulk-selection$/, "39-project-inbox", "-bulk-selection"],
  [/^filled-project-.+-inbox-snooze-menu$/, "39-project-inbox", "-snooze-menu"],
  [/^filled-project-.+-inbox-decline-dialog$/, "39-project-inbox", "-decline-dialog"],
  [/^filled-project-.+-inbox-duplicate-dialog$/, "39-project-inbox", "-duplicate-dialog"],
  [/^filled-project-.+-inbox-open-empty$/, "39-project-inbox", "-open-empty"],
  [/^filled-project-.+-inbox-closed-empty$/, "39-project-inbox", "-closed-empty"],
  [/^filled-project-.+-inbox$/, "39-project-inbox", ""],
];

// ---------------------------------------------------------------------------
// Modal spec patterns (regex → modal spec slug for dual output)
// ---------------------------------------------------------------------------

export const MODAL_SPEC_PATTERNS: Array<[RegExp, string]> = [
  [/^filled-settings-profile-avatar-upload-modal$/, "avatar-upload"],
  [/^filled-settings-profile-cover-upload-modal$/, "cover-image-upload"],
  [/^filled-project-.+-settings-delete-alert-dialog$/, "alert-dialog"],
  [/^filled-dashboard-omnibox$/, "command-palette"],
  [/^filled-project-.+-members-confirm-dialog$/, "confirm-dialog"],
  [/^filled-dashboard-customize-modal$/, "dashboard-customize"],
  [/^filled-document-editor-move-dialog$/, "move-document"],
  [/^filled-document-editor-markdown-preview-modal$/, "markdown-preview"],
  [/^filled-project-.+-create-issue-modal$/, "create-issue"],
  [/^filled-calendar-create-event-modal$/, "create-event"],
];

// ---------------------------------------------------------------------------
// Resolution functions
// ---------------------------------------------------------------------------

/** Resolve a page capture to its spec folder, filename suffix, and modal spec. */
export function resolveCaptureTarget(prefix: string, name: string): CaptureTarget {
  const pageId = `${prefix}-${name}`;

  let specFolder = PAGE_TO_SPEC_FOLDER[pageId] ?? null;
  let filenameSuffix = "";

  if (!specFolder) {
    for (const [pattern, folder, suffix] of DYNAMIC_PAGE_PATTERNS) {
      if (pattern.test(pageId)) {
        specFolder = folder;
        const match = pageId.match(pattern);
        filenameSuffix = suffix.replace("$1", match?.[1] ?? "");
        break;
      }
    }
  }

  let modalSpecSlug: string | null = null;
  for (const [pattern, slug] of MODAL_SPEC_PATTERNS) {
    if (pattern.test(pageId)) {
      modalSpecSlug = slug;
      break;
    }
  }

  return { pageId, specFolder, filenameSuffix, modalSpecSlug };
}

/** Get the list of all spec folders that could receive screenshots. */
export function getGeneratedSpecFolders(): string[] {
  return [
    ...new Set([
      ...Object.values(PAGE_TO_SPEC_FOLDER),
      ...DYNAMIC_PAGE_PATTERNS.map(([, folder]) => folder),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// Pre-compiled URL patterns for readiness dispatch
// ---------------------------------------------------------------------------

/**
 * Pre-compiled URL patterns derived from ROUTES. Each converts the route path
 * (e.g. "/$orgSlug/projects/$key/board") into a regex that matches URLs with
 * concrete segments in place of dynamic params.
 */
export const URL_PATTERNS = {
  projectBoard: routePattern(ROUTES.projects.board.path, "$"),
  projectBacklog: routePattern(ROUTES.projects.backlog.path, "$"),
  projectCalendar: routePattern(ROUTES.projects.calendar.path, "$"),
  projectActivity: routePattern(ROUTES.projects.activity.path, "$"),
  projectAnalytics: routePattern(ROUTES.projects.analytics.path, "$"),
  projectTimesheet: routePattern(ROUTES.projects.timesheet.path, "$"),
  projectSprints: routePattern(ROUTES.projects.sprints.path, "$"),
  projectRoadmap: routePattern(ROUTES.projects.roadmap.path, "$"),
  projectBilling: routePattern(ROUTES.projects.billing.path, "$"),
  projectSettings: routePattern(ROUTES.projects.settings.path, "$"),
  projectInbox: routePattern(ROUTES.projects.inbox.path, "$"),
  dashboard: routePattern(ROUTES.dashboard.path, "$"),
  settings: routePattern(ROUTES.settings.profile.path, "$"),
  projects: routePattern(ROUTES.projects.list.path, "\\/?$"),
  issues: routePattern(ROUTES.issues.list.path, "\\/?$"),
  issueDetail: routePattern(ROUTES.issues.detail.path, "$"),
  workspaces: routePattern(ROUTES.workspaces.list.path, "\\/?$"),
  timeTracking: routePattern(ROUTES.timeTracking.path, "$"),
  notifications: routePattern(ROUTES.notifications.path, "\\/?$"),
  myIssues: routePattern(ROUTES.myIssues.path, "\\/?$"),
  orgCalendar: routePattern(ROUTES.calendar.path, "\\/?$"),
  analytics: routePattern(ROUTES.analytics.path, "\\/?$"),
  invoices: routePattern(ROUTES.invoices.list.path, "\\/?$"),
  clients: routePattern(ROUTES.clients.list.path, "\\/?$"),
  meetings: routePattern(ROUTES.meetings.path, "\\/?$"),
  outreach: routePattern(ROUTES.outreach.path, "\\/?$"),
  workspaceDetail: routePattern(ROUTES.workspaces.detail.path, "\\/?$"),
  workspaceSettings: routePattern(ROUTES.workspaces.settings.path, "$"),
  workspaceBacklog: routePattern(ROUTES.workspaces.backlog.path, "$"),
  workspaceCalendar: routePattern(ROUTES.workspaces.calendar.path, "$"),
  workspaceSprints: routePattern(ROUTES.workspaces.sprints.path, "$"),
  workspaceDependencies: routePattern(ROUTES.workspaces.dependencies.path, "$"),
  workspaceWiki: routePattern(ROUTES.workspaces.wiki.path, "$"),
  teamDetail: routePattern(ROUTES.workspaces.teams.detail.path, "\\/?$"),
  teamBoard: routePattern(ROUTES.workspaces.teams.board.path, "$"),
  teamCalendar: routePattern(ROUTES.workspaces.teams.calendar.path, "$"),
  teamSettings: routePattern(ROUTES.workspaces.teams.settings.path, "$"),
  teamWiki: routePattern(ROUTES.workspaces.teams.wiki.path, "$"),
  documentEditor: routePattern(ROUTES.documents.detail.path, "$"),
  documentTemplates: routePattern(ROUTES.documents.templates.path, "$"),
};
