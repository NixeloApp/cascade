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
    /** @see src/components/IssueCard.tsx */
    TITLE: "issue-title",
    /** @see src/components/IssueCard.tsx */
    KEY: "issue-key",
    /** @see src/components/IssueCard.tsx */
    PRIORITY: "issue-priority",
    /** @see src/components/IssueDetailModal.tsx */
    DETAIL_MODAL: "issue-detail-modal",
  },

  BOARD: {
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
  // Search
  // ============================================================

  SEARCH: {
    /** @see src/components/GlobalSearch.tsx */
    MODAL: "search-modal",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_ITEM: "search-result-item",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_TYPE: "search-result-type",
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
    /** @see src/components/auth/SignInForm.tsx */
    EMAIL_INPUT: "auth-email-input",
    /** @see src/components/auth/SignInForm.tsx */
    PASSWORD_INPUT: "auth-password-input",
    /** @see src/components/auth/SignInForm.tsx */
    SUBMIT_BUTTON: "auth-submit-button",
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
  // Settings
  // ============================================================

  SETTINGS: {
    /** @see src/routes/_app.$orgSlug.settings.tsx */
    ORG_TAB: "settings-org-tab",
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
    /** @see src/components/DocumentHeader.tsx */
    TITLE: "document-title",
  },
} as const;

/** Type helper for accessing TEST_IDS values */
export type TestIdKey = keyof typeof TEST_IDS;
