import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

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

  // ===================
  // Locators - Preferences
  // ===================
  readonly notificationPreferences: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly pushNotificationsToggle: Locator;
  readonly languageSelect: Locator;
  readonly timezoneSelect: Locator;

  // ===================
  // Locators - Admin
  // ===================
  readonly userManagementSection: Locator;
  readonly inviteUserButton: Locator;
  readonly userTypeManager: Locator;
  readonly hourComplianceDashboard: Locator;

  // ===================
  // Locators - Invite User Modal
  // ===================
  readonly inviteUserModal: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly sendInviteButton: Locator;

  // ===================
  // Locators - Organization Settings
  // ===================
  readonly organizationNameInput: Locator;
  readonly requiresTimeApprovalSwitch: Locator;
  readonly saveSettingsButton: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Settings tabs
    this.integrationsTab = page
      .getByRole("tab", { name: /integration/i })
      .or(page.getByRole("button", { name: /integration/i }));
    this.apiKeysTab = page
      .getByRole("tab", { name: /api.*key/i })
      .or(page.getByRole("button", { name: /api.*key/i }));
    this.offlineTab = page
      .getByRole("tab", { name: /offline/i })
      .or(page.getByRole("button", { name: /offline/i }));
    this.preferencesTab = page
      .getByRole("tab", { name: /preference/i })
      .or(page.getByRole("button", { name: /preference/i }));
    this.adminTab = page
      .getByRole("tab", { name: /admin/i })
      .or(page.getByRole("button", { name: /admin/i }));
    this.devToolsTab = page.getByRole("tab", { name: /dev tools/i });

    // Theme options (in Preferences tab) - ToggleGroupItems with aria-labels
    this.themeLightOption = page.getByRole("radio", { name: /light theme/i });
    this.themeDarkOption = page.getByRole("radio", { name: /dark theme/i });
    this.themeSystemOption = page.getByRole("radio", { name: /system theme/i });

    // Integrations
    this.githubIntegration = page
      .locator("[data-integration='github']")
      .or(page.getByText(/github/i).first());
    this.googleCalendarIntegration = page
      .locator("[data-integration='google-calendar']")
      .or(page.getByText(/google.*calendar/i).first());
    this.pumbleIntegration = page
      .locator("[data-integration='pumble']")
      .or(page.getByText(/pumble/i).first());
    this.connectGithubButton = page.getByRole("button", { name: /connect.*github/i });
    this.connectGoogleButton = page.getByRole("button", { name: /connect.*google/i });
    this.connectPumbleButton = page.getByRole("button", { name: /connect.*pumble/i });

    // API Keys
    this.apiKeysList = page.locator("[data-api-keys-list]");
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
    this.syncStatusIndicator = page.locator("[data-sync-status]");
    this.forceSyncButton = page.getByRole("button", { name: /sync|force.*sync/i });

    // Preferences
    this.notificationPreferences = page.locator("[data-notification-preferences]");
    this.emailNotificationsToggle = page
      .getByRole("switch", { name: /email/i })
      .or(page.getByRole("checkbox", { name: /email.*notification/i }));
    this.pushNotificationsToggle = page
      .getByRole("switch", { name: /push/i })
      .or(page.getByRole("checkbox", { name: /push.*notification/i }));
    this.languageSelect = page.getByRole("combobox", { name: /language/i });
    this.timezoneSelect = page.getByRole("combobox", { name: /timezone/i });

    // Admin
    this.userManagementSection = page
      .locator("[data-user-management]")
      .or(page.getByText(/user.*management/i));
    this.inviteUserButton = page.getByRole("button", { name: /invite.*user/i });
    this.userTypeManager = page.locator("[data-user-type-manager]");
    this.hourComplianceDashboard = page.locator("[data-hour-compliance]");

    // Invite user form (it's an inline Card, not a dialog)
    this.inviteUserModal = page.getByRole("heading", { name: /send invitation/i });
    this.inviteEmailInput = page.getByPlaceholder("user@example.com");
    this.inviteRoleSelect = page.getByLabel(/role/i);
    this.sendInviteButton = page.getByRole("button", { name: "Send Invitation", exact: true });

    // Admin - Organization Settings
    this.organizationNameInput = page.locator("#orgName");
    this.requiresTimeApprovalSwitch = page.getByRole("switch", { name: /require time approval/i });
    this.saveSettingsButton = page.getByRole("button", { name: /save changes/i });
  }

  // ===================
  // Actions - Navigation
  // ===================

  async goto() {
    // Navigate directly to settings URL
    const url = `/${this.orgSlug}/settings/profile`;
    await this.page.goto(url);

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
      const bodyText = await this.page
        .evaluate(() => document.body.innerText)
        .catch(() => "Could not get body text");
      console.log(`[DEBUG] SettingsPage.goto failed`);
      console.log(`[DEBUG] Target URL: ${url}`);
      console.log(`[DEBUG] Current URL: ${currentUrl}`);
      const localStorage = await this.page
        .evaluate(() => JSON.stringify(localStorage))
        .catch(() => "Could not get localStorage");
      const convexClientState = await this.page
        .evaluate(() => {
          // biome-ignore lint/suspicious/noExplicitAny: Accessing internal test client
          const client = (window as any).__convex_test_client;
          return client
            ? `Found client. Auth token set: ${!!client.authenticationToken}`
            : "Client not found on window";
        })
        .catch(() => "Error getting client state");
      console.log(`[DEBUG] LocalStorage: ${localStorage}`);
      console.log(`[DEBUG] ConvexClient: ${convexClientState}`);
      console.log(`[DEBUG] Body Text: ${bodyText.substring(0, 1000)}`);
      throw e;
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
    await this.page.waitForLoadState("domcontentloaded");

    // For admin tab, wait for the tab to appear (requires isOrganizationAdmin query)
    const waitTimeout = tab === "admin" ? 60000 : 30000;
    const tabName = tab === "admin" ? /^Admin$/i : new RegExp(tab, "i");
    const tabLocator = this.page.getByRole("tab", { name: tabName });
    await tabLocator.waitFor({ state: "visible", timeout: waitTimeout });

    // Verify tab is selected
    await expect(tabLocator).toHaveAttribute("aria-selected", "true");

    // For admin tab, also verify the admin content is actually visible
    if (tab === "admin") {
      await this.page
        .getByRole("heading", { name: /organization settings/i })
        .waitFor({ state: "visible" });
    }

    await this.waitForLoad();
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

  // ===================
  // Actions - Admin
  // ===================

  async openInviteUserModal() {
    // Wait for the Admin tab content to be fully loaded - wait for heading to be visible
    await this.page
      .getByRole("heading", { name: /organization settings/i })
      .waitFor({ state: "visible" });

    // Use the first "Invite User" button (header one, not empty state one)
    const inviteBtn = this.inviteUserButton.first();
    await inviteBtn.waitFor({ state: "visible" });

    // Scroll into view and wait for it to be stable
    await inviteBtn.scrollIntoViewIfNeeded();

    // Retry pattern handles potential element detachment during re-renders
    // Press Escape first to ensure any open modals are closed
    await expect(async () => {
      await this.page.keyboard.press("Escape");
      await expect(inviteBtn).toBeEnabled();
      await inviteBtn.click();
      await expect(this.inviteUserModal).toBeVisible();
    }).toPass();
  }

  async inviteUser(email: string, role?: string) {
    await this.openInviteUserModal();
    await this.inviteEmailInput.fill(email);
    // Only change role if it's not "user" (which is the default)
    if (role && role.toLowerCase() !== "user") {
      // Radix Select - click trigger with current value text, then select option
      // The select shows "User" or "Super Admin" (or placeholder "Select role")
      // Use retry pattern to handle element detachment during React updates
      const displayRole = "Super Admin";
      await expect(async () => {
        const selectTrigger = this.page
          .getByRole("combobox")
          .filter({ hasText: /^User$|^Super Admin$|Select role/i });
        await expect(selectTrigger).toBeVisible();
        await selectTrigger.click();
        await expect(this.page.getByRole("option", { name: displayRole })).toBeVisible();
      }).toPass();
      await this.page.getByRole("option", { name: displayRole }).click();
      // Wait for select dropdown to close (React re-render completes)
      await expect(this.page.getByRole("option", { name: displayRole })).not.toBeVisible();
    }
    // Wait for the submit button to be stable and click with retry pattern
    await expect(async () => {
      await expect(this.sendInviteButton).toBeVisible();
      await expect(this.sendInviteButton).toBeEnabled();
      await this.sendInviteButton.click();
    }).toPass();
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const options = {
      light: this.themeLightOption,
      dark: this.themeDarkOption,
      system: this.themeSystemOption,
    };
    await options[theme].click();
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

  async updateOrganizationName(name: string) {
    if (name) {
      await this.organizationNameInput.fill(name);
    }
    await this.saveSettingsButton.click();
    // Use .first() to handle multiple toast notifications
    await expect(this.page.getByText(/organization settings updated/i).first()).toBeVisible();
  }

  async toggleTimeApproval(enabled: boolean) {
    // Wait for the switch to appear - OrganizationSettings component makes its own query
    await this.requiresTimeApprovalSwitch.waitFor({ state: "visible" });

    // Wait for save button to appear (form is loaded)
    await this.saveSettingsButton.waitFor({ state: "visible" });

    // Scroll the switch into view
    await this.requiresTimeApprovalSwitch.scrollIntoViewIfNeeded();

    const isChecked = await this.requiresTimeApprovalSwitch.getAttribute("aria-checked");
    const needsChange = (isChecked === "true") !== enabled;

    if (!needsChange) {
      // Already in desired state, nothing to do
      return;
    }

    // Click the switch to toggle - verify the aria-checked changes
    await this.requiresTimeApprovalSwitch.click();
    const expectedChecked = enabled ? "true" : "false";
    await expect(this.requiresTimeApprovalSwitch).toHaveAttribute("aria-checked", expectedChecked);

    // Wait for save button to be enabled (form has changes)
    await expect(this.saveSettingsButton).toBeEnabled();

    // Click immediately after enabled check passes
    await this.saveSettingsButton.click({ force: true });

    // Wait for success toast - use data attribute to be more specific
    await expect(this.page.locator("[data-sonner-toast][data-type='success']").first()).toBeVisible(
      {},
    );
  }

  async expectOrganizationName(name: string) {
    await this.organizationNameInput.waitFor({ state: "visible" });
    await expect(this.organizationNameInput).toHaveValue(name);
  }
}
