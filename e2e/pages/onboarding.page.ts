import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { waitForConvexConnectionReady } from "../utils/wait-helpers";

const TRANSITION_TIMEOUT = 15000;
const CLICK_RETRY_TIMEOUT = 3000;
const CARD_SELECTION_TIMEOUT = 5000;
const CONVEX_CONNECTION_TIMEOUT = 15000;

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
  readonly nameProjectHeading: Locator;
  readonly projectNameInput: Locator;
  readonly allSetHeading: Locator;
  readonly goToDashboardButton: Locator;
  readonly createProjectButton: Locator;

  // Feature highlights
  readonly kanbanBoardsText: Locator;
  readonly documentsText: Locator;
  readonly sprintPlanningText: Locator;

  // Dashboard (after onboarding)
  readonly myWorkHeading: Locator;
  readonly error500Heading: Locator;
  readonly errorHeading: Locator;
  readonly errorMessage: Locator;

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
    this.nameProjectHeading = page.getByTestId(TEST_IDS.ONBOARDING.NAME_PROJECT_HEADING);
    this.projectNameInput = page.getByPlaceholder(/e\.g\., acme corp/i);
    this.allSetHeading = page.getByRole("heading", { name: /you're ready/i });
    this.goToDashboardButton = page.getByTestId(TEST_IDS.ONBOARDING.GO_TO_DASHBOARD_BUTTON);
    this.createProjectButton = page.getByRole("button", { name: /create project/i });

    // Feature highlights
    this.kanbanBoardsText = page.getByText(/kanban boards/i);
    this.documentsText = page.getByText(/documents/i);
    this.sprintPlanningText = page.getByText(/sprint planning/i);

    // Dashboard - use test ID to avoid matching multiple headings
    this.myWorkHeading = page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING);
    this.error500Heading = page.getByRole("heading", { name: "500" });
    this.errorHeading = page.getByRole("heading", { name: /^error$/i });
    this.errorMessage = page.getByText(/something went wrong|setting up your project/i).first();

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
    await this.page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await this.expectOnboardingRoute();
  }

  async recoverOnboardingRouteIfNeeded() {
    const hasAppError =
      (await this.error500Heading.isVisible().catch(() => false)) ||
      ((await this.errorHeading.isVisible().catch(() => false)) &&
        (await this.errorMessage.isVisible().catch(() => false)));

    if (!hasAppError) {
      return;
    }

    await this.page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await this.expectOnboardingRoute();
  }

  async waitForConvexConnection() {
    const connected = await waitForConvexConnectionReady(this.page, {
      timeout: CONVEX_CONNECTION_TIMEOUT,
      requireHydration: true,
    });
    expect(connected).toBe(true);
  }

  async hasRoleSelectionStarted(card: Locator) {
    const pressed = await card.getAttribute("aria-pressed").catch(() => null);
    if (pressed === "true") {
      return true;
    }

    const isEnabled = await card.isEnabled().catch(() => false);
    return !isEnabled;
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
    await this.prepareOnboardingWizard();
    try {
      await this.expectWizardVisible(timeout);
    } catch {
      await this.recoverOnboardingRouteIfNeeded();
      await this.prepareOnboardingWizard();
      await this.expectWizardVisible(timeout);
    }
  }

  /** Wait for role selection cards to be interactive */
  async waitForRoleCardsReady() {
    await this.waitForWizard();
    try {
      await this.expectRoleCardsInteractive();
    } catch {
      await this.recoverOnboardingRouteIfNeeded();
      await this.waitForWizard();
      await this.expectRoleCardsInteractive();
    }
  }

  /**
   * Select team lead role and verify transition
   */
  async selectTeamLead() {
    console.log("Selecting Team Lead role...");
    await this.selectRoleAndWaitForStep(this.teamLeadCard, this.teamLeadHeading);
    console.log("Successfully transitioned to Team Lead setup.");
  }

  /**
   * Select team member role and verify transition
   */
  async selectTeamMember() {
    console.log("Selecting Team Member role...");
    await this.selectRoleAndWaitForStep(this.teamMemberCard, this.nameProjectHeading);
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
    await expect(this.backButton).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.backButton).toBeEnabled();
    await this.backButton.click();

    if (await this.waitForRoleSelectionReady(5000)) {
      return;
    }

    // Only retry if back button is visible AND enabled AND role selection is still not ready
    const backVisible = await this.backButton.isVisible().catch(() => false);
    const backEnabled = backVisible && !(await this.backButton.isDisabled().catch(() => true));
    const roleReady = await this.waitForRoleSelectionReady(0);

    if (backVisible && backEnabled && !roleReady) {
      await this.backButton.click();
    }

    await this.waitForWizard();
  }

  /**
   * Skip onboarding and go to dashboard
   */
  async skipOnboarding() {
    const skipAction = await this.getVisibleSkipAction();
    await this.clickToDashboard(skipAction);
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
    await expect(this.createProjectButton).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.createProjectButton).toBeEnabled();
    await this.createProjectButton.click();

    // Don't retry non-idempotent create - just wait longer for submit state
    const submitStarted = await this.waitForProjectCreateSubmitStart(8000);
    if (!submitStarted) {
      throw new Error(
        "Project creation did not start within timeout - refusing to retry non-idempotent action",
      );
    }

    await this.expectTeamMemberComplete();
  }

  async fillProjectName(name: string) {
    await expect(this.projectNameInput).toBeVisible();
    await this.projectNameInput.fill(name);
  }

  /**
   * Complete team member flow to dashboard
   */
  async goToDashboard() {
    await expect(this.goToDashboardButton).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    await expect(this.goToDashboardButton).toBeEnabled();
    await this.clickToDashboard(this.goToDashboardButton);
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

  async expectOnboardingRoute(timeout = TRANSITION_TIMEOUT) {
    await expect(this.page).toHaveURL(/\/onboarding$/, { timeout });
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
    await expect(this.page).toHaveURL(/\/[^/]+\/dashboard/, { timeout });
    await expect(this.myWorkHeading).toBeVisible({ timeout });
  }

  private async getVisibleSkipAction() {
    if (await this.skipButton.isVisible().catch(() => false)) {
      await expect(this.skipButton).toBeEnabled();
      return this.skipButton;
    }

    await expect(this.skipText).toBeVisible({ timeout: TRANSITION_TIMEOUT });
    return this.skipText;
  }

  private async clickToDashboard(trigger: Locator) {
    await trigger.click();
    if (await this.waitForDashboardReady(5000)) {
      return;
    }

    // Only retry if we're still on onboarding - the trigger may no longer exist if we navigated
    const stillOnOnboarding = await this.page
      .url()
      .then((url) => url.includes("/onboarding"))
      .catch(() => false);
    if (stillOnOnboarding && (await trigger.isVisible().catch(() => false))) {
      await trigger.click();
    }

    await this.expectDashboard();
  }

  private async prepareOnboardingWizard() {
    await this.recoverOnboardingRouteIfNeeded();
    await this.expectOnboardingRoute();
    await this.waitForConvexConnection();
    await this.waitForSplashScreen();
  }

  private async expectWizardVisible(timeout = TRANSITION_TIMEOUT) {
    await expect(this.welcomeHeading).toBeVisible({ timeout });
    await expect(this.teamLeadCard).toBeVisible({ timeout });
    await expect(this.teamMemberCard).toBeVisible({ timeout });
  }

  private async expectRoleCardsInteractive(timeout = TRANSITION_TIMEOUT) {
    await expect(this.teamLeadCard).toBeEnabled({ timeout });
    await expect(this.teamMemberCard).toBeEnabled({ timeout });
  }

  private async selectRoleAndWaitForStep(card: Locator, nextStepHeading: Locator) {
    await this.waitForRoleCardsReady();

    if (await nextStepHeading.isVisible().catch(() => false)) {
      return;
    }

    try {
      if (!(await this.hasRoleSelectionStarted(card))) {
        await card.click({ timeout: CLICK_RETRY_TIMEOUT });
      }
      await expect(nextStepHeading).toBeVisible({ timeout: CARD_SELECTION_TIMEOUT });
      return;
    } catch {
      await this.recoverOnboardingRouteIfNeeded();
      await this.waitForRoleCardsReady();
    }

    if (!(await this.hasRoleSelectionStarted(card))) {
      await card.click({ timeout: CLICK_RETRY_TIMEOUT });
    }

    await expect(nextStepHeading).toBeVisible({ timeout: TRANSITION_TIMEOUT });
  }

  private async waitForDashboardReady(timeout = 3000) {
    try {
      await this.expectDashboard(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForRoleSelectionReady(timeout = 3000) {
    try {
      await this.expectWizardVisible(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForProjectCreateSubmitStart(timeout = 3000) {
    try {
      await expect
        .poll(async () => this.getProjectCreateSubmitState(), {
          timeout,
          intervals: [200, 500, 1000],
        })
        .not.toBe("pending");
      return true;
    } catch {
      return false;
    }
  }

  private async getProjectCreateSubmitState(): Promise<"submitting" | "complete" | "pending"> {
    if (await this.allSetHeading.isVisible().catch(() => false)) {
      return "complete";
    }

    const creatingButton = this.page.getByRole("button", { name: /creating/i });
    if (await creatingButton.isVisible().catch(() => false)) {
      return "submitting";
    }

    return "pending";
  }
}
