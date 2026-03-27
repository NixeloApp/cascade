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
  // Page Layout
  // ============================================================

  PAGE: {
    /** @see src/components/layout/PageHeader.tsx */
    HEADER_TITLE: "page-header-title",
    /** @see src/components/layout/PageContent.tsx */
    LOADING_STATE: "page-loading-state",
    /** @see src/components/layout/PageContent.tsx */
    EMPTY_STATE: "page-empty-state",
    /** @see public/offline.html */
    OFFLINE_FALLBACK_HEADING: "offline-fallback-heading",
  },

  // ============================================================
  // Issues & Board
  // ============================================================

  ISSUE: {
    /** @see src/components/IssueCard.tsx */
    CARD: "issue-card",
    /** @see src/routes/_auth/_app/$orgSlug/issues/index.tsx */
    SEARCH_INPUT: "issue-search-input",
    /** @see src/routes/_auth/_app/$orgSlug/issues/index.tsx */
    STATUS_FILTER: "issue-status-filter",
    /** @see src/routes/_auth/_app/$orgSlug/issues/index.tsx */
    PRIORITY_FILTER: "issue-priority-filter",
    /** @see src/routes/_auth/_app/$orgSlug/issues/index.tsx */
    TYPE_FILTER: "issue-type-filter",
    /** @see src/routes/_auth/_app/$orgSlug/issues/index.tsx */
    FILTER_SUMMARY: "issue-filter-summary",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    CREATE_TRIGGER: "issue-create-trigger",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_MODAL: "issue-create-modal",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_TITLE_INPUT: "issue-create-title-input",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_DESCRIPTION_EDITOR: "issue-create-description-editor",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_DRAFT_BANNER: "issue-create-draft-banner",
    /** @see src/components/DuplicateDetection.tsx */
    CREATE_DUPLICATE_DETECTION: "issue-create-duplicate-detection",
    /** @see src/components/IssueDetail/CreateIssueModal.tsx */
    CREATE_ANOTHER_SWITCH: "issue-create-another-switch",
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
    /** @see src/routes/_auth/_app/$orgSlug/issues/$key.tsx */
    EDIT_BUTTON: "issue-edit-button",
    /** @see src/components/IssueDetail/IssueDetailContent.tsx */
    SAVE_BUTTON: "issue-save-button",
  },

  COMMENTS: {
    /** @see src/components/IssueComments.tsx */
    LOADING: "comments-loading",
    /** @see src/components/IssueComments.tsx */
    ADD_BUTTON: "comments-add-button",
    /** @see src/components/IssueComments.tsx */
    SUBMIT_BUTTON: "comments-submit-button",
  },

  BOARD: {
    /** @see src/components/KanbanBoard.tsx */
    ROOT: "project-board",
    /** @see src/components/Kanban/BoardToolbar.tsx */
    TOOLBAR: "project-board-toolbar",
    /** @see src/components/KanbanBoard.tsx */
    LOADING_STATE: "project-board-loading-state",
    /** @see src/components/KanbanBoard.tsx */
    LOADING_COLUMN: "project-board-loading-column",
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
    /** @see src/routes/_auth/_app/$orgSlug/workspaces/index.tsx */
    CREATE_BUTTON: "workspace-create-button",
    /** @see src/components/CreateWorkspaceModal.tsx */
    CREATE_MODAL: "workspace-create-modal",
    /** @see src/components/CreateWorkspaceModal.tsx */
    CREATE_NAME_INPUT: "workspace-create-name-input",
    /** @see src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/index.tsx */
    CREATE_TEAM_BUTTON: "workspace-create-team-button",
    /** @see src/components/CreateTeamModal.tsx */
    CREATE_TEAM_MODAL: "workspace-create-team-modal",
    /** @see src/components/CreateTeamModal.tsx */
    CREATE_TEAM_NAME_INPUT: "workspace-create-team-name-input",
    /** @see src/routes/_auth/_app/$orgSlug/workspaces/index.tsx */
    SEARCH_INPUT: "workspace-search-input",
    /** @see src/routes/_auth/_app/$orgSlug/workspaces/index.tsx */
    SEARCH_EMPTY_STATE: "workspace-search-empty-state",
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
    ISSUES_LINK: "sidebar-issues-link",
    /** @see src/components/App/AppSidebar.tsx */
    MY_ISSUES_LINK: "sidebar-my-issues-link",
    /** @see src/components/App/AppSidebar.tsx */
    INVOICES_LINK: "sidebar-invoices-link",
    /** @see src/components/App/AppSidebar.tsx */
    DOCUMENTS_LINK: "sidebar-documents-link",
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
    /** @see src/components/ProjectsList.tsx */
    CARD: "project-card",
    /** @see src/components/ProjectsList.tsx */
    GRID: "project-grid",
    /** @see src/components/ProjectsList.tsx */
    EMPTY_STATE: "project-empty-state",
    /** @see src/components/ProjectsList.tsx */
    LOADING_STATE: "project-loading-state",
    /** @see src/components/ProjectsList.tsx */
    SINGLE_PROJECT_OVERVIEW: "project-single-project-overview",
    /** @see src/components/ExportButton.tsx */
    IMPORT_EXPORT_TRIGGER: "project-import-export-trigger",
    /** @see src/components/ImportExportModal.tsx */
    IMPORT_EXPORT_MODAL: "project-import-export-modal",
    /** @see src/components/ImportExportModal.tsx */
    IMPORT_EXPORT_MODE_IMPORT: "project-import-export-mode-import",
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
    /** @see src/components/PlateEditor.tsx */
    STARTER_PANEL: "plate-editor-starter-panel",
    /** @see src/components/PlateEditor.tsx */
    HYDRATED_STATE: "plate-editor-hydrated-state",
    /** @see src/components/CommandPalette.tsx */
    COMMAND_PALETTE: "command-palette",
  },

  // ============================================================
  // Calendar
  // ============================================================

  CALENDAR: {
    /** @see src/components/Calendar/CalendarView.tsx */
    ROOT: "calendar-root",
    /** @see src/components/Calendar/shadcn-calendar/header/date/calendar-header-date-chevrons.tsx */
    TODAY_BUTTON: "calendar-today-button",
    /** @see src/components/Calendar/shadcn-calendar/header/date/calendar-header-date-chevrons.tsx */
    PREV_BUTTON: "calendar-prev-button",
    /** @see src/components/Calendar/shadcn-calendar/header/date/calendar-header-date-chevrons.tsx */
    NEXT_BUTTON: "calendar-next-button",
    /** @see src/components/Calendar/CreateEventModal.tsx */
    CREATE_EVENT_MODAL: "calendar-create-event-modal",
    /** @see src/components/Calendar/shadcn-calendar/header/actions/calendar-header-actions-add.tsx */
    CREATE_EVENT_BUTTON: "calendar-create-event-button",
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

  ORG_CALENDAR: {
    /** @see src/routes/_auth/_app/$orgSlug/calendar.tsx */
    CONTENT: "org-calendar-content",
    /** @see src/routes/_auth/_app/$orgSlug/calendar.tsx */
    LOADING_STATE: "org-calendar-loading-state",
    /** @see src/routes/_auth/_app/$orgSlug/calendar.tsx */
    TEAM_FILTER: "org-calendar-team-filter",
    /** @see src/routes/_auth/_app/$orgSlug/calendar.tsx */
    WORKSPACE_FILTER: "org-calendar-workspace-filter",
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
    /** @see src/components/Sprints/CreateSprintForm.tsx */
    CREATE_FORM: "sprint-create-form",
    /** @see src/routes/_app.$orgSlug.projects.$key.sprints.tsx */
    CONTENT: "sprints-content",
    /** @see src/components/Sprints/SprintManager.tsx */
    PAGE_HEADER: "sprints-page-header",
    /** @see src/components/Sprints/SprintManager.tsx */
    CREATE_BUTTON: "sprints-create-button",
    /** @see src/components/Sprints/SprintManager.tsx */
    EMPTY_STATE: "sprints-empty-state",
  },

  ROADMAP: {
    /** @see src/components/RoadmapView.tsx */
    HEADER: "roadmap-header",
    /** @see src/components/Roadmap/RoadmapHeaderControls.tsx */
    HEADER_CONTROLS: "roadmap-header-controls",
    /** @see src/components/RoadmapView.tsx */
    CONTENT: "roadmap-content",
    /** @see src/components/RoadmapView.tsx */
    TIMELINE_CANVAS: "roadmap-timeline-canvas",
    /** @see src/components/RoadmapView.tsx */
    ISSUE_HEADER: "roadmap-issue-header",
    /** @see src/components/RoadmapView.tsx */
    ISSUE_COLUMN: "roadmap-issue-column",
    /** @see src/components/RoadmapView.tsx */
    EMPTY_STATE: "roadmap-empty-state",
    /** @see src/components/RoadmapView.tsx */
    DEPENDENCY_PANEL: "roadmap-dependency-panel",
    /** @see src/components/RoadmapView.tsx */
    DEPENDENCY_LINES: "roadmap-dependency-lines",
    /** @see src/components/RoadmapView.tsx */
    TODAY_MARKER_HEADER: "roadmap-today-marker-header",
    /** @see src/components/RoadmapView.tsx */
    TODAY_MARKER_BODY: "roadmap-today-marker-body",
    /** @see src/components/RoadmapView.tsx */
    RANGE_LABEL: "roadmap-range-label",
    /** @see src/components/Roadmap/RoadmapHeaderControls.tsx */
    GROUP_BY_SELECT: "roadmap-group-by-select",
    /** @see src/components/Roadmap/RoadmapHeaderControls.tsx */
    TIMELINE_SPAN_SELECT: "roadmap-timeline-span-select",
    /** @see src/components/Roadmap/RoadmapHeaderControls.tsx */
    DEPENDENCIES_TOGGLE: "roadmap-dependencies-toggle",
  },

  // ============================================================
  // Analytics
  // ============================================================

  ANALYTICS: {
    /** @see src/components/AnalyticsDashboard.tsx */
    CARD: "analytics-card",
    /** @see src/routes/_app.$orgSlug.projects.$projectKey.analytics.tsx */
    PAGE: "analytics-page",
    /** @see src/routes/_auth/_app/$orgSlug/analytics.tsx */
    ORG_PAGE: "org-analytics-page",
    /** @see src/routes/_auth/_app/$orgSlug/analytics.tsx */
    ORG_PERIOD_SELECT: "org-analytics-period-select",
    /** @see src/components/AnalyticsDashboard.tsx - page header */
    PAGE_HEADER: "analytics-page-header",
    /** @see src/components/AnalyticsDashboard.tsx - page description */
    PAGE_DESCRIPTION: "analytics-page-description",
    /** @see src/components/AnalyticsDashboard.tsx - chart cards */
    CHART_STATUS: "analytics-chart-status",
    CHART_TYPE: "analytics-chart-type",
    CHART_PRIORITY: "analytics-chart-priority",
    CHART_VELOCITY: "analytics-chart-velocity",
    CHART_ASSIGNEE: "analytics-chart-assignee",
    RECENT_ACTIVITY: "analytics-recent-activity",
    /** Metric card labels */
    METRIC_TOTAL_ISSUES: "analytics-metric-total-issues",
    METRIC_UNASSIGNED: "analytics-metric-unassigned",
    METRIC_AVG_VELOCITY: "analytics-metric-avg-velocity",
    METRIC_COMPLETED_SPRINTS: "analytics-metric-completed-sprints",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_METRIC_COMPLETED: "org-analytics-metric-completed",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_METRIC_UNASSIGNED: "org-analytics-metric-unassigned",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_METRIC_PROJECTS: "org-analytics-metric-projects",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_CHART_TYPE: "org-analytics-chart-type",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_CHART_PRIORITY: "org-analytics-chart-priority",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_CHART_PROJECTS: "org-analytics-chart-projects",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_TREND_SECTION: "org-analytics-trend-section",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_PROJECT_BREAKDOWN: "org-analytics-project-breakdown",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_EMPTY_STATE: "org-analytics-empty-state",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_PROJECT_BREAKDOWN_EMPTY: "org-analytics-project-breakdown-empty",
    /** @see src/components/Analytics/OrganizationAnalyticsDashboard.tsx */
    ORG_TRUNCATION_NOTICE: "org-analytics-truncation-notice",
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
    /** @see src/components/Notifications/NotificationItem.tsx */
    ACTIONS: "notification-item-actions",
  },

  // ============================================================
  // Settings
  // ============================================================

  SETTINGS: {
    /** @see src/routes/_app.$orgSlug.settings.tsx */
    ORG_TAB: "settings-org-tab",
    /** @see src/components/Settings.tsx — settings tab trigger prefix, suffixed with tab value */
    TAB_PROFILE: "settings-tab-profile",
    TAB_SECURITY: "settings-tab-security",
    TAB_NOTIFICATIONS: "settings-tab-notifications",
    TAB_INTEGRATIONS: "settings-tab-integrations",
    TAB_APIKEYS: "settings-tab-apikeys",
    TAB_OFFLINE: "settings-tab-offline",
    TAB_PREFERENCES: "settings-tab-preferences",
    TAB_ADMIN: "settings-tab-admin",
    TAB_DEVELOPER: "settings-tab-developer",
    /** @see src/components/Admin/UserManagement.tsx */
    INVITE_BUTTON: "settings-invite-button",
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
    /** @see src/components/Settings/ProfileContent.tsx */
    PROFILE_AVATAR_UPLOAD_TRIGGER: "settings-profile-avatar-upload-trigger",
    /** @see src/components/Settings/ProfileContent.tsx */
    PROFILE_COVER_UPLOAD_TRIGGER: "settings-profile-cover-upload-trigger",
    /** @see src/components/Settings/NotificationsTab.tsx */
    NOTIFICATIONS_BLOCKED_ALERT: "settings-notifications-blocked-alert",
    /** @see src/components/Settings/NotificationsTab.tsx */
    NOTIFICATIONS_BLOCKED_BUTTON: "settings-notifications-blocked-button",
    /** @see src/components/Admin/UserManagement.tsx */
    USER_MANAGEMENT_SECTION: "settings-user-management-section",
    /** @see src/components/Admin/UserManagement.tsx - Users tab in admin section */
    ADMIN_USERS_TAB: "settings-admin-users-tab",
    /** @see src/components/Admin/UserTypeManager.tsx */
    USER_TYPE_MANAGER_SECTION: "settings-user-type-manager-section",
    /** @see src/components/Admin/HourComplianceDashboard.tsx */
    HOUR_COMPLIANCE_SECTION: "settings-hour-compliance-section",
  },

  PROJECT_SETTINGS: {
    /** @see src/components/ProjectSettings/MemberManagement.tsx */
    MEMBERS_SECTION: "project-settings-members-section",
    /** @see src/components/ProjectSettings/MemberManagement.tsx */
    MEMBER_REMOVE_BUTTON: "project-settings-member-remove-button",
    /** @see src/components/ProjectSettings/DangerZone.tsx */
    DELETE_TRIGGER: "project-settings-delete-trigger",
    /** @see src/components/ProjectSettings/DangerZone.tsx */
    DELETE_CONFIRM_INPUT: "project-settings-delete-confirm-input",
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
    /** @see src/routes/invite.$token.tsx - Public invite state screen wrapper */
    STATE_SCREEN: "invite-state-screen",
    /** @see src/routes/invite.$token.tsx - Loading state */
    LOADING: "invite-loading",
  },

  // ============================================================
  // Landing Page
  // ============================================================

  LANDING: {
    /** @see src/components/Landing/WhyChooseSection.tsx */
    PROOF_SECTION: "landing-proof-section",
    /** @see src/components/Landing/PricingSection.tsx */
    PRICING_SECTION: "landing-pricing-section",
  },

  // ============================================================
  // Teams
  // ============================================================

  TEAMS: {
    /** @see src/routes/_app.$orgSlug.workspaces.$workspaceSlug.teams.tsx */
    LIST_HEADING: "teams-list-heading",
    /** @see src/routes/_app.$orgSlug.workspaces.$workspaceSlug.teams.index.tsx */
    EMPTY_STATE: "teams-empty-state",
  },

  // ============================================================
  // Dashboard
  // ============================================================

  DASHBOARD: {
    /** @see src/routes/_app.$orgSlug.dashboard.tsx */
    FEED_HEADING: "dashboard-feed-heading",
    /** @see src/routes/_app.$orgSlug.dashboard.tsx */
    CONTENT: "dashboard-content",
    /** @see src/components/Dashboard/QuickStats.tsx */
    QUICK_STATS: "dashboard-quick-stats",
    /** @see src/components/Dashboard/RecentActivity.tsx */
    RECENT_ACTIVITY: "dashboard-recent-activity",
    /** @see src/components/Dashboard/WorkspacesList.tsx */
    WORKSPACES_LIST: "dashboard-workspaces-list",
    /** @see src/components/Dashboard/DashboardCustomizeModal.tsx */
    CUSTOMIZE_TRIGGER: "dashboard-customize-trigger",
    /** @see src/components/Dashboard/DashboardCustomizeModal.tsx */
    CUSTOMIZE_MODAL: "dashboard-customize-modal",
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
    /** @see src/routes/_app.$orgSlug.documents.templates.tsx */
    TEMPLATES_CONTENT: "document-templates-content",
    /** @see src/components/Documents/DocumentSidebar.tsx */
    NEW_BUTTON: "document-new-button",
    /** @see src/components/Documents/DocumentSidebar.tsx */
    TEMPLATE_BUTTON: "document-template-button",
    /** @see src/components/Documents/DocumentSidebar.tsx */
    SEARCH_INPUT: "document-search-input",
    /** @see src/components/Documents/DocumentSidebar.tsx */
    TEMPLATE_MODAL: "document-template-modal",
    /** @see src/routes/_auth/_app/$orgSlug/documents/index.tsx */
    WORKSPACE_SUMMARY: "documents-workspace-summary",
    /** @see src/routes/_auth/_app/$orgSlug/documents/index.tsx */
    WORKSPACE_TEMPLATES_PANEL: "documents-workspace-templates-panel",
    /** @see src/routes/_auth/_app/$orgSlug/documents/index.tsx */
    WORKSPACE_RECENT_SECTION: "documents-workspace-recent-section",
    /** @see src/routes/_auth/_app/$orgSlug/documents/index.tsx */
    WORKSPACE_LIBRARY_SECTION: "documents-workspace-library-section",
    /** @see src/routes/_auth/_app/$orgSlug/documents/index.tsx */
    SEARCH_EMPTY_STATE: "documents-search-empty-state",
  },

  // ============================================================
  // Time Tracking
  // ============================================================

  TIME_TRACKING: {
    /** @see src/components/TimeTracking/TimeEntriesList.tsx */
    ADD_ENTRY_BUTTON: "time-tracking-add-entry-button",
    /** @see src/components/TimeTracking/TimeEntryModal.tsx */
    ENTRY_MODAL: "time-tracking-entry-modal",
    /** @see src/components/TimeTracking/TimeEntryModal.tsx */
    ENTRY_FORM: "time-entry-form",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    CONTENT: "time-tracking-content",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    OVERVIEW: "time-tracking-overview",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    SUMMARY_LOGGED: "time-tracking-summary-logged",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    SUMMARY_ENTRIES: "time-tracking-summary-entries",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    SUMMARY_BILLABLE: "time-tracking-summary-billable",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    PROJECT_FILTER: "time-tracking-project-filter",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    DATE_RANGE_FILTER: "time-tracking-date-range-filter",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    TAB_ENTRIES: "time-tracking-tab-entries",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    TAB_BURN_RATE: "time-tracking-tab-burn-rate",
    /** @see src/components/TimeTracking/TimeTrackingPage.tsx */
    TAB_RATES: "time-tracking-tab-rates",
    /** @see src/components/TimeTracking/TimeEntriesList.tsx */
    ENTRIES_LIST: "time-tracking-entries-list",
    /** @see src/components/TimeTracking/TimeEntriesList.tsx */
    ENTRIES_EMPTY_STATE: "time-tracking-entries-empty-state",
    /** @see src/components/TimeTracking/BurnRateDashboard.tsx */
    BURN_RATE_PANEL: "time-tracking-burn-rate-panel",
    /** @see src/components/TimeTracking/UserRatesManagement.tsx */
    RATES_PANEL: "time-tracking-rates-panel",
  },

  NOTIFICATIONS: {
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    CONTENT: "notifications-content",
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    INBOX_EMPTY_STATE: "notifications-inbox-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    ARCHIVED_EMPTY_STATE: "notifications-archived-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    UNREAD_BADGE: "notifications-unread-badge",
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    MARK_ALL_READ_BUTTON: "notifications-mark-all-read-button",
    /** @see src/routes/_auth/_app/$orgSlug/notifications.tsx */
    ARCHIVE_ALL_BUTTON: "notifications-archive-all-button",
  },

  INVOICES: {
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    CONTENT: "invoices-content",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    MOBILE_LIST: "invoices-mobile-list",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    TABLE: "invoices-table",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    STATUS_FILTER: "invoices-status-filter",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    EMPTY_STATE: "invoices-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    FILTERED_EMPTY_STATE: "invoices-filtered-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    LOADING_STATE: "invoices-loading-state",
    /** @see src/routes/_auth/_app/$orgSlug/invoices/index.tsx */
    CREATE_DIALOG: "invoices-create-dialog",
  },

  ASSISTANT: {
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    CONTENT: "assistant-content",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    LOADING_STATE: "assistant-loading-state",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    OVERVIEW_TAB: "assistant-overview-tab",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    CONVERSATIONS_TAB: "assistant-conversations-tab",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    OVERVIEW_PANEL: "assistant-overview-panel",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    CONVERSATIONS_PANEL: "assistant-conversations-panel",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    SNAPSHOT_CARD: "assistant-snapshot-card",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    OVERVIEW_EMPTY_STATE: "assistant-overview-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    CONVERSATIONS_EMPTY_STATE: "assistant-conversations-empty-state",
    /** @see src/routes/_auth/_app/$orgSlug/assistant.tsx */
    CONVERSATIONS_LIST: "assistant-conversations-list",
  },

  MY_ISSUES: {
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    CONTENT: "my-issues-content",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    MOBILE_COLUMN_SELECTOR: "my-issues-mobile-column-selector",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    PRIORITY_FILTER: "my-issues-priority-filter",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    PRIORITY_FILTER_OPTION_PREFIX: "my-issues-priority-filter-option",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    DUE_DATE_FILTER: "my-issues-due-date-filter",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    DUE_DATE_FILTER_OPTION_PREFIX: "my-issues-due-date-filter-option",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    GROUP_BY_CONTROL: "my-issues-group-by-control",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    FILTER_SUMMARY: "my-issues-filter-summary",
    /** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
    COLUMN: "my-issues-column",
  },

  PROJECT_INBOX: {
    /** @see src/components/InboxList.tsx */
    CONTENT: "project-inbox-content",
    /** @see src/components/InboxList.tsx */
    SEARCH_INPUT: "project-inbox-search-input",
    /** @see src/components/InboxList.tsx */
    BULK_ACTIONS: "project-inbox-bulk-actions",
    /** @see src/components/InboxList.tsx */
    OPEN_EMPTY_STATE: "project-inbox-open-empty-state",
    /** @see src/components/InboxList.tsx */
    CLOSED_EMPTY_STATE: "project-inbox-closed-empty-state",
    /** @see src/components/InboxList.tsx */
    CLOSED_TAB: "project-inbox-closed-tab",
    /** @see src/components/InboxList.tsx */
    SNOOZE_MENU: "project-inbox-snooze-menu",
    /** @see src/components/InboxList.tsx */
    DECLINE_DIALOG: "project-inbox-decline-dialog",
    /** @see src/components/InboxList.tsx */
    CUSTOM_SNOOZE_DIALOG: "project-inbox-custom-snooze-dialog",
    /** @see src/components/InboxList.tsx */
    DUPLICATE_DIALOG: "project-inbox-duplicate-dialog",
    /** @see src/components/InboxList.tsx */
    ROW: "project-inbox-row",
  },

  // ============================================================
  // Outreach
  // ============================================================

  OUTREACH: {
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ROOT: "outreach-root",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    LAUNCH_CHECKLIST: "outreach-launch-checklist",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ACTION_IMPORT_CONTACTS: "outreach-action-import-contacts",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ACTION_NEW_CONTACT: "outreach-action-new-contact",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ACTION_NEW_SEQUENCE: "outreach-action-new-sequence",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ACTION_ENROLL_CONTACTS: "outreach-action-enroll-contacts",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    TAB_OVERVIEW: "outreach-tab-overview",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    TAB_SEQUENCES: "outreach-tab-sequences",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    TAB_CONTACTS: "outreach-tab-contacts",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    TAB_MAILBOXES: "outreach-tab-mailboxes",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    TAB_ANALYTICS: "outreach-tab-analytics",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    OVERVIEW_SECTION: "outreach-overview-section",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    SEQUENCES_LIST: "outreach-sequences-list",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    SEQUENCE_DETAIL: "outreach-sequence-detail",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    CONTACTS_SECTION: "outreach-contacts-section",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    MAILBOXES_SECTION: "outreach-mailboxes-section",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ANALYTICS_SECTION: "outreach-analytics-section",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    CONTACT_DIALOG: "outreach-contact-dialog",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    IMPORT_DIALOG: "outreach-import-dialog",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    SEQUENCE_DIALOG: "outreach-sequence-dialog",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    ENROLL_DIALOG: "outreach-enroll-dialog",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    MAILBOX_CARD: "outreach-mailbox-card",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    MAILBOX_DISCONNECT_BUTTON: "outreach-mailbox-disconnect-button",
    /** @see src/components/Outreach/OutreachWorkspace.tsx */
    MAILBOX_DISCONNECT_CONFIRM: "outreach-mailbox-disconnect-confirm",
  },

  // ============================================================
  // Meetings
  // ============================================================

  MEETINGS: {
    /** @see src/routes/_app.$orgSlug.meetings.tsx */
    RECENT_SECTION: "meetings-recent-section",
    /** @see src/routes/_app.$orgSlug.meetings.tsx */
    DETAIL_SECTION: "meetings-detail-section",
    /** @see src/routes/_app.$orgSlug.meetings.tsx */
    MEMORY_SECTION: "meetings-memory-section",
    /** @see src/routes/_app.$orgSlug.meetings.tsx */
    RECORDING_CARD: "meetings-recording-card",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - search input */
    SEARCH_INPUT: "meetings-search-input",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - transcript search */
    TRANSCRIPT_SEARCH: "meetings-transcript-search",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - action items section */
    ACTION_ITEMS_SECTION: "meetings-action-items-section",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - schedule recording button */
    SCHEDULE_BUTTON: "meetings-schedule-button",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - schedule recording dialog */
    SCHEDULE_DIALOG: "meetings-schedule-dialog",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - filtered empty state */
    FILTER_EMPTY_STATE: "meetings-filter-empty-state",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - detail placeholder empty state */
    DETAIL_EMPTY_STATE: "meetings-detail-empty-state",
    /** @see src/components/Meetings/MeetingsWorkspace.tsx - summary processing placeholder */
    SUMMARY_PROCESSING_STATE: "meetings-summary-processing-state",
  },

  // ============================================================
  // Billing
  // ============================================================

  BILLING: {
    /** @see src/routes/_app.$orgSlug.projects.$key.billing.tsx */
    CONTENT: "billing-content",
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

/** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
export function getMyIssuesPriorityFilterOptionTestId(priority: string): string {
  return `${TEST_IDS.MY_ISSUES.PRIORITY_FILTER_OPTION_PREFIX}-${priority}`;
}

/** @see src/routes/_auth/_app/$orgSlug/my-issues.tsx */
export function getMyIssuesDueDateFilterOptionTestId(filter: string): string {
  return `${TEST_IDS.MY_ISSUES.DUE_DATE_FILTER_OPTION_PREFIX}-${filter}`;
}

/** Type helper for accessing TEST_IDS values */
export type TestIdKey = keyof typeof TEST_IDS;
