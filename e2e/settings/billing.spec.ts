import { SETTINGS_PROFILES, TEST_ORG_SLUG } from "../config";
import { authenticatedTest, expect } from "../fixtures";
import { testUserService } from "../utils";

/**
 * Billing Settings Tests
 *
 * Tests behavior when billing is enabled vs disabled.
 * Uses settings profiles to toggle billingEnabled.
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */
authenticatedTest.describe("Billing Settings", () => {
  // Run tests serially to prevent auth token rotation issues
  authenticatedTest.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated (e.g., by signout test in another file)
  authenticatedTest.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  // Reset to default settings after each test
  authenticatedTest.afterEach(async () => {
    await testUserService.updateOrganizationSettings(TEST_ORG_SLUG, SETTINGS_PROFILES.default);
  });

  authenticatedTest(
    "billing enabled shows billable checkbox on time entries",
    async ({ dashboardPage, orgSlug }) => {
      // Ensure billing is enabled
      const result = await testUserService.updateOrganizationSettings(orgSlug, {
        billingEnabled: true,
      });
      expect(result.success).toBe(true);

      // Navigate to time tracking
      await dashboardPage.goto(orgSlug);

      // TODO: Navigate to time entry form and verify billable checkbox is visible
      // This is a placeholder - implement actual UI checks when time entry form exists
    },
  );

  authenticatedTest(
    "billing disabled hides billable checkbox on time entries",
    async ({ dashboardPage, orgSlug }) => {
      // Disable billing
      const result = await testUserService.updateOrganizationSettings(orgSlug, {
        billingEnabled: false,
      });
      expect(result.success).toBe(true);

      // Navigate to time tracking
      await dashboardPage.goto(orgSlug);

      // TODO: Navigate to time entry form and verify billable checkbox is NOT visible
      // This is a placeholder - implement actual UI checks when time entry form exists
    },
  );
});
