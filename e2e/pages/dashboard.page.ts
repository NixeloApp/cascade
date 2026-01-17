import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
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
  readonly projectsTab: Locator;
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
  readonly projectsSection: Locator;
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

  constructor(page: Page) {
    super(page);

    // Navigation tabs - TanStack Router uses links, not buttons
    this.dashboardTab = page
      .locator("[data-tour='nav-dashboard']")
      .or(page.getByRole("link", { name: /^dashboard$/i }));
    this.documentsTab = page
      .locator("[data-tour='nav-documents']")
      .or(page.getByRole("link", { name: /^documents$/i }));
    // Workspaces tab (previously Projects) - matches new UI label
    this.projectsTab = page
      .locator("[data-tour='nav-projects']")
      .or(page.getByRole("link", { name: /^projects$/i }))
      .or(page.getByRole("link", { name: /^workspaces$/i }));
    this.timesheetTab = page
      .locator("[data-tour='nav-timesheet']")
      .or(page.getByRole("link", { name: /timesheet/i }));
    this.calendarTab = page
      .locator("[data-tour='nav-calendar']")
      .or(page.getByRole("link", { name: /calendar/i }));
    this.settingsTab = page
      .locator("[data-tour='nav-settings']")
      .or(page.getByRole("link", { name: /settings/i }));

    // Header actions - using aria-labels for accessibility
    this.mobileMenuButton = page.getByRole("button", { name: /toggle sidebar menu/i });
    // "Commands ⌘K" button - has aria-label and data-tour attribute
    this.commandPaletteButton = page.getByRole("button", { name: /open command palette/i });
    // Keyboard shortcuts help button (? icon)
    this.shortcutsHelpButton = page.getByRole("button", { name: /keyboard shortcuts/i });
    this.globalSearchButton = page.getByRole("button", { name: /search/i });
    // Bell notification icon button - find by the unique bell SVG path (no aria-label in NotificationCenter component)
    this.notificationButton = page.locator("button:has(svg path[d*='M15 17h5'])");
    // "Sign out" text button
    this.signOutButton = page.getByRole("button", { name: /sign out/i });

    // User menu (avatar dropdown in header)
    this.userMenuButton = page.getByRole("button", { name: "User menu" });
    this.userMenuSignOutItem = page.getByRole("menuitem", { name: /sign out/i });

    // Theme toggle buttons - using aria-labels
    this.lightThemeButton = page.getByRole("button", { name: /switch to light theme/i });
    this.darkThemeButton = page.getByRole("button", { name: /switch to dark theme/i });
    this.systemThemeButton = page.getByRole("button", { name: /switch to system theme/i });

    // Content areas
    this.mainContent = page.getByRole("main");
    this.sidebar = page.locator("[data-tour='sidebar']");
    this.loadingSpinner = page.locator(".animate-spin");

    // Dashboard specific content - match actual UI headings
    this.myIssuesSection = page.getByRole("heading", { name: /feed/i }).first();
    this.projectsSection = page.getByRole("heading", { name: /workspaces/i });
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
    this.globalSearchModal = page.getByTestId("global-search-modal");
    this.globalSearchInput = page.getByPlaceholder(/search issues and documents/i);

    // Notifications - PopoverContent with "Notifications" h3 heading
    this.notificationPanel = page.locator("[data-radix-popper-content-wrapper]").filter({
      has: page.getByText("Notifications", { exact: true }),
    });
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

  async goto(orgSlug?: string) {
    // Use provided slug or default to TEST_ORG_SLUG
    const slug = orgSlug || "nixelo-e2e";
    const dashboardUrl = `/${slug}/dashboard`;

    // Determine baseURL from current URL
    const urlObj = new URL(this.page.url());
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Check if already on dashboard - skip navigation to avoid token rotation
    const currentUrl = this.page.url();
    if (currentUrl.includes(`/${slug}/dashboard`)) {
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

    // Wait a bit for potential auth redirect to settle
    await this.page.waitForTimeout(1000);

    // Check if we got redirected to landing/signin page (auth failure)
    let finalUrl = this.page.url();
    if (
      finalUrl.includes("/signin") ||
      finalUrl === baseUrl ||
      finalUrl === `${baseUrl}/` ||
      !finalUrl.includes(slug)
    ) {
      console.warn(
        "⚠️  Auth redirect detected: navigated to",
        finalUrl,
        ". Retrying navigation once...",
      );
      // Wait for a moment to allow any lingering auth state to settle
      await this.page.waitForTimeout(2000);
      await this.page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });
      await this.waitForLoad();
      finalUrl = this.page.url(); // Update finalUrl after retry
    }

    // Final check after potential retry
    if (
      finalUrl.includes("/signin") ||
      finalUrl === baseUrl ||
      finalUrl === `${baseUrl}/` ||
      !finalUrl.includes(slug)
    ) {
      console.error("❌ Still on landing page after retry. Auth failed.");
      throw new Error(`Redirected to landing/signin page: ${finalUrl}. Auth session invalid.`);
    }

    // Wait for dashboard app shell with recovery
    try {
      await this.commandPaletteButton.waitFor({ state: "visible", timeout: 45000 });
    } catch (e) {
      // Check again if redirected to landing after timeout
      const currentUrl = this.page.url();
      if (
        currentUrl.includes("/signin") ||
        currentUrl === "http://localhost:5555/" ||
        !currentUrl.includes(slug)
      ) {
        throw new Error(`Redirected to landing/signin page: ${currentUrl}. Auth session invalid.`);
      }
      console.log("Dashboard didn't load in time, reloading...");
      await this.page.reload();
      await this.commandPaletteButton.waitFor({ state: "visible", timeout: 45000 });
    }

    // Ensure loading spinner is gone and React is hydrated
    await this.expectLoaded();
    await this.waitForLoad();

    // Explicitly wait for the main content sections to prevent hydration flakes
    await this.myIssuesSection.waitFor({ state: "visible", timeout: 10000 });
  }

  async navigateTo(
    tab: "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings",
  ) {
    const tabs = {
      dashboard: this.dashboardTab,
      documents: this.documentsTab,
      projects: this.projectsTab,
      timesheet: this.timesheetTab,
      calendar: this.calendarTab,
      settings: this.settingsTab,
    };
    // Wait for tab to be visible and stable
    await tabs[tab].waitFor({ state: "visible", timeout: 5000 });

    // Click and wait for navigation if it's a link-based tab
    const urlBefore = this.page.url();
    await tabs[tab].click({ force: true });

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
    await expect(async () => {
      // Small stabilization wait to ensure hydration is settled and listeners are attached
      await this.page.waitForTimeout(1000);
      // Remove force: true to allow Playwright to wait for actionability (event handlers attached)
      await this.commandPaletteButton.click();
      await expect(this.commandPalette).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 20000 });
    await this.page.waitForTimeout(500);
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

      await expect(this.commandPalette).not.toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10000 });
  }

  async openShortcutsHelp() {
    await this.shortcutsHelpButton.click({ force: true });
    await expect(this.shortcutsModal).toBeVisible({ timeout: 5000 });
  }

  async closeShortcutsHelp() {
    await expect(async () => {
      if (!(await this.shortcutsModal.isVisible())) return;
      await this.page.keyboard.press("Escape");
      // Fallback: click outside if escape fails (try clicking main content)
      if (await this.shortcutsModal.isVisible()) {
        await this.mainContent.click({ force: true, position: { x: 10, y: 10 } }).catch(() => {});
      }
      await expect(this.shortcutsModal).not.toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10000 });
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const buttons = {
      light: this.lightThemeButton,
      dark: this.darkThemeButton,
      system: this.systemThemeButton,
    };
    await buttons[theme].click({ force: true });
  }

  async openNotifications() {
    await this.notificationButton.click({ force: true });
  }

  async closeNotifications() {
    await this.page.keyboard.press("Escape");
  }

  async signOut() {
    await this.signOutButton.click({ force: true });
  }

  async signOutViaUserMenu() {
    await this.userMenuButton.click();
    // Wait for dropdown content to be visible
    await this.userMenuSignOutItem.waitFor({ state: "visible", timeout: 5000 });
    await this.userMenuSignOutItem.click();
  }

  async openGlobalSearch() {
    await this.globalSearchButton.click({ force: true });
    await expect(this.globalSearchModal).toBeVisible({ timeout: 5000 });
  }

  async closeGlobalSearch() {
    await expect(async () => {
      if (!(await this.globalSearchModal.isVisible())) return;
      await this.globalSearchInput.click().catch(() => {});
      await this.page.keyboard.press("Escape");

      // Fallback: click top-left corner (backdrop) if escape fails
      if (await this.globalSearchModal.isVisible()) {
        await this.page.mouse.click(0, 0);
      }

      await expect(this.globalSearchModal).not.toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10000 });
  }

  // ===================
  // Actions - Dashboard Content
  // ===================

  async filterIssues(filter: "assigned" | "created") {
    const tabs = {
      assigned: this.assignedTab,
      created: this.createdTab,
    };
    await tabs[filter].click({ force: true });
  }

  // ===================
  // Actions - Documents Sidebar
  // ===================

  async createNewDocument() {
    await this.newDocumentButton.click({ force: true });
  }

  async searchDocuments(query: string) {
    await this.documentSearchInput.fill(query);
  }

  // ===================
  // Actions - Projects Sidebar
  // ===================

  async createNewProject() {
    await this.newProjectButton.click({ force: true });
  }

  // ===================
  // Actions - Keyboard
  // ===================

  async pressCommandPaletteShortcut() {
    // Ensure focus is on the page before pressing keys
    await this.page.click("body").catch(() => {});
    // Use ControlOrMeta for cross-platform compatibility (Cmd on Mac, Ctrl on Windows/Linux)
    await this.page.keyboard.press("ControlOrMeta+k");
  }

  async pressShortcutsHelpShortcut() {
    // Ensure focus is on the page before pressing keys
    await this.page.click("body").catch(() => {});
    await this.page.keyboard.press("Shift+?");
  }

  // ===================
  // Assertions
  // ===================

  async expectDashboard() {
    // Check for command palette button (always visible in app shell) as indicator of dashboard
    await expect(this.commandPaletteButton).toBeVisible();
  }

  async expectActiveTab(
    tab: "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings",
  ) {
    // Check URL contains the tab path segment
    // Note: "projects" tab now uses /projects/ URL path
    const tabPaths = {
      dashboard: /\/dashboard/,
      documents: /\/documents/,
      projects: /\/workspaces/,
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
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 15000 });
  }
}
