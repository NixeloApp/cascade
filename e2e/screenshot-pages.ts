/**
 * Visual screenshot tool for reviewing all app pages.
 *
 * Captures screenshots across viewport/theme combinations:
 *   - desktop-dark (1920x1080)
 *   - desktop-light (1920x1080)
 *   - tablet-light (768x1024)
 *   - mobile-light (390x844)
 *
 * Output: e2e/screenshots/ (flat folder, files prefixed with viewport-theme)
 *
 * Usage:
 *   pnpm screenshots              # capture all
 *   pnpm screenshots -- --headed  # visible browser
 *
 * Requires dev server running (pnpm dev).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type Browser, chromium, type Page } from "@playwright/test";
import { TEST_IDS } from "../src/lib/test-ids";
import { TEST_USERS } from "./config";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SCREENSHOT_BASE_DIR = path.join(process.cwd(), "e2e", "screenshots");
const SETTLE_MS = 2000;

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

async function takeScreenshot(
  page: Page,
  prefix: string,
  name: string,
  url: string,
): Promise<void> {
  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const filename = `${currentConfigPrefix}-${num}-${prefix}-${name}.png`;
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    // networkidle often times out on real-time apps -- page is still usable
  }
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: path.join(SCREENSHOT_BASE_DIR, filename) });
  totalScreenshots++;
  console.log(`    ${num}  [${prefix}] ${name}`);
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

  await page.waitForTimeout(2000);
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

  // Project sub-pages
  const projectKey = seed.projectKey;
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

    // Calendar view modes
    const calendarUrl = `/${orgSlug}/projects/${projectKey}/calendar`;
    try {
      await page.goto(`${BASE_URL}${calendarUrl}`, { waitUntil: "networkidle", timeout: 15000 });
    } catch {}
    await page.waitForTimeout(SETTLE_MS);

    // Calendar view-mode screenshots: day, week, month
    const calendarModeTestIds = {
      day: TEST_IDS.CALENDAR.MODE_DAY,
      week: TEST_IDS.CALENDAR.MODE_WEEK,
      month: TEST_IDS.CALENDAR.MODE_MONTH,
    } as const;
    for (const mode of ["day", "week", "month"] as const) {
      const toggleItem = page.getByTestId(calendarModeTestIds[mode]);
      if ((await toggleItem.count()) > 0) {
        await toggleItem.first().click();
        await page.waitForTimeout(SETTLE_MS);
      }
      const n = nextIndex(p);
      const num = String(n).padStart(2, "0");
      const filename = `${currentConfigPrefix}-${num}-${p}-calendar-${mode}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_BASE_DIR, filename) });
      totalScreenshots++;
      console.log(`    ${num}  [${p}] calendar-${mode}`);
    }

    // Event details modal screenshot — click first visible calendar event
    // Switch back to week view for the modal screenshot (events are most visible)
    const weekToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK);
    if ((await weekToggle.count()) > 0) {
      await weekToggle.first().click();
      await page.waitForTimeout(SETTLE_MS);
    }
    // Events are rendered as tabIndex={0} divs with event titles
    const eventEl = page
      .locator("[tabindex='0']")
      .filter({ hasText: /Sprint Planning|Design Review|Focus Time|Standup/i });
    if ((await eventEl.count()) > 0) {
      await eventEl.first().click();
      await page.waitForTimeout(SETTLE_MS);
      const n = nextIndex(p);
      const num = String(n).padStart(2, "0");
      const filename = `${currentConfigPrefix}-${num}-${p}-calendar-event-modal.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_BASE_DIR, filename) });
      totalScreenshots++;
      console.log(`    ${num}  [${p}] calendar-event-modal`);

      // Close the modal via Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  }

  // Issue detail
  const firstIssue = seed.issueKeys?.[0];
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
  await page
    .goto(`${BASE_URL}/${orgSlug}/documents`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  const docId = await discoverFirstHref(page, /\/documents\/([a-z0-9]+)/);
  if (docId) {
    await takeScreenshot(page, p, "document-editor", `/${orgSlug}/documents/${docId}`);
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
      await page.waitForTimeout(1500);

      // Empty states (before seed data is visible in this context)
      await screenshotEmptyStates(page, orgSlug);

      // Filled states
      await screenshotFilledStates(page, orgSlug, seedResult);
    } catch {
      console.log(`    ⚠️ Auth failed for ${dirName}, skipping authenticated pages`);
    }
  }

  await context.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  // Clean and recreate base directory
  if (fs.existsSync(SCREENSHOT_BASE_DIR)) {
    fs.rmSync(SCREENSHOT_BASE_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_BASE_DIR, { recursive: true });

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         NIXELO SCREENSHOT CAPTURE                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n  Base URL: ${BASE_URL}`);
  console.log(`  Configs: ${CONFIGS.map((c) => `${c.viewport}-${c.theme}`).join(", ")}`);

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

  // Summary
  const files = fs.readdirSync(SCREENSHOT_BASE_DIR).filter((f) => f.endsWith(".png"));
  console.log(`  Output: ${SCREENSHOT_BASE_DIR}/ (${files.length} files)`);
  console.log("");
}

run().catch(console.error);
