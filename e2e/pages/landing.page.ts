import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
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
  readonly workflowTourButton: Locator;
  readonly productShowcase: Locator;

  // ===================
  // Locators - Features Section
  // ===================
  readonly featuresHeading: Locator;
  readonly featuresHeadingDocs: Locator;
  readonly featuresHeadingCollaboration: Locator;
  readonly featuresHeadingAI: Locator;
  readonly learnMoreLinks: Locator;

  // ===================
  // Locators - Proof / Pricing Section
  // ===================
  readonly proofHeading: Locator;
  readonly pricingHeading: Locator;
  readonly pricingStarterPlan: Locator;
  readonly pricingTeamPlan: Locator;
  readonly pricingEnterprisePlan: Locator;

  // ===================
  // Locators - Footer
  // ===================
  readonly footer: Locator;
  readonly footerProductHeading: Locator;
  readonly footerLegalHeading: Locator;
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
    this.navLogo = this.nav.getByText("Nixelo");
    this.navFeaturesLink = this.nav.getByText("Features");
    this.navPricingLink = this.nav.getByText("Pricing");
    this.navResourcesLink = this.nav.getByText("Resources");
    this.navLoginButton = this.nav.getByText("Sign in");
    this.navGetStartedButton = this.nav.getByRole("link", { name: /get started/i });

    // Hero Section
    this.heroHeadline = page.getByRole("heading", {
      name: /replace scattered project tools.*with one sharper workspace/i,
    });
    this.heroSubtitle = page.getByText(
      /Nixelo keeps specs, tasks, client updates, and AI assistance in the same flow/i,
    );
    this.heroGetStartedButton = page.getByRole("link", { name: /get started free/i });
    this.workflowTourButton = page.getByRole("link", { name: /see workflow tour/i });
    this.productShowcase = page.getByText(/product control tower/i);

    // Features Section
    this.featuresHeading = page.getByRole("heading", { name: /built for the intelligence age/i });
    this.featuresHeadingDocs = page.getByRole("heading", {
      name: /docs and execution stay linked/i,
    });
    this.featuresHeadingCollaboration = page.getByRole("heading", {
      name: /collaboration with less context loss/i,
    });
    this.featuresHeadingAI = page.getByRole("heading", {
      name: /ai can act on real workspace context/i,
    });
    this.learnMoreLinks = page.getByRole("link", { name: /learn more/i });

    // Proof / Pricing Section
    this.proofHeading = page.getByTestId(TEST_IDS.LANDING.PROOF_SECTION);
    this.pricingHeading = page.getByTestId(TEST_IDS.LANDING.PRICING_SECTION);
    this.pricingStarterPlan = page.getByRole("heading", { name: /^starter$/i });
    this.pricingTeamPlan = page.getByRole("heading", { name: /^team$/i });
    this.pricingEnterprisePlan = page.getByRole("heading", { name: /^enterprise$/i });

    // Footer
    this.footer = page.locator("footer");
    this.footerProductHeading = this.footer.getByRole("heading", { name: /product/i });
    this.footerLegalHeading = this.footer.getByRole("heading", { name: /legal/i });
    this.footerPrivacyLink = this.footer.getByRole("link", { name: /privacy/i });
    this.footerTermsLink = this.footer.getByRole("link", { name: /terms/i });
    this.footerCopyright = this.footer.getByText(/©\s+\d{4}\s+Nixelo/i);

    // Auth page headings (separate routes now)
    // Updated to match the actual text in src/routes/signin.tsx and src/routes/signup.tsx
    this.signInHeading = page.getByRole("heading", { name: /sign in to nixelo/i });
    this.signUpHeading = page.getByRole("heading", { name: /create your account/i });
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

  async expectLandingOrSignInPage() {
    await expect
      .poll(
        async () => {
          const isOnSignIn = await isLocatorVisible(this.signInHeading);
          const isOnLanding = await isLocatorVisible(this.heroHeadline);
          return isOnSignIn || isOnLanding;
        },
        { timeout: 30000, intervals: [250, 500, 1000] },
      )
      .toBe(true);
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
    await expect(this.workflowTourButton).toBeVisible();
    await expect(this.productShowcase).toBeVisible();
  }

  /**
   * Assert features section is visible
   */
  async expectFeaturesSection() {
    await expect(this.featuresHeading).toBeVisible();
    await expect(this.featuresHeadingDocs).toBeVisible();
    await expect(this.featuresHeadingCollaboration).toBeVisible();
    await expect(this.featuresHeadingAI).toBeVisible();
    // Should have 3 learn more links (one per feature card)
    await expect(this.learnMoreLinks).toHaveCount(3);
  }

  /**
   * Assert proof and pricing sections are visible
   */
  async expectStatsSection() {
    await expect(this.proofHeading).toBeVisible();
    await expect(this.pricingHeading).toBeVisible();
    await expect(this.pricingStarterPlan).toBeVisible();
    await expect(this.pricingTeamPlan).toBeVisible();
    await expect(this.pricingEnterprisePlan).toBeVisible();
  }

  /**
   * Assert footer is visible
   */
  async expectFooter() {
    await expect(this.footerProductHeading).toBeVisible();
    await expect(this.footerLegalHeading).toBeVisible();
    await expect(this.footerPrivacyLink).toBeVisible();
    await expect(this.footerTermsLink).toBeVisible();
    await expect(this.footerCopyright).toBeVisible();
  }
}
