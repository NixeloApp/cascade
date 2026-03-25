import { TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";
import { DashboardPage } from "./pages";
import { trySignInUser } from "./utils";

/**
 * Sign Out E2E Tests
 *
 * This file runs BEFORE z-onboarding.spec.ts alphabetically.
 * Sign out invalidates tokens server-side, but z-onboarding tests
 * will load fresh auth state from the file saved before this test ran.
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 *
 * Uses DashboardPage and LandingPage page objects for consistent locators.
 */

test.describe("Sign Out", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  // Re-authenticate if tokens were invalidated before this test
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test("sign out returns to landing page and allows signing back in", async ({
    browser,
    dashboardPage,
    landingPage,
    orgSlug,
    page,
  }, testInfo) => {
    // Navigate to dashboard via proper entry point
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Sign out via user menu dropdown
    console.log("  🚪 Clicking sign out...");
    await dashboardPage.signOutViaUserMenu();
    console.log("  ✓ Sign out clicked, waiting for landing page...");

    // Should return to landing page - verify Get Started button is visible
    await expect(landingPage.heroGetStartedButton).toBeVisible();

    // Sign in back using the same user credentials
    const workerSuffix = `w${testInfo.parallelIndex}`;
    const user = {
      ...TEST_USERS.teamLead,
      email: TEST_USERS.teamLead.email.replace("@", `-${workerSuffix}@`),
    };
    const baseURL = new URL(page.url()).origin;

    // Click 'Log in' from the landing page nav
    await landingPage.clickNavLogin();
    await page.waitForURL("**/signin*");

    const freshContext = await browser.newContext();
    try {
      const freshPage = await freshContext.newPage();
      const success = await trySignInUser(freshPage, baseURL, user);
      expect(success).toBe(true);

      const freshDashboardPage = new DashboardPage(freshPage, orgSlug);
      await freshDashboardPage.expectLoaded();
    } finally {
      await freshContext.close();
    }
  });
});
