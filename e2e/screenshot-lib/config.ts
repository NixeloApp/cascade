/**
 * Screenshot tool configuration — constants, types, and viewport/theme definitions.
 */

import * as path from "node:path";
import { TEST_USERS, type TestUser } from "../config";
import type { E2EWorkflowState } from "../utils/test-user-service";

// ---------------------------------------------------------------------------
// Directories
// ---------------------------------------------------------------------------

export const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
export const SPECS_BASE_DIR = path.join(process.cwd(), "docs", "design", "specs", "pages");
export const MODAL_SPECS_BASE_DIR = path.join(
  process.cwd(),
  "docs",
  "design",
  "specs",
  "modals",
  "screenshots",
);
export const FALLBACK_SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");
export const SCREENSHOT_STAGING_BASE_DIR = path.join(process.cwd(), ".tmp", "screenshot-staging");

// ---------------------------------------------------------------------------
// Viewports & Configs
// ---------------------------------------------------------------------------

export const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
export type ThemeName = "dark" | "light";

export const CONFIGS: Array<{ viewport: ViewportName; theme: ThemeName }> = [
  { viewport: "desktop", theme: "dark" },
  { viewport: "desktop", theme: "light" },
  { viewport: "tablet", theme: "light" },
  { viewport: "mobile", theme: "light" },
];

// ---------------------------------------------------------------------------
// Test User & Constants
// ---------------------------------------------------------------------------

export const SCREENSHOT_USER = {
  email: TEST_USERS.teamLead.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamLead.password,
};

export const SCREENSHOT_EMPTY_USER = {
  email: TEST_USERS.teamMember.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamMember.password,
};

export const SCREENSHOT_AUTH_USER: TestUser = {
  ...SCREENSHOT_USER,
  platformRole: "user",
  onboardingPersona: "team_lead",
  description: "Primary screenshot capture user",
};

export const SCREENSHOT_EMPTY_AUTH_USER: TestUser = {
  ...SCREENSHOT_EMPTY_USER,
  platformRole: "user",
  onboardingPersona: "team_member",
  description: "Empty-state screenshot capture user",
};

export const SEARCH_SHORTCUT = process.platform === "darwin" ? "Meta+K" : "Control+K";

export const MARKDOWN_IMPORT_PREVIEW = `# Imported Product Brief

- Align launch copy
- Finalize onboarding checklist

\`\`\`ts
export const launchReady = true;
\`\`\`
`;

export const MARKDOWN_RICH_CONTENT = `# Release Readiness

Use this document to confirm the final handoff details before launch.

| Milestone | Owner | Status |
| --- | --- | --- |
| QA signoff | Maya | Ready |
| Launch copy | Eli | Review |

\`\`\`ts
export const shipWindow = "2026-03-25";
\`\`\`
`;

export const DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES: E2EWorkflowState[] = [
  { id: "todo", name: "To Do", category: "todo", order: 0 },
  { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
  { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
  { id: "done", name: "Done", category: "done", order: 3 },
];

// ---------------------------------------------------------------------------
// CLI Options
// ---------------------------------------------------------------------------

export interface CliOptions {
  headless: boolean;
  dryRun: boolean;
  configFilters: Set<string> | null;
  specFilters: string[];
  matchFilters: string[];
  shardIndex: number | null;
  shardTotal: number | null;
  help: boolean;
}

// ---------------------------------------------------------------------------
// Capture Target
// ---------------------------------------------------------------------------

export interface CaptureTarget {
  pageId: string;
  specFolder: string | null;
  filenameSuffix: string;
  modalSpecSlug: string | null;
}

// ---------------------------------------------------------------------------
// Page-to-Spec Folder Mapping
// ---------------------------------------------------------------------------

export const PAGE_TO_SPEC_FOLDER: Record<string, string> = {
  // Public pages
  "public-landing": "01-landing",
  "public-signin": "02-signin",
  "public-signup": "03-signup",
  "public-forgot-password": "04-forgot-password",
  "public-verify-email": "14-verify-email",
  "public-invite": "15-invite",
  "public-unsubscribe": "16-unsubscribe",

  // Workspace-level pages (empty states)
  "empty-dashboard": "04-dashboard",
  "empty-projects": "05-projects",
  "empty-documents": "09-documents",
  "empty-settings": "12-settings",
  "empty-issues": "19-issues",
  "empty-notifications": "21-notifications",
  "empty-invoices": "25-invoices",
  "empty-clients": "26-clients",
  "empty-meetings": "30-meetings",
  "empty-outreach": "41-outreach",

  // Workspace-level pages (filled states)
  "filled-dashboard": "04-dashboard",
  "filled-projects": "05-projects",
  "filled-documents": "09-documents",
  "filled-workspaces": "27-workspaces",
  "filled-settings": "12-settings",
  "filled-issues": "19-issues",
  "filled-notifications": "21-notifications",
  "filled-my-issues": "20-my-issues",
  "filled-org-calendar": "23-org-calendar",
  "filled-org-analytics": "24-org-analytics",
  "filled-invoices": "25-invoices",
  "filled-clients": "26-clients",
  "filled-meetings": "30-meetings",
  "filled-outreach": "41-outreach",
  "filled-time-tracking": "22-time-tracking",
  "filled-sidebar-collapsed": "04-dashboard",
  "filled-404-page": "40-error",
  "filled-authentication": "31-authentication",
  "filled-add-ons": "32-add-ons",
  "filled-assistant": "33-assistant",
  "filled-mcp-server": "34-mcp-server",
};
