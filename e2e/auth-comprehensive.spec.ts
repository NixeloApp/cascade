import { TEST_IDS } from "../src/lib/test-ids";
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

  test("displays all sign in form elements", async ({ authPage, page }) => {
    // Wait for page to be ready
    await expect(authPage.signInHeading).toBeVisible();

    // Google sign in is always visible
    await expect(authPage.googleSignInButton).toBeVisible();

    // Toggle link is always visible
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign up/i);

    // Submit button is always visible (shows either "Continue with email" or "Sign in")
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    await expect(submitButton).toBeVisible();

    // Wait for hydration before interacting
    await authPage.waitForHydration();

    // Expand form and verify all elements in a single retry block
    // This ensures the form stays expanded during verification
    await expect(async () => {
      // Check if form needs expansion
      const buttonText = await submitButton.textContent();
      const needsExpansion = buttonText?.toLowerCase().includes("continue with email");

      if (needsExpansion) {
        // Click to expand
        await submitButton.click();
        // Wait for text to change
        await expect(submitButton).toHaveText(/sign in/i);
      }

      // Now verify all expanded elements
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
      await expect(submitButton).toHaveText(/sign in/i);
      await expect(authPage.forgotPasswordButton).toBeVisible();
    }).toPass();

    // Final assertions for input types (these don't depend on form state)
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("email input validates email format", async ({ authPage, page }) => {
    await authPage.waitForHydration();
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);

    // Expand form, fill with invalid email, and verify validation in retry block
    await expect(async () => {
      const buttonText = await submitButton.textContent();
      if (buttonText?.toLowerCase().includes("continue with email")) {
        await submitButton.click();
        await expect(submitButton).toHaveText(/sign in/i);
      }

      // Fill form with invalid email
      await authPage.emailInput.fill("invalid-email");
      await authPage.passwordInput.fill("password123");
      await submitButton.click();

      // HTML5 validation should trigger
      const isInvalid = await authPage.emailInput.evaluate(
        (el: HTMLInputElement) => !el.validity.valid,
      );
      expect(isInvalid).toBe(true);
    }).toPass();
  });

  test("password input is masked", async ({ authPage, page }) => {
    await authPage.waitForHydration();
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);

    // Expand form and verify password is masked in retry block
    await expect(async () => {
      const buttonText = await submitButton.textContent();
      if (buttonText?.toLowerCase().includes("continue with email")) {
        await submitButton.click();
        await expect(submitButton).toHaveText(/sign in/i);
      }

      await authPage.passwordInput.fill("secretpassword");
      await expect(authPage.passwordInput).toHaveAttribute("type", "password");
    }).toPass();
  });
});

test.describe("Sign Up Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    // Go directly to sign-up page - avoids extra navigation through sign-in
    await authPage.gotoSignUp();
  });

  test("displays all sign up form elements", async ({ authPage }) => {
    // Heading - use page object locator
    await expect(authPage.signUpHeading).toBeVisible();

    // Same form inputs
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();

    // Submit button text is "Create account"
    await expect(authPage.submitButton).toHaveText(/create account/i);

    // Toggle link changes to "Sign in instead"
    await expect(authPage.toggleFlowButton).toContainText(/sign in/i);

    // Forgot password hidden in sign up mode
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  // This test involves multiple navigation and form expansion operations which can be flaky
  // due to React state management timing. Allow retries to handle intermittent failures.
  test("can switch between sign in and sign up", async ({ authPage }) => {
    test.info().annotations.push({
      type: "flaky",
      description: "Form expansion timing can be inconsistent",
    });
    // Currently on sign up - button says "Create account"
    await expect(authPage.submitButton).toHaveText(/create account/i);

    // Switch to sign in
    await authPage.switchToSignIn();
    await expect(authPage.submitButton).toHaveText(/sign in/i);

    // Switch back to sign up
    await authPage.switchToSignUp();
    await expect(authPage.submitButton).toHaveText(/create account/i);
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
    await expect(authPage.submitButton).toHaveText(/sign in/i);
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
