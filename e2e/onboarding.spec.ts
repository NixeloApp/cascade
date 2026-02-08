import { TEST_IDS } from "../src/lib/test-ids";
import { E2E_ENDPOINTS, getE2EHeaders, TEST_USERS } from "./config";
import { expect, onboardingTest as test } from "./fixtures";
import { OnboardingPage } from "./pages";

/**
 * Onboarding Wizard E2E Tests
 *
 * Tests the onboarding wizard flow for new users.
 * Uses a dedicated onboarding-user that starts with onboarding incomplete.
 */

/**
 * Reset onboarding state for the dedicated onboarding test user
 */
async function resetOnboarding(parallelIndex: number): Promise<void> {
  try {
    const workerSuffix = `w${parallelIndex}`;
    const email = TEST_USERS.onboarding.email.replace("@", `-${workerSuffix}@`);

    const response = await fetch(E2E_ENDPOINTS.resetOnboarding, {
      method: "POST",
      headers: getE2EHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      console.warn(`Failed to reset onboarding for ${email}: ${response.status}`);
    }
    // Note: DB changes propagate reactively via Convex, no hardcoded delay needed
  } catch (e) {
    console.warn(`Failed to reset onboarding: ${e}`);
  }
}

// NOTE: Using dedicated onboardingTest fixture ensures isolation.
test.describe("Onboarding Wizard", () => {
  // Use a dedicated user to avoid auth token rotation issues with other tests

  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }, testInfo) => {
    // Ensure we are signed in as the onboarding user
    await ensureAuthenticated();
    // Reset onboarding state before each test to ensure we start at step 0
    await resetOnboarding(testInfo.parallelIndex);
  });

  test("displays welcome page with role selection", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    // Use a longer timeout and explicit URL wait to handle slow hydration/Convex updates
    await page.waitForURL("**/onboarding");
    await onboarding.waitForSplashScreen();

    // Should show role selection
    await onboarding.expectRoleSelection();
  });

  test("can select team lead role", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.waitForWizard();
    await onboarding.selectTeamLead();
  });

  test("can select team member role", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.waitForWizard();
    await onboarding.selectTeamMember();
  });

  // TODO: Dashboard stuck in loading state after skip - needs investigation
  test("can skip onboarding", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    // Wait for welcome heading to confirm we're on onboarding
    await onboarding.waitForWizard();

    // Find and click skip element
    await expect(onboarding.skipText).toBeVisible();
    await onboarding.skipOnboarding();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/[^/]+\/dashboard/);
    await page.waitForLoadState("domcontentloaded");

    // Wait for dashboard to finish loading — use test ID to avoid matching multiple headings
    await expect(page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING)).toBeVisible();

    // Should navigate to dashboard
    await onboarding.expectDashboard();
  });

  test("shows feature highlights", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    // Wait for welcome heading to confirm we're on onboarding
    await onboarding.waitForWizard();

    // Should show feature highlights section
    await onboarding.expectFeatureHighlights();
  });
});

// Team Lead Flow runs BEFORE Team Member Flow because Team Lead doesn't navigate away
// from onboarding (just goes back to role selection), while Team Member completes
// onboarding and navigates to dashboard which can corrupt auth state.
test.describe("Onboarding - Team Lead Flow", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  // Skip auth save for this test - onboarding state changes can affect auth state

  // TODO: Storage state becomes invalid after earlier tests - needs investigation
  test("shows team lead features and can go back to role selection", async ({ page }, testInfo) => {
    const onboarding = new OnboardingPage(page);

    // Reset onboarding state via HTTP endpoint
    await resetOnboarding(testInfo.parallelIndex);

    // Navigate to onboarding
    await onboarding.goto();

    // Wait for role selection to appear and be interactive
    await onboarding.waitForWizard();
    await onboarding.waitForRoleCardsReady();

    // Select Team Lead role (this transitions to the features screen)
    await onboarding.selectTeamLead();

    // Test back navigation directly from features screen
    await expect(onboarding.backButton).toBeVisible();
    await onboarding.clickBack();

    // Should return to role selection
    await onboarding.waitForWizard();
  });
});

// Team Member Flow runs LAST because it completes onboarding and navigates to dashboard.
// Uses ensureAuthenticated to re-login if tokens were invalidated by signout test.
test.describe("Onboarding - Team Member Flow", () => {
  // Run tests serially to prevent auth token rotation issues

  // TODO: Storage state becomes invalid after earlier tests - needs investigation
  test("shows member-specific content and can complete onboarding", async ({ page }, testInfo) => {
    const onboarding = new OnboardingPage(page);

    // Reset onboarding state via HTTP endpoint
    await resetOnboarding(testInfo.parallelIndex);

    // Navigate to onboarding and wait for initial load
    await onboarding.goto();

    // Wait for role selection to appear and be interactive
    await onboarding.waitForWizard();
    await onboarding.waitForRoleCardsReady();

    // Select Team Member role (transitions to project naming)
    await onboarding.selectTeamMember();

    // Enter project name and create it
    await page.getByPlaceholder(/e.g., Acme Corp/i).fill("E2E Test Project");
    await onboarding.createProject();

    // Wait for features screen
    await onboarding.expectTeamMemberComplete();

    // Verify we are on the Team Member specific step
    // (Implicitly verified by selectTeamMember action now)

    // Click "Go to Dashboard" button to complete onboarding
    await onboarding.goToDashboard();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/[^/]+\/dashboard/);
    await page.waitForLoadState("domcontentloaded");

    // Wait for dashboard to finish loading — use test ID to avoid matching multiple headings
    await expect(page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING)).toBeVisible();

    // Should navigate to dashboard
    await onboarding.expectDashboard();
  });
});
