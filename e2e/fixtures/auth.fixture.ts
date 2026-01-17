import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect, type Page } from "@playwright/test";
import { AUTH_PATHS, TEST_USERS } from "../config";
import {
  AuthPage,
  CalendarPage,
  DashboardPage,
  DocumentsPage,
  LandingPage,
  OnboardingPage,
  ProjectsPage,
  SettingsPage,
  WorkspacesPage,
} from "../pages";
import { trySignInUser } from "../utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");

function getAuthStatePath(workerIndex = 0): string {
  return path.join(AUTH_DIR, path.basename(AUTH_PATHS.teamLead(workerIndex)));
}

function getOnboardingAuthStatePath(workerIndex = 0): string {
  return path.join(AUTH_DIR, path.basename(AUTH_PATHS.onboarding(workerIndex)));
}

function loadDashboardConfig(workerIndex = 0): { orgSlug: string; email: string } | null {
  try {
    const configPath = path.join(AUTH_DIR, `dashboard-config-${workerIndex}.json`);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export type AuthFixtures = {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  documentsPage: DocumentsPage;
  landingPage: LandingPage;
  onboardingPage: OnboardingPage;
  projectsPage: ProjectsPage;
  workspacesPage: WorkspacesPage;
  calendarPage: CalendarPage;
  settingsPage: SettingsPage;
  saveAuthState: () => Promise<void>;
  ensureAuthenticated: () => Promise<void>;
  forceNewContext: boolean;
  orgSlug: string;
  monitorAuthState: unknown;
  skipAuthSave: boolean;
};

export const authenticatedTest = base.extend<AuthFixtures>({
  storageState: async ({}, use, testInfo) => {
    let state: unknown;
    try {
      const authPath = getAuthStatePath(testInfo.parallelIndex);
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, "utf-8");
        state = JSON.parse(content);
      }
    } catch (e) {
      console.log(`⚠️ Auth state unavailable. Error: ${(e as Error).message}`);
    }
    await use(state);
  },

  skipAuthSave: [false, { option: true }],

  ensureAuthenticated: async ({ page, orgSlug }, use, testInfo) => {
    const reauth = async () => {
      const dashboardUrl = orgSlug ? `/${orgSlug}/dashboard` : "/";
      await page.goto(dashboardUrl);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const currentUrl = page.url();
      const needsReauth = !(
        currentUrl.includes("/dashboard") || currentUrl.includes("/onboarding")
      );
      if (needsReauth) {
        console.log("  🔄 ensureAuthenticated: re-authenticating...");
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        const baseURL = page.url().split("/").slice(0, 3).join("/");

        // Wait for signin page to be ready
        await page.goto(`${baseURL}/signin`);
        await page.waitForLoadState("domcontentloaded");

        // Dynamically construct the worker-specific user to ensure isolation
        // This matches the logic in global-setup.ts
        const workerSuffix = `w${testInfo.parallelIndex}`;
        const workerUser = {
          ...TEST_USERS.teamLead,
          email: TEST_USERS.teamLead.email.replace("@", `-${workerSuffix}@`),
        };

        console.log(`  🔐 ensureAuthenticated: Re-authenticating as ${workerUser.email}...`);
        await trySignInUser(page, baseURL, workerUser);

        // Stabilize and verify we are actually on dashboard
        await page.goto(dashboardUrl);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000); // Give Convex time to hydrate

        const finalUrl = page.url();
        if (!(finalUrl.includes("/dashboard") || finalUrl.includes("/onboarding"))) {
          console.error(`  ❌ ensureAuthenticated failed. Still at: ${finalUrl}`);
          throw new Error("Failed to ensure authentication after retry.");
        }

        // Save the new state so subsequent tests don't have to re-auth
        const currentState = await page.context().storageState();
        const authPath = getAuthStatePath(testInfo.parallelIndex);
        fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));

        console.log("  ✅ ensureAuthenticated: SUCCESS (Saved state)");
      }
    };
    await use(reauth);
  },

  saveAuthState: async ({ context, skipAuthSave }, use, testInfo) => {
    const save = async () => {
      if (skipAuthSave) return;
      try {
        const currentState = await context.storageState();
        const hasAuthTokens = currentState.origins?.some((origin) =>
          origin.localStorage?.some(
            (item) => item.name.includes("convexAuth") || item.name.includes("__convexAuth"),
          ),
        );
        if (hasAuthTokens) {
          try {
            const authPath = getAuthStatePath(testInfo.parallelIndex);
            fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));
          } catch (writeError) {
            console.warn("⚠️ Failed to save auth state.");
          }
        }
      } catch (e) {
        console.warn(`⚠️ Error in saveAuthState: ${(e as Error).message}`);
      }
    };
    await use(save);
    await save();
  },

  orgSlug: async ({}, use, testInfo) => {
    const config = loadDashboardConfig(testInfo.parallelIndex);
    if (!config?.orgSlug) testInfo.skip(true, "Default user config not found.");
    await use(config?.orgSlug || "");
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  workspacesPage: async ({ page }, use) => {
    await use(new WorkspacesPage(page));
  },
  calendarPage: async ({ page }, use) => {
    await use(new CalendarPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  monitorAuthState: [
    async (
      { ensureAuthenticated, page }: { ensureAuthenticated: () => Promise<void>; page: Page },
      use: () => Promise<void>,
    ) => {
      await page.context().addInitScript(() => {
        try {
          Object.defineProperty(navigator, "onLine", { get: () => true });
        } catch {}
      });
      await ensureAuthenticated();
      await use();
    },
    { auto: true, scope: "test" },
  ],
});

export const onboardingTest = base.extend<AuthFixtures>({
  storageState: async ({}, use, testInfo) => {
    let state: unknown;
    try {
      const authPath = getOnboardingAuthStatePath(testInfo.parallelIndex);
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, "utf-8");
        state = JSON.parse(content);
      }
    } catch (e) {
      console.log(`⚠️ Onboarding auth state unavailable. Error: ${(e as Error).message}`);
    }
    await use(state);
  },

  skipAuthSave: [false, { option: true }],

  ensureAuthenticated: async ({ page }, use, testInfo) => {
    const reauth = async () => {
      const onboardingUrl = "/onboarding";
      await page.goto(onboardingUrl);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const currentUrl = page.url();
      const needsReauth = !currentUrl.includes("/onboarding");

      if (needsReauth) {
        console.log("  🔄 onboardingTest: re-authenticating...");
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        const baseURL = page.url().split("/").slice(0, 3).join("/");
        await page.goto(`${baseURL}/signin`);
        await page.waitForLoadState("domcontentloaded");

        const workerSuffix = `w${testInfo.parallelIndex}`;
        const onboardingUser = {
          ...TEST_USERS.onboarding,
          email: TEST_USERS.onboarding.email.replace("@", `-${workerSuffix}@`),
        };

        console.log(`  🔐 onboardingTest: Re-authenticating as ${onboardingUser.email}...`);
        await trySignInUser(page, baseURL, onboardingUser, false);
        await page.goto(onboardingUrl);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(2000);

        const currentState = await page.context().storageState();
        const authPath = getOnboardingAuthStatePath(testInfo.parallelIndex);
        fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));
      }
    };
    await use(reauth);
  },

  saveAuthState: async ({ context, skipAuthSave }, use, testInfo) => {
    const save = async () => {
      if (skipAuthSave) return;
      try {
        const currentState = await context.storageState();
        const authPath = getOnboardingAuthStatePath(testInfo.parallelIndex);
        fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));
      } catch (e) {
        console.warn(`⚠️ Error in onboarding saveAuthState: ${(e as Error).message}`);
      }
    };
    await use(save);
    await save();
  },

  orgSlug: async ({}, use) => {
    // Onboarding user doesn't have an organization yet
    await use("");
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  workspacesPage: async ({ page }, use) => {
    await use(new WorkspacesPage(page));
  },
  calendarPage: async ({ page }, use) => {
    await use(new CalendarPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  monitorAuthState: [
    async (
      { ensureAuthenticated, page }: { ensureAuthenticated: () => Promise<void>; page: Page },
      use: () => Promise<void>,
    ) => {
      await page.context().addInitScript(() => {
        try {
          Object.defineProperty(navigator, "onLine", { get: () => true });
        } catch {}
      });
      await ensureAuthenticated();
      await use();
    },
    { auto: true, scope: "test" },
  ],
});

export { expect };
