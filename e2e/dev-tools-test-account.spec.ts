import { authenticatedTest, expect } from "./fixtures";

/**
 * Test that mailtrap account (@inbox.mailtrap.io) shows Dev Tools tab
 * Uses authenticated dashboard user fixture with organization slug
 * Uses SettingsPage page object for consistent locators.
 */
authenticatedTest(
  "Mailtrap account shows Dev Tools tab in Settings",
  async ({ dashboardPage, settingsPage }) => {
    authenticatedTest.setTimeout(60000);

    // Navigate to settings via sidebar
    await dashboardPage.goto();
    await dashboardPage.navigateTo("settings");

    console.log("On settings page");

    // Verify Dev Tools tab is visible (for @inbox.mailtrap.io accounts)
    await expect(settingsPage.devToolsTab).toBeVisible({ timeout: 30000 });

    console.log("✓ Dev Tools tab is visible for mailtrap account!");
    console.log("\n✅ TEST PASSED: @inbox.mailtrap.io account shows Dev Tools tab");
  },
);
