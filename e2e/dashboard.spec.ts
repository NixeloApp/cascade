import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Dashboard E2E Tests
 *
 * Tests for authenticated user experience.
 * Auth state is managed by authenticated fixtures and ensureAuthenticated().
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail. Serial mode ensures
 * tokens are properly propagated between tests.
 */

test.describe("Dashboard Tests", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated (e.g., by signout test in another file)
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Dashboard Navigation", () => {
    test("authenticated user lands on dashboard after login", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectDashboard();
      await dashboardPage.expectActiveTab("dashboard");
      await dashboardPage.expectLoaded();
    });

    test("can navigate between tabs", async ({ dashboardPage }) => {
      await dashboardPage.goto();

      await dashboardPage.navigateTo("workspaces");
      await dashboardPage.expectActiveTab("workspaces");

      await dashboardPage.navigateTo("documents");
      await dashboardPage.expectActiveTab("documents");

      await dashboardPage.navigateTo("dashboard");
      await dashboardPage.expectActiveTab("dashboard");
    });
  });

  test.describe("Dashboard Content", () => {
    test("displays main dashboard sections", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(dashboardPage.mainContent).toBeVisible();
      await expect(dashboardPage.myIssuesSection).toBeVisible();
      await expect(dashboardPage.workspacesSection).toBeVisible();
    });

    test("can filter issues", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(dashboardPage.assignedTab).toBeVisible();
      await expect(dashboardPage.createdTab).toBeVisible();

      await dashboardPage.filterIssues("created");
      await dashboardPage.filterIssues("assigned");
    });
  });

  test.describe("Command Palette", () => {
    test("can open and close via button", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.openCommandPalette();
      await expect(dashboardPage.commandPalette).toBeVisible();
      await dashboardPage.closeCommandPalette();
      await expect(dashboardPage.commandPalette).not.toBeVisible();
    });

    test("can open via keyboard shortcut", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      // pressCommandPaletteShortcut includes retry logic and visibility check
      await dashboardPage.pressCommandPaletteShortcut();
      await expect(dashboardPage.commandPalette).toBeVisible();
    });
  });

  test.describe("Theme Toggle", () => {
    test("can switch themes via settings", async ({ dashboardPage, settingsPage, page }) => {
      // Navigate through UI: dashboard -> settings sidebar link
      await dashboardPage.goto();
      await dashboardPage.navigateTo("settings");
      await settingsPage.switchToTab("preferences");

      const html = page.locator("html");

      // Switch to dark theme using page object
      await settingsPage.setTheme("dark");
      await expect(html).toHaveClass(/dark/);

      // Switch to light theme using page object
      await settingsPage.setTheme("light");
      await expect(html).not.toHaveClass(/dark/);

      // Switch to system theme using page object
      await settingsPage.setTheme("system");
    });
  });

  test.describe("Global Search", () => {
    test("can open and close", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.openGlobalSearch();
      await expect(dashboardPage.globalSearchModal).toBeVisible();
      await dashboardPage.closeGlobalSearch();
      await expect(dashboardPage.globalSearchModal).not.toBeVisible();
    });
  });

  test.describe("Keyboard Shortcuts Help", () => {
    test("can open and close via button", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.openShortcutsHelp();
      await expect(dashboardPage.shortcutsModal).toBeVisible();
      await dashboardPage.closeShortcutsHelp();
      await expect(dashboardPage.shortcutsModal).not.toBeVisible();
    });

    test("can open via keyboard shortcut", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.pressShortcutsHelpShortcut();
      await expect(dashboardPage.shortcutsModal).toBeVisible();
    });
  });

  test.describe("Notifications", () => {
    test("can open notifications panel", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.openNotifications();
      await expect(dashboardPage.notificationPanel).toBeVisible();
    });
  });
});
