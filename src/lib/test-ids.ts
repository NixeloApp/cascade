/**
 * Shared Test IDs for E2E Tests and Components
 *
 * This file is the single source of truth for all data-testid values.
 * It is imported by both:
 * - Production components: `data-testid={TEST_IDS.ISSUE.CARD}`
 * - E2E tests: `page.getByTestId(TEST_IDS.ISSUE.CARD)`
 *
 * RULES:
 * 1. Every ID here must be used in a component's data-testid attribute
 * 2. Use semantic names that describe WHAT the element is
 * 3. Group by feature/domain
 * 4. Values are kebab-case strings (e.g., 'issue-card')
 */

export const TEST_IDS = {
  // ============================================================
  // Issues & Board
  // ============================================================

  ISSUE: {
    /** @see src/components/IssueCard.tsx */
    CARD: "issue-card",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    CREATE_TRIGGER: "issue-create-trigger",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_MODAL: "issue-create-modal",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_TITLE_INPUT: "issue-create-title-input",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_DESCRIPTION_EDITOR: "issue-create-description-editor",
    /** @see src/components/IssueCard.tsx */
    DRAG_HANDLE: "issue-drag-handle",
    /** @see src/components/IssueCard.tsx */
    TITLE: "issue-title",
    /** @see src/components/IssueCard.tsx */
    KEY: "issue-key",
    /** @see src/components/IssueCard.tsx */
    PRIORITY: "issue-priority",
    /** @see src/components/IssueCard.tsx */
    ASSIGNEE: "issue-assignee",
    /** @see src/components/IssueDetailModal.tsx */
    DETAIL_MODAL: "issue-detail-modal",
    /** @see src/components/IssueDetail/IssueDetailContent.tsx */
    DESCRIPTION_EDITOR: "issue-description-editor",
    /** @see src/components/IssueDetail/IssueDetailContent.tsx */
    DESCRIPTION_CONTENT: "issue-description-content",
  },

  BOARD: {
    /** @see src/components/KanbanBoard.tsx */
    ROOT: "project-board",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN: "board-column",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN_HEADER: "board-column-header",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN_COUNT: "board-column-count",
  },

  // ============================================================
  // Workspaces & Teams
  // ============================================================

  WORKSPACE: {
    /** @see src/components/WorkspaceCard.tsx */
    CARD: "workspace-card",
    /** @see src/components/WorkspaceCard.tsx */
    NAME: "workspace-name",
  },

  // ============================================================
  // Navigation & Layout
  // ============================================================

  NAV: {
    /** @see src/components/ui/Logo.tsx */
    BRAND_LOGO: "brand-logo",
    /** @see src/components/Sidebar.tsx */
    SIDEBAR: "sidebar",
    /** @see src/components/App/AppSidebar.tsx */
    DASHBOARD_LINK: "sidebar-dashboard-link",
    /** @see src/components/App/AppSidebar.tsx */
    DOCUMENTS_LINK: "sidebar-documents-link",
    /** @see src/components/App/AppSidebar.tsx */
    WORKSPACES_LINK: "sidebar-workspaces-link",
    /** @see src/components/App/AppSidebar.tsx */
    TIMESHEET_LINK: "sidebar-timesheet-link",
    /** @see src/components/App/AppSidebar.tsx */
    CALENDAR_LINK: "sidebar-calendar-link",
    /** @see src/components/App/AppSidebar.tsx */
    SETTINGS_LINK: "sidebar-settings-link",
    /** @see src/components/App/AppSidebar.tsx */
    DOCUMENT_LIST: "sidebar-document-list",
    /** @see src/components/App/AppSidebar.tsx */
    DOCUMENT_ITEM: "sidebar-document-item",
    /** @see src/components/App/AppSidebar.tsx */
    WORKSPACE_LIST: "sidebar-workspace-list",
    /** @see src/components/App/AppSidebar.tsx */
    WORKSPACE_ITEM: "sidebar-workspace-item",
    /** @see src/routes/__root.tsx */
    MAIN_CONTENT: "main-content",
  },

  // ============================================================
  // Header Actions
  // ============================================================

  HEADER: {
    /** @see src/components/NotificationCenter.tsx */
    NOTIFICATION_BUTTON: "header-notification-button",
    /** @see src/components/NotificationCenter.tsx */
    NOTIFICATION_PANEL: "header-notification-panel",
    /** @see src/components/CommandPalette.tsx */
    COMMAND_PALETTE_BUTTON: "header-command-palette-button",
    /** @see src/components/GlobalSearch.tsx */
    SEARCH_BUTTON: "header-search-button",
    /** @see src/components/Header.tsx */
    SHORTCUTS_BUTTON: "header-shortcuts-button",
    /** @see src/components/UserMenu.tsx */
    USER_MENU_BUTTON: "header-user-menu-button",
  },

  // ============================================================
  // Toasts & Feedback
  // ============================================================

  TOAST: {
    /** @see src/lib/toast.ts */
    SUCCESS: "toast-success",
    /** @see src/lib/toast.ts */
    ERROR: "toast-error",
    /** @see src/lib/toast.ts */
    INFO: "toast-info",
  },

  // ============================================================
  // Search
  // ============================================================

  SEARCH: {
    /** @see src/components/GlobalSearch.tsx */
    MODAL: "search-modal",
    /** @see src/components/AdvancedSearchModal.tsx */
    ADVANCED_MODAL: "search-advanced-modal",
    /** @see src/components/GlobalSearch.tsx */
    INPUT: "search-input",
    /** @see src/components/GlobalSearch.tsx */
    RESULTS_GROUP: "search-results-group",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_ITEM: "search-result-item",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_TYPE: "search-result-type",
    /** @see src/components/GlobalSearch.tsx */
    LOADING_STATE: "search-loading-state",
    /** @see src/components/GlobalSearch.tsx */
    MIN_QUERY_MESSAGE: "search-min-query-message",
    /** @see src/components/GlobalSearch.tsx */
    TAB_ALL: "search-tab-all",
    /** @see src/components/GlobalSearch.tsx */
    TAB_ISSUES: "search-tab-issues",
    /** @see src/components/GlobalSearch.tsx */
    TAB_DOCUMENTS: "search-tab-documents",
  },

  // ============================================================
  // Projects
  // ============================================================

  PROJECT: {
    /** @see src/components/CreateProjectFromTemplate.tsx */
    CREATE_MODAL: "create-project-modal",
    /** @see src/components/CreateProjectFromTemplate.tsx */
    NAME_INPUT: "project-name-input",
    /** @see src/components/CreateProjectFromTemplate.tsx */
    KEY_INPUT: "project-key-input",
  },

  // ============================================================
  // Auth
  // ============================================================

  AUTH: {
    /** @see src/components/Auth/SignInForm.tsx */
    EMAIL_INPUT: "auth-email-input",
    /** @see src/components/Auth/SignInForm.tsx */
    PASSWORD_INPUT: "auth-password-input",
    /** @see src/components/Auth/SignInForm.tsx */
    SUBMIT_BUTTON: "auth-submit-button",
    /** @see src/components/Auth/SignInForm.tsx */
    FORM: "auth-form",
    /** @see src/components/Auth/SignInForm.tsx */
    EMAIL_FORM: "auth-email-form",
    /** @see src/components/Auth/SignInForm.tsx */
    FORM_READY: "auth-form-ready",
    /** @see src/components/Auth/SignInForm.tsx */
    FORM_HYDRATED: "auth-form-hydrated",
    /** @see src/components/auth/GoogleAuthButton.tsx */
    GOOGLE_BUTTON: "auth-google-button",
    /** @see src/components/Auth/EmailVerificationForm.tsx */
    VERIFICATION_CODE_INPUT: "auth-verification-code-input",
    /** @see src/components/Auth/EmailVerificationForm.tsx */
    VERIFICATION_SUBMIT_BUTTON: "auth-verification-submit-button",
    /** @see src/components/Auth/ResetPasswordForm.tsx */
    RESET_CODE_INPUT: "auth-reset-code-input",
    /** @see src/components/Auth/ResetPasswordForm.tsx */
    RESET_PASSWORD_INPUT: "auth-reset-password-input",
    /** @see src/components/Auth/ResetPasswordForm.tsx */
    RESET_SUBMIT_BUTTON: "auth-reset-submit-button",
  },

  // ============================================================
  // Editor
  // ============================================================

  EDITOR: {
    /** @see src/components/PlateEditor.tsx */
    PLATE: "plate-editor",
    /** @see src/components/CommandPalette.tsx */
    COMMAND_PALETTE: "command-palette",
  },

  // ============================================================
  // Calendar
  // ============================================================

  CALENDAR: {
    /** @see src/components/Calendar/CalendarView.tsx */
    ROOT: "calendar-root",
    /** @see src/components/Calendar/shadcn-calendar/body/calendar-body.tsx */
    GRID: "calendar-grid",
    /** @see src/components/Calendar/shadcn-calendar/calendar-event.tsx */
    EVENT_ITEM: "calendar-event-item",
    /** @see src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx */
    DAY_CELL: "calendar-day-cell",
    /** @see src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx */
    DAY_CELL_DROP_TARGET: "calendar-day-cell-drop-target",
    /** @see src/components/Calendar/EventDetailsModal.tsx */
    EVENT_DETAILS_MODAL: "calendar-event-details-modal",
    /** @see src/components/Calendar/EventDetailsModal.tsx */
    ATTENDEES_LIST: "calendar-attendees-list",
    /** @see src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx */
    QUICK_ADD_DAY: "calendar-quick-add-day",
    /** @see src/components/Calendar/shadcn-calendar/header/date/calendar-header-date.tsx */
    HEADER_DATE: "calendar-header-date",
    /** @see src/components/Calendar/shadcn-calendar/header/actions/calendar-header-actions-mode.tsx */
    MODE_DAY: "calendar-mode-day",
    MODE_WEEK: "calendar-mode-week",
    MODE_MONTH: "calendar-mode-month",
  },

  // ============================================================
  // Debug / Dev Tools
  // ============================================================

  DEBUG: {
    /** @see src/components/DevTools.tsx */
    USER_ROLE: "debug-user-role",
  },

  // ============================================================
  // Activity Feed
  // ============================================================

  ACTIVITY: {
    /** @see src/components/ActivityFeed.tsx */
    FEED: "activity-feed",
    /** @see src/components/ActivityFeed.tsx */
    ENTRY: "activity-entry",
    /** @see src/components/ActivityFeed.tsx - shown when no activity */
    EMPTY_STATE: "activity-empty-state",
    /** @see src/components/ActivityFeed.tsx - relative timestamp on each entry */
    TIMESTAMP: "activity-timestamp",
  },

  // ============================================================
  // Sprints
  // ============================================================

  SPRINT: {
    /** @see src/components/SprintCard.tsx */
    CARD: "sprint-card",
    /** @see src/components/SprintCard.tsx */
    NAME: "sprint-name",
  },

  ROADMAP: {
    /** @see src/components/RoadmapView.tsx */
    TIMELINE_CANVAS: "roadmap-timeline-canvas",
    /** @see src/components/RoadmapView.tsx */
    ISSUE_HEADER: "roadmap-issue-header",
    /** @see src/components/RoadmapView.tsx */
    ISSUE_COLUMN: "roadmap-issue-column",
    /** @see src/components/RoadmapView.tsx */
    DEPENDENCY_PANEL: "roadmap-dependency-panel",
    /** @see src/components/RoadmapView.tsx */
    TODAY_MARKER_HEADER: "roadmap-today-marker-header",
    /** @see src/components/RoadmapView.tsx */
    TODAY_MARKER_BODY: "roadmap-today-marker-body",
    /** @see src/components/RoadmapView.tsx */
    RANGE_LABEL: "roadmap-range-label",
  },

  // ============================================================
  // Analytics
  // ============================================================

  ANALYTICS: {
    /** @see src/components/AnalyticsDashboard.tsx */
    CARD: "analytics-card",
    /** @see src/routes/_app.$orgSlug.projects.$projectKey.analytics.tsx */
    PAGE: "analytics-page",
    /** Metric card labels */
    METRIC_TOTAL_ISSUES: "analytics-metric-total-issues",
    METRIC_UNASSIGNED: "analytics-metric-unassigned",
    METRIC_AVG_VELOCITY: "analytics-metric-avg-velocity",
    METRIC_COMPLETED_SPRINTS: "analytics-metric-completed-sprints",
  },

  // ============================================================
  // Search (Global Search)
  // ============================================================

  GLOBAL_SEARCH: {
    /** @see src/components/GlobalSearch.tsx */
    NO_RESULTS: "search-no-results",
  },

  // ============================================================
  // Loading States
  // ============================================================

  LOADING: {
    /** @see src/components/ui/LoadingSpinner.tsx */
    SPINNER: "loading-spinner",
    /** @see src/components/ui/Skeleton.tsx */
    SKELETON: "loading-skeleton",
  },

  // ============================================================
  // Notifications
  // ============================================================

  NOTIFICATION: {
    /** @see src/components/Notifications/NotificationItem.tsx */
    ITEM: "notification-item",
  },

  // ============================================================
  // Settings
  // ============================================================

  SETTINGS: {
    /** @see src/routes/_app.$orgSlug.settings.tsx */
    ORG_TAB: "settings-org-tab",
    /** @see src/components/Admin/OrganizationSettings.tsx */
    TIME_APPROVAL_SWITCH: "settings-time-approval-switch",
    /** @see src/components/Admin/OrganizationSettings.tsx */
    SAVE_BUTTON: "settings-save-button",
    /** @see src/components/Settings/GitHubIntegration.tsx */
    GITHUB_INTEGRATION: "settings-github-integration",
    /** @see src/components/Settings/GoogleCalendarIntegration.tsx */
    GOOGLE_CALENDAR_INTEGRATION: "settings-google-calendar-integration",
    /** @see src/components/Settings/PumbleIntegration.tsx */
    PUMBLE_INTEGRATION: "settings-pumble-integration",
    /** @see src/components/Settings/ApiKeysManager.tsx */
    API_KEYS_SECTION: "settings-api-keys-section",
    /** @see src/components/Settings/TwoFactorSettings.tsx */
    TWO_FACTOR_SECTION: "settings-two-factor-section",
    /** @see src/components/Settings/DevToolsTab.tsx */
    DEVTOOLS_SECTION: "settings-devtools-section",
    /** @see src/components/Settings/OfflineTab.tsx */
    OFFLINE_STATUS_CARD: "settings-offline-status-card",
    /** @see src/components/Settings/NotificationsTab.tsx */
    NOTIFICATION_PREFERENCES_SECTION: "settings-notification-preferences-section",
    /** @see src/components/Admin/UserManagement.tsx */
    USER_MANAGEMENT_SECTION: "settings-user-management-section",
    /** @see src/components/Admin/UserTypeManager.tsx */
    USER_TYPE_MANAGER_SECTION: "settings-user-type-manager-section",
    /** @see src/components/Admin/HourComplianceDashboard.tsx */
    HOUR_COMPLIANCE_SECTION: "settings-hour-compliance-section",
  },

  // ============================================================
  // Invites (User Management)
  // ============================================================

  INVITE: {
    /** @see src/components/Admin/UserManagement.tsx - Email input in invite form */
    EMAIL_INPUT: "invite-email-input",
    /** @see src/components/Admin/UserManagement.tsx - Role select in invite form */
    ROLE_SELECT: "invite-role-select",
    /** @see src/components/Admin/UserManagement.tsx - Send invitation button */
    SEND_BUTTON: "invite-send-button",
    /** @see src/components/Admin/UserManagement.tsx - Invitations table */
    TABLE: "invite-table",
    /** @see src/components/Admin/UserManagement.tsx - Invite row in table */
    ROW: "invite-row",
  },

  // ============================================================
  // Teams
  // ============================================================

  TEAMS: {
    /** @see src/routes/_app.$orgSlug.workspaces.$workspaceSlug.teams.tsx */
    LIST_HEADING: "teams-list-heading",
  },

  // ============================================================
  // Dashboard
  // ============================================================

  DASHBOARD: {
    /** @see src/routes/_app.$orgSlug.dashboard.tsx */
    FEED_HEADING: "dashboard-feed-heading",
  },

  // ============================================================
  // Documents
  // ============================================================

  DOCUMENT: {
    /** @see src/components/DocumentsList.tsx */
    CARD: "document-card",
    /** @see src/components/Documents/DocumentHeader.tsx */
    TITLE: "document-title",
    /** @see src/components/Documents/DocumentHeader.tsx */
    TITLE_INPUT: "document-title-input",
    /** @see src/components/Plate/HeadingElement.tsx */
    HEADING_ANCHOR: "document-heading-anchor",
  },

  // ============================================================
  // Dialog / Modal
  // ============================================================

  DIALOG: {
    /** @see src/components/ui/Dialog.tsx */
    OVERLAY: "dialog-overlay",
  },

  // ============================================================
  // Onboarding
  // ============================================================

  ONBOARDING: {
    /** @see src/routes/_auth/onboarding.tsx - Welcome heading on role select */
    WELCOME_HEADING: "onboarding-welcome-heading",
    /** @see src/components/Onboarding/RoleSelector.tsx - Team Lead role card */
    TEAM_LEAD_CARD: "onboarding-team-lead-card",
    /** @see src/components/Onboarding/RoleSelector.tsx - Team Member role card */
    TEAM_MEMBER_CARD: "onboarding-team-member-card",
    /** @see src/routes/_auth/onboarding.tsx - Skip button in header */
    SKIP_BUTTON: "onboarding-skip-button",
    /** @see src/components/Onboarding/LeadOnboarding.tsx - "Perfect for Team Leads" heading */
    TEAM_LEAD_HEADING: "onboarding-team-lead-heading",
    /** @see src/components/Onboarding/LeadOnboarding.tsx - Setup workspace button */
    SETUP_WORKSPACE_BUTTON: "onboarding-setup-workspace-button",
    /** @see src/components/Onboarding/MemberOnboarding.tsx - "You're ready" heading */
    ALL_SET_HEADING: "onboarding-all-set-heading",
    /** @see src/components/Onboarding/MemberOnboarding.tsx - Go to dashboard button */
    GO_TO_DASHBOARD_BUTTON: "onboarding-go-to-dashboard-button",
    /** @see src/components/Onboarding/LeadOnboarding.tsx - Create project button */
    CREATE_PROJECT_BUTTON: "onboarding-create-project-button",
    /** @see src/components/Onboarding/MemberOnboarding.tsx - Back button */
    BACK_BUTTON: "onboarding-back-button",
    /** @see src/components/Onboarding/MemberOnboarding.tsx - Name your project heading */
    NAME_PROJECT_HEADING: "onboarding-name-project-heading",
  },
} as const;

/** Type helper for accessing TEST_IDS values */
export type TestIdKey = keyof typeof TEST_IDS;
