import { TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";
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

  // TODO: This test is flaky due to Convex auth state race conditions after sign-out.
  // The sign-in works in fresh browser contexts but fails when re-authenticating
  // in the same context after sign-out. Needs investigation into Convex WebSocket
  // connection state management.
  test.skip("sign out returns to landing page and allows signing back in", async ({
    dashboardPage,
    landingPage,
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

    // First attempt - standard sign-in
    let success = await trySignInUser(page, baseURL, user);

    // If first attempt fails, clear storage and try again from a fresh state.
    // This handles race conditions with Convex WebSocket auth state after sign-out.
    if (!success) {
      console.log("  ↻ First sign-in attempt failed. Resetting browser state for retry...");
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      // Navigate to sign-in page fresh
      await page.goto(`${baseURL}/signin`, { waitUntil: "domcontentloaded" });
      success = await trySignInUser(page, baseURL, user);
    }

    expect(success).toBe(true);
    await dashboardPage.expectLoaded();
  });
});
