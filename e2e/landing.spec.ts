import { expect, test } from "./fixtures";

/**
 * Comprehensive Landing Page E2E Tests
 *
 * Tests all actionable elements on the landing page for unauthenticated users.
 * Uses LandingPage page object for consistent locators and actions.
 */

test.describe("Landing Page - Navigation", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays all navigation elements", async ({ landingPage }) => {
    // Logo
    await expect(landingPage.navLogo).toBeVisible();

    // Use page object assertion for all navigation elements
    await landingPage.expectNavigation();

    // Get Started button in nav
    await expect(landingPage.navGetStartedButton).toBeVisible();
  });

  test("nav login button opens auth form", async ({ landingPage }) => {
    await landingPage.clickNavLogin();
    await landingPage.expectLoginSection();
  });

  test("nav get started button opens auth form", async ({ landingPage }) => {
    await landingPage.clickNavGetStarted();
    await landingPage.expectSignUpSection();
  });
});

test.describe("Landing Page - Hero Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays hero content", async ({ landingPage }) => {
    // Use page object assertion for all hero elements
    await landingPage.expectHeroSection();

    // Also verify specific text content
    await expect(landingPage.heroHeadline).toContainText(/replace scattered project tools/i);
  });

  test("hero get started button opens auth form", async ({ landingPage }) => {
    await landingPage.clickGetStarted();
    await landingPage.expectSignUpSection();
  });

  test("can return to landing from signup section", async ({ landingPage }) => {
    await landingPage.clickGetStarted();
    await landingPage.expectSignUpSection();
    await landingPage.goBackToHome();
    await landingPage.expectLandingPage();
  });
});

test.describe("Landing Page - Features Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays features section", async ({ landingPage }) => {
    // Use page object assertion for all feature elements
    await landingPage.expectFeaturesSection();
  });
});

test.describe("Landing Page - Stats Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays stats section", async ({ landingPage }) => {
    // Use page object assertion for all stats elements
    await landingPage.expectStatsSection();
  });
});

test.describe("Landing Page - Footer", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays footer sections", async ({ landingPage }) => {
    // Use page object assertion for all footer elements
    await landingPage.expectFooter();
  });
});
