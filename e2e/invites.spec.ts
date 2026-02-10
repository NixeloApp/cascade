import { TEST_IDS } from "../src/lib/test-ids";
import { generateTestEmail } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Invites E2E Tests
 *
 * Tests the user invitation flow:
 * 1. Admin sends an invite
 * 2. Invite appears in the list
 * 3. Admin can revoke the invite
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("User Invitations", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated (e.g., by signout test in another file)
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test("admin can send and revoke invites", async ({ dashboardPage, settingsPage, page }) => {
    // 1. Navigate to Settings -> Admin via sidebar
    await dashboardPage.goto();
    await dashboardPage.navigateTo("settings");
    // Wait for settings page to load before switching tabs
    await expect(page).toHaveURL(/\/settings/);
    await settingsPage.switchToTab("admin");

    // 2. Send an invite
    const testEmail = generateTestEmail("invite-test");
    await settingsPage.inviteUser(testEmail, "user");

    // 3. Verify invite was created - check table for the email
    const inviteTable = page.getByTestId(TEST_IDS.INVITE.TABLE);
    await expect(inviteTable.getByText(testEmail)).toBeVisible();

    // 4. Revoke the invite
    // Handle confirmation dialog BEFORE clicking (needs to be registered first)
    page.once("dialog", (dialog) => dialog.accept());

    // Find the row with our test email and click its Revoke button
    const row = inviteTable.getByTestId(TEST_IDS.INVITE.ROW).filter({ hasText: testEmail });
    await row.getByRole("button", { name: /revoke/i }).click();

    // 5. Verify revocation - wait for success toast or status change
    await expect(page.getByText(/invitation revoked|revoked successfully/i).first()).toBeVisible();
  });
});
