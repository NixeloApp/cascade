import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getOptionalLocatorText, isLocatorVisible } from "../utils/locator-state";
import { escapeRegExp, ROUTES } from "../utils/routes";
import { waitForDashboardReady } from "../utils/wait-helpers";
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
  readonly headerStartTimerButton: Locator;
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
  readonly advancedSearchModal: Locator;
  readonly globalSearchInput: Locator;
  readonly globalSearchResultsGroup: Locator;
  readonly globalSearchResultItems: Locator;
  readonly globalSearchLoadingState: Locator;
  readonly globalSearchMinimumQueryMessage: Locator;
  readonly globalSearchNoResults: Locator;
  readonly globalSearchAllTab: Locator;
  readonly globalSearchIssuesTab: Locator;
  readonly globalSearchDocumentsTab: Locator;
  readonly timeEntryModal: Locator;
  readonly timeEntryBillableCheckbox: Locator;
  readonly appErrorHeading: Locator;
  readonly appErrorDetailsSummary: Locator;
  readonly appErrorDetailsMessage: Locator;

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
      .getByTestId(TEST_IDS.NAV.DASHBOARD_LINK)
      .or(navSidebar.getByRole("link", { name: /^dashboard$/i }));
    this.documentsTab = page
      .getByTestId(TEST_IDS.NAV.DOCUMENTS_LINK)
      .or(navSidebar.getByRole("link", { name: /^documents$/i }));
    // Workspaces navigation tab
    this.workspacesTab = page
      .getByTestId(TEST_IDS.NAV.WORKSPACES_LINK)
      .or(navSidebar.getByRole("link", { name: /^workspaces$/i }));
    this.timesheetTab = page
      .getByTestId(TEST_IDS.NAV.TIMESHEET_LINK)
      .or(navSidebar.getByRole("link", { name: /time tracking/i }));
    this.calendarTab = page
      .getByTestId(TEST_IDS.NAV.CALENDAR_LINK)
      .or(navSidebar.getByRole("link", { name: /^general$/i }));
    this.settingsTab = page
      .getByTestId(TEST_IDS.NAV.SETTINGS_LINK)
      .or(navSidebar.getByRole("link", { name: /^settings$/i }));

    // Header actions - using aria-labels for accessibility
    this.mobileMenuButton = page.getByRole("button", { name: /toggle sidebar menu/i });
    // Unified omnibox trigger in the app header
    this.commandPaletteButton = page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON);
    // Keyboard shortcuts help button (? icon)
    this.shortcutsHelpButton = page.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
    // Global search button with aria-label "Open search (⌘K)"
    this.globalSearchButton = page.getByRole("button", { name: /open search/i });
    this.headerStartTimerButton = page.getByRole("button", { name: /^start timer$/i }).first();
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
    this.sidebar = page.getByTestId(TEST_IDS.NAV.SIDEBAR).or(page.getByRole("complementary"));
    // Use aria-label="Loading" to target actual loading spinners, not empty states
    this.loadingSpinner = page.getByLabel("Loading").or(page.getByTestId(TEST_IDS.LOADING.SPINNER));

    // Dashboard sections - use data-testid where available, semantic fallback where not
    this.myIssuesSection = page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING);
    this.workspacesSection = page.getByTestId(TEST_IDS.DASHBOARD.WORKSPACES_LIST);
    this.recentActivitySection = page.getByTestId(TEST_IDS.DASHBOARD.RECENT_ACTIVITY);
    this.quickStatsSection = page.getByTestId(TEST_IDS.DASHBOARD.QUICK_STATS);
    // Issue filter tabs: tab role in Radix/Tabs, with button fallback for legacy markup.
    this.assignedTab = page
      .getByRole("tab", { name: /^assigned/i })
      .or(page.getByRole("button", { name: /^assigned/i }));
    this.createdTab = page
      .getByRole("tab", { name: /^created/i })
      .or(page.getByRole("button", { name: /^created/i }));

    // Unified omnibox replaces the old standalone command palette.
    this.commandPaletteInput = page.getByTestId(TEST_IDS.SEARCH.INPUT);
    this.commandPalette = page.getByTestId(TEST_IDS.SEARCH.MODAL);

    // Modals - Shortcuts (uses title="Keyboard Shortcuts" via aria-labelledby)
    this.shortcutsModal = page.getByRole("dialog", { name: /keyboard shortcuts/i });

    // Modals - Global Search (not a dialog role, it's a fixed positioned div)
    // The modal contains "Search issues and documents..." placeholder input
    this.globalSearchModal = page.getByTestId(TEST_IDS.SEARCH.MODAL);
    this.advancedSearchModal = page.getByTestId(TEST_IDS.SEARCH.ADVANCED_MODAL);
    this.globalSearchInput = page.getByTestId(TEST_IDS.SEARCH.INPUT);
    this.globalSearchResultsGroup = page.getByTestId(TEST_IDS.SEARCH.RESULTS_GROUP);
    this.globalSearchResultItems = page.getByTestId(TEST_IDS.SEARCH.RESULT_ITEM);
    this.globalSearchLoadingState = page.getByTestId(TEST_IDS.SEARCH.LOADING_STATE);
    this.globalSearchMinimumQueryMessage = page.getByTestId(TEST_IDS.SEARCH.MIN_QUERY_MESSAGE);
    this.globalSearchNoResults = page.getByTestId(TEST_IDS.GLOBAL_SEARCH.NO_RESULTS);
    this.globalSearchAllTab = page.getByTestId(TEST_IDS.SEARCH.TAB_ALL);
    this.globalSearchIssuesTab = page.getByTestId(TEST_IDS.SEARCH.TAB_ISSUES);
    this.globalSearchDocumentsTab = page.getByTestId(TEST_IDS.SEARCH.TAB_DOCUMENTS);
    this.timeEntryModal = page.getByRole("dialog", { name: /^start timer$/i });
    this.timeEntryBillableCheckbox = this.timeEntryModal.getByRole("checkbox", {
      name: /billable/i,
    });
    this.appErrorHeading = page.getByRole("heading", { name: "500" });
    this.appErrorDetailsSummary = page.getByText(/view error details/i);
    this.appErrorDetailsMessage = page.locator("details pre");

    // Notifications panel
    this.notificationPanel = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_PANEL);
    this.markAllReadButton = page.getByRole("button", { name: /mark all read/i });
    this.notificationItems = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM);

    // Documents sidebar
    this.documentSearchInput = page.getByPlaceholder(/search.*document/i);
    this.newDocumentButton = page.getByRole("button", { name: /new.*document|\+ new/i });
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page.getByTestId(TEST_IDS.NAV.DOCUMENT_LIST);

    // Projects sidebar
    this.newProjectButton = page.getByRole("button", {
      name: /new.*project|\+ new/i,
    });
    this.projectList = page.getByTestId(TEST_IDS.NAV.WORKSPACE_LIST);
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    const dashboardUrl = ROUTES.dashboard.build(this.orgSlug);
    const currentUrl = this.page.url();

    if (currentUrl.includes(ROUTES.dashboard.build(this.orgSlug))) {
      await this.page.waitForLoadState("domcontentloaded");
      if (await this.tryDashboardReady()) {
        return;
      }
    }

    const isInAuthenticatedAppShell =
      currentUrl.includes(`/${this.orgSlug}/`) &&
      !currentUrl.includes(ROUTES.signin.build()) &&
      (await isLocatorVisible(this.dashboardTab));

    if (isInAuthenticatedAppShell) {
      await this.dashboardTab.click();
      if (await this.tryDashboardReady(5000)) {
        return;
      }
    } else {
      await this.page.waitForLoadState("load");
      await this.page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });
      await this.page.waitForLoadState("load");
      if (await this.tryDashboardReady(5000)) {
        return;
      }
    }

    await this.recoverDashboardRoute(dashboardUrl);
    await this.expectDashboardReady();
  }

  async waitUntilReady(): Promise<void> {
    await waitForDashboardReady(this.page);
  }

  private async expectDashboardReady(timeout = 15000) {
    const currentUrl = this.page.url();
    if (this.isOutsideOrgShell(currentUrl)) {
      throw new Error(`Redirected to landing/signin page: ${currentUrl}. Auth session invalid.`);
    }

    const escapedDashboardUrl = escapeRegExp(ROUTES.dashboard.build(this.orgSlug));
    await expect(this.page).toHaveURL(new RegExp(`${escapedDashboardUrl}(?:\\?.*)?$`), {
      timeout,
    });
    await this.expectLoaded();
    await waitForDashboardReady(this.page);
    await expect(this.myIssuesSection).toBeVisible({ timeout });
  }

  private async tryDashboardReady(timeout = 5000) {
    try {
      await this.expectDashboardReady(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async recoverDashboardRoute(dashboardUrl: string) {
    if (this.isOutsideOrgShell(this.page.url())) {
      await this.page.goto("/app", { waitUntil: "domcontentloaded" });
      await this.page.waitForLoadState("load");
      if (await this.tryDashboardReady(5000)) {
        return;
      }
    }

    await this.page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");

    if (await this.tryDashboardReady(5000)) {
      return;
    }

    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
  }

  private isOutsideOrgShell(url: string) {
    return !url.includes(`/${this.orgSlug}/`) || url.includes(ROUTES.signin.build());
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
    await tabs[tab].click();

    // Wait for the expected route segment rather than document-load state.
    const tabPaths = {
      dashboard: /\/dashboard/,
      documents: /\/documents/,
      workspaces: /\/workspaces/,
      timesheet: /\/timesheet/,
      calendar: /\/calendar/,
      settings: /\/settings/,
    };
    await expect(this.page).toHaveURL(tabPaths[tab]);

    await waitForDashboardReady(this.page);
  }

  // ===================
  // Actions - Header
  // ===================

  async openCommandPalette() {
    await this.openGlobalSearch();
  }

  async closeCommandPalette() {
    await this.closeGlobalSearch();
  }

  async closeCommandPaletteIfOpen() {
    await this.closeGlobalSearchIfOpen();
  }

  async openShortcutsHelp() {
    await this.shortcutsHelpButton.waitFor({ state: "visible" });
    await this.closeShortcutsHelpIfOpen();
    await this.clickShortcutsHelpTrigger();

    if (await this.waitForShortcutsHelpVisible()) {
      return;
    }

    await this.clickShortcutsHelpTrigger();
    await this.expectShortcutsHelpVisible();
  }

  private async clickShortcutsHelpTrigger() {
    await expect(this.shortcutsHelpButton).toBeVisible();
    await expect(this.shortcutsHelpButton).toBeEnabled();
    await this.shortcutsHelpButton.click();
  }

  private async waitForShortcutsHelpVisible(timeout = 3000) {
    try {
      await this.expectShortcutsHelpVisible(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectShortcutsHelpVisible(timeout = 10000) {
    await expect(this.shortcutsModal).toBeVisible({ timeout });
  }

  async closeShortcutsHelp() {
    await this.closeShortcutsHelpIfOpen();
    await expect(this.shortcutsModal).not.toBeVisible();
  }

  async closeShortcutsHelpIfOpen() {
    await this.dismissModalIfOpen(this.shortcutsModal, async () => {
      await this.dismissModalViaMainContent("keyboard shortcuts help");
    });
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
    await waitForDashboardReady(this.page);
    await this.closeNotificationsIfOpen();
    await this.clickNotificationTrigger();

    if (await this.waitForNotificationsPanelVisible()) {
      return;
    }

    await this.clickNotificationTrigger();
    await this.expectNotificationsPanelVisible();
  }

  async closeNotifications() {
    await this.closeNotificationsIfOpen();
    await expect(this.notificationPanel).not.toBeVisible();
  }

  async closeNotificationsIfOpen() {
    await this.dismissModalIfOpen(this.notificationPanel);
  }

  async signOut() {
    await this.signOutButton.click();
  }

  async signOutViaUserMenu() {
    await waitForDashboardReady(this.page);

    if (await this.isSignedOutDestinationVisible()) {
      return;
    }

    await this.attemptSignOutViaUserMenu();

    if (await this.waitForSignedOutDestination()) {
      return;
    }

    await this.attemptSignOutViaUserMenu();
    await this.expectSignedOutDestination();
  }

  private async waitForSignedOutDestination(timeout = 5000) {
    try {
      await this.expectSignedOutDestination(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectSignedOutDestination(timeout = 30000) {
    await expect
      .poll(
        async () => {
          if (await this.isSignedOutDestinationVisible()) {
            return "signed-out";
          }

          if (this.page.url().includes(`/${this.orgSlug}/`)) {
            return "authenticated-app";
          }

          return "redirecting";
        },
        { timeout, intervals: [500, 1000, 2000] },
      )
      .toBe("signed-out");
  }

  private async attemptSignOutViaUserMenu() {
    await this.openUserMenu();
    await this.clickVisibleUserMenuSignOutItem();
  }

  private async clickVisibleUserMenuSignOutItem() {
    await expect(this.getVisibleUserMenuSignOutItem()).toBeVisible();
    if (await this.tryClickVisibleUserMenuSignOutItem()) {
      return;
    }

    await this.openUserMenu();
    await expect(this.getVisibleUserMenuSignOutItem()).toBeVisible();
    const clicked = await this.tryClickVisibleUserMenuSignOutItem();
    expect(clicked).toBe(true);
  }

  private getVisibleUserMenuSignOutItem() {
    return this.page.getByRole("menuitem", { name: /sign out/i }).last();
  }

  private async tryClickVisibleUserMenuSignOutItem() {
    try {
      await this.getVisibleUserMenuSignOutItem().click();
      return true;
    } catch {
      return false;
    }
  }

  private async openUserMenu() {
    await expect(this.userMenuButton).toBeVisible();
    await this.userMenuButton.click();

    if (await this.waitForVisibleUserMenuSignOutItem()) {
      return;
    }

    await this.userMenuButton.click();
    await this.expectVisibleUserMenuSignOutItem();
  }

  private async waitForVisibleUserMenuSignOutItem(timeout = 3000) {
    try {
      await this.expectVisibleUserMenuSignOutItem(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectVisibleUserMenuSignOutItem(timeout = 5000) {
    await expect(this.getVisibleUserMenuSignOutItem()).toBeVisible({ timeout });
  }

  private async isSignedOutDestinationVisible(): Promise<boolean> {
    const landingCtaVisible = await isLocatorVisible(
      this.page.getByRole("link", { name: /get started free/i }),
    );
    if (landingCtaVisible) {
      return true;
    }

    return isLocatorVisible(this.page.getByRole("heading", { name: /sign in to nixelo/i }));
  }

  async openGlobalSearch() {
    await waitForDashboardReady(this.page);
    await this.throwIfAppErrorVisible();
    await this.closeGlobalSearchIfOpen();
    await this.clickGlobalSearchTrigger();
    await this.throwIfAppErrorVisible();

    if (await this.waitForGlobalSearchReady()) {
      await this.globalSearchInput.focus();
      await expect(this.globalSearchInput).toBeVisible();
      return;
    }

    await this.clickGlobalSearchTrigger();
    await this.throwIfAppErrorVisible();
    await this.expectGlobalSearchReady();
    await this.globalSearchInput.focus();
    await expect(this.globalSearchInput).toBeVisible();
  }

  private async clickGlobalSearchTrigger() {
    await expect(this.globalSearchButton).toBeVisible();
    await expect(this.globalSearchButton).toBeEnabled();
    await this.globalSearchButton.click();
  }

  private async clickNotificationTrigger() {
    await expect(this.notificationButton).toBeVisible();
    await expect(this.notificationButton).toBeEnabled();
    await this.notificationButton.click();
  }

  private async throwIfAppErrorVisible() {
    if (!(await isLocatorVisible(this.appErrorHeading))) {
      return;
    }

    const detailsVisible = await isLocatorVisible(this.appErrorDetailsMessage);
    if (!detailsVisible) {
      await this.expandAppErrorDetailsIfAvailable();
    }

    const errorDetails = (await getOptionalLocatorText(this.appErrorDetailsMessage))?.trim();
    const suffix = errorDetails ? `: ${errorDetails}` : "";
    const diagnostics = await this.getAppErrorDiagnostics();
    throw new Error(`App error boundary visible${suffix}${diagnostics}`);
  }

  private async getAppErrorDiagnostics(): Promise<string> {
    let diagnostics: {
      url: string;
      hydrated: boolean;
      authKeys: string[];
      connectionState: unknown;
    } | null = null;

    try {
      diagnostics = await this.page.evaluate(() => {
        const authKeys = Object.keys(localStorage)
          .filter((key) => key.includes("convexAuth"))
          .sort();
        const convexClient = (
          window as typeof window & {
            __convex_test_client?: { connectionState: () => unknown };
          }
        ).__convex_test_client;

        return {
          url: window.location.href,
          hydrated: document.body.classList.contains("app-hydrated"),
          authKeys,
          connectionState: convexClient?.connectionState() ?? null,
        };
      });
    } catch {
      diagnostics = null;
    }

    if (!diagnostics) {
      return "";
    }

    return ` [diagnostics ${JSON.stringify(diagnostics)}]`;
  }

  async openTimeEntryModal(options?: { expectBillable?: boolean }) {
    await waitForDashboardReady(this.page);
    if (options?.expectBillable === undefined) {
      await this.openTimeEntryModalOnce();
      return;
    }

    await this.openTimeEntryModalOnce();

    if (await this.waitForTimeEntryBillingState(options.expectBillable)) {
      await this.expectTimeEntryBillingState(options.expectBillable);
      return;
    }

    await this.resyncTimeEntryModalBillingState();
    await this.openTimeEntryModalOnce();
    await this.expectTimeEntryBillingState(options.expectBillable);
  }

  async reloadAppShell() {
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await waitForDashboardReady(this.page);
    await this.expectLoaded();
  }

  async closeGlobalSearch() {
    await this.closeGlobalSearchIfOpen();
    await expect(this.globalSearchModal).not.toBeVisible();
  }

  async closeGlobalSearchIfOpen() {
    await this.dismissModalIfOpen(this.globalSearchModal, async () => {
      await this.page.mouse.click(10, 10);
    });
  }

  async closeGlobalSearchWithEscape() {
    await expect(this.globalSearchModal).toBeVisible();
    await this.page.keyboard.press("Escape");
    await expect(this.globalSearchModal).not.toBeVisible();
  }

  async openAdvancedSearch() {
    await this.openGlobalSearch();
    const advancedSearchButton = this.globalSearchModal.getByRole("button", {
      name: /^advanced search$/i,
    });
    await expect(advancedSearchButton).toBeVisible();
    await advancedSearchButton.click();
    await expect(this.advancedSearchModal).toBeVisible();
  }

  async closeAdvancedSearch() {
    await this.closeAdvancedSearchIfOpen();
    await expect(this.advancedSearchModal).not.toBeVisible();
  }

  async closeAdvancedSearchIfOpen() {
    await this.dismissModalIfOpen(this.advancedSearchModal, async () => {
      await this.dismissModalViaMainContent("advanced search");
    });
  }

  async closeTimeEntryModal() {
    await this.closeTimeEntryModalIfOpen();
    await expect(this.timeEntryModal).not.toBeVisible();
  }

  async closeTimeEntryModalIfOpen() {
    await this.dismissModalIfOpen(this.timeEntryModal);
  }

  private async openTimeEntryModalOnce() {
    await this.closeTimeEntryModalIfOpen();
    await this.clickTimeEntryTrigger();

    if (await this.waitForTimeEntryModalVisible()) {
      return;
    }

    await this.clickTimeEntryTrigger();
    await this.expectTimeEntryModalVisible();
  }

  private async clickTimeEntryTrigger() {
    await expect(this.headerStartTimerButton).toBeVisible();
    await expect(this.headerStartTimerButton).toBeEnabled();
    await this.headerStartTimerButton.click();
  }

  private async dismissModalIfOpen(modal: Locator, fallbackDismiss?: () => Promise<void>) {
    if (!(await isLocatorVisible(modal))) {
      return;
    }

    await this.page.keyboard.press("Escape");

    if (!(await this.waitForModalHidden(modal))) {
      if (fallbackDismiss) {
        await fallbackDismiss();
      }
      await expect(modal).not.toBeVisible();
      return;
    }

    await expect(modal).not.toBeVisible();
  }

  private async dismissModalViaMainContent(modalLabel: string): Promise<void> {
    await expect(
      this.mainContent,
      `${modalLabel} fallback dismissal requires visible main content`,
    ).toBeVisible();

    try {
      await this.mainContent.click({ position: { x: 10, y: 10 } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to dismiss ${modalLabel} via main content click: ${message}`);
    }
  }

  private async expandAppErrorDetailsIfAvailable(): Promise<void> {
    const summaryVisible = await isLocatorVisible(this.appErrorDetailsSummary);
    if (!summaryVisible) {
      return;
    }

    try {
      await this.appErrorDetailsSummary.click();
    } catch (error) {
      const detailsVisible = await isLocatorVisible(this.appErrorDetailsMessage);
      if (detailsVisible) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`App error details could not be expanded: ${message}`);
    }
  }

  private async waitForModalHidden(modal: Locator, timeout = 1000) {
    try {
      await modal.waitFor({ state: "hidden", timeout });
      return true;
    } catch {
      return false;
    }
  }

  private async waitForNotificationsPanelVisible(timeout = 3000) {
    try {
      await this.notificationPanel.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  private async resyncTimeEntryModalBillingState() {
    await this.closeTimeEntryModalIfOpen();
    await this.reloadAppShell();
  }

  private async waitForTimeEntryModalVisible(timeout = 3000) {
    try {
      await this.timeEntryModal.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  private async expectTimeEntryModalVisible(timeout = 10000) {
    const visible = await this.waitForTimeEntryModalVisible(timeout);
    expect(visible).toBe(true);
  }

  private async waitForTimeEntryBillingState(expectBillable: boolean, timeout = 3000) {
    try {
      await expect
        .poll(async () => this.getTimeEntryBillingState(), {
          timeout,
          intervals: [200, 500, 1000],
        })
        .toBe(expectBillable ? "billable" : "non-billable");
      return true;
    } catch {
      return false;
    }
  }

  private async getTimeEntryBillingState(): Promise<"billable" | "non-billable" | "pending"> {
    if (!(await isLocatorVisible(this.timeEntryModal))) {
      return "pending";
    }

    if (await isLocatorVisible(this.timeEntryBillableCheckbox)) {
      return "billable";
    }

    return "non-billable";
  }

  private async expectTimeEntryBillingState(expectBillable: boolean) {
    if (expectBillable) {
      await expect(this.timeEntryBillableCheckbox).toBeVisible();
      return;
    }

    await expect(this.timeEntryBillableCheckbox).not.toBeVisible();
  }

  async openGlobalSearchWithShortcut() {
    await waitForDashboardReady(this.page);
    await this.closeGlobalSearchIfOpen();
    await this.page.keyboard.press("ControlOrMeta+k");

    if (!(await this.waitForGlobalSearchReady())) {
      await this.page.keyboard.press("ControlOrMeta+k");
      await this.expectGlobalSearchReady();
      return;
    }

    await this.globalSearchInput.focus();
    await expect(this.globalSearchInput).toBeVisible();
  }

  async waitForGlobalSearchReady(timeout = 3000) {
    try {
      await this.throwIfAppErrorVisible();
      await this.globalSearchModal.waitFor({ state: "visible", timeout });
      await this.globalSearchInput.waitFor({ state: "visible", timeout });
      await expect(this.globalSearchInput).toBeEnabled({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async expectGlobalSearchReady(timeout = 10000) {
    const ready = await this.waitForGlobalSearchReady(timeout);
    expect(ready).toBe(true);
    await this.globalSearchInput.focus();
    await expect(this.globalSearchInput).toBeVisible();
  }

  async searchFor(query: string) {
    await this.expectGlobalSearchReady();
    await this.enterGlobalSearchQuery(query);

    if (query.length < 2) {
      await this.throwIfAppErrorVisible();
      await expect(this.globalSearchMinimumQueryMessage).toBeVisible();
      return;
    }

    await this.waitForSearchSettled();
  }

  async waitForSearchSettled() {
    await expect
      .poll(async () => this.getGlobalSearchResultsState(), {
        timeout: 10000,
        intervals: [200, 500, 1000],
      })
      .toMatch(/^(results|empty)$/);
  }

  async switchGlobalSearchTab(tab: "all" | "issues" | "documents") {
    const tabs = {
      all: this.globalSearchAllTab,
      issues: this.globalSearchIssuesTab,
      documents: this.globalSearchDocumentsTab,
    };

    await expect(tabs[tab]).toBeVisible();
    await tabs[tab].click();
    await expect(tabs[tab]).toHaveAttribute("aria-selected", "true");
    await this.waitForSearchSettled();
  }

  getGlobalSearchResult(title: string): Locator {
    return this.globalSearchResultItems.filter({ hasText: title }).first();
  }

  getGlobalSearchResults(title: string): Locator {
    return this.globalSearchResultItems.filter({ hasText: title });
  }

  getGlobalSearchResultType(title: string): Locator {
    return this.getGlobalSearchResult(title).getByTestId(TEST_IDS.SEARCH.RESULT_TYPE);
  }

  private async enterGlobalSearchQuery(query: string) {
    await this.throwIfAppErrorVisible();
    await expect(this.globalSearchInput).toBeVisible();
    await expect(this.globalSearchInput).toBeEnabled();
    await this.globalSearchInput.focus();
    await this.globalSearchInput.fill(query);
    await this.throwIfAppErrorVisible();

    if (await this.waitForGlobalSearchQueryValue(query)) {
      return;
    }

    await this.expectGlobalSearchReady();
    await this.globalSearchInput.fill(query);
    await this.throwIfAppErrorVisible();
    await expect(this.globalSearchInput).toHaveValue(query);
  }

  private async waitForGlobalSearchQueryValue(query: string, timeout = 3000) {
    try {
      await expect(this.globalSearchInput).toHaveValue(query, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getGlobalSearchResultsState(): Promise<"loading" | "results" | "empty" | "settling"> {
    await this.throwIfAppErrorVisible();

    if (await isLocatorVisible(this.globalSearchLoadingState)) {
      return "loading";
    }

    if (await isLocatorVisible(this.globalSearchResultItems.first())) {
      return "results";
    }

    if (await isLocatorVisible(this.globalSearchNoResults)) {
      return "empty";
    }

    return "settling";
  }

  // ===================
  // Actions - Dashboard Content
  // ===================

  async filterIssues(filter: "assigned" | "created") {
    const tabs = {
      assigned: this.assignedTab,
      created: this.createdTab,
    };
    await expect(tabs[filter]).toBeVisible();
    await expect(tabs[filter]).toBeEnabled();
    await tabs[filter].click();

    await expect(tabs[filter]).toHaveAttribute("aria-selected", "true");
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

  async pressShortcutsHelpShortcut() {
    await this.waitForLoad();
    // Press Shift+/ which produces "?" - TanStack hotkeys normalizes this to Shift+/
    await this.page.keyboard.press("Shift+/");
    await expect(this.shortcutsModal).toBeVisible();
  }

  // ===================
  // Assertions
  // ===================

  async expectDashboard() {
    await expect(this.globalSearchButton).toBeVisible();
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

  async expectMainSectionsVisible() {
    await expect(this.mainContent).toBeVisible();
    await expect(this.myIssuesSection).toBeVisible();
    await expect(this.workspacesSection).toBeVisible();
  }

  async expectIssueFiltersVisible() {
    await expect(this.assignedTab).toBeVisible();
    await expect(this.createdTab).toBeVisible();
  }

  async expectNotificationsPanelVisible() {
    await expect(this.notificationPanel).toBeVisible();
  }
}
