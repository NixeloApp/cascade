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
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);
    await expect(submitButton).toBeVisible();

    // Wait for hydration before interacting
    await authPage.waitForHydration();

    // Expand form and verify all elements in a single retry block
    // This ensures the form stays expanded during verification
    await expect(async () => {
      // Check if form needs expansion using data-expanded attribute
      const isExpanded = await authForm.getAttribute("data-expanded");

      if (isExpanded !== "true") {
        // Click to expand
        await submitButton.click();
        // Wait for form to expand
        await expect(authForm).toHaveAttribute("data-expanded", "true");
      }

      // Now verify all expanded elements
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
      await expect(authForm).toHaveAttribute("data-expanded", "true");
      await expect(authPage.forgotPasswordButton).toBeVisible();
    }).toPass();

    // Final assertions for input types (these don't depend on form state)
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("email input validates email format", async ({ authPage, page }) => {
    await authPage.waitForHydration();
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);

    // Expand form, fill with invalid email, and verify validation in retry block
    await expect(async () => {
      const isExpanded = await authForm.getAttribute("data-expanded");
      if (isExpanded !== "true") {
        await submitButton.click();
        await expect(authForm).toHaveAttribute("data-expanded", "true");
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
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);

    // Expand form and verify password is masked in retry block
    await expect(async () => {
      const isExpanded = await authForm.getAttribute("data-expanded");
      if (isExpanded !== "true") {
        await submitButton.click();
        await expect(authForm).toHaveAttribute("data-expanded", "true");
      }

      await authPage.passwordInput.fill("secretpassword");
      await expect(authPage.passwordInput).toHaveAttribute("type", "password");
    }).toPass();
  });
});

test.describe("Sign Up Form - Elements", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-up page directly without auto-expansion
    await page.goto("/signup", { waitUntil: "commit" });
  });

  test("displays all sign up form elements", async ({ authPage, page }) => {
    // Wait for page to be ready
    await expect(authPage.signUpHeading).toBeVisible();

    // Google sign up is always visible
    await expect(authPage.googleSignInButton).toBeVisible();

    // Toggle link is always visible
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign in/i);

    // Submit button is always visible (shows either "Continue with email" or "Create account")
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);
    await expect(submitButton).toBeVisible();

    // Wait for hydration before interacting
    await authPage.waitForHydration();

    // Expand form and verify all elements in a single retry block
    // This ensures the form stays expanded during verification
    await expect(async () => {
      // Check if form needs expansion using data-expanded attribute
      const isExpanded = await authForm.getAttribute("data-expanded");

      if (isExpanded !== "true") {
        // Click to expand
        await submitButton.click();
        // Wait for form to expand
        await expect(authForm).toHaveAttribute("data-expanded", "true");
      }

      // Now verify all expanded elements
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
      await expect(authForm).toHaveAttribute("data-expanded", "true");
    }).toPass();

    // Forgot password hidden in sign up mode (only shown in sign in)
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  // This test involves multiple navigation and form expansion operations which can be flaky
  // due to React state management timing. Allow retries to handle intermittent failures.
  test("can switch between sign in and sign up", async ({ authPage, page }) => {
    test.info().annotations.push({
      type: "flaky",
      description: "Form expansion timing can be inconsistent",
    });
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);
    const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);

    // Wait for hydration and expand form
    await authPage.waitForHydration();
    await expect(async () => {
      const isExpanded = await authForm.getAttribute("data-expanded");
      if (isExpanded !== "true") {
        await submitButton.click();
        await expect(authForm).toHaveAttribute("data-expanded", "true");
      }
    }).toPass();

    // Switch to sign in
    await authPage.switchToSignIn();
    await expect(authForm).toHaveAttribute("data-expanded", "true");

    // Switch back to sign up
    await authPage.switchToSignUp();
    await expect(authForm).toHaveAttribute("data-expanded", "true");
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

  test("can go back to sign in", async ({ authPage, page }) => {
    await authPage.goBackToSignIn();
    const authForm = page.getByTestId(TEST_IDS.AUTH.FORM);
    await expect(authForm).toHaveAttribute("data-expanded", "true");
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
