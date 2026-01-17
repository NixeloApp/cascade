import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS } from "../config";
import { ProjectsPage, WorkspacesPage } from "../pages";

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

function getAuthPath(role: UserRole, workerIndex = 0): string {
  const paths: Record<UserRole, string> = {
    admin: AUTH_PATHS.teamLead(workerIndex),
    editor: AUTH_PATHS.teamMember(workerIndex),
    viewer: AUTH_PATHS.viewer(workerIndex),
  };
  const filename = path.basename(paths[role]);
  const fullPath = path.join(AUTH_DIR, filename);
  return fullPath;
}

function assertAuthStateValid(role: UserRole, workerIndex = 0): void {
  const authPath = getAuthPath(role, workerIndex);
  if (!fs.existsSync(authPath)) {
    throw new Error(`[AuthState] File not found: ${authPath} (Worker: ${workerIndex})`);
  }
  try {
    const content = fs.readFileSync(authPath, "utf-8");
    const state = JSON.parse(content);
    if (state.origins && Array.isArray(state.origins)) {
      for (const origin of state.origins) {
        if (origin.localStorage && Array.isArray(origin.localStorage)) {
          const hasAuthToken = origin.localStorage.some(
            (item: { name: string }) =>
              item.name.includes("auth") ||
              item.name.includes("token") ||
              item.name.includes("convex"),
          );
          if (hasAuthToken) return;
        }
      }
    }
    throw new Error(`[AuthState] Token not found in structure. Path: ${authPath}`);
  } catch (e) {
    throw new Error(`[AuthState] Exception: ${(e as Error).message}. Path: ${authPath}`);
  }
}

export type RbacFixtures = {
  adminContext: BrowserContext;
  adminPage: Page;
  adminProjectsPage: ProjectsPage;
  adminWorkspacesPage: WorkspacesPage;

  editorContext: BrowserContext;
  editorPage: Page;
  editorProjectsPage: ProjectsPage;
  editorWorkspacesPage: WorkspacesPage;

  viewerContext: BrowserContext;
  viewerPage: Page;
  viewerProjectsPage: ProjectsPage;
  viewerWorkspacesPage: WorkspacesPage;

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
    const authPath = getAuthPath("admin", workerIndex);
    assertAuthStateValid("admin", workerIndex);

    const context = await browser.newContext({ storageState: authPath });
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "admin";
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._workerIndex =
      workerIndex;
    await use(context);
    await context.close();
  },
  editorContext: async ({ browser }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    assertAuthStateValid("editor", workerIndex);
    const authPath = getAuthPath("editor", workerIndex);
    const context = await browser.newContext({ storageState: authPath });
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "editor";
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._workerIndex =
      workerIndex;
    await use(context);
    await context.close();
  },
  viewerContext: async ({ browser }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    assertAuthStateValid("viewer", workerIndex);
    const authPath = getAuthPath("viewer", workerIndex);
    const context = await browser.newContext({ storageState: authPath });
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._role = "viewer";
    (context as BrowserContext & { _role?: string; _workerIndex?: number })._workerIndex =
      workerIndex;
    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  adminProjectsPage: async ({ adminPage }, use) => {
    // Add re-auth check for admin (handle redirect to landing page)
    const targetUrl = adminPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await adminPage.goto("/nixelo-e2e/dashboard");
      await adminPage.waitForLoadState("networkidle");
      await adminPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(adminPage));
  },
  adminWorkspacesPage: async ({ adminPage }, use) => {
    await use(new WorkspacesPage(adminPage));
  },

  editorPage: async ({ editorContext }, use) => {
    const page = await editorContext.newPage();
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  editorProjectsPage: async ({ editorPage }, use) => {
    // Add re-auth check for editor
    const targetUrl = editorPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await editorPage.goto("/nixelo-e2e/dashboard");
      await editorPage.waitForLoadState("networkidle");
      await editorPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(editorPage));
  },
  editorWorkspacesPage: async ({ editorPage }, use) => {
    await use(new WorkspacesPage(editorPage));
  },

  viewerPage: async ({ viewerContext }, use) => {
    const page = await viewerContext.newPage();
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));
    await use(page);
    await page.close();
  },
  viewerProjectsPage: async ({ viewerPage }, use) => {
    // Add re-auth check for viewer
    const targetUrl = viewerPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await viewerPage.goto("/nixelo-e2e/dashboard");
      await viewerPage.waitForLoadState("networkidle");
      await viewerPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(viewerPage));
  },
  viewerWorkspacesPage: async ({ viewerPage }, use) => {
    await use(new WorkspacesPage(viewerPage));
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
        const authPath = getAuthPath(role, workerIndex);
        try {
          const authContent = JSON.parse(fs.readFileSync(authPath, "utf-8"));
          const originState = authContent.origins?.[0];

          if (originState?.localStorage) {
            // Convex uses dynamic keys like __convexAuthJWT_httpsmajestic...
            // Find any key that looks like a JWT store
            const convexJwt = originState.localStorage.find(
              (item: { name: string; value: string }) => item.name.includes("__convexAuthJWT_"),
            );

            if (convexJwt) {
              console.log(
                `[Test Manual] Preparing initScript for ${role} (Worker ${workerIndex})...`,
              );
              // Use context.addInitScript to inject token before ANY page code runs
              // This is much faster and more reliable than navigating to / first
              await page.context().addInitScript(
                ({ name, value }) => {
                  window.localStorage.setItem(name, value);
                },
                { name: convexJwt.name, value: convexJwt.value },
              );
            } else {
              console.warn(`[Test Manual] No JWT found in ${authPath}`);
            }
          }
        } catch (e) {
          console.error(`[Test Manual] Token prep failed: ${(e as Error)?.message || e}`);
        }
      }

      console.log(`Navigating to ${targetUrl}...`);
      await page.goto(targetUrl);

      // 2. Wait for Convex WebSocket synchronization
      await page
        .waitForFunction(
          () => {
            const convex = (
              window as Window & {
                __convex_test_client?: { connectionState: () => { isWebSocketConnected: boolean } };
              }
            ).__convex_test_client;
            return convex?.connectionState().isWebSocketConnected;
          },
          { timeout: 15000 },
        )
        .catch(() => {
          console.warn("⚠️ Convex WebSocket timed out, proceeding anyway...");
        });

      // Final check: URL should contain /board
      await expect(page).toHaveURL(/.*\/board/, { timeout: 15000 });
      console.log(`✓ Navigated to ${page.url()}`);
    };
    await use(goto);
  },
});

export { expect };

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
