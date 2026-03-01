/**
 * Application-wide constants
 * Centralized configuration for magic numbers, limits, and common values
 */

/**
 * Animation delays and durations (in milliseconds)
 */
export const ANIMATION = {
  /** Stagger delay between list items (e.g., 50ms between each card) */
  STAGGER_DELAY: 50,
  /** Fast transitions (e.g., hover effects) */
  FAST: 150,
  /** Medium transitions (e.g., modals, drawers) */
  MEDIUM: 300,
  /** Slow transitions (e.g., page transitions) */
  SLOW: 500,
  /** Tooltip delay before showing */
  TOOLTIP_DELAY: 300,
} as const;

/**
 * Display limits for lists and pagination
 */
export const DISPLAY_LIMITS = {
  /** Quick stats on dashboard */
  QUICK_STATS: 5,
  /** Recent activity items */
  RECENT_ACTIVITY: 10,
  /** Search results per page */
  SEARCH_RESULTS: 20,
  /** Notifications in dropdown */
  NOTIFICATIONS: 50,
  /** Issues per kanban column (before "load more") */
  KANBAN_ISSUES: 100,
  /** History/undo stack size */
  MAX_HISTORY_SIZE: 10,
  /** Maximum items before showing "+X more" */
  MAX_VISIBLE_LABELS: 3,
} as const;

/**
 * Tailwind breakpoints (must match tailwind.config.js)
 */
export const BREAKPOINTS = {
  /** Small devices (640px+) */
  sm: "640px",
  /** Medium devices (768px+) */
  md: "768px",
  /** Large devices (1024px+) */
  lg: "1024px",
  /** Extra large devices (1280px+) */
  xl: "1280px",
  /** 2X large devices (1536px+) */
  "2xl": "1536px",
} as const;

/**
 * Form field sizes
 */
export const INPUT_SIZES = {
  /** Small input height */
  sm: "h-8",
  /** Medium input height */
  md: "h-10",
  /** Large input height */
  lg: "h-12",
} as const;

/**
 * Common spacing values (Tailwind classes)
 */
export const SPACING = {
  /** Extra small gap */
  xs: "gap-1",
  /** Small gap */
  sm: "gap-2",
  /** Medium gap */
  md: "gap-4",
  /** Large gap */
  lg: "gap-6",
  /** Extra large gap */
  xl: "gap-8",
} as const;

/**
 * Icon sizes
 */
export const ICON_SIZES = {
  /** Extra small icon (12px) */
  xs: "w-3 h-3",
  /** Small icon (16px) */
  sm: "w-4 h-4",
  /** Medium icon (20px) */
  md: "w-5 h-5",
  /** Large icon (24px) */
  lg: "w-6 h-6",
  /** Extra large icon (32px) */
  xl: "w-8 h-8",
  /** 2X large icon (48px) */
  "2xl": "w-12 h-12",
} as const;

/**
 * Runtime color values (hex strings for database storage)
 * These are intentionally hex strings, not CSS variables, because they are
 * stored in the database and need to work independently of the CSS theme.
 */
export const COLORS = {
  /** Default label color (brand indigo) */
  DEFAULT_LABEL: "#6366F1",
} as const;

/**
 * API and query limits
 */
export const API_LIMITS = {
  /** Maximum file upload size (bytes) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Maximum attachments per issue */
  MAX_ATTACHMENTS: 10,
  /** Query timeout (ms) */
  QUERY_TIMEOUT: 30000,
  /** Rate limit requests per minute */
  RATE_LIMIT: 60,
} as const;

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  /** User theme preference */
  THEME: "nixelo-theme",
  /** Command palette history */
  COMMAND_HISTORY: "nixelo-command-history",
  /** Sidebar collapsed state */
  SIDEBAR_COLLAPSED: "nixelo-sidebar-collapsed",
  /** Recent projects */
  RECENT_PROJECTS: "nixelo-recent-projects",
  /** Draft issue data */
  DRAFT_ISSUE: "nixelo-draft-issue",
} as const;

/**
 * Date/time formats
 */
export const DATE_FORMATS = {
  /** Short date (e.g., "Jan 1, 2024") */
  SHORT: "MMM d, yyyy",
  /** Long date (e.g., "January 1, 2024") */
  LONG: "MMMM d, yyyy",
  /** Date with time (e.g., "Jan 1, 2024 at 3:30 PM") */
  WITH_TIME: "MMM d, yyyy 'at' h:mm a",
  /** Time only (e.g., "3:30 PM") */
  TIME_ONLY: "h:mm a",
  /** ISO format for API */
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

/**
 * Common regex patterns
 */
export const PATTERNS = {
  /** Email validation */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** URL validation */
  URL: /^https?:\/\/.+/,
  /** Project key (e.g., "PROJ", "DEV-123") */
  PROJECT_KEY: /^[A-Z]{2,10}$/,
  /** Issue key (e.g., "PROJ-123") */
  ISSUE_KEY: /^[A-Z]{2,10}-\d+$/,
} as const;

/**
 * Keyboard shortcuts
 */
export const SHORTCUTS = {
  /** Open command palette */
  COMMAND_PALETTE: "cmd+k",
  /** Open search */
  SEARCH: "cmd+k",
  /** Create new issue */
  NEW_ISSUE: "cmd+i",
  /** Save */
  SAVE: "cmd+s",
  /** Undo */
  UNDO: "cmd+z",
  /** Redo */
  REDO: "cmd+shift+z",
} as const;

/**
 * Time tracking activity types
 */
export const ACTIVITY_TYPES = [
  "Development",
  "Code Review",
  "Meeting",
  "Design",
  "Testing",
  "Documentation",
  "Planning",
  "Research",
  "Bug Fixing",
  "Deployment",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Supported currencies for time tracking
 */
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Time entry defaults
 */
export const TIME_TRACKING = {
  /** Default hourly rate (USD) */
  DEFAULT_HOURLY_RATE: 0,
  /** Minimum billable increment (minutes) */
  MIN_BILLABLE_INCREMENT: 15,
  /** Maximum hours per day */
  MAX_HOURS_PER_DAY: 24,
  /** Default timer update interval (ms) */
  TIMER_UPDATE_INTERVAL: 1000,
} as const;
