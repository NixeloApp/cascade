import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Landing Page Object
 * Handles the NixeloLanding marketing page shown to unauthenticated users
 */
export class LandingPage extends BasePage {
  // ===================
  // Locators - Navigation
  // ===================
  readonly nav: Locator;
  readonly navLogo: Locator;
  readonly navFeaturesLink: Locator;
  readonly navPricingLink: Locator;
  readonly navResourcesLink: Locator;
  readonly navLoginButton: Locator;
  readonly navGetStartedButton: Locator;

  // ===================
  // Locators - Hero Section
  // ===================
  readonly heroHeadline: Locator;
  readonly heroSubtitle: Locator;
  readonly heroGetStartedButton: Locator;
  readonly watchDemoButton: Locator;

  // ===================
  // Locators - Features Section
  // ===================
  readonly featuresHeadingTools: Locator;
  readonly featuresHeadingDocs: Locator;
  readonly featuresHeadingRealtime: Locator;
  readonly featuresHeadingDashboard: Locator;
  readonly learnMoreLinks: Locator;

  // ===================
  // Locators - Stats Section
  // ===================
  readonly statsHeading: Locator;
  readonly statsMeetings: Locator;
  readonly statsTools: Locator;
  readonly statsDaily: Locator;
  readonly statsRecommend: Locator;

  // ===================
  // Locators - Footer
  // ===================
  readonly footer: Locator;
  readonly footerProductHeading: Locator;
  readonly footerOrganizationHeading: Locator;
  readonly footerResourcesHeading: Locator;
  readonly footerPrivacyLink: Locator;
  readonly footerTermsLink: Locator;
  readonly footerCopyright: Locator;

  // ===================
  // Locators - Auth Pages (after navigation)
  // ===================
  readonly signInHeading: Locator;
  readonly signUpHeading: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Navigation
    this.nav = page.locator("nav");
    this.navLogo = this.nav.getByText("nixelo");
    this.navFeaturesLink = this.nav.getByText("Features");
    this.navPricingLink = this.nav.getByText("Pricing");
    this.navResourcesLink = this.nav.getByText("Resources");
    this.navLoginButton = this.nav.getByText("Sign in");
    this.navGetStartedButton = this.nav.getByRole("link", { name: /get started/i });

    // Hero Section
    this.heroHeadline = page.getByRole("heading", { name: /revolutionize your workflow/i });
    this.heroSubtitle = page.getByText(/experience the future of project management/i);
    this.heroGetStartedButton = page.getByRole("link", { name: /get started free/i });
    this.watchDemoButton = page.getByRole("link", { name: /watch demo/i });

    // Features Section
    this.featuresHeadingTools = page.getByRole("heading", {
      name: /stop juggling tools.*start shipping/i,
    });
    this.featuresHeadingDocs = page.getByRole("heading", {
      name: /docs and issues.*finally together/i,
    });
    this.featuresHeadingRealtime = page.getByRole("heading", { name: /edit together.*real-time/i });
    this.featuresHeadingDashboard = page.getByRole("heading", {
      name: /see everything.*miss nothing/i,
    });
    this.learnMoreLinks = page.getByRole("link", { name: /learn more/i });

    // Stats Section
    this.statsHeading = page.getByRole("heading", { name: /teams actually like using it/i });
    this.statsMeetings = page.getByText(/less time in meetings/i);
    this.statsTools = page.getByText(/fewer tools to manage/i);
    this.statsDaily = page.getByText(/actually use it daily/i);
    this.statsRecommend = page.getByText(/would recommend/i);

    // Footer
    this.footer = page.locator("footer");
    this.footerProductHeading = this.footer.getByRole("heading", { name: /product/i });
    this.footerOrganizationHeading = this.footer.getByRole("heading", { name: /organization/i });
    this.footerResourcesHeading = this.footer.getByRole("heading", { name: /resources/i });
    this.footerPrivacyLink = this.footer.getByRole("link", { name: /privacy/i });
    this.footerTermsLink = this.footer.getByRole("link", { name: /terms/i });
    this.footerCopyright = page.getByText(/© 2026 nixelo/i);

    // Auth page headings (separate routes now)
    this.signInHeading = page.getByRole("heading", { name: /welcome back/i });
    this.signUpHeading = page.getByRole("heading", { name: /create an account/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async clickGetStarted() {
    // Wait for button to be ready and stable (handles React hydration)
    await this.heroGetStartedButton.waitFor({ state: "visible" });
    await expect(this.heroGetStartedButton).toBeEnabled();

    // Click the button to navigate to signup page
    await this.heroGetStartedButton.click();

    // Wait for signup page to load (URL changes to /signup)
    await this.page.waitForURL("**/signup");

    // Wait for signup heading to appear and be stable
    await this.signUpHeading.waitFor({ state: "visible" });
  }

  async clickNavLogin() {
    await this.navLoginButton.waitFor({ state: "visible" });
    await this.navLoginButton.click();
    // Wait for signin page to load
    await this.page.waitForURL("**/signin");
    // Wait for heading with increased timeout for CI
    await this.signInHeading.waitFor({ state: "visible", timeout: 30000 });
  }

  async clickNavGetStarted() {
    await this.navGetStartedButton.waitFor({ state: "visible" });
    await this.navGetStartedButton.click();
    // Wait for signup page to load
    await this.page.waitForURL("**/signup");
    // Wait for heading with increased timeout for CI
    await this.signUpHeading.waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Navigate back to landing page from auth pages using browser back or logo click
   */
  async goBackToHome() {
    // Use browser back navigation
    await this.page.goBack();
    // Wait for landing page to load
    await this.page.waitForURL("**/");
    await this.heroHeadline.waitFor({ state: "visible" });
  }

  // ===================
  // Assertions
  // ===================

  async expectLandingPage() {
    await expect(this.heroHeadline).toBeVisible();
    await expect(this.heroGetStartedButton).toBeVisible();
    await expect(this.navGetStartedButton).toBeVisible();
  }

  async expectSignInPage() {
    await expect(this.signInHeading).toBeVisible();
  }

  async expectSignUpPage() {
    await expect(this.signUpHeading).toBeVisible();
  }

  /**
   * Alias for expectSignInPage - tests may call it expectLoginSection
   */
  async expectLoginSection() {
    await this.expectSignInPage();
  }

  /**
   * Alias for expectSignUpPage - tests may call it expectSignUpSection
   */
  async expectSignUpSection() {
    await this.expectSignUpPage();
  }

  /**
   * Assert navigation elements are visible
   */
  async expectNavigation() {
    await expect(this.navFeaturesLink).toBeVisible();
    await expect(this.navPricingLink).toBeVisible();
    await expect(this.navResourcesLink).toBeVisible();
    await expect(this.navLoginButton).toBeVisible();
  }

  /**
   * Assert hero section is visible
   */
  async expectHeroSection() {
    await expect(this.heroHeadline).toBeVisible();
    await expect(this.heroSubtitle).toBeVisible();
    await expect(this.heroGetStartedButton).toBeVisible();
    await expect(this.watchDemoButton).toBeVisible();
  }

  /**
   * Assert features section is visible
   */
  async expectFeaturesSection() {
    await expect(this.featuresHeadingTools).toBeVisible();
    await expect(this.featuresHeadingDocs).toBeVisible();
    await expect(this.featuresHeadingRealtime).toBeVisible();
    await expect(this.featuresHeadingDashboard).toBeVisible();
    // Should have 3 learn more links (one per feature card)
    await expect(this.learnMoreLinks).toHaveCount(3);
  }

  /**
   * Assert stats section is visible
   */
  async expectStatsSection() {
    await expect(this.statsHeading).toBeVisible();
    await expect(this.statsMeetings).toBeVisible();
    await expect(this.statsTools).toBeVisible();
    await expect(this.statsDaily).toBeVisible();
    await expect(this.statsRecommend).toBeVisible();
  }

  /**
   * Assert footer is visible
   */
  async expectFooter() {
    await expect(this.footerProductHeading).toBeVisible();
    await expect(this.footerOrganizationHeading).toBeVisible();
    await expect(this.footerResourcesHeading).toBeVisible();
    await expect(this.footerPrivacyLink).toBeVisible();
    await expect(this.footerTermsLink).toBeVisible();
    await expect(this.footerCopyright).toBeVisible();
  }
}
