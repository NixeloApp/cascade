import { expect, test } from "./fixtures";

/**
 * Comprehensive Authentication E2E Tests
 *
 * Tests all actionable elements in the auth forms.
 * Uses AuthPage page object for consistent locators and actions.
 */

test.describe("Sign In Form - Elements", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page directly without auto-expansion
    await page.goto("/signin", { waitUntil: "commit" });
  });

  test("displays all sign in form elements", async ({ authPage }) => {
    // Wait for page to be ready
    await expect(authPage.signInHeading).toBeVisible();

    // Google sign in is always visible
    await expect(authPage.googleSignInButton).toBeVisible();

    // Toggle link is always visible
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign up/i);

    await expect(authPage.submitButton).toBeVisible();

    await authPage.expandEmailForm();
    await authPage.waitForFormExpanded();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.forgotPasswordButton).toBeVisible();

    // Final assertions for input types (these don't depend on form state)
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("email input validates email format", async ({ authPage }) => {
    await authPage.expandEmailForm();

    await authPage.emailInput.fill("invalid-email");
    await authPage.passwordInput.fill("password123");
    await authPage.submitButton.click();

    const isInvalid = await authPage.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test("password input is masked", async ({ authPage }) => {
    await authPage.expandEmailForm();

    await authPage.passwordInput.fill("secretpassword");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });
});

test.describe("Sign Up Form - Elements", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-up page directly without auto-expansion
    await page.goto("/signup", { waitUntil: "commit" });
  });

  test("displays all sign up form elements", async ({ authPage }) => {
    // Wait for page to be ready
    await expect(authPage.signUpHeading).toBeVisible();

    // Google sign up is always visible
    await expect(authPage.googleSignInButton).toBeVisible();

    // Toggle link is always visible
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign in/i);

    await expect(authPage.submitButton).toBeVisible();

    await authPage.expandEmailForm();
    await authPage.waitForFormExpanded();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();

    // Forgot password hidden in sign up mode (only shown in sign in)
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  test("can switch between sign in and sign up", async ({ authPage }) => {
    await authPage.expandEmailForm();
    await authPage.waitForFormExpanded();

    // Switch to sign in
    await authPage.switchToSignIn();
    await expect(authPage.signInHeading).toBeVisible();
    await authPage.waitForFormExpanded();

    // Switch back to sign up
    await authPage.switchToSignUp();
    await expect(authPage.signUpHeading).toBeVisible();
    await authPage.waitForFormExpanded();
  });
});

test.describe("Forgot Password Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    // Navigate directly to forgot password page to avoid form expansion issues
    await authPage.gotoForgotPassword();
  });

  test("displays forgot password form elements", async ({ authPage }) => {
    // Heading - use page object locator
    await expect(authPage.forgotPasswordHeading).toBeVisible();

    // Email input
    await expect(authPage.emailInput).toBeVisible();

    // Submit button
    await expect(authPage.sendResetCodeButton).toBeVisible();

    // Back to sign in
    await expect(authPage.backToSignInButton).toBeVisible();
  });

  test("can go back to sign in", async ({ authPage }) => {
    await authPage.goBackToSignIn();
    await expect(authPage.authForm).toHaveAttribute("data-expanded", "true");
  });
});

test.describe("Google OAuth - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("google sign in button has correct styling", async ({ authPage }) => {
    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });
});

test.describe("Login Section - Back Navigation", () => {
  test("back button returns to landing page", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();

    // Verify we're on sign up page (Get Started navigates to signup)
    await expect(landingPage.signUpHeading).toBeVisible();

    // Click back
    await landingPage.goBackToHome();

    // Verify we're back on landing
    await landingPage.expectLandingPage();
  });
});
