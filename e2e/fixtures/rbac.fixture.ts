import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS } from "../config";
import { E2E_TIMEZONE } from "../constants";
import { ProjectsPage, SettingsPage, WorkspacesPage } from "../pages";
import { loginFixtureUserWithRepair } from "../utils/fixture-auth";
import { ensureAuthenticatedDashboardReady, waitForConvexConnectionReady } from "../utils/wait-helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const RBAC_CONFIG_DIR = AUTH_DIR;

function getRbacConfig(workerIndex = 0): { projectKey: string; orgSlug: string } {
  try {
    const configPath = path.join(RBAC_CONFIG_DIR, `rbac-config-${workerIndex}.json`);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const config: SavedRbacConfig = JSON.parse(content);
      if (config.projectKey && config.orgSlug) {
        return { projectKey: config.projectKey, orgSlug: config.orgSlug };
      }
    }
  } catch {}
  return { projectKey: RBAC_TEST_CONFIG.projectKey, orgSlug: RBAC_TEST_CONFIG.orgSlug };
}

function _getAuthPath(role: UserRole, workerIndex = 0): string {
  const paths: Record<UserRole, string> = {
    admin: AUTH_PATHS.teamLead(workerIndex),
    editor: AUTH_PATHS.teamMember(workerIndex),
    viewer: AUTH_PATHS.viewer(workerIndex),
  };
  const filename = path.basename(paths[role]);
  const fullPath = path.join(AUTH_DIR, filename);
  return fullPath;
}

export type RbacFixtures = {
  adminContext: BrowserContext;
  adminPage: Page;
  adminProjectsPage: ProjectsPage;
  adminWorkspacesPage: WorkspacesPage;
  adminSettingsPage: SettingsPage;

  editorContext: BrowserContext;
  editorPage: Page;
  editorProjectsPage: ProjectsPage;
  editorWorkspacesPage: WorkspacesPage;
  editorSettingsPage: SettingsPage;

  viewerContext: BrowserContext;
  viewerPage: Page;
  viewerProjectsPage: ProjectsPage;
  viewerWorkspacesPage: WorkspacesPage;
  viewerSettingsPage: SettingsPage;

  rbacProjectKey: string;
  rbacProjectUrl: string;
  rbacOrgSlug: string;
  gotoRbacProject: (page: Page) => Promise<void>;
};

// Helper for client-side navigation to preserve WebSocket connection
export async function clientSideNavigate(page: Page, url: string) {
  await page.evaluate((targetUrl) => {
    // "Black-box" navigation: Simulate a user clicking a link.
    // This works with TanStack Router (which intercepts clicks)
    // without needing to expose internal instances.
    const a = document.createElement("a");
    a.href = targetUrl;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, url);
}

export const rbacTest = base.extend<RbacFixtures>({
  adminContext: async ({ browser }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    const context = await browser.newContext({ timezoneId: E2E_TIMEZONE });

    // Calculate email for this worker
    const workerSuffix = `w${workerIndex}`;
    const email = TEST_USERS.teamLead.email.replace("@", `-${workerSuffix}@`);

    console.log(`  🔐 adminContext: Logging in as ${email}...`);
    await loginFixtureUserWithRepair(
      context,
      { ...TEST_USERS.teamLead, email },
      "RBAC bootstrap",
    );

    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "admin";
    (context as BrowserContext & { _workerIndex?: number })._workerIndex = workerIndex;

    await use(context);
    await context.close();
  },
  editorContext: async ({ browser }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    const context = await browser.newContext({ timezoneId: E2E_TIMEZONE });

    const workerSuffix = `w${workerIndex}`;
    const email = TEST_USERS.teamMember.email.replace("@", `-${workerSuffix}@`);

    console.log(`  🔐 editorContext: Logging in as ${email}...`);
    await loginFixtureUserWithRepair(
      context,
      { ...TEST_USERS.teamMember, email },
      "RBAC bootstrap",
    );

    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "editor";
    (context as BrowserContext & { _workerIndex?: number })._workerIndex = workerIndex;

    await use(context);
    await context.close();
  },
  viewerContext: async ({ browser }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    const context = await browser.newContext({ timezoneId: E2E_TIMEZONE });

    const workerSuffix = `w${workerIndex}`;
    const email = TEST_USERS.viewer.email.replace("@", `-${workerSuffix}@`);

    console.log(`  🔐 viewerContext: Logging in as ${email}...`);
    await loginFixtureUserWithRepair(
      context,
      { ...TEST_USERS.viewer, email },
      "RBAC bootstrap",
    );

    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "viewer";
    (context as BrowserContext & { _workerIndex?: number })._workerIndex = workerIndex;

    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage(); // Setup console listener
    page.on("console", (msg) => {
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    });
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  adminProjectsPage: async ({ adminPage, rbacOrgSlug }, use) => {
    await ensureAuthenticatedDashboardIfNeeded(adminPage, rbacOrgSlug);
    await use(new ProjectsPage(adminPage, rbacOrgSlug));
  },
  adminWorkspacesPage: async ({ adminPage, rbacOrgSlug }, use) => {
    await use(new WorkspacesPage(adminPage, rbacOrgSlug));
  },
  adminSettingsPage: async ({ adminPage, rbacOrgSlug }, use) => {
    await use(new SettingsPage(adminPage, rbacOrgSlug));
  },

  editorPage: async ({ editorContext }, use) => {
    const page = await editorContext.newPage();
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  editorProjectsPage: async ({ editorPage, rbacOrgSlug }, use) => {
    await ensureAuthenticatedDashboardIfNeeded(editorPage, rbacOrgSlug);
    await use(new ProjectsPage(editorPage, rbacOrgSlug));
  },
  editorWorkspacesPage: async ({ editorPage, rbacOrgSlug }, use) => {
    await use(new WorkspacesPage(editorPage, rbacOrgSlug));
  },
  editorSettingsPage: async ({ editorPage, rbacOrgSlug }, use) => {
    await use(new SettingsPage(editorPage, rbacOrgSlug));
  },

  viewerPage: async ({ viewerContext }, use) => {
    const page = await viewerContext.newPage();
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  viewerProjectsPage: async ({ viewerPage, rbacOrgSlug }, use) => {
    await ensureAuthenticatedDashboardIfNeeded(viewerPage, rbacOrgSlug);
    await use(new ProjectsPage(viewerPage, rbacOrgSlug));
  },
  viewerWorkspacesPage: async ({ viewerPage, rbacOrgSlug }, use) => {
    await use(new WorkspacesPage(viewerPage, rbacOrgSlug));
  },
  viewerSettingsPage: async ({ viewerPage, rbacOrgSlug }, use) => {
    await use(new SettingsPage(viewerPage, rbacOrgSlug));
  },

  rbacProjectKey: async ({}, use, testInfo) => {
    await use(getRbacConfig(testInfo.parallelIndex).projectKey);
  },

  rbacOrgSlug: async ({}, use, testInfo) => {
    await use(getRbacConfig(testInfo.parallelIndex).orgSlug);
  },
  rbacProjectUrl: async ({ rbacOrgSlug, rbacProjectKey }, use) => {
    await use(`/${rbacOrgSlug}/projects/${rbacProjectKey}/board`);
  },

  gotoRbacProject: async ({ rbacOrgSlug, rbacProjectKey }, use) => {
    const goto = async (page: Page) => {
      const targetUrl = `/${rbacOrgSlug}/projects/${rbacProjectKey}/board`;

      // 1. Identify role and prepare JWT
      const role = (page.context() as BrowserContext & { _role?: string })._role as UserRole;
      const workerIndex =
        (page.context() as BrowserContext & { _workerIndex?: number })._workerIndex ?? 0;

      if (role) {
        // Tokens already injected via context.addInitScript in context fixture
        console.log(`  ✓ Auth ready for ${role} (Worker ${workerIndex})`);
      }

      console.log(`Navigating to ${targetUrl}...`);
      await page.goto(targetUrl);

      // 2. Wait for Convex WebSocket synchronization
      if (!(await waitForConvexConnectionReady(page))) {
        console.warn("⚠️ Convex WebSocket timed out, proceeding anyway...");
      }

      // Final check: URL should contain /board
      await expect(page).toHaveURL(/.*\/board/);
      console.log(`✓ Navigated to ${page.url()}`);
    };
    await use(goto);
  },
});

export { expect };

async function ensureAuthenticatedDashboardIfNeeded(page: Page, orgSlug: string): Promise<void> {
  const targetUrl = page.url();
  if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
    await ensureAuthenticatedDashboardReady(page, orgSlug);
  }
}

export function hasAdminAuth(workerIndex = 0): boolean {
  try {
    assertAuthStateValid("admin", workerIndex);
    return true;
  } catch {
    return false;
  }
}
export function hasEditorAuth(workerIndex = 0): boolean {
  try {
    assertAuthStateValid("editor", workerIndex);
    return true;
  } catch {
    return false;
  }
}
export function hasViewerAuth(workerIndex = 0): boolean {
  try {
    assertAuthStateValid("viewer", workerIndex);
    return true;
  } catch {
    return false;
  }
}

export const RBAC_USERS = {
  admin: { email: TEST_USERS.teamLead.email, role: "admin" as const, description: "Project admin" },
  editor: { email: TEST_USERS.teamMember.email, role: "editor" as const, description: "Editor" },
  viewer: { email: TEST_USERS.viewer.email, role: "viewer" as const, description: "Viewer" },
};
