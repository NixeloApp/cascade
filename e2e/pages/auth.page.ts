import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { BasePage } from "./base.page";

/**
 * Authentication Page Object
 * Handles sign in, sign up, password reset, and email verification flows
 *
 * Note: Sign In/Sign Up forms have a two-step flow:
 * 1. Click "Continue with email" to reveal form fields
 * 2. Fill email/password and submit
 *
 * Routes:
 * - /signin - Sign in form
 * - /signup - Sign up form
 * - /forgot-password - Password reset flow
 */
export class AuthPage extends BasePage {
  // ===================
  // Locators - Page Headings
  // ===================
  readonly signInHeading: Locator;
  readonly signUpHeading: Locator;
  readonly forgotPasswordHeading: Locator;
  readonly resetPasswordHeading: Locator;

  // ===================
  // Locators - Sign In/Up Forms
  // ===================
  readonly continueWithEmailButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleSignInButton: Locator;
  readonly signUpLink: Locator;
  readonly signInLink: Locator;

  /**
   * Dynamic submit button - returns the visible submit button (Sign in, Create account, or Continue with email)
   * Used by tests that need a generic submit button reference
   */
  get submitButton(): Locator {
    // Return a locator that matches the submit button in any form state
    return this.page.getByRole("button", {
      name: /^(sign in|create account|continue with email)$/i,
    });
  }

  /**
   * Dynamic toggle flow button - returns sign up or sign in link based on current page
   * On sign-in page: shows "Sign up" link
   * On sign-up page: shows "Sign in" link
   */
  get toggleFlowButton(): Locator {
    // Return a locator that matches the navigation link between sign-in and sign-up
    return this.page.getByRole("link", { name: /sign (in|up)/i });
  }

  /**
   * Alias for forgotPasswordLink - some tests reference it as forgotPasswordButton
   */
  get forgotPasswordButton(): Locator {
    return this.forgotPasswordLink;
  }

  /**
   * Alias for backToSignInLink - some tests reference it as backToSignInButton
   */
  get backToSignInButton(): Locator {
    return this.backToSignInLink;
  }

  // ===================
  // Locators - Password Reset
  // ===================
  readonly sendResetCodeButton: Locator;
  readonly backToSignInLink: Locator;
  readonly codeInput: Locator;
  readonly newPasswordInput: Locator;
  readonly resetPasswordButton: Locator;

  // ===================
  // Locators - Email Verification
  // ===================
  readonly verifyHeading: Locator;
  readonly verifyCodeInput: Locator;
  readonly verifyEmailButton: Locator;
  readonly resendCodeButton: Locator;
  readonly signOutLink: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Page headings
    this.signInHeading = page.getByRole("heading", { name: /welcome back/i });
    this.signUpHeading = page.getByRole("heading", { name: /create an account/i });
    this.forgotPasswordHeading = page.getByText("Forgot Password", { exact: false });
    this.resetPasswordHeading = page.getByRole("heading", { name: /reset password/i });

    // Sign In / Sign Up form - two-step flow
    this.continueWithEmailButton = page.getByRole("button", { name: /continue with email/i });
    this.emailInput = page.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    this.passwordInput = page.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    // These buttons appear after clicking "Continue with email" - text changes on the same button
    // Use getByRole with the specific text that appears after form expansion
    this.signInButton = page.getByRole("button", { name: "Sign in", exact: true });
    this.signUpButton = page.getByRole("button", { name: "Create account", exact: true });
    this.forgotPasswordLink = page.getByRole("button", { name: "Forgot password?" });
    this.googleSignInButton = page.getByRole("button", { name: /sign in with google/i });

    // Navigation links between auth pages
    this.signUpLink = page.getByRole("link", { name: /sign up/i });
    this.signInLink = page.getByRole("link", { name: /sign in/i });

    // Password Reset
    this.sendResetCodeButton = page.getByRole("button", { name: /send reset code/i });
    this.backToSignInLink = page.getByRole("link", { name: /back to sign in/i });
    this.codeInput = page.getByPlaceholder("8-digit code");
    this.newPasswordInput = page.getByPlaceholder("New password");
    this.resetPasswordButton = page.getByRole("button", { name: /^reset password$/i });

    // Email Verification
    // Email Verification - Use more robust locators that don't depend strictly on ARIA roles
    // as they might vary between h1/h2 during architecture transitions
    this.verifyHeading = page.getByText(/verify your email/i).first();
    this.verifyCodeInput = page.getByPlaceholder(/enter.*code|8-digit code/i);
    this.verifyEmailButton = page.getByRole("button", { name: /verify email/i });
    this.resendCodeButton = page.getByRole("button", { name: /didn't receive|resend/i });
    this.signOutLink = page.getByRole("button", { name: /sign out|different account/i });
  }

  // ===================
  // Navigation
  // ===================

  /**
   * Navigate to sign in page
   */
  async goto() {
    await this.gotoSignIn();
  }

  /**
   * Navigate to sign in page and expand email form
   */
  async gotoSignIn() {
    await this.page.goto("/signin", { waitUntil: "commit" });
    await this.signInHeading.waitFor({ state: "visible" });
    // Wait for hydration before expanding
    await this.waitForHydration();
    // Expand form using robust click logic
    await this.expandEmailForm();
    // Verify form is expanded by checking button text shows "Sign in"
    const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    await expect(submitButton).toHaveText(/Sign in/i);
  }

  /**
   * Navigate to sign up page and expand email form
   */
  async gotoSignUp() {
    await this.page.goto("/signup", { waitUntil: "commit" });
    await this.signUpHeading.waitFor({ state: "visible" });
    // Wait for hydration before expanding
    await this.waitForHydration();
    // Expand form using robust click logic
    await this.expandEmailForm();
    // Verify form is expanded by checking button text shows "Create account"
    const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    await expect(submitButton).toHaveText(/Create account/i);
  }

  /**
   * Navigate directly to forgot password page
   */
  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
    await this.forgotPasswordHeading.waitFor({ state: "visible" });
    await this.emailInput.waitFor({ state: "visible" });
  }

  /**
   * Navigate directly to landing page
   */
  async gotoLanding() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  // ===================
  // Actions - Form Expansion
  // ===================

  /**
   * Expand the email form by clicking "Continue with email"
   * Call this after navigating if form is collapsed
   * Uses retry logic to handle React hydration timing issues
   */
  async expandEmailForm() {
    // Wait for hydration first
    await this.waitForHydration();

    // The submit button with test ID - text changes from "Continue with email" to "Sign in"/"Create account"
    const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);

    // Wait for button to be visible and enabled
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Retry expansion to handle React timing issues
    // toPass() uses Playwright's default intervals and timeout (no hardcoded values)
    await expect(async () => {
      // Check if already expanded by looking at button text
      const currentText = await submitButton.textContent();
      if (currentText?.includes("Sign in") || currentText?.includes("Create account")) {
        return; // Expanded
      }

      // Click the button to expand the form
      await submitButton.click();

      // Verify button text changed (uses Playwright's default assertion timeout)
      await expect(submitButton).toHaveText(/Sign in|Create account/i);
    }).toPass();

    // Wait for form-ready state
    await this.waitForFormReady();

    // On sign-in page, also wait for "Forgot password?" to render (conditionally shown when expanded)
    const currentUrl = this.page.url();
    if (currentUrl.includes("/signin") || currentUrl.endsWith("/signin")) {
      await expect(this.forgotPasswordLink).toBeVisible();
    }
  }

  // ===================
  // Actions - Sign In/Up
  // ===================

  async signIn(email: string, password: string) {
    await this.expandEmailForm();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(email: string, password: string) {
    // Use retry pattern for the entire sign-up flow to handle form state issues
    await expect(async () => {
      // Ensure the email form is expanded
      await this.expandEmailForm();

      // Verify form is actually expanded by checking button text
      const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
      const buttonText = await submitButton.textContent();
      if (!buttonText?.includes("Create account")) {
        throw new Error(`Form not expanded - button shows: ${buttonText}`);
      }

      // Fill the form fields - wait for inputs to be ready
      await expect(this.emailInput).toBeVisible();
      await this.emailInput.fill(email);

      // Verify form still expanded after filling email
      const textAfterEmail = await submitButton.textContent();
      if (!textAfterEmail?.includes("Create account")) {
        throw new Error(`Form collapsed after email fill - button shows: ${textAfterEmail}`);
      }

      await expect(this.passwordInput).toBeVisible();
      await this.passwordInput.fill(password);

      // Verify form still expanded after filling password
      const textAfterPassword = await submitButton.textContent();
      if (!textAfterPassword?.includes("Create account")) {
        throw new Error(`Form collapsed after password fill - button shows: ${textAfterPassword}`);
      }

      // Ensure form is ready before clicking submit
      await this.waitForFormReady();

      // Submit the form
      await submitButton.click();

      // Wait for either verification form or toast to appear
      await expect(this.verifyHeading.or(this.page.locator(".sonner-toast"))).toBeVisible();
    }).toPass();
  }

  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.signUpHeading.waitFor({ state: "visible" });
    // Wait for the new page's form to hydrate - it's a different component instance
    await this.waitForHydration();
  }

  async navigateToSignIn() {
    await this.signInLink.click();
    await this.signInHeading.waitFor({ state: "visible" });
    // Wait for the new page's form to hydrate - it's a different component instance
    await this.waitForHydration();
  }

  async switchToSignUp() {
    await this.navigateToSignUp();
    await this.expandEmailForm();
    // Verify form is expanded by checking button text
    const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    await expect(submitButton).toHaveText(/Create account/i);
  }

  async switchToSignIn() {
    await this.navigateToSignIn();
    await this.expandEmailForm();
    // Verify form is expanded by checking button text
    const submitButton = this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    await expect(submitButton).toHaveText(/Sign in/i);
  }

  async signInWithGoogle() {
    await this.googleSignInButton.waitFor({ state: "visible" });
    await this.googleSignInButton.click();
    // Note: Will redirect to Google OAuth
  }

  // ===================
  // Actions - Password Reset
  // ===================

  async clickForgotPassword() {
    // Use retry pattern to handle form expansion and navigation
    await expect(async () => {
      // Forgot password link appears after form is expanded
      await this.expandEmailForm();
      // Wait for form to stabilize (formReady state) before clicking
      await this.waitForFormReady();

      // Verify forgot password link is visible and enabled before clicking
      await expect(this.forgotPasswordLink).toBeVisible();
      await expect(this.forgotPasswordLink).toBeEnabled();

      // Click the link
      await this.forgotPasswordLink.click();

      // Verify navigation completed
      await expect(this.page).toHaveURL(/forgot-password/);
      await expect(this.forgotPasswordHeading).toBeVisible();
    }).toPass();
  }

  /**
   * Alias for clickForgotPassword - navigates to forgot password from sign in
   */
  async goToForgotPassword() {
    await this.clickForgotPassword();
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.sendResetCodeButton.click();
  }

  async completePasswordReset(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }

  async goBackToSignIn() {
    await this.backToSignInLink.waitFor({ state: "visible" });
    await this.backToSignInLink.click();
    await this.signInHeading.waitFor({ state: "visible" });
    // Expand the form after navigation
    await this.expandEmailForm();
  }

  // ===================
  // Actions - Email Verification
  // ===================

  async verifyEmail(code: string) {
    await this.verifyCodeInput.fill(code);
    await this.verifyEmailButton.click({ force: true });
    // Wait for verification to process - wait for DOM update after API call
    await this.page.waitForLoadState("domcontentloaded");
  }

  async resendVerificationCode() {
    await this.resendCodeButton.click({ force: true });
  }

  async signOutFromVerification() {
    await this.signOutLink.click({ force: true });
  }

  // ===================
  // Assertions
  // ===================

  /**
   * Wait for component to be hydrated
   * Uses Playwright's default timeout (no hardcoded value)
   */
  async waitForHydration() {
    await this.page.locator('form[data-hydrated="true"]').waitFor({
      state: "attached",
    });
  }

  /**
   * Wait for form to be fully ready (formReady state)
   * The form sets formReady=true after expansion which enables required attributes
   * Uses data-form-ready attribute instead of arbitrary timeout
   * This is a best-effort wait - it won't throw if the form doesn't have this attribute
   */
  async waitForFormReady() {
    try {
      await this.page.locator('form[data-form-ready="true"]').waitFor({
        state: "attached",
      });
    } catch {
      // Form might not have data-form-ready attribute (e.g., forgot password page)
      // Wait for DOM to be ready as fallback
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  async expectSignInForm() {
    await expect(this.signInHeading).toBeVisible();
    // Expand form if collapsed (after navigation from forgot-password, form is collapsed)
    await this.expandEmailForm();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
    await expect(this.googleSignInButton).toBeVisible();
  }

  async expectSignUpForm() {
    await expect(this.signUpHeading).toBeVisible();
    // Expand form if collapsed
    await this.expandEmailForm();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectForgotPasswordForm() {
    await expect(this.forgotPasswordHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendResetCodeButton).toBeVisible();
  }

  async expectResetCodeForm() {
    await expect(this.resetPasswordHeading).toBeVisible();
    await expect(this.codeInput).toBeVisible();
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.resetPasswordButton).toBeVisible();
  }

  async expectVerificationForm() {
    // Wait for verification form to appear - uses Playwright's default timeout
    await expect(this.verifyHeading).toBeVisible();
    await expect(this.verifyCodeInput).toBeVisible();
    await expect(this.verifyEmailButton).toBeVisible();
  }

  async expectValidationError(field: "email" | "password") {
    const input = field === "email" ? this.emailInput : this.passwordInput;
    // HTML5 validation - check validity state
    const isInvalid = await input.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  }
}
