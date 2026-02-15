import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";

const TRANSITION_TIMEOUT = 15000;

/**
 * Onboarding Page Object
 * Handles both:
 * - The new onboarding wizard (role selection, features)
 * - The legacy Driver.js welcome tour
 *
 * NOTE: Does NOT extend BasePage because onboarding happens BEFORE
 * the user has an organization. The orgSlug is not available yet.
 */
export class OnboardingPage {
  readonly page: Page;
  // ===================
  // Onboarding Wizard Locators
  // ===================
  readonly welcomeHeading: Locator;
  readonly teamLeadCard: Locator;
  readonly teamMemberCard: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly skipButton: Locator;
  readonly skipText: Locator;

  // Team Lead flow
  readonly teamLeadHeading: Locator;
  readonly setupWorkspaceButton: Locator;

  // Team Member flow
  readonly allSetHeading: Locator;
  readonly goToDashboardButton: Locator;
  readonly createProjectButton: Locator;

  // Feature highlights
  readonly kanbanBoardsText: Locator;
  readonly documentsText: Locator;
  readonly sprintPlanningText: Locator;

  // Dashboard (after onboarding)
  readonly myWorkHeading: Locator;

  // ===================
  // Driver.js Tour Locators (legacy)
  // ===================
  readonly tourOverlay: Locator;
  readonly tourPopover: Locator;
  readonly tourTitle: Locator;
  readonly tourDescription: Locator;
  readonly tourNextButton: Locator;
  readonly tourPrevButton: Locator;
  readonly tourCloseButton: Locator;
  readonly tourProgress: Locator;

  constructor(page: Page) {
    this.page = page;

    // Onboarding wizard - using TEST_IDS for reliable selectors
    this.welcomeHeading = page.getByTestId(TEST_IDS.ONBOARDING.WELCOME_HEADING);
    this.teamLeadCard = page.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_CARD);
    this.teamMemberCard = page.getByTestId(TEST_IDS.ONBOARDING.TEAM_MEMBER_CARD);
    this.continueButton = page.getByRole("button", { name: /continue/i });
    this.backButton = page.getByRole("button", { name: /back/i });
    this.skipButton = page.getByTestId(TEST_IDS.ONBOARDING.SKIP_BUTTON);
    this.skipText = page.getByText(/skip for now/i);

    // Team Lead flow
    this.teamLeadHeading = page.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_HEADING);
    this.setupWorkspaceButton = page.getByTestId(TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON);

    // Team Member flow
    this.allSetHeading = page.getByRole("heading", { name: /you're ready/i });
    this.goToDashboardButton = page.getByTestId(TEST_IDS.ONBOARDING.GO_TO_DASHBOARD_BUTTON);
    this.createProjectButton = page.getByRole("button", { name: /create project/i });

    // Feature highlights
    this.kanbanBoardsText = page.getByText(/kanban boards/i);
    this.documentsText = page.getByText(/documents/i);
    this.sprintPlanningText = page.getByText(/sprint planning/i);

    // Dashboard - use test ID to avoid matching multiple headings
    this.myWorkHeading = page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING);

    // Driver.js uses these CSS classes
    this.tourOverlay = page.locator(".driver-overlay");
    this.tourPopover = page.locator(".driver-popover");
    this.tourTitle = page.locator(".driver-popover-title");
    this.tourDescription = page.locator(".driver-popover-description");
    this.tourNextButton = page.locator(".driver-popover-next-btn");
    this.tourPrevButton = page.locator(".driver-popover-prev-btn");
    this.tourCloseButton = page.locator(".driver-popover-close-btn");
    this.tourProgress = page.locator(".driver-popover-progress-text");
  }

  async goto(): Promise<void> {
    // Onboarding shows on /onboarding route for new users
    await this.page.goto("/onboarding");
  }

  /**
   * Helper to check if a locator is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await expect(locator).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the tour to appear (driver.js loads dynamically)
   */
  async waitForTourToAppear() {
    await expect(this.tourPopover).toBeVisible();
  }

  /**
   * Check if tour is currently visible
   */
  async isTourVisible(): Promise<boolean> {
    return this.isVisible(this.tourPopover);
  }

  /**
   * Get the current tour step title
   */
  async getTourTitle(): Promise<string> {
    return (await this.tourTitle.textContent()) ?? "";
  }

  /**
   * Get the current tour step description
   */
  async getTourDescription(): Promise<string> {
    return (await this.tourDescription.textContent()) ?? "";
  }

  /**
   * Click next to advance the tour
   */
  async clickNext() {
    await this.tourNextButton.click();
  }

  /**
   * Click previous to go back in the tour
   */
  async clickPrevious() {
    await this.tourPrevButton.click();
  }

  /**
   * Click close/skip to exit the tour early
   */
  async skipTour() {
    await this.tourCloseButton.click();
  }

  /**
   * Complete the entire tour by clicking through all steps
   */
  async completeTour() {
    await this.waitForTourToAppear();

    // Keep clicking next until we can't anymore
    let hasNext = true;
    while (hasNext) {
      try {
        await expect(this.tourNextButton).toBeVisible();
        await this.tourNextButton.click();
        // Wait for animation to complete using Web Animations API
        await this.tourPopover
          .evaluate((el) => {
            return new Promise<void>((resolve) => {
              const animations = el.getAnimations();
              if (!animations.length) {
                resolve();
                return;
              }
              Promise.all(animations.map((a) => a.finished)).then(() => resolve());
            });
          })
          .catch(() => {});
      } catch {
        hasNext = false;
      }
    }
  }

  /**
   * Assert tour is showing welcome message
   */
  async expectWelcomeStep() {
    await expect(this.tourTitle).toContainText("Welcome to Nixelo");
  }

  /**
   * Assert tour is on command palette step
   */
  async expectCommandPaletteStep() {
    await expect(this.tourTitle).toContainText("Command Palette");
  }

  /**
   * Assert tour is on create project step
   */
  async expectCreateProjectStep() {
    await expect(this.tourTitle).toContainText("Create Your First Project");
  }

  /**
   * Assert tour is on final step
   */
  async expectFinalStep() {
    await expect(this.tourTitle).toContainText("Ready to Get Started");
  }

  /**
   * Assert tour is no longer visible
   */
  async expectTourClosed() {
    await expect(this.tourPopover).not.toBeVisible();
    await expect(this.tourOverlay).not.toBeVisible();
  }
  // ===================

  /**
   * Wait for the app splash screen to disappear
   */
  async waitForSplashScreen() {
    // The splash screen has a high z-index and is fixed inset-0
    // We use .first() to avoid strict mode violations if multiple exist during transitions
    const splash = this.page.locator(".bg-ui-bg-hero.z-\\[9999\\]").first();
    await expect(splash).not.toBeVisible();
  }

  /**
   * Onboarding Wizard Actions
   */

  /**
   * Wait for onboarding wizard to load
   */
  async waitForWizard(timeout = TRANSITION_TIMEOUT) {
    await this.waitForSplashScreen();
    await expect(this.welcomeHeading).toBeVisible({ timeout });
  }

  /** Wait for role selection cards to be interactive */
  async waitForRoleCardsReady() {
    await expect(this.teamLeadCard).toBeEnabled();
    await expect(this.teamMemberCard).toBeEnabled();
  }

  /**
   * Select team lead role and verify transition
   */
  async selectTeamLead() {
    console.log("Selecting Team Lead role...");
    await expect(async () => {
      // If we are already on the next screen, we are good
      if (await this.teamLeadHeading.isVisible()) {
        return;
      }

      // Ensure splash screen is gone before clicking
      await this.waitForSplashScreen();

      // The role cards have a small pending state/delay, so we might need to retry click
      await this.teamLeadCard.click();

      // Check for the outcome (first screen of lead flow)
      await expect(this.teamLeadHeading).toBeVisible();
    }).toPass();
    console.log("Successfully transitioned to Team Lead setup.");
  }

  /**
   * Select team member role and verify transition
   */
  async selectTeamMember() {
    console.log("Selecting Team Member role...");
    await expect(async () => {
      // For team members, the immediate next step is "Name Your Project"
      if (await this.page.getByRole("heading", { name: /name your project/i }).isVisible()) {
        return;
      }

      await this.waitForSplashScreen();

      await this.teamMemberCard.click();

      // Check for the outcome (first screen of member flow)
      await expect(this.page.getByRole("heading", { name: /name your project/i })).toBeVisible();
    }).toPass();
    console.log("Successfully transitioned to Team Member project naming.");
  }

  /**
   * Click continue button
   */
  async clickContinue() {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.backButton.click();
  }

  /**
   * Skip onboarding and go to dashboard
   */
  async skipOnboarding() {
    // Try button first, then text
    const skipVisible = await this.skipButton.isVisible().catch(() => false);
    if (skipVisible) {
      await this.skipButton.click();
    } else {
      await this.skipText.click();
    }
  }

  /**
   * Complete team lead flow to project setup
   */
  async goToWorkspaceSetup() {
    await this.setupWorkspaceButton.click();
  }

  /**
   * Click create project button
   */
  async createProject() {
    await this.createProjectButton.click();
  }

  /**
   * Complete team member flow to dashboard
   */
  async goToDashboard() {
    await this.goToDashboardButton.click();
  }

  // ===================
  // Onboarding Wizard Assertions
  // ===================

  /**
   * Assert wizard shows role selection
   */
  async expectRoleSelection() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.teamLeadCard).toBeVisible();
    await expect(this.teamMemberCard).toBeVisible();
  }

  /**
   * Assert wizard shows team lead features
   */
  async expectTeamLeadFeatures() {
    await expect(this.teamLeadHeading).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.setupWorkspaceButton).toBeVisible({ timeout: TRANSITION_TIMEOUT });
  }

  /**
   * Assert wizard shows team member completion
   */
  async expectTeamMemberComplete() {
    await expect(this.allSetHeading).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.goToDashboardButton).toBeVisible({ timeout: TRANSITION_TIMEOUT });
  }

  /**
   * Assert feature highlights are visible
   */
  async expectFeatureHighlights() {
    await expect(this.kanbanBoardsText).toBeVisible();
    await expect(this.documentsText).toBeVisible();
    await expect(this.sprintPlanningText).toBeVisible();
  }

  /**
   * Assert we're on the dashboard
   */
  async expectDashboard(timeout = TRANSITION_TIMEOUT) {
    await expect(this.myWorkHeading).toBeVisible({ timeout });
  }
}
