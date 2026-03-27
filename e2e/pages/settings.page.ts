import { expect, type Locator } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import {
  getLocatorInputValue,
  isLocatorDisabled,
  isLocatorEditable,
  isLocatorVisible,
} from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

declare global {
  interface Window {
    __NIXELO_E2E_NOTIFICATION_PERMISSION__?: NotificationPermission;
    __NIXELO_E2E_VAPID_PUBLIC_KEY__?: string;
    __NIXELO_E2E_WEB_PUSH_SUPPORTED__?: boolean;
  }
}

/**
 * Settings Page Object
 * Handles the settings view with integrations, API keys, and preferences
 */
export class SettingsPage extends BasePage {
  // ===================
  // Locators - Settings Tabs
  // ===================
  readonly integrationsTab: Locator;
  readonly apiKeysTab: Locator;
  readonly offlineTab: Locator;
  readonly preferencesTab: Locator;
  readonly adminTab: Locator;
  readonly devToolsTab: Locator;
  readonly profileTab: Locator;
  readonly profileAvatarUploadTrigger: Locator;
  readonly profileCoverUploadTrigger: Locator;

  // ===================
  // Locators - Theme Options (in Preferences tab)
  // ===================
  readonly themeLightOption: Locator;
  readonly themeDarkOption: Locator;
  readonly themeSystemOption: Locator;

  // ===================
  // Locators - Integrations
  // ===================
  readonly githubIntegration: Locator;
  readonly googleCalendarIntegration: Locator;
  readonly pumbleIntegration: Locator;
  readonly connectGithubButton: Locator;
  readonly connectGoogleButton: Locator;
  readonly connectPumbleButton: Locator;

  // ===================
  // Locators - API Keys
  // ===================
  readonly apiKeysList: Locator;
  readonly generateApiKeyButton: Locator;
  readonly apiKeyNameInput: Locator;
  readonly createApiKeyButton: Locator;
  readonly copyApiKeyButton: Locator;
  readonly revokeApiKeyButton: Locator;

  // ===================
  // Locators - Offline Mode
  // ===================
  readonly offlineToggle: Locator;
  readonly syncStatusIndicator: Locator;
  readonly forceSyncButton: Locator;
  readonly processQueueButton: Locator;
  readonly localOfflineQueueHeading: Locator;
  readonly lastSuccessfulReplayLabel: Locator;

  // ===================
  // Locators - Preferences
  // ===================
  readonly notificationPreferences: Locator;
  readonly notificationsBlockedAlert: Locator;
  readonly notificationsBlockedButton: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly pushNotificationsToggle: Locator;
  readonly languageSelect: Locator;
  readonly timezoneSelect: Locator;

  // ===================
  // Locators - Admin
  // ===================
  readonly userManagementSection: Locator;
  readonly userManagementHeading: Locator;
  readonly inviteUserButton: Locator;
  readonly userTypeManager: Locator;
  readonly hourComplianceDashboard: Locator;
  readonly inviteTable: Locator;
  readonly inviteEmptyState: Locator;
  readonly adminUsersTab: Locator;
  readonly platformUsersTable: Locator;

  // ===================
  // Locators - Invite User Modal
  // ===================
  readonly inviteUserModal: Locator;
  readonly inviteUserForm: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly sendInviteButton: Locator;
  readonly cancelInviteButton: Locator;

  // ===================
  // Locators - Organization Settings
  // ===================
  readonly organizationNameInput: Locator;
  readonly requiresTimeApprovalSwitch: Locator;
  readonly saveSettingsButton: Locator;
  readonly organizationSettingsHeading: Locator;
  readonly twoFactorSection: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Settings tabs
    this.integrationsTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_INTEGRATIONS);
    this.apiKeysTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_APIKEYS);
    this.offlineTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_OFFLINE);
    this.preferencesTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_PREFERENCES);
    this.adminTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_ADMIN);
    this.devToolsTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_DEVELOPER);
    this.profileTab = page.getByTestId(TEST_IDS.SETTINGS.TAB_PROFILE);
    this.profileAvatarUploadTrigger = page.getByTestId(
      TEST_IDS.SETTINGS.PROFILE_AVATAR_UPLOAD_TRIGGER,
    );
    this.profileCoverUploadTrigger = page.getByTestId(
      TEST_IDS.SETTINGS.PROFILE_COVER_UPLOAD_TRIGGER,
    );

    // Theme options (in Preferences tab) - ToggleGroupItems with aria-labels
    this.themeLightOption = page.getByRole("radio", { name: /light theme/i });
    this.themeDarkOption = page.getByRole("radio", { name: /dark theme/i });
    this.themeSystemOption = page.getByRole("radio", { name: /system theme/i });

    // Integrations
    this.githubIntegration = page.getByTestId(TEST_IDS.SETTINGS.GITHUB_INTEGRATION);
    this.googleCalendarIntegration = page.getByTestId(
      TEST_IDS.SETTINGS.GOOGLE_CALENDAR_INTEGRATION,
    );
    this.pumbleIntegration = page.getByTestId(TEST_IDS.SETTINGS.PUMBLE_INTEGRATION);
    this.connectGithubButton = page.getByRole("button", { name: /connect.*github/i });
    this.connectGoogleButton = page.getByRole("button", { name: /connect.*google/i });
    this.connectPumbleButton = page.getByRole("button", { name: /connect.*pumble/i });

    // API Keys
    this.apiKeysList = page.getByTestId(TEST_IDS.SETTINGS.API_KEYS_SECTION);
    this.generateApiKeyButton = page.getByRole("button", {
      name: /generate|create.*key|new.*key/i,
    });
    this.apiKeyNameInput = page.getByPlaceholder(/key.*name|name/i);
    this.createApiKeyButton = page.getByRole("button", { name: /^create$/i });
    this.copyApiKeyButton = page.getByRole("button", { name: /copy/i });
    this.revokeApiKeyButton = page.getByRole("button", { name: /revoke|delete/i });

    // Offline mode
    this.offlineToggle = page
      .getByRole("switch", { name: /offline/i })
      .or(page.getByRole("checkbox", { name: /offline/i }));
    this.syncStatusIndicator = page.getByTestId(TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD);
    this.forceSyncButton = page.getByRole("button", { name: /sync|force.*sync/i });
    this.processQueueButton = page.getByRole("button", { name: /^process queue$/i });
    this.localOfflineQueueHeading = page.getByRole("heading", { name: /local offline queue/i });
    this.lastSuccessfulReplayLabel = page.getByText(/^Last Successful Replay$/);

    // Preferences
    this.notificationPreferences = page.getByTestId(
      TEST_IDS.SETTINGS.NOTIFICATION_PREFERENCES_SECTION,
    );
    this.notificationsBlockedAlert = page.getByTestId(
      TEST_IDS.SETTINGS.NOTIFICATIONS_BLOCKED_ALERT,
    );
    this.notificationsBlockedButton = page.getByTestId(
      TEST_IDS.SETTINGS.NOTIFICATIONS_BLOCKED_BUTTON,
    );
    this.emailNotificationsToggle = page
      .getByRole("switch", { name: /email/i })
      .or(page.getByRole("checkbox", { name: /email.*notification/i }));
    this.pushNotificationsToggle = page
      .getByRole("switch", { name: /push/i })
      .or(page.getByRole("checkbox", { name: /push.*notification/i }));
    this.languageSelect = page.getByRole("combobox", { name: /language/i });
    this.timezoneSelect = page.locator("#timezone");

    // Admin
    this.userManagementSection = page.getByTestId(TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION);
    this.userManagementHeading = page
      .getByTestId(TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION)
      .getByRole("heading")
      .first();
    this.inviteUserButton = page.getByTestId(TEST_IDS.SETTINGS.INVITE_BUTTON);
    this.userTypeManager = page.getByTestId(TEST_IDS.SETTINGS.USER_TYPE_MANAGER_SECTION);
    this.hourComplianceDashboard = page.getByTestId(TEST_IDS.SETTINGS.HOUR_COMPLIANCE_SECTION);
    this.adminUsersTab = page.getByTestId(TEST_IDS.SETTINGS.ADMIN_USERS_TAB);
    this.platformUsersTable = page.getByTestId(TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION);
    this.inviteEmptyState = page.getByText(/^No invitations$/);

    // Invite user form (it's an inline Card, not a dialog)
    this.inviteUserModal = page.getByRole("heading", { name: /send invitation/i });
    this.inviteEmailInput = page.getByTestId(TEST_IDS.INVITE.EMAIL_INPUT);
    this.inviteUserForm = this.inviteEmailInput.locator("xpath=ancestor::form");
    this.inviteRoleSelect = page.getByTestId(TEST_IDS.INVITE.ROLE_SELECT);
    this.sendInviteButton = page.getByTestId(TEST_IDS.INVITE.SEND_BUTTON);
    this.cancelInviteButton = this.inviteUserForm.getByRole("button", { name: /^cancel$/i });
    this.inviteTable = page.getByTestId(TEST_IDS.INVITE.TABLE);

    // Admin - Organization Settings
    this.organizationSettingsHeading = page.getByRole("heading", {
      name: /organization settings/i,
    });
    this.organizationNameInput = page.locator("#orgName");
    this.requiresTimeApprovalSwitch = page.getByTestId(TEST_IDS.SETTINGS.TIME_APPROVAL_SWITCH);
    this.saveSettingsButton = page.getByTestId(TEST_IDS.SETTINGS.SAVE_BUTTON);
    this.twoFactorSection = page.getByTestId(TEST_IDS.SETTINGS.TWO_FACTOR_SECTION);
  }

  // ===================
  // Actions - Navigation
  // ===================

  async goto() {
    // Navigate directly to settings URL
    const url = ROUTES.settings.profile.build(this.orgSlug);
    await this.gotoPath(url);

    try {
      // Wait for the Settings heading as a sign of page load
      await this.page
        .getByRole("heading", { name: /settings/i })
        .first()
        .waitFor({ state: "visible" });

      // Wait for settings page to load - look for integrations tab (always visible)
      await this.integrationsTab.first().waitFor({ state: "visible" });
    } catch (e) {
      const currentUrl = this.page.url();
      const bodyText = await this.getDebugValue(
        () => this.page.evaluate(() => document.body.innerText),
        "Could not get body text",
      );
      console.log(`[DEBUG] SettingsPage.goto failed`);
      console.log(`[DEBUG] Target URL: ${url}`);
      console.log(`[DEBUG] Current URL: ${currentUrl}`);
      const localStorage = await this.getDebugValue(
        () => this.page.evaluate(() => JSON.stringify(localStorage)),
        "Could not get localStorage",
      );
      const convexClientState = await this.getDebugValue(
        () =>
          this.page.evaluate(() => {
            const client = (window as Record<string, unknown>).__convex_test_client as
              | { authenticationToken?: unknown }
              | undefined;
            return client
              ? `Found client. Auth token set: ${!!client.authenticationToken}`
              : "Client not found on window";
          }),
        "Error getting client state",
      );
      console.log(`[DEBUG] LocalStorage: ${localStorage}`);
      console.log(`[DEBUG] ConvexClient: ${convexClientState}`);
      console.log(`[DEBUG] Body Text: ${bodyText.substring(0, 1000)}`);
      throw e;
    }
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.profileTab.waitFor({ state: "visible", timeout: 12000 });
  }

  async waitForCaptureReady(
    name:
      | "settings"
      | "settings-profile"
      | "settings-notifications"
      | "settings-security"
      | "settings-apikeys"
      | "settings-integrations"
      | "settings-admin"
      | "settings-offline",
  ): Promise<void> {
    const expectedPathname = new URL(
      ROUTES.settings.profile.build(this.orgSlug),
      "http://cascade.local",
    ).pathname;
    await this.page.waitForURL((currentUrl) => new URL(currentUrl).pathname === expectedPathname, {
      timeout: 12000,
    });
    await this.waitUntilReady();

    if (name === "settings-notifications") {
      await this.notificationPreferences.waitFor({ state: "visible", timeout: 12000 });
      return;
    }

    if (name === "settings-security") {
      await this.twoFactorSection.waitFor({ state: "visible", timeout: 12000 });
      return;
    }

    if (name === "settings-apikeys") {
      await this.apiKeysList.waitFor({ state: "visible", timeout: 12000 });
      return;
    }

    if (name === "settings-integrations") {
      await this.githubIntegration.waitFor({ state: "visible", timeout: 12000 });
      return;
    }

    if (name === "settings-admin") {
      await this.userManagementSection.waitFor({ state: "visible", timeout: 12000 });
      return;
    }

    if (name === "settings-offline") {
      await this.syncStatusIndicator.waitFor({ state: "visible", timeout: 12000 });
    }
  }

  async switchToTab(
    tab: "integrations" | "apiKeys" | "offline" | "preferences" | "admin" | "devTools",
  ) {
    // Map tab names to URL param values (must match validTabs in Settings.tsx)
    const tabParamMap: Record<string, string> = {
      integrations: "integrations",
      apiKeys: "apikeys",
      offline: "offline",
      preferences: "preferences",
      admin: "admin",
      devTools: "developer",
    };

    // Navigate via URL param - more reliable than clicking
    const tabParam = tabParamMap[tab] || tab;
    const currentUrl = new URL(this.page.url());
    currentUrl.searchParams.set("tab", tabParam);
    await this.page.goto(currentUrl.toString());
    await expect(this.page).toHaveURL(currentUrl.toString());

    // For admin tab, wait for the tab to appear (requires isOrganizationAdmin query)
    const waitTimeout = tab === "admin" ? 60000 : 30000;
    const tabName = tab === "admin" ? /^Admin$/i : new RegExp(tab, "i");
    const tabLocator = this.page.getByRole("tab", { name: tabName });
    await tabLocator.waitFor({ state: "visible", timeout: waitTimeout });

    // Verify tab is selected
    await expect(tabLocator).toHaveAttribute("aria-selected", "true");

    // For admin tab, also verify the admin content is actually visible
    if (tab === "admin") {
      await this.organizationSettingsHeading.waitFor({ state: "visible" });
    }

    await this.waitForLoad();
  }

  async gotoProfile(): Promise<void> {
    await this.gotoPath(ROUTES.settings.profile.build(this.orgSlug));
    await this.waitForCaptureReady("settings-profile");
  }

  async gotoNotifications(): Promise<void> {
    await this.gotoPath(ROUTES.settings.profile.build(this.orgSlug, "notifications"));
    await this.waitForCaptureReady("settings-notifications");
  }

  async gotoNotificationsWithBlockedPermission(): Promise<void> {
    if (this.page.url() !== "about:blank") {
      throw new Error(
        "gotoNotificationsWithBlockedPermission must run on a fresh page before any navigation",
      );
    }

    await this.page.addInitScript(() => {
      window.__NIXELO_E2E_NOTIFICATION_PERMISSION__ = "denied";
      window.__NIXELO_E2E_WEB_PUSH_SUPPORTED__ = true;
      window.__NIXELO_E2E_VAPID_PUBLIC_KEY__ = "e2e-screenshot-vapid-key";
    });
    await this.gotoNotifications();
  }

  async openProfileAvatarUploadModal(): Promise<Locator> {
    await this.gotoProfile();
    await this.profileAvatarUploadTrigger.waitFor({ state: "visible", timeout: 8000 });
    await this.profileAvatarUploadTrigger.scrollIntoViewIfNeeded();
    await this.profileAvatarUploadTrigger.click();
    const dialog = this.page.getByRole("dialog", { name: /^upload avatar$/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^upload$/i })).toBeVisible();
    return dialog;
  }

  async openProfileCoverUploadModal(): Promise<Locator> {
    await this.gotoProfile();
    await this.profileCoverUploadTrigger.waitFor({ state: "visible", timeout: 8000 });
    await this.profileCoverUploadTrigger.scrollIntoViewIfNeeded();
    await this.profileCoverUploadTrigger.click();
    const dialog = this.page.getByRole("dialog", { name: /^upload cover image$/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^upload$/i })).toBeVisible();
    return dialog;
  }

  async expectNotificationsPermissionDeniedState(): Promise<void> {
    await this.waitForCaptureReady("settings-notifications");
    await expect(this.notificationsBlockedAlert).toBeVisible();
    await expect(this.notificationsBlockedButton).toBeDisabled();
  }

  // ===================
  // Actions - Integrations
  // ===================

  async connectGithub() {
    await this.connectGithubButton.click();
  }

  async connectGoogleCalendar() {
    await this.connectGoogleButton.click();
  }

  async connectPumble() {
    await this.connectPumbleButton.click();
  }

  // ===================
  // Actions - API Keys
  // ===================

  async generateApiKey(name: string) {
    await this.generateApiKeyButton.click();
    await this.apiKeyNameInput.fill(name);
    await this.createApiKeyButton.click();
  }

  async copyApiKey() {
    await this.copyApiKeyButton.click();
  }

  async revokeApiKey() {
    await this.revokeApiKeyButton.first().click();
  }

  // ===================
  // Actions - Offline Mode
  // ===================

  async toggleOfflineMode() {
    await this.offlineToggle.click();
  }

  async forceSync() {
    await this.forceSyncButton.click();
  }

  async getCurrentTimezoneLabel() {
    await expect(this.timezoneSelect).toBeVisible();
    const text = await this.timezoneSelect.innerText();
    return text.trim();
  }

  async selectTimezone(timezone: string) {
    const option = this.page.getByRole("option", { name: timezone, exact: true });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(this.timezoneSelect).toBeVisible();
      await this.timezoneSelect.click();

      try {
        await expect(option).toBeVisible();
        await option.click();
        await this.expectTimezoneSelected(timezone);
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }
  }

  async expectTimezoneSelected(timezone: string) {
    await expect(this.timezoneSelect).toContainText(timezone);
  }

  getOfflineQueueItem(mutationType: string) {
    return this.page.getByText(mutationType, { exact: true });
  }

  async expectOfflineQueueItemVisible(mutationType: string) {
    await expect(this.localOfflineQueueHeading).toBeVisible();
    await expect(this.getOfflineQueueItem(mutationType)).toBeVisible();
  }

  async expectOfflineQueueHidden() {
    await expect(this.localOfflineQueueHeading).toHaveCount(0);
  }

  async processOfflineQueue() {
    await expect(this.processQueueButton).toBeVisible();
    await this.processQueueButton.click();
  }

  async waitForOfflineQueueToDrain() {
    await expect(async () => {
      await this.offlineTab.click();
      await expect(this.localOfflineQueueHeading).toHaveCount(0);
    }).toPass({ intervals: [500, 1000, 2000] });
  }

  // ===================
  // Actions - Admin
  // ===================

  async openInviteUserModal() {
    await this.waitForInviteManagementReady();

    const inviteBtn = this.inviteUserButton.first();
    await inviteBtn.waitFor({ state: "visible" });
    await inviteBtn.scrollIntoViewIfNeeded();

    await this.closeInviteUserModalIfOpen();
    await expect(inviteBtn).toBeEnabled();
    await inviteBtn.click();

    if (await this.waitForInviteFormReady()) {
      return;
    }

    // Only re-click if the form is not visible (avoid double-clicking an open form)
    if (await isLocatorVisible(this.inviteUserForm)) {
      await this.expectInviteFormReady();
    } else {
      await inviteBtn.click();
      await this.expectInviteFormReady();
    }
  }

  async closeInviteUserModalIfOpen() {
    if (!(await isLocatorVisible(this.inviteUserForm))) {
      return;
    }

    if (await isLocatorVisible(this.cancelInviteButton)) {
      await this.dismissInviteUserModalWithCancel();
    }

    if (await isLocatorVisible(this.inviteUserForm)) {
      await this.page.keyboard.press("Escape");
    }

    await expect(this.inviteUserForm).not.toBeVisible();
  }

  async inviteUser(email: string, role?: string) {
    await this.fillInviteEmail(email);

    // Normalize role first to handle whitespace-padded values like " User "
    const normalizedRole = role?.trim().toLowerCase();

    // Only change role if it's not "user" (which is the default)
    if (normalizedRole && normalizedRole !== "user") {
      const roleLabelMap: Record<string, string> = {
        "super admin": "Super Admin",
        super_admin: "Super Admin",
        admin: "Super Admin",
      };
      const displayRole = roleLabelMap[normalizedRole];
      if (!displayRole) {
        throw new Error(`Unsupported invite role: ${role}`);
      }
      await expect(this.inviteRoleSelect).toBeVisible();
      await this.inviteRoleSelect.click();
      await expect(this.page.getByRole("option", { name: displayRole })).toBeVisible();
      await this.page.getByRole("option", { name: displayRole }).click();
      await expect(this.page.getByRole("option", { name: displayRole })).not.toBeVisible();
    }

    const inviteRow = this.getInviteRow(email);
    if (await isLocatorVisible(inviteRow)) {
      return;
    }

    await this.ensureInviteFormReady();
    await expect(this.sendInviteButton).toBeVisible();
    await expect(this.sendInviteButton).toBeEnabled();
    await this.sendInviteButton.click();

    await this.expectInviteVisible(email);
  }

  getInviteRow(email: string) {
    return this.inviteTable.getByTestId(TEST_IDS.INVITE.ROW).filter({ hasText: email });
  }

  async expectInviteVisible(email: string) {
    const row = this.getInviteRow(email);
    await expect(this.inviteTable).toBeVisible();
    await expect(row).toBeVisible();
  }

  async expectInviteRevoked(email: string) {
    const row = this.getInviteRow(email);
    await expect(row).toBeVisible();
    await expect(row.getByText(/^revoked$/i)).toBeVisible();
    await expect(row.getByRole("button", { name: /revoke/i })).toHaveCount(0);
  }

  async revokeInvite(email: string) {
    const row = this.getInviteRow(email);
    await expect(row).toBeVisible();

    // Click revoke button to open confirm dialog
    await row.getByRole("button", { name: /revoke/i }).click();

    // Confirm in the ConfirmDialog
    const confirmDialog = this.page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: /revoke/i }).click();

    await this.expectInviteRevoked(email);
  }

  private async ensureInviteFormReady() {
    if (await this.waitForInviteFormReady(1000)) {
      return;
    }

    await this.openInviteUserModal();
    await this.expectInviteFormReady();
  }

  private async fillInviteEmail(email: string) {
    await this.ensureInviteFormReady();

    if (await this.tryFillInviteEmail(email)) {
      return;
    }

    await this.closeInviteUserModalIfOpen();
    await this.ensureInviteFormReady();
    await this.expectInviteEmailFilled(email);
  }

  private async tryFillInviteEmail(email: string) {
    try {
      await this.inviteEmailInput.fill(email);
    } catch {
      return false;
    }

    const currentValue = await getLocatorInputValue(this.inviteEmailInput);
    return currentValue === email;
  }

  private async expectInviteEmailFilled(email: string) {
    await this.inviteEmailInput.fill(email);
    await expect(this.inviteEmailInput).toHaveValue(email);
  }

  private async waitForInviteManagementReady(timeout = 15000) {
    await expect(this.organizationSettingsHeading).toBeVisible({ timeout });
    await expect(this.userManagementHeading).toBeVisible({ timeout });
    await expect(this.adminUsersTab).toBeVisible({ timeout });
    await expect
      .poll(async () => this.getInviteManagementState(), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .toMatch(/^(table|empty)$/);
  }

  private async waitForInviteFormReady(timeout = 3000) {
    try {
      await this.expectInviteFormReady(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectInviteFormReady(timeout = 10000) {
    await expect
      .poll(async () => this.getInviteFormState(), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .toBe("ready");
  }

  private async getInviteManagementState(): Promise<"table" | "empty" | "loading"> {
    if (await isLocatorVisible(this.inviteTable)) {
      return "table";
    }

    if (await isLocatorVisible(this.inviteEmptyState)) {
      return "empty";
    }

    return "loading";
  }

  private async getInviteFormState(): Promise<"ready" | "open" | "closed"> {
    if (
      (await isLocatorVisible(this.inviteEmailInput)) &&
      (await isLocatorEditable(this.inviteEmailInput)) &&
      (await isLocatorVisible(this.sendInviteButton))
    ) {
      return "ready";
    }

    if (
      (await isLocatorVisible(this.inviteUserModal)) ||
      (await isLocatorVisible(this.inviteUserForm)) ||
      (await isLocatorVisible(this.sendInviteButton))
    ) {
      return "open";
    }

    return "closed";
  }

  async openAdminUsersList() {
    await expect(this.userManagementHeading).toBeVisible({ timeout: 15000 });
    await expect(this.platformUsersTable).toBeVisible({ timeout: 10000 });
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const options = {
      light: this.themeLightOption,
      dark: this.themeDarkOption,
      system: this.themeSystemOption,
    };
    await options[theme].click();
  }

  async expectDarkThemeEnabled() {
    await expect(this.page.locator("html")).toHaveClass(/dark/);
  }

  async expectDarkThemeDisabled() {
    await expect(this.page.locator("html")).not.toHaveClass(/dark/);
  }

  // ===================
  // Assertions
  // ===================

  async expectSettingsView() {
    await expect(this.integrationsTab).toBeVisible();
  }

  async expectIntegrationsTab() {
    await expect(this.githubIntegration).toBeVisible();
  }

  async expectApiKeysTab() {
    await expect(this.generateApiKeyButton).toBeVisible();
  }

  async expectPreferencesTab() {
    await expect(this.notificationPreferences).toBeVisible();
  }

  async isAdminTabVisible() {
    return isLocatorVisible(this.adminTab);
  }

  async expectAdminTabHidden() {
    await expect(this.adminTab).not.toBeVisible();
  }

  async expectAdminSettingsLoaded() {
    await this.organizationSettingsHeading.waitFor({ state: "visible" });
    await expect(this.organizationNameInput).toBeVisible();
    await expect(this.requiresTimeApprovalSwitch).toBeVisible();
  }

  async expectAdminContentHidden() {
    await expect(this.organizationSettingsHeading).not.toBeVisible();
    await expect(this.organizationNameInput).not.toBeVisible();
  }

  async updateOrganizationName(name: string) {
    if (name) {
      await this.organizationNameInput.fill(name);
    }
    await this.saveSettingsButton.click();
    // Use .first() to handle multiple toast notifications
    await expect(this.page.getByText(/organization settings updated/i).first()).toBeVisible();
  }

  async toggleTimeApproval(enabled: boolean) {
    await this.expectAdminSettingsLoaded();

    if (await this.hasTimeApprovalState(enabled)) {
      // Even if DOM matches, there may be a pending unsaved draft - ensure it's persisted
      if (await this.waitForSettingsSaveReady(500)) {
        await this.saveOrganizationSettings();
      }
      await this.expectTimeApprovalEnabled(enabled);
      return;
    }

    await this.setTimeApprovalDraftState(enabled);

    if (await this.saveOrganizationSettingsAttempt()) {
      await this.expectTimeApprovalEnabled(enabled);
      return;
    }

    await this.setTimeApprovalDraftState(enabled);
    await this.expectTimeApprovalDraftState(enabled);
    await this.saveOrganizationSettings();
    await this.expectTimeApprovalEnabled(enabled);
  }

  async hasTimeApprovalState(enabled: boolean) {
    return (
      (await this.requiresTimeApprovalSwitch.getAttribute("aria-checked")) ===
      (enabled ? "true" : "false")
    );
  }

  async setTimeApprovalDraftState(enabled: boolean) {
    if (await this.hasTimeApprovalState(enabled)) {
      return;
    }

    await this.requiresTimeApprovalSwitch.scrollIntoViewIfNeeded();
    await this.requiresTimeApprovalSwitch.click();
    await this.expectTimeApprovalDraftState(enabled);
  }

  async waitForSettingsSaveReady(timeout = 2000) {
    try {
      await expect(this.saveSettingsButton).toBeEnabled({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async expectSettingsSaveReady(timeout = 5000) {
    await expect(this.saveSettingsButton).toBeEnabled({ timeout });
  }

  async expectTimeApprovalDraftState(enabled: boolean) {
    await expect(this.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      enabled ? "true" : "false",
    );
  }

  private async saveOrganizationSettingsAttempt() {
    await this.saveSettingsButton.waitFor({ state: "visible" });

    if (!(await this.waitForSettingsSaveReady())) {
      return false;
    }

    await this.waitForSettingsSuccessToastReset();
    if (!(await this.tryClickSaveSettingsButton())) {
      return false;
    }

    try {
      await this.waitForOrganizationSettingsSaved();
      return true;
    } catch {
      return false;
    }
  }

  async saveOrganizationSettings() {
    await this.expectSettingsSaveReady();
    await this.waitForSettingsSuccessToastReset();
    if (!(await this.tryClickSaveSettingsButton())) {
      throw new Error("Save Changes button became unavailable before organization settings submit");
    }
    await this.waitForOrganizationSettingsSaved();
  }

  async waitForOrganizationSettingsSaved() {
    await expect(this.page.getByText(/organization settings updated/i).first()).toBeVisible();
  }

  private async waitForSettingsSuccessToastReset() {
    const successToast = this.page.getByText(/organization settings updated/i).first();
    const toastVisible = await isLocatorVisible(successToast);
    if (!toastVisible) {
      return;
    }

    try {
      await successToast.waitFor({ state: "hidden", timeout: 1000 });
    } catch (error) {
      const stillVisible = await isLocatorVisible(successToast);
      if (!stillVisible) {
        return;
      }

      const saveReady = await this.waitForSettingsSaveReady(250);
      if (saveReady) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Organization settings success toast did not clear before retry: ${message}`);
    }
  }

  private async dismissInviteUserModalWithCancel(): Promise<void> {
    try {
      await this.cancelInviteButton.click();
    } catch (error) {
      if (!(await isLocatorVisible(this.inviteUserForm))) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invite user modal cancel button failed: ${message}`);
    }
  }

  private async tryClickSaveSettingsButton() {
    await this.saveSettingsButton.waitFor({ state: "visible" });

    try {
      await this.saveSettingsButton.click({ timeout: 2000 });
      return true;
    } catch {
      await this.saveSettingsButton.waitFor({ state: "visible" });
      if (await isLocatorDisabled(this.saveSettingsButton, true)) {
        return false;
      }
      try {
        await this.saveSettingsButton.click({ timeout: 2000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async expectOrganizationName(name: string) {
    await this.organizationNameInput.waitFor({ state: "visible" });
    await expect(this.organizationNameInput).toHaveValue(name);
  }

  async expectOrganizationNameVisible(name: string) {
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible();
  }

  async expectTimeApprovalEnabled(enabled: boolean) {
    await expect(this.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      enabled ? "true" : "false",
    );
  }

  private async getDebugValue(read: () => Promise<string>, fallback: string) {
    try {
      return await read();
    } catch {
      return fallback;
    }
  }
}
