import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { BasePage } from "./base.page";

/**
 * Dashboard Page Object
 * Handles the main authenticated app interface
 */
export class DashboardPage extends BasePage {
  // ===================
  // Locators - Navigation Tabs
  // ===================
  readonly dashboardTab: Locator;
  readonly documentsTab: Locator;
  readonly workspacesTab: Locator;
  readonly timesheetTab: Locator;
  readonly calendarTab: Locator;
  readonly settingsTab: Locator;

  // ===================
  // Locators - Header Actions
  // ===================
  readonly mobileMenuButton: Locator;
  readonly commandPaletteButton: Locator;
  readonly shortcutsHelpButton: Locator;
  readonly globalSearchButton: Locator;
  readonly notificationButton: Locator;
  readonly signOutButton: Locator;

  // ===================
  // Locators - User Menu (Header Avatar Dropdown)
  // ===================
  readonly userMenuButton: Locator;
  readonly userMenuSignOutItem: Locator;

  // ===================
  // Locators - Theme Toggle
  // ===================
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly systemThemeButton: Locator;

  // ===================
  // Locators - Content
  // ===================
  readonly mainContent: Locator;
  readonly sidebar: Locator;
  readonly loadingSpinner: Locator;

  // ===================
  // Locators - Dashboard Content
  // ===================
  readonly myIssuesSection: Locator;
  readonly workspacesSection: Locator;
  readonly recentActivitySection: Locator;
  readonly quickStatsSection: Locator;
  readonly assignedTab: Locator;
  readonly createdTab: Locator;

  // ===================
  // Locators - Modals
  // ===================
  readonly commandPalette: Locator;
  readonly commandPaletteInput: Locator;
  readonly shortcutsModal: Locator;
  readonly globalSearchModal: Locator;
  readonly globalSearchInput: Locator;

  // ===================
  // Locators - Notifications
  // ===================
  readonly notificationPanel: Locator;
  readonly markAllReadButton: Locator;
  readonly notificationItems: Locator;

  // ===================
  // Locators - Documents Sidebar
  // ===================
  readonly documentSearchInput: Locator;
  readonly newDocumentButton: Locator;
  readonly templateButton: Locator;
  readonly documentList: Locator;

  // ===================
  // Locators - Projects Sidebar
  // ===================
  readonly newProjectButton: Locator;
  readonly projectList: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Navigation tabs - in the org-specific inner sidebar (navigation role)
    // Use navigation landmark to scope to the correct sidebar
    const navSidebar = page.getByRole("navigation");
    this.dashboardTab = page
      .locator("[data-tour='nav-dashboard']")
      .or(navSidebar.getByRole("link", { name: /^dashboard$/i }));
    this.documentsTab = page
      .locator("[data-tour='nav-documents']")
      .or(navSidebar.getByRole("link", { name: /^documents$/i }));
    // Workspaces navigation tab
    this.workspacesTab = page
      .locator("[data-tour='nav-workspaces']")
      .or(navSidebar.getByRole("link", { name: /^workspaces$/i }));
    this.timesheetTab = page
      .locator("[data-tour='nav-timesheet']")
      .or(navSidebar.getByRole("link", { name: /time tracking/i }));
    this.calendarTab = page
      .locator("[data-tour='nav-calendar']")
      .or(navSidebar.getByRole("link", { name: /^calendar$/i }));
    this.settingsTab = page
      .locator("[data-tour='nav-settings']")
      .or(navSidebar.getByRole("link", { name: /^settings$/i }));

    // Header actions - using aria-labels for accessibility
    this.mobileMenuButton = page.getByRole("button", { name: /toggle sidebar menu/i });
    // "Commands ⌘K" button - has aria-label and data-tour attribute
    this.commandPaletteButton = page.getByRole("button", { name: /open command palette/i });
    // Keyboard shortcuts help button (? icon)
    this.shortcutsHelpButton = page.getByRole("button", { name: /keyboard shortcuts/i });
    // Global search button with aria-label "Open search (⌘K)"
    this.globalSearchButton = page.getByRole("button", { name: /open search/i });
    // Bell notification icon button - aria-label is "Notifications" or "Notifications, N unread"
    this.notificationButton = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_BUTTON);
    // "Sign out" text button
    this.signOutButton = page.getByRole("button", { name: /sign out/i });

    // User menu (avatar dropdown - use last() since there may be one in sidebar and one in header)
    this.userMenuButton = page.getByRole("button", { name: "User menu" }).last();
    this.userMenuSignOutItem = page.getByRole("menuitem", { name: /sign out/i });

    // Theme toggle buttons - using aria-labels
    this.lightThemeButton = page.getByRole("button", { name: /switch to light theme/i });
    this.darkThemeButton = page.getByRole("button", { name: /switch to dark theme/i });
    this.systemThemeButton = page.getByRole("button", { name: /switch to system theme/i });

    // Content areas - use last() to get innermost main element (nested layout)
    this.mainContent = page.getByRole("main").last();
    this.sidebar = page.locator("[data-tour='sidebar']");
    // Use aria-label="Loading" to target actual loading spinners, not empty states
    this.loadingSpinner = page.getByLabel("Loading").or(page.locator("[data-loading-spinner]"));

    // Dashboard specific content - match actual UI headings
    this.myIssuesSection = page.getByRole("heading", { name: /feed/i }).first();
    this.workspacesSection = page.getByRole("heading", { name: /workspaces/i });
    this.recentActivitySection = page.getByText(/recent activity/i);
    this.quickStatsSection = page.getByText(/quick stats/i);
    // Issue filter tabs: "Assigned (0)" and "Created (0)"
    this.assignedTab = page.getByRole("button", { name: /filter assigned/i });
    this.createdTab = page.getByRole("button", { name: /filter created/i });

    // Modals - Command Palette (no aria-label, identify by input placeholder)
    this.commandPaletteInput = page.getByPlaceholder(/type a command/i);
    this.commandPalette = page.getByRole("dialog").filter({
      has: this.commandPaletteInput,
    });

    // Modals - Shortcuts (uses title="Keyboard Shortcuts" via aria-labelledby)
    this.shortcutsModal = page.getByRole("dialog", { name: /keyboard shortcuts/i });

    // Modals - Global Search (not a dialog role, it's a fixed positioned div)
    // The modal contains "Search issues and documents..." placeholder input
    this.globalSearchModal = page.getByTestId(TEST_IDS.SEARCH.MODAL);
    this.globalSearchInput = page.getByPlaceholder(/search issues and documents/i);

    // Notifications panel
    this.notificationPanel = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_PANEL);
    this.markAllReadButton = page.getByRole("button", { name: /mark all read/i });
    this.notificationItems = page.locator("[data-notification-item]");

    // Documents sidebar
    this.documentSearchInput = page.getByPlaceholder(/search.*document/i);
    this.newDocumentButton = page.getByRole("button", { name: /new.*document|\+ new/i });
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page.locator("[data-document-list]");

    // Projects sidebar
    this.newProjectButton = page.getByRole("button", {
      name: /new.*project|\+ new/i,
    });
    this.projectList = page.locator("[data-project-list]");
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    const dashboardUrl = `/${this.orgSlug}/dashboard`;

    // Determine baseURL from current URL
    const urlObj = new URL(this.page.url());
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Check if already on dashboard - skip navigation to avoid token rotation
    const currentUrl = this.page.url();
    if (currentUrl.includes(`/${this.orgSlug}/dashboard`)) {
      // Already on dashboard, just verify it's loaded
      const isLoaded = await this.commandPaletteButton.isVisible().catch(() => false);
      if (isLoaded) {
        // Even if already on page, ensure it's hydrated before returning
        await this.waitForLoad();
        return;
      }
    }

    // Navigate directly to dashboard URL
    await this.page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

    // Wait for URL to settle (auth redirect check)
    await this.page.waitForLoadState("load");

    // Check if we got redirected to landing/signin page (auth failure)
    let finalUrl = this.page.url();
    if (
      finalUrl.includes("/signin") ||
      finalUrl === baseUrl ||
      finalUrl === `${baseUrl}/` ||
      !finalUrl.includes(this.orgSlug)
    ) {
      console.warn(
        "⚠️  Auth redirect detected: navigated to",
        finalUrl,
        ". Retrying navigation once...",
      );
      // Wait for auth state to settle by waiting for load state
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });
      await this.waitForLoad();
      finalUrl = this.page.url(); // Update finalUrl after retry
    }

    // Final check after potential retry
    if (
      finalUrl.includes("/signin") ||
      finalUrl === baseUrl ||
      finalUrl === `${baseUrl}/` ||
      !finalUrl.includes(this.orgSlug)
    ) {
      console.error("❌ Still on landing page after retry. Auth failed.");
      throw new Error(`Redirected to landing/signin page: ${finalUrl}. Auth session invalid.`);
    }

    // Wait for dashboard app shell with recovery
    try {
      await this.commandPaletteButton.waitFor({ state: "visible" });
    } catch (_e) {
      // Check again if redirected to landing after timeout
      const currentUrl = this.page.url();
      if (
        currentUrl.includes("/signin") ||
        currentUrl === "http://localhost:5555/" ||
        !currentUrl.includes(this.orgSlug)
      ) {
        throw new Error(`Redirected to landing/signin page: ${currentUrl}. Auth session invalid.`);
      }
      console.log("Dashboard didn't load in time, reloading...");
      await this.page.reload();
      await this.commandPaletteButton.waitFor({ state: "visible" });
    }

    await this.expectLoaded();
    await this.waitForLoad();
    await expect(this.myIssuesSection).toBeVisible();
  }

  async navigateTo(
    tab: "dashboard" | "documents" | "workspaces" | "timesheet" | "calendar" | "settings",
  ) {
    const tabs = {
      dashboard: this.dashboardTab,
      documents: this.documentsTab,
      workspaces: this.workspacesTab,
      timesheet: this.timesheetTab,
      calendar: this.calendarTab,
      settings: this.settingsTab,
    };
    // Wait for tab to be visible and stable
    await tabs[tab].waitFor({ state: "visible" });

    // Click and wait for navigation if it's a link-based tab
    const urlBefore = this.page.url();
    await tabs[tab].click();

    // If it's a navigation tab, wait for URL to actually change or for load to complete
    if (tab !== "dashboard" || !urlBefore.includes("/dashboard")) {
      await this.page.waitForLoadState("domcontentloaded");
    }

    await this.waitForLoad();
  }

  // ===================
  // Actions - Header
  // ===================

  async openCommandPalette() {
    await this.waitForLoad();
    // Wait for command palette button to be actionable (indicates React hydration complete)
    await this.commandPaletteButton.waitFor({ state: "visible" });

    // Use retry pattern - button click may not trigger event handler immediately after hydration
    await expect(async () => {
      // Close any existing command palette first (in case it's in an inconsistent state)
      if (await this.commandPalette.isVisible().catch(() => false)) {
        await this.page.keyboard.press("Escape");
      }
      // Click to open command palette
      await this.commandPaletteButton.click();
      // Wait for dialog animation to complete (Radix Dialog has opening animation)
      await expect(this.commandPalette).toBeVisible();
      // Verify it stays visible (not immediately closed)
      await expect(this.commandPaletteInput).toBeVisible();
      // Focus the input to keep the dialog open and stable (inside retry loop to handle detachments)
      await this.commandPaletteInput.focus();
    }).toPass();
  }

  async closeCommandPalette() {
    await expect(async () => {
      if (!(await this.commandPalette.isVisible())) return;
      // Focus input to ensure keyboard environment is captured
      await this.commandPaletteInput.click().catch(() => {});
      await this.page.keyboard.press("Escape");

      // Fallback: click top-left corner (backdrop) if escape fails
      if (await this.commandPalette.isVisible()) {
        await this.page.mouse.click(0, 0);
      }

      await expect(this.commandPalette).not.toBeVisible();
    }).toPass();
  }

  async openShortcutsHelp() {
    await this.shortcutsHelpButton.click();
    await expect(this.shortcutsModal).toBeVisible();
  }

  async closeShortcutsHelp() {
    await expect(async () => {
      if (!(await this.shortcutsModal.isVisible())) return;
      await this.page.keyboard.press("Escape");
      // Fallback: click outside if escape fails (try clicking main content)
      if (await this.shortcutsModal.isVisible()) {
        await this.mainContent.click({ position: { x: 10, y: 10 } }).catch(() => {});
      }
      await expect(this.shortcutsModal).not.toBeVisible();
    }).toPass();
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const buttons = {
      light: this.lightThemeButton,
      dark: this.darkThemeButton,
      system: this.systemThemeButton,
    };
    await buttons[theme].click();
  }

  async openNotifications() {
    await this.notificationButton.click();
  }

  async closeNotifications() {
    await this.page.keyboard.press("Escape");
  }

  async signOut() {
    await this.signOutButton.click();
  }

  async signOutViaUserMenu() {
    await this.userMenuButton.click();
    // Wait for dropdown content to be visible
    await this.userMenuSignOutItem.waitFor({ state: "visible" });
    await this.userMenuSignOutItem.click();
  }

  async openGlobalSearch() {
    // Ensure page is hydrated first
    await this.waitForLoad();

    // Wait for search button to be ready
    await this.globalSearchButton.waitFor({ state: "visible" });

    // Use retry pattern - click may not register immediately after page load
    await expect(async () => {
      // Close any existing modals first by pressing Escape
      await this.page.keyboard.press("Escape");

      // Click the search button directly (keyboard shortcut conflicts with command palette)
      await this.globalSearchButton.click();

      // Check if modal opened AND input is ready
      await expect(this.globalSearchModal).toBeVisible();
      await expect(this.globalSearchInput).toBeVisible();
      await expect(this.globalSearchInput).toBeEnabled();
    }).toPass();

    // Focus the input to ensure it's ready for typing
    await this.globalSearchInput.focus();
  }

  async closeGlobalSearch() {
    // If modal is not visible, nothing to close
    if (!(await this.globalSearchModal.isVisible().catch(() => false))) {
      return;
    }

    // Use retry pattern to handle timing variability
    await expect(async () => {
      // Try pressing Escape to close
      await this.page.keyboard.press("Escape");

      // Check if still visible - if so, try clicking outside
      if (await this.globalSearchModal.isVisible().catch(() => false)) {
        await this.page.mouse.click(10, 10);
      }

      // Verify closed
      await expect(this.globalSearchModal).not.toBeVisible();
    }).toPass();
  }

  // ===================
  // Actions - Dashboard Content
  // ===================

  async filterIssues(filter: "assigned" | "created") {
    const tabs = {
      assigned: this.assignedTab,
      created: this.createdTab,
    };
    await tabs[filter].click();
  }

  // ===================
  // Actions - Documents Sidebar
  // ===================

  async createNewDocument() {
    await this.newDocumentButton.click();
  }

  async searchDocuments(query: string) {
    await this.documentSearchInput.fill(query);
  }

  // ===================
  // Actions - Projects Sidebar
  // ===================

  async createNewProject() {
    await this.newProjectButton.click();
  }

  // ===================
  // Actions - Keyboard
  // ===================

  async pressCommandPaletteShortcut() {
    await this.waitForLoad();
    // Wait for command palette button to be actionable (indicates React hydration complete)
    await this.commandPaletteButton.waitFor({ state: "visible" });
    // Use retry logic - keyboard events may not be captured immediately after hydration
    await expect(async () => {
      await this.page.keyboard.press("ControlOrMeta+k");
      await expect(this.commandPalette).toBeVisible();
    }).toPass();
  }

  async pressShortcutsHelpShortcut() {
    await this.waitForLoad();
    await this.page.keyboard.press("Shift+?");
    await expect(this.shortcutsModal).toBeVisible();
  }

  // ===================
  // Assertions
  // ===================

  async expectDashboard() {
    // Check for command palette button (always visible in app shell) as indicator of dashboard
    await expect(this.commandPaletteButton).toBeVisible();
  }

  async expectActiveTab(
    tab: "dashboard" | "documents" | "workspaces" | "timesheet" | "calendar" | "settings",
  ) {
    // Check URL contains the tab path segment
    const tabPaths = {
      dashboard: /\/dashboard/,
      documents: /\/documents/,
      workspaces: /\/workspaces/,
      timesheet: /\/timesheet/,
      calendar: /\/calendar/,
      settings: /\/settings/,
    };
    await expect(this.page).toHaveURL(tabPaths[tab]);
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async expectLoaded() {
    // Wait longer for organization context to load (auth tokens, organization data)
    await expect(this.loadingSpinner).not.toBeVisible();
  }
}
