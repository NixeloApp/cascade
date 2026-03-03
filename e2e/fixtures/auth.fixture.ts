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

function _getAuthStatePath(workerIndex = 0): string {
  return path.join(AUTH_DIR, path.basename(AUTH_PATHS.teamLead(workerIndex)));
}

function _getOnboardingAuthStatePath(workerIndex = 0): string {
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
  // Disable storageState loading to force fresh login per test
  // This prevents "Invalid refresh token" errors caused by token reuse across parallel workers
  storageState: async ({}, use) => {
    await use(undefined);
  },

  skipAuthSave: [true, { option: true }],

  ensureAuthenticated: async ({ page, orgSlug }, use, testInfo) => {
    // Determine the base URL from the current context or config
    // Since we are starting fresh, page.url() might be about:blank
    const baseURL = process.env.BASE_URL || "http://localhost:5555";

    const authenticate = async () => {
      // 1. Clear any existing state (redundant if new context, but safe)
      await page.context().clearCookies();

      // 2. Construct worker-specific user
      const workerSuffix = `w${testInfo.parallelIndex}`;
      const workerUser = {
        ...TEST_USERS.teamLead,
        email: TEST_USERS.teamLead.email.replace("@", `-${workerSuffix}@`),
      };

      console.log(`  🔐 ensureAuthenticated: Logging in as ${workerUser.email}...`);

      // 3. Perform fresh login (uses API fast-path internally)
      const success = await trySignInUser(page, baseURL, workerUser);

      if (!success) {
        throw new Error(`Failed to authenticate as ${workerUser.email}`);
      }

      // 4. Navigate to the intended destination
      const destination = orgSlug ? `/${orgSlug}/dashboard` : "/";
      await page.goto(destination);
      if (orgSlug) {
        await expect(page).toHaveURL(/\/dashboard/);
      } else {
        await expect(page).toHaveURL(/\/$/);
      }
    };

    await use(authenticate);
  },

  // Disable saving state to disk to prevent race conditions
  saveAuthState: async ({}, use) => {
    await use(async () => {});
  },

  orgSlug: async ({}, use, testInfo) => {
    const config = loadDashboardConfig(testInfo.parallelIndex);
    if (!config?.orgSlug) {
      throw new Error(
        `orgSlug not found for worker ${testInfo.parallelIndex}. ` +
          "Ensure global-setup.ts created the worker-specific config file.",
      );
    }
    await use(config.orgSlug);
  },

  authPage: async ({ page, orgSlug }, use) => {
    await use(new AuthPage(page, orgSlug));
  },
  dashboardPage: async ({ page, orgSlug }, use) => {
    await use(new DashboardPage(page, orgSlug));
  },
  documentsPage: async ({ page, orgSlug }, use) => {
    await use(new DocumentsPage(page, orgSlug));
  },
  landingPage: async ({ page, orgSlug }, use) => {
    await use(new LandingPage(page, orgSlug));
  },
  onboardingPage: async ({ page, orgSlug }, use) => {
    await use(new OnboardingPage(page, orgSlug));
  },
  projectsPage: async ({ page, orgSlug }, use) => {
    await use(new ProjectsPage(page, orgSlug));
  },
  workspacesPage: async ({ page, orgSlug }, use) => {
    await use(new WorkspacesPage(page, orgSlug));
  },
  calendarPage: async ({ page, orgSlug }, use) => {
    await use(new CalendarPage(page, orgSlug));
  },
  settingsPage: async ({ page, orgSlug }, use) => {
    await use(new SettingsPage(page, orgSlug));
  },

  monitorAuthState: [
    async ({ ensureAuthenticated, page }, use) => {
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
  // Disable storageState loading
  storageState: async ({}, use) => {
    await use(undefined);
  },

  skipAuthSave: [true, { option: true }],

  ensureAuthenticated: async ({ page }, use, testInfo) => {
    const baseURL = process.env.BASE_URL || "http://localhost:5555";
    const onboardingUrl = "/onboarding";

    const authenticate = async () => {
      // 1. Clear any existing state
      await page.context().clearCookies();

      // 2. Construct worker-specific user
      const workerSuffix = `w${testInfo.parallelIndex}`;
      const onboardingUser = {
        ...TEST_USERS.onboarding,
        email: TEST_USERS.onboarding.email.replace("@", `-${workerSuffix}@`),
      };

      console.log(`  🔐 onboardingTest: Logging in as ${onboardingUser.email}...`);

      // 3. Perform fresh login (uses API fast-path internally)
      // Pass 'false' for autoCompleteOnboarding so we stay on onboarding page
      const success = await trySignInUser(page, baseURL, onboardingUser, false);

      if (!success) {
        throw new Error(`Failed to authenticate as ${onboardingUser.email}`);
      }

      // 4. Ensure we are at /onboarding
      await page.goto(onboardingUrl);
      await expect(page).toHaveURL(/\/onboarding/);
    };

    await use(authenticate);
  },

  // Disable saving state
  saveAuthState: async ({}, use) => {
    await use(async () => {});
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
