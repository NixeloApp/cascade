/**
 * Visual screenshot tool for reviewing all app pages.
 *
 * Captures screenshots across viewport/theme combinations:
 *   - desktop-dark (1920x1080)
 *   - desktop-light (1920x1080)
 *   - tablet-light (768x1024)
 *   - mobile-light (390x844)
 *
 * Output: Screenshots go to their corresponding spec folders:
 *   - docs/design/specs/pages/02-signin/screenshots/
 *   - docs/design/specs/pages/03-signup/screenshots/
 *   - etc.
 *
 * Pages without specs go to: e2e/screenshots/ (flat folder)
 *
 * Usage:
 *   pnpm screenshots              # capture all
 *   pnpm screenshots -- --headed  # visible browser
 *
 * Requires dev server running (pnpm dev).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type Browser, chromium, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../src/lib/test-ids";
import { TEST_USERS } from "./config";
import { E2E_TIMEZONE } from "./constants";
import { ProjectsPage } from "./pages";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SPECS_BASE_DIR = path.join(process.cwd(), "docs", "design", "specs", "pages");
const FALLBACK_SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");

// Map page identifiers to their spec folder names
// Pages with specs get screenshots in their spec folder
// Pages without specs go to the fallback directory
const PAGE_TO_SPEC_FOLDER: Record<string, string> = {
  // Public pages
  "public-landing": "01-landing",
  "public-signin": "02-signin",
  "public-signup": "03-signup",
  "public-forgot-password": "04-forgot-password",

  // Workspace-level pages (empty states)
  "empty-dashboard": "04-dashboard",
  "empty-projects": "05-projects",
  "empty-issues": "07-backlog",
  "empty-documents": "09-documents",
  "empty-settings": "12-settings",

  // Workspace-level pages (filled states)
  "filled-dashboard": "04-dashboard",
  "filled-projects": "05-projects",
  "filled-issues": "07-backlog",
  "filled-documents": "09-documents",
  "filled-settings": "12-settings",

  // Project sub-pages (filled states) - these use dynamic keys
  // Pattern: filled-project-{key}-{tab}
  // We'll handle these with a prefix match below
};

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

// Desktop captures both themes, tablet/mobile light only
const CONFIGS: Array<{ viewport: keyof typeof VIEWPORTS; theme: "dark" | "light" }> = [
  { viewport: "desktop", theme: "dark" },
  { viewport: "desktop", theme: "light" },
  { viewport: "tablet", theme: "light" },
  { viewport: "mobile", theme: "light" },
];

type ViewportName = keyof typeof VIEWPORTS;
type ThemeName = "dark" | "light";

const SCREENSHOT_USER = {
  email: TEST_USERS.teamLead.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamLead.password,
};
const SEARCH_SHORTCUT = process.platform === "darwin" ? "Meta+K" : "Control+K";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentConfigPrefix = ""; // e.g. "desktop-dark", "tablet-light"
let counters = new Map<string, number>();
let totalScreenshots = 0;

function resetCounters(): void {
  counters = new Map<string, number>();
}

function nextIndex(prefix: string): number {
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return n;
}

// ---------------------------------------------------------------------------
// Screenshot helpers
// ---------------------------------------------------------------------------

// Dynamic page patterns that map to spec folders
// Pattern: [regex to match pageId, spec folder, filename suffix]
const DYNAMIC_PAGE_PATTERNS: Array<[RegExp, string, string]> = [
  [/^filled-dashboard-omnibox$/, "04-dashboard", "-omnibox"],
  [/^filled-dashboard-advanced-search-modal$/, "04-dashboard", "-advanced-search-modal"],
  [/^filled-dashboard-shortcuts-modal$/, "04-dashboard", "-shortcuts-modal"],
  [/^filled-dashboard-time-entry-modal$/, "04-dashboard", "-time-entry-modal"],
  [/^filled-projects-create-project-modal$/, "05-projects", "-create-project-modal"],
  // Project board: filled-project-xxx-board → 06-board
  [/^filled-project-[^-]+-board$/, "06-board", ""],
  [/^filled-project-[^-]+-create-issue-modal$/, "06-board", "-create-issue-modal"],
  // Project backlog: filled-project-xxx-backlog → 07-backlog
  [/^filled-project-[^-]+-backlog$/, "07-backlog", ""],
  // Issue detail: filled-issue-xxx → 08-issue
  [/^filled-issue-/, "08-issue", ""],
  [/^filled-project-[^-]+-issue-detail-modal$/, "08-issue", "-detail-modal"],
  // Document editor: filled-document-editor → 10-editor
  [/^filled-document-editor$/, "10-editor", ""],
  // Project calendar views: filled-project-xxx-calendar, filled-calendar-{mode}
  [/^filled-project-[^-]+-calendar$/, "11-calendar", ""],
  [/^filled-calendar-(day|week|month)$/, "11-calendar", "-$1"],
  [/^filled-calendar-event-modal$/, "11-calendar", "-event-modal"],
  // Project analytics: filled-project-xxx-analytics → 13-analytics
  [/^filled-project-[^-]+-analytics$/, "13-analytics", ""],
  // Project settings: filled-project-xxx-settings → 12-settings
  [/^filled-project-[^-]+-settings$/, "12-settings", "-project"],
];

function getScreenshotPath(prefix: string, name: string): string {
  const pageId = `${prefix}-${name}`;

  // Check static mapping first
  let specFolder = PAGE_TO_SPEC_FOLDER[pageId];
  let filenameSuffix = "";

  // Check dynamic patterns if no static match
  if (!specFolder) {
    for (const [pattern, folder, suffix] of DYNAMIC_PAGE_PATTERNS) {
      if (pattern.test(pageId)) {
        specFolder = folder;
        // Replace $1 with captured group if present
        const match = pageId.match(pattern);
        filenameSuffix = suffix.replace("$1", match?.[1] ?? "");
        break;
      }
    }
  }

  // Filename: viewport-theme.png or viewport-theme-suffix.png
  const filename = filenameSuffix
    ? `${currentConfigPrefix}${filenameSuffix}.png`
    : `${currentConfigPrefix}.png`;

  if (specFolder) {
    // Page has a spec folder - put screenshot there
    const specScreenshotDir = path.join(SPECS_BASE_DIR, specFolder, "screenshots");
    if (!fs.existsSync(specScreenshotDir)) {
      fs.mkdirSync(specScreenshotDir, { recursive: true });
    }
    return path.join(specScreenshotDir, filename);
  }

  // No spec folder - use fallback with full naming
  const fallbackFilename = `${currentConfigPrefix}-${prefix}-${name}.png`;
  if (!fs.existsSync(FALLBACK_SCREENSHOT_DIR)) {
    fs.mkdirSync(FALLBACK_SCREENSHOT_DIR, { recursive: true });
  }
  return path.join(FALLBACK_SCREENSHOT_DIR, fallbackFilename);
}

async function takeScreenshot(
  page: Page,
  prefix: string,
  name: string,
  url: string,
): Promise<void> {
  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const screenshotPath = getScreenshotPath(prefix, name);

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    // networkidle often times out on real-time apps -- page is still usable
  }
  await waitForScreenshotReady(page);
  await waitForExpectedContent(page, url, name);
  await waitForScreenshotReady(page);
  await page.screenshot({ path: screenshotPath });
  totalScreenshots++;

  // Show relative path for clarity
  const relativePath = path.relative(process.cwd(), screenshotPath);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePath}`);
}

async function captureCurrentView(page: Page, prefix: string, name: string): Promise<void> {
  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const screenshotPath = getScreenshotPath(prefix, name);

  await waitForScreenshotReady(page);
  await page.screenshot({ path: screenshotPath });
  totalScreenshots++;

  const relativePath = path.relative(process.cwd(), screenshotPath);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePath}`);
}

async function runCaptureStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`    ⚠️  skipped ${label}: ${message}`);
  }
}

async function dismissIfOpen(page: Page, locator: Locator): Promise<void> {
  if (!(await locator.isVisible().catch(() => false))) {
    return;
  }

  await page.keyboard.press("Escape").catch(() => {});

  if (await locator.isVisible().catch(() => false)) {
    await page.mouse.click(10, 10).catch(() => {});
  }

  await locator.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}

async function waitForDialogOverlaysToClear(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll("[data-testid='dialog-overlay'][data-state='open']").length === 0,
      undefined,
      { timeout: 5000 },
    )
    .catch(() => {});
}

async function dismissAllDialogs(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const openOverlays = await page
      .getByTestId(TEST_IDS.DIALOG.OVERLAY)
      .count()
      .catch(() => 0);
    if (openOverlays === 0) {
      break;
    }

    await page.keyboard.press("Escape").catch(() => {});
    await waitForDialogOverlaysToClear(page);

    const remainingOverlays = await page
      .getByTestId(TEST_IDS.DIALOG.OVERLAY)
      .count()
      .catch(() => 0);
    if (remainingOverlays === 0) {
      break;
    }

    await page.mouse.click(10, 10).catch(() => {});
    await waitForDialogOverlaysToClear(page);
  }
}

async function openOmnibox(page: Page, trigger: Locator, dialog: Locator): Promise<void> {
  await dismissAllDialogs(page);

  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click({ force: true });
  } else {
    await page.keyboard.press(SEARCH_SHORTCUT);
  }

  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId(TEST_IDS.SEARCH.INPUT).waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText(/jump faster across your workspace/i)
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {});
  await waitForScreenshotReady(page);
  await page.waitForTimeout(250);
}

function isProjectBoardUrl(url: string): boolean {
  return /\/projects\/[^/]+\/board$/.test(url);
}

function isDashboardUrl(url: string): boolean {
  return /\/[^/]+\/dashboard$/.test(url);
}

function isProjectCalendarUrl(url: string): boolean {
  return /\/projects\/[^/]+\/calendar$/.test(url);
}

function isProjectSettingsUrl(url: string): boolean {
  return /\/projects\/[^/]+\/settings$/.test(url);
}

function isSettingsUrl(url: string): boolean {
  return /\/[^/]+\/settings(?:\/profile)?$/.test(url);
}

function isProjectsUrl(url: string): boolean {
  return /\/[^/]+\/projects\/?$/.test(url);
}

function isIssueDetailUrl(url: string): boolean {
  return /\/[^/]+\/issues\/[^/]+$/.test(url);
}

function isDocumentEditorUrl(url: string): boolean {
  return /\/[^/]+\/documents\/[^/]+$/.test(url);
}

async function waitForCalendarReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK).first().waitFor({
        state: "visible",
        timeout: 8000,
      });
      await page.locator("[data-calendar]").first().waitFor({
        state: "visible",
        timeout: 4000,
      });
      await page
        .locator(".animate-shimmer")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      return true;
    } catch {
      if (attempt === 0) {
        await page
          .goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 })
          .catch(() => {});
        await waitForScreenshotReady(page);
      }
    }
  }
  return false;
}

async function waitForCalendarEvents(page: Page, timeoutMs = 8000): Promise<boolean> {
  const eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
  const attempts = Math.max(1, Math.ceil(timeoutMs / 500));

  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await eventItems.count().catch(() => 0)) > 0) {
      return true;
    }

    if (attempt === Math.floor(attempts / 2)) {
      await page
        .getByRole("button", { name: /^today$/i })
        .first()
        .click()
        .catch(() => {});
    }

    await page.waitForTimeout(500);
  }

  return false;
}

async function waitForBoardReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.BOARD.COLUMN).first().waitFor({
        state: "visible",
        timeout: 10000,
      });
      await page
        .getByText(/delivery board|kanban board|sprint board/i)
        .first()
        .waitFor({ state: "visible", timeout: 6000 })
        .catch(() => {});
      await page
        .locator(".animate-shimmer")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      await page
        .locator(".animate-spin")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      return true;
    } catch {
      if (attempt === 0) {
        await page
          .goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 })
          .catch(() => {});
        await waitForScreenshotReady(page);
      }
    }
  }

  return false;
}

async function waitForProjectsReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /^projects$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create project/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .locator(".animate-spin")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        if (text.includes("No projects yet")) {
          return true;
        }

        return Array.from(document.querySelectorAll("a[href]")).some((link) => {
          const href = link.getAttribute("href") || "";
          return /\/projects\/[^/]+\/board$/.test(href);
        });
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
}

async function waitForIssueDetailReady(page: Page): Promise<void> {
  await page
    .getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT)
    .or(page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR))
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .locator(".animate-spin")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForDocumentsReady(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        if (!/documents/i.test(text)) {
          return false;
        }

        return Array.from(document.querySelectorAll("a[href]")).some((link) => {
          const href = link.getAttribute("href") || "";
          return /\/documents\/[^/?#]+$/.test(href) && !href.endsWith("/templates");
        });
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .locator(".animate-spin")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForDocumentEditorReady(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Project Requirements") ||
          text.includes("Sprint Retrospective Notes") ||
          document.querySelector("[contenteditable='true']") !== null
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .locator(".animate-spin")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForExpectedContent(page: Page, url: string, name: string): Promise<void> {
  if (isDashboardUrl(url) || name === "dashboard") {
    await page
      .getByRole("heading", { name: /^dashboard$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .locator(".animate-shimmer")
      .first()
      .waitFor({ state: "hidden", timeout: 4000 })
      .catch(() => {});
    return;
  }

  if (isProjectBoardUrl(url)) {
    await waitForBoardReady(page);
    return;
  }

  if (isProjectSettingsUrl(url)) {
    await page
      .getByRole("heading", { name: "Project Settings" })
      .first()
      .waitFor({
        state: "visible",
        timeout: 12000,
      })
      .catch(() => {});
    return;
  }

  if (isSettingsUrl(url) || name === "settings" || name === "settings-profile") {
    await page
      .waitForURL(
        (currentUrl) => /\/[^/]+\/settings\/profile$/.test(new URL(currentUrl).pathname),
        {
          timeout: 12000,
        },
      )
      .catch(() => {});
    await page
      .getByRole("heading", { name: /^settings$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("tab", { name: /^profile$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByText(/manage your account, integrations, and preferences/i)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .locator(".animate-spin")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (isProjectsUrl(url) || name === "projects") {
    await waitForProjectsReady(page);
    return;
  }

  if (isIssueDetailUrl(url)) {
    await waitForIssueDetailReady(page);
    return;
  }

  if (name === "documents" || /\/[^/]+\/documents\/?$/.test(url)) {
    await waitForDocumentsReady(page);
    return;
  }

  if (isDocumentEditorUrl(url) || name === "document-editor") {
    await waitForDocumentEditorReady(page);
    return;
  }

  if (
    isProjectCalendarUrl(url) ||
    name === "calendar-event-modal" ||
    /^calendar-(day|week|month)$/.test(name)
  ) {
    await waitForCalendarReady(page);
  }
}

async function waitForScreenshotReady(page: Page): Promise<void> {
  await page.waitForFunction(() => document.readyState === "complete");
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  // App shell loading indicator may appear during route/query transitions.
  const loadingSpinner = page
    .getByLabel("Loading")
    .or(page.getByRole("status").filter({ has: page.locator(".animate-spin") }))
    .or(page.locator("[data-loading-spinner]"))
    .first();
  await loadingSpinner.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  // Wait two animation frames so paint/layout settles before screenshot.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

async function discoverFirstHref(page: Page, pattern: RegExp): Promise<string | null> {
  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const match = href.match(pattern);
        if (match?.[1]) return match[1];
      }
    }
  } catch {}
  return null;
}

async function discoverIssueKey(
  page: Page,
  orgSlug: string,
  projectKey: string,
): Promise<string | null> {
  const candidatePaths = [
    `/${orgSlug}/issues`,
    `/${orgSlug}/projects/${projectKey}/backlog`,
    `/${orgSlug}/projects/${projectKey}/board`,
  ];

  for (const pathName of candidatePaths) {
    await page
      .goto(`${BASE_URL}${pathName}`, { waitUntil: "domcontentloaded", timeout: 15000 })
      .catch(() => {});
    await waitForExpectedContent(page, pathName, "issues");
    await waitForScreenshotReady(page);

    const issueKey = await discoverFirstHref(page, /\/issues\/([^/?#]+)/);
    if (issueKey) {
      return issueKey;
    }
  }

  return null;
}

async function discoverDocumentId(page: Page, orgSlug: string): Promise<string | null> {
  await page
    .goto(`${BASE_URL}/${orgSlug}/documents`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, `/${orgSlug}/documents`, "documents");
  await waitForScreenshotReady(page);

  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      const match = href?.match(/\/documents\/([^/?#]+)/);
      const candidate = match?.[1];
      if (candidate && candidate !== "templates") {
        return candidate;
      }
    }
  } catch {}

  return null;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function autoLogin(page: Page): Promise<string | null> {
  console.log("    Creating test user...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );
  if (!createResult.success) {
    console.error(`    Failed to create user: ${createResult.error}`);
    return null;
  }
  console.log(`    User ready: ${SCREENSHOT_USER.email}`);

  console.log("    Logging in via API...");
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );
  if (!(loginResult.success && loginResult.token)) {
    console.error(`    API login failed: ${loginResult.error}`);
    return null;
  }

  await page.goto(`${BASE_URL}/signin`, { waitUntil: "domcontentloaded" });

  await page.evaluate(
    ({ token, refreshToken, convexUrl }) => {
      localStorage.setItem("convexAuthToken", token);
      if (refreshToken) {
        localStorage.setItem("convexAuthRefreshToken", refreshToken);
      }
      if (convexUrl) {
        const ns = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
        localStorage.setItem(`__convexAuthJWT_${ns}`, token);
        if (refreshToken) {
          localStorage.setItem(`__convexAuthRefreshToken_${ns}`, refreshToken);
        }
      }
    },
    {
      token: loginResult.token,
      refreshToken: loginResult.refreshToken ?? null,
      convexUrl: CONVEX_URL,
    },
  );

  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForURL((u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname), {
      timeout: 20000,
    });
  } catch {
    console.error("    Login redirect timed out. Current URL:", page.url());
    return null;
  }

  await waitForScreenshotReady(page);
  const orgSlug = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
  console.log(`    Logged in. Org: ${orgSlug}`);
  return orgSlug;
}

// ---------------------------------------------------------------------------
// Screenshot passes
// ---------------------------------------------------------------------------

async function screenshotPublicPages(page: Page): Promise<void> {
  console.log("    --- Public pages ---");
  await takeScreenshot(page, "public", "landing", "/");
  await takeScreenshot(page, "public", "signin", "/signin");
  await takeScreenshot(page, "public", "signup", "/signup");
  await takeScreenshot(page, "public", "forgot-password", "/forgot-password");
  await takeScreenshot(page, "public", "invite-invalid", "/invite/screenshot-test-token");
}

async function screenshotEmptyStates(page: Page, orgSlug: string): Promise<void> {
  console.log("    --- Empty states ---");
  const p = "empty";
  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);
}

async function screenshotFilledStates(
  page: Page,
  orgSlug: string,
  seed: SeedScreenshotResult,
): Promise<void> {
  console.log("    --- Filled states ---");
  const p = "filled";

  // Top-level pages
  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);

  await screenshotDashboardModals(page, orgSlug, p);
  await screenshotProjectsModal(page, orgSlug, p);

  // Project sub-pages
  const projectKey = seed.projectKey;
  const firstIssueKey = seed.issueKeys?.[0];
  if (projectKey) {
    const tabs = [
      "board",
      "backlog",
      "sprints",
      "roadmap",
      "calendar",
      "activity",
      "analytics",
      "billing",
      "timesheet",
      "settings",
    ];
    for (const tab of tabs) {
      await takeScreenshot(
        page,
        p,
        `project-${projectKey.toLowerCase()}-${tab}`,
        `/${orgSlug}/projects/${projectKey}/${tab}`,
      );
    }

    await screenshotBoardModals(page, orgSlug, projectKey, firstIssueKey, p);

    // Calendar view modes
    const calendarUrl = `/${orgSlug}/projects/${projectKey}/calendar`;
    try {
      await page.goto(`${BASE_URL}${calendarUrl}`, { waitUntil: "networkidle", timeout: 15000 });
    } catch {}
    await waitForScreenshotReady(page);
    const isCalendarReady = await waitForCalendarReady(page);
    if (!isCalendarReady) {
      console.log("    ⚠️  [filled] calendar not ready, skipping mode-specific screenshots");
    } else {
      // Calendar view-mode screenshots: day, week, month
      const calendarModeTestIds = {
        day: TEST_IDS.CALENDAR.MODE_DAY,
        week: TEST_IDS.CALENDAR.MODE_WEEK,
        month: TEST_IDS.CALENDAR.MODE_MONTH,
      } as const;
      for (const mode of ["day", "week", "month"] as const) {
        const toggleItem = page.getByTestId(calendarModeTestIds[mode]);
        // Retry up to 3 times if toggle not found
        for (let attempt = 0; attempt < 3; attempt++) {
          if ((await toggleItem.count()) > 0) break;
          await page.waitForTimeout(500);
        }
        if ((await toggleItem.count()) === 0) {
          throw new Error(`[${p}] calendar-${mode} toggle not found after retries`);
        }
        await toggleItem.first().click();
        await waitForScreenshotReady(page);
        const modeReady = await waitForCalendarReady(page);
        if (!modeReady) {
          throw new Error(`[${p}] calendar-${mode} not ready after mode switch`);
        }
        const n = nextIndex(p);
        const num = String(n).padStart(2, "0");
        const screenshotPath = getScreenshotPath(p, `calendar-${mode}`);
        await page.screenshot({ path: screenshotPath });
        totalScreenshots++;
        const relativePath = path.relative(process.cwd(), screenshotPath);
        console.log(`    ${num}  [${p}] calendar-${mode} → ${relativePath}`);
      }

      await runCaptureStep("calendar event-detail modal", async () => {
        const openDayView = async (): Promise<void> => {
          const dayToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_DAY);
          if ((await dayToggle.count()) > 0) {
            await dayToggle.first().click();
            await waitForScreenshotReady(page);
            await waitForCalendarReady(page);
          }
        };

        const locateEvent = () => page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();

        let eventItem = locateEvent();
        if (typeof seed.workspaceSlug === "string") {
          await page
            .goto(`${BASE_URL}/${orgSlug}/workspaces/${seed.workspaceSlug}/calendar`, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            })
            .catch(() => {});
          await waitForScreenshotReady(page);
          const workspaceCalendarReady = await waitForCalendarReady(page);
          if (workspaceCalendarReady) {
            await openDayView();
            eventItem = locateEvent();
          }
        } else {
          await openDayView();
          eventItem = locateEvent();
        }

        if (!(await waitForCalendarEvents(page))) {
          throw new Error(`[${p}] No calendar events found for modal screenshot`);
        }

        eventItem = locateEvent();
        await eventItem.scrollIntoViewIfNeeded().catch(() => {});
        await eventItem.click({ force: true });
        const dialog = page.getByTestId(TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL);
        await dialog.waitFor({ state: "visible", timeout: 5000 });
        await captureCurrentView(page, p, "calendar-event-modal");
        await dismissIfOpen(page, dialog);
      });
    }
  }

  // Issue detail
  const firstIssue = (await discoverIssueKey(page, orgSlug, projectKey)) ?? seed.issueKeys?.[0];
  if (firstIssue) {
    await takeScreenshot(
      page,
      p,
      `issue-${firstIssue.toLowerCase()}`,
      `/${orgSlug}/issues/${firstIssue}`,
    );
  }

  // Workspace & team pages
  const wsSlug = seed.workspaceSlug;
  const teamSlug = seed.teamSlug;

  if (wsSlug) {
    const wsBase = `/${orgSlug}/workspaces/${wsSlug}`;
    await takeScreenshot(page, p, `workspace-${wsSlug}`, wsBase);
    await takeScreenshot(page, p, `workspace-${wsSlug}-settings`, `${wsBase}/settings`);

    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      const teamBase = `${wsBase}/teams/${resolvedTeam}`;
      await takeScreenshot(page, p, `team-${resolvedTeam}`, teamBase);
      for (const tab of ["board", "calendar", "settings"] as const) {
        await takeScreenshot(page, p, `team-${resolvedTeam}-${tab}`, `${teamBase}/${tab}`);
      }
    }
  }

  // Document editor
  const docId = await discoverDocumentId(page, orgSlug);
  if (docId) {
    await takeScreenshot(page, p, "document-editor", `/${orgSlug}/documents/${docId}`);
  }
}

async function screenshotDashboardModals(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  await page
    .goto(`${BASE_URL}/${orgSlug}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, `/${orgSlug}/dashboard`, "dashboard");
  await waitForScreenshotReady(page);

  const omniboxTrigger = page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON);
  const omniboxDialog = page.getByTestId(TEST_IDS.SEARCH.MODAL);
  if ((await omniboxTrigger.count()) > 0) {
    await runCaptureStep("dashboard omnibox", async () => {
      await openOmnibox(page, omniboxTrigger, omniboxDialog);
      await captureCurrentView(page, prefix, "dashboard-omnibox");
      await dismissIfOpen(page, omniboxDialog);
    });

    await runCaptureStep("dashboard advanced-search modal", async () => {
      try {
        await openOmnibox(page, omniboxTrigger, omniboxDialog);
        const advancedSearchButton = omniboxDialog.getByRole("button", {
          name: /^advanced search$/i,
        });
        await advancedSearchButton.waitFor({ state: "visible", timeout: 5000 });
        await advancedSearchButton.click();
        await omniboxDialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
        const advancedSearchDialog = page.getByTestId(TEST_IDS.SEARCH.ADVANCED_MODAL);
        await advancedSearchDialog.waitFor({ state: "visible", timeout: 5000 });
        await captureCurrentView(page, prefix, "dashboard-advanced-search-modal");
        await dismissIfOpen(page, advancedSearchDialog);
      } finally {
        await dismissIfOpen(page, omniboxDialog);
      }
    });
  }

  const shortcutsTrigger = page.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
  if (
    (await shortcutsTrigger.count()) > 0 &&
    (await shortcutsTrigger
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    await runCaptureStep("dashboard shortcuts modal", async () => {
      await dismissAllDialogs(page);
      await shortcutsTrigger.click();
      const shortcutsDialog = page.getByRole("dialog", { name: /keyboard shortcuts/i });
      await shortcutsDialog.waitFor({ state: "visible", timeout: 5000 });
      await captureCurrentView(page, prefix, "dashboard-shortcuts-modal");
      await dismissIfOpen(page, shortcutsDialog);
    });
  }

  const timeEntryTrigger = page.getByRole("button", { name: /^start timer$/i }).first();
  if ((await timeEntryTrigger.count()) > 0) {
    await runCaptureStep("dashboard time-entry modal", async () => {
      await dismissAllDialogs(page);
      await timeEntryTrigger.click();
      const timeEntryDialog = page.getByRole("dialog", { name: /^start timer$/i });
      await timeEntryDialog.waitFor({ state: "visible", timeout: 5000 });
      await captureCurrentView(page, prefix, "dashboard-time-entry-modal");
      await dismissIfOpen(page, timeEntryDialog);
    });
  }
}

async function screenshotProjectsModal(page: Page, orgSlug: string, prefix: string): Promise<void> {
  await page
    .goto(`${BASE_URL}/${orgSlug}/projects`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);

  if ((await projectsPage.newProjectButton.count()) === 0) {
    return;
  }

  await runCaptureStep("projects create-project modal", async () => {
    await projectsPage.openCreateProjectForm();
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "projects-create-project-modal");
    await projectsPage.closeCreateProjectFormIfOpen();
  });
}

async function screenshotBoardModals(
  page: Page,
  orgSlug: string,
  projectKey: string,
  issueKey: string | undefined,
  prefix: string,
): Promise<void> {
  const boardUrl = `/${orgSlug}/projects/${projectKey}/board`;
  await page
    .goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, boardUrl, "board");
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);
  if ((await projectsPage.createIssueButton.count()) > 0) {
    await runCaptureStep("board create-issue modal", async () => {
      await dismissAllDialogs(page);
      await projectsPage.openCreateIssueModal();
      const createIssueDialog = projectsPage.createIssueModal;
      const formReadySignal = projectsPage.issueTitleInput
        .or(projectsPage.submitIssueButton)
        .or(createIssueDialog.getByRole("button", { name: /get ai suggestions/i }))
        .or(projectsPage.issueTypeSelect)
        .first();
      await formReadySignal.waitFor({ state: "visible", timeout: 12000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${projectKey.toLowerCase()}-create-issue-modal`,
      );
      await dismissIfOpen(page, createIssueDialog);
    });
  }

  let issueCard = page.getByTestId(TEST_IDS.ISSUE.CARD).first();
  if (issueKey) {
    const matchingIssueCard = page
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .filter({ hasText: issueKey })
      .first();
    if ((await matchingIssueCard.count()) > 0) {
      issueCard = matchingIssueCard;
    }
  }

  if ((await issueCard.count()) > 0) {
    await runCaptureStep("board issue-detail modal", async () => {
      await issueCard.scrollIntoViewIfNeeded().catch(() => {});
      await issueCard.click({ force: true });
      const issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
      await issueDetailDialog.waitFor({ state: "visible", timeout: 5000 });
      await captureCurrentView(
        page,
        prefix,
        `project-${projectKey.toLowerCase()}-issue-detail-modal`,
      );
      await dismissIfOpen(page, issueDetailDialog);
    });
  }
}

// ---------------------------------------------------------------------------
// Main capture function for a single viewport/theme combination
// ---------------------------------------------------------------------------

async function captureForConfig(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  seedResult: SeedScreenshotResult,
): Promise<void> {
  currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height})`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
  });
  const page = await context.newPage();

  // Public pages (no auth needed)
  await screenshotPublicPages(page);

  // Inject auth tokens
  await page.goto(`${BASE_URL}/signin`, { waitUntil: "domcontentloaded" });
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );

  if (loginResult.success && loginResult.token) {
    await page.evaluate(
      ({ token, refreshToken, convexUrl }) => {
        localStorage.setItem("convexAuthToken", token);
        if (refreshToken) localStorage.setItem("convexAuthRefreshToken", refreshToken);
        if (convexUrl) {
          const ns = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
          localStorage.setItem(`__convexAuthJWT_${ns}`, token);
          if (refreshToken) localStorage.setItem(`__convexAuthRefreshToken_${ns}`, refreshToken);
        }
      },
      {
        token: loginResult.token,
        refreshToken: loginResult.refreshToken ?? null,
        convexUrl: CONVEX_URL,
      },
    );

    await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForURL(
        (u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname),
        { timeout: 15000 },
      );
      await waitForScreenshotReady(page);

      // Empty states (before seed data is visible in this context)
      await screenshotEmptyStates(page, orgSlug);

      // Filled states
      await screenshotFilledStates(page, orgSlug, seedResult);
    } catch {
      console.log(`    ⚠️ Auth failed for ${currentConfigPrefix}, skipping authenticated pages`);
    }
  }

  await context.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  // Clean screenshot folders in spec directories
  const specFolders = Object.values(PAGE_TO_SPEC_FOLDER);
  for (const folder of [...new Set(specFolders)]) {
    const screenshotDir = path.join(SPECS_BASE_DIR, folder, "screenshots");
    if (fs.existsSync(screenshotDir)) {
      // Only remove generated screenshots (viewport-theme.png), keep reference-* files
      const files = fs.readdirSync(screenshotDir);
      for (const file of files) {
        if (!file.startsWith("reference-") && file.endsWith(".png")) {
          fs.unlinkSync(path.join(screenshotDir, file));
        }
      }
    }
  }

  // Clean fallback directory
  if (fs.existsSync(FALLBACK_SCREENSHOT_DIR)) {
    fs.rmSync(FALLBACK_SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(FALLBACK_SCREENSHOT_DIR, { recursive: true });

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         NIXELO SCREENSHOT CAPTURE                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n  Base URL: ${BASE_URL}`);
  console.log(`  Configs: ${CONFIGS.map((c) => `${c.viewport}-${c.theme}`).join(", ")}`);
  console.log(`  Spec folders: ${[...new Set(specFolders)].join(", ")}`);

  const headless = !process.argv.includes("--headed");
  const browser = await chromium.launch({ headless });

  // Setup: Create test user and seed data once
  console.log("\n  🔧 Setting up test data...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );
  if (!createResult.success) {
    console.error(`  ❌ Failed to create user: ${createResult.error}`);
    await browser.close();
    return;
  }
  console.log(`  ✓ User: ${SCREENSHOT_USER.email}`);

  // Get org slug via initial login
  const setupContext = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    colorScheme: "dark",
    timezoneId: E2E_TIMEZONE,
  });
  const setupPage = await setupContext.newPage();
  const orgSlug = await autoLogin(setupPage);
  await setupContext.close();

  if (!orgSlug) {
    console.error("  ❌ Could not authenticate. Aborting.");
    await browser.close();
    return;
  }

  // Seed data for filled states
  console.log("  Seeding screenshot data...");
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email);
  if (seedResult.success) {
    console.log(
      `  ✓ Seeded: project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}`,
    );
  } else {
    console.log(`  ⚠️ Seed failed: ${seedResult.error} (continuing anyway)`);
  }

  // Capture configured combinations
  for (const config of CONFIGS) {
    await captureForConfig(browser, config.viewport, config.theme, orgSlug, seedResult);
  }

  await browser.close();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ COMPLETE: ${totalScreenshots} screenshots captured`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Summary - count files in each location
  console.log("  Output:");
  const uniqueSpecFolders = [...new Set(Object.values(PAGE_TO_SPEC_FOLDER))];
  for (const folder of uniqueSpecFolders) {
    const screenshotDir = path.join(SPECS_BASE_DIR, folder, "screenshots");
    if (fs.existsSync(screenshotDir)) {
      const files = fs
        .readdirSync(screenshotDir)
        .filter((f) => f.endsWith(".png") && !f.startsWith("reference-"));
      if (files.length > 0) {
        console.log(`    ${folder}/screenshots/ (${files.length} screenshots)`);
      }
    }
  }
  if (fs.existsSync(FALLBACK_SCREENSHOT_DIR)) {
    const fallbackFiles = fs.readdirSync(FALLBACK_SCREENSHOT_DIR).filter((f) => f.endsWith(".png"));
    if (fallbackFiles.length > 0) {
      console.log(`    e2e/screenshots/ (${fallbackFiles.length} screenshots without specs)`);
    }
  }
  console.log("");
}

run().catch(console.error);
