import { SETTINGS_PROFILES, TEST_ORG_SLUG } from "../config";
import { authenticatedTest, expect } from "../fixtures";
import { testUserService } from "../utils";

/**
 * Billing Settings Tests
 *
 * Tests behavior when billing is enabled vs disabled.
 * Uses settings profiles to toggle billingEnabled.
 *
 * The billable checkbox appears in the TimeEntryModal when:
 * 1. User clicks "Start Timer" button in the AppHeader (TimerWidget)
 * 2. The TimeEntryModal opens with billingEnabled prop from org context
 * 3. The modal conditionally renders "Billable time" checkbox based on this prop
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

      // Navigate to dashboard (org context loads billingEnabled from settings)
      await dashboardPage.goto(orgSlug);
      await dashboardPage.expectLoaded();

      await dashboardPage.openTimeEntryModal();

      // Verify billable checkbox IS visible when billing is enabled
      await expect(dashboardPage.timeEntryBillableCheckbox).toBeVisible();

      // Close modal
      await dashboardPage.closeTimeEntryModal();
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

      // Navigate to dashboard (org context loads billingEnabled from settings)
      await dashboardPage.goto(orgSlug);
      await dashboardPage.expectLoaded();

      await dashboardPage.openTimeEntryModal();

      // Verify billable checkbox is NOT visible when billing is disabled
      await expect(dashboardPage.timeEntryBillableCheckbox).not.toBeVisible();

      // Close modal
      await dashboardPage.closeTimeEntryModal();
    },
  );
});
