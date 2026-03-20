import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import type { TestUser } from "../config";
import { trySignInUser } from "../utils/auth-helpers";
import { ROUTES } from "../utils/routes";
import { getToastLocator } from "../utils/toast-locators";
import { waitForDashboardReady } from "../utils/wait-helpers";
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
  readonly checkEmailHeading: Locator;
  readonly authAlert: Locator;

  // ===================
  // Locators - Sign In/Up Forms
  // ===================
  readonly continueWithEmailButton: Locator;
  readonly authForm: Locator;
  readonly emailForm: Locator;
  readonly authFormReadyMarker: Locator;
  readonly authFormHydratedMarker: Locator;
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
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Page headings
    // Updated to match the actual text in src/routes/signin.tsx and src/routes/signup.tsx
    this.signInHeading = page.getByRole("heading", { name: /sign in to nixelo/i });
    this.signUpHeading = page.getByRole("heading", { name: /create your account/i });
    this.forgotPasswordHeading = page.getByRole("heading", { name: /reset your password/i });
    this.resetPasswordHeading = page.getByRole("heading", { name: /enter reset code/i });
    this.checkEmailHeading = page.getByRole("heading", { name: /check your email/i });
    this.authAlert = page.getByRole("alert");

    // Sign In / Sign Up form - two-step flow
    this.continueWithEmailButton = page.getByRole("button", { name: /continue with email/i });
    this.authForm = page.getByTestId(TEST_IDS.AUTH.FORM);
    this.emailForm = page.getByTestId(TEST_IDS.AUTH.EMAIL_FORM);
    this.authFormReadyMarker = page.getByTestId(TEST_IDS.AUTH.FORM_READY);
    this.authFormHydratedMarker = page.getByTestId(TEST_IDS.AUTH.FORM_HYDRATED);
    this.emailInput = page.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    this.passwordInput = page.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    // Submit button reuses the same DOM node across expanded states; bind by stable test id.
    this.signInButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    this.signUpButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    this.forgotPasswordLink = page
      .getByRole("button", { name: /forgot password\??/i })
      .or(page.getByRole("link", { name: /forgot password\??/i }));
    this.googleSignInButton = page.getByTestId(TEST_IDS.AUTH.GOOGLE_BUTTON);

    // Navigation links between auth pages
    this.signUpLink = page.getByRole("link", { name: /sign up/i });
    this.signInLink = page.getByRole("link", { name: /sign in/i });

    // Password Reset
    this.sendResetCodeButton = page.getByRole("button", { name: /send reset code/i });
    this.backToSignInLink = page.getByRole("link", { name: /sign in/i });
    this.codeInput = page.getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT);
    this.newPasswordInput = page.getByTestId(TEST_IDS.AUTH.RESET_PASSWORD_INPUT);
    this.resetPasswordButton = page.getByTestId(TEST_IDS.AUTH.RESET_SUBMIT_BUTTON);

    // Email Verification
    // Email Verification - Use more robust locators that don't depend strictly on ARIA roles
    // as they might vary between h1/h2 during architecture transitions
    this.verifyHeading = page.getByText(/verify your email/i).first();
    this.verifyCodeInput = page.getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT);
    this.verifyEmailButton = page.getByTestId(TEST_IDS.AUTH.VERIFICATION_SUBMIT_BUTTON);
    this.resendCodeButton = page.getByRole("button", { name: /didn't receive|resend/i });
    this.signOutLink = page.getByRole("button", { name: /sign out|different account/i });
    this.successToast = getToastLocator(page, "success").first();
    this.errorToast = getToastLocator(page, "error").first();
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
    await this.page.goto(ROUTES.signin.build(), { waitUntil: "domcontentloaded" });
    await this.signInHeading.waitFor({ state: "visible", timeout: 30000 });
    await this.waitForAuthFormHydrated();
    // Expand form using robust click logic
    await this.expandEmailForm("signin");
    // Verify form is expanded using owned auth markers plus visible inputs.
    await this.waitForFormExpanded("signin");
  }

  async gotoSignInLanding() {
    await this.page.goto(ROUTES.signin.build(), { waitUntil: "domcontentloaded" });
    await this.signInHeading.waitFor({ state: "visible", timeout: 30000 });
    await this.waitForAuthFormHydrated();
  }

  /**
   * Navigate to sign up page and expand email form
   */
  async gotoSignUp() {
    await this.page.goto(ROUTES.signup.build(), { waitUntil: "domcontentloaded" });
    await this.signUpHeading.waitFor({ state: "visible", timeout: 30000 });
    await this.waitForAuthFormHydrated();
    // Expand form using robust click logic
    await this.expandEmailForm("signup");
    // Verify form is expanded using owned auth markers plus visible inputs.
    await this.waitForFormExpanded("signup");
  }

  /**
   * Navigate directly to forgot password page
   */
  async gotoForgotPassword() {
    await this.page.goto(ROUTES.forgotPassword.build());
    await this.expectForgotPasswordEntryFormReady();
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
   * Uses one bounded second-click recovery if the first expansion misses
   */
  async expandEmailForm(mode?: "signin" | "signup") {
    await this.waitForAuthFormHydrated();
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());

    if (await this.waitForStableEmailFormExpanded(1800, expectedMode)) {
      return;
    }

    await expect(this.continueWithEmailButton).toBeVisible();
    await expect(this.continueWithEmailButton).toBeEnabled();

    await this.continueWithEmailButton.click();

    if (await this.waitForStableEmailFormExpanded(2500, expectedMode)) {
      return;
    }

    await expect(this.continueWithEmailButton).toBeVisible();
    await expect(this.continueWithEmailButton).toBeEnabled();
    await this.continueWithEmailButton.focus();
    await this.page.keyboard.press("Enter");
    await this.expectStableEmailFormExpanded(expectedMode);
  }

  // ===================
  // Actions - Sign In/Up
  // ===================

  async signIn(email: string, password: string) {
    await this.expandEmailForm("signin");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await expect(this.signInButton).toBeVisible();
    await this.waitForFormReady("signin");
    await this.signInButton.click();

    if (!(await this.waitForSignInSubmitStart(3000))) {
      await expect(this.signInButton).toBeVisible();
      await expect(this.signInButton).toBeEnabled();
      await this.signInButton.click();
      const started = await this.waitForSignInSubmitStart(5000);
      if (!started) {
        throw new Error("Sign-in submission did not start after retry");
      }
    }
  }

  async signInAndReachAuthenticatedApp(
    email: string,
    password: string,
    options?: {
      baseURL?: string;
      fallbackUser?: TestUser;
      autoCompleteOnboarding?: boolean;
    },
  ) {
    await this.signIn(email, password);

    const shellVisible = await this.expectAuthenticatedApp({ recoverFromLanding: true })
      .then(() => true)
      .catch(() => false);

    if (!shellVisible && options?.baseURL && options.fallbackUser) {
      await trySignInUser(
        this.page,
        options.baseURL,
        options.fallbackUser,
        options.autoCompleteOnboarding,
      );
    }

    await this.expectAuthenticatedApp({ recoverFromLanding: true });
  }

  async signUp(email: string, password: string) {
    if (await this.attemptSignUp(email, password)) {
      return;
    }

    const completed = await this.attemptSignUp(email, password, { expectOutcome: true });
    expect(completed).toBe(true);
  }

  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.waitForAuthLanding("signup");
  }

  async navigateToSignIn() {
    await this.signInLink.click();
    await this.waitForAuthLanding("signin");
  }

  async switchToSignUp() {
    await this.navigateToSignUp();
    await this.expandEmailForm("signup");
    // Verify form is expanded using owned auth markers plus visible inputs.
    await this.waitForFormExpanded("signup");
  }

  async switchToSignIn() {
    await this.navigateToSignIn();
    await this.expandEmailForm("signin");
    // Verify form is expanded using owned auth markers plus visible inputs.
    await this.waitForFormExpanded("signin");
  }

  async signInWithGoogle() {
    await this.googleSignInButton.waitFor({ state: "visible" });
    await this.googleSignInButton.click();
    // Note: Will redirect to Google OAuth
  }

  async waitForOAuthErrorSettle() {
    await expect
      .poll(async () => this.getOAuthErrorSettleState(), { timeout: 5000, intervals: [250, 500] })
      .not.toBe("pending");
  }

  // ===================
  // Actions - Password Reset
  // ===================

  async clickForgotPassword() {
    await this.expandEmailForm("signin");
    await this.waitForFormReady("signin");
    if (await this.waitForForgotPasswordReady(500)) {
      return;
    }

    await this.clickForgotPasswordLink();
    if (await this.waitForForgotPasswordReady()) {
      return;
    }

    await this.page.goto(ROUTES.forgotPassword.build(), { waitUntil: "domcontentloaded" });
    await this.expectForgotPasswordReady();
  }

  /**
   * Alias for clickForgotPassword - navigates to forgot password from sign in
   */
  async goToForgotPassword() {
    await this.clickForgotPassword();
  }

  async requestPasswordReset(email: string) {
    const state = await this.ensureForgotPasswordEntry();
    if (state === "check-email" || state === "code") {
      return;
    }

    await this.submitPasswordResetRequest(email);
    if (await this.waitForPasswordResetCodeStep()) {
      return;
    }

    await this.retryPasswordResetRequest(email);
  }

  async completePasswordReset(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();

    if (!(await this.waitForPasswordResetSubmitStart(3000))) {
      await expect(this.resetPasswordButton).toBeVisible();
      await expect(this.resetPasswordButton).toBeEnabled();
      await this.resetPasswordButton.click();
      const started = await this.waitForPasswordResetSubmitStart(5000);
      if (!started) {
        throw new Error("Password reset submission did not start after retry");
      }
    }
  }

  async goBackToSignIn() {
    await this.backToSignInLink.waitFor({ state: "visible" });
    await this.backToSignInLink.click();
    if (!(await this.waitForAuthLandingReady("signin", 5000))) {
      await this.page.goto(ROUTES.signin.build(), { waitUntil: "domcontentloaded" });
      await this.waitForAuthLanding("signin");
    }
    await this.expandEmailForm("signin");
  }

  // ===================
  // Actions - Email Verification
  // ===================

  async verifyEmail(code: string) {
    await this.verifyCodeInput.fill(code);
    await this.verifyEmailButton.click();

    if (!(await this.waitForVerificationSubmitStart(3000))) {
      await expect(this.verifyEmailButton).toBeVisible();
      await expect(this.verifyEmailButton).toBeEnabled();
      await this.verifyEmailButton.click();
      const started = await this.waitForVerificationSubmitStart(5000);
      if (!started) {
        throw new Error("Email verification submission did not start after retry");
      }
    }
  }

  getSuccessToast(message: RegExp): Locator {
    return getToastLocator(this.page, "success").filter({ hasText: message }).first();
  }

  async waitForToastOutcome(message: RegExp): Promise<"success" | "timeout"> {
    const result = await expect
      .poll(() => this.getToastOutcomeState(message), {
        timeout: 10000,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending")
      .then(async () => this.getToastOutcomeState(message))
      .catch(() => "timeout" as const);

    if (result === "error") {
      const errorText = await this.errorToast.textContent();
      throw new Error(`Auth flow failed with error toast: ${errorText}`);
    }

    return result;
  }

  async expectAuthenticatedApp(options?: { recoverFromLanding?: boolean }) {
    const isLandingOrSignIn = () => {
      const { pathname } = new URL(this.page.url());
      return pathname === "/" || pathname === ROUTES.signin.build();
    };

    const onboardingCandidates = [
      this.page.getByTestId(TEST_IDS.ONBOARDING.SKIP_BUTTON),
      this.page.getByTestId(TEST_IDS.ONBOARDING.WELCOME_HEADING),
      this.page.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_CARD),
      this.page.getByTestId(TEST_IDS.ONBOARDING.TEAM_MEMBER_CARD),
      this.page.getByRole("heading", { name: /welcome to nixelo/i }),
    ];

    const getVisibleOnboardingCandidate = async () => {
      for (const candidate of onboardingCandidates) {
        const locator = candidate.first();
        if (await locator.isVisible().catch(() => false)) {
          return locator;
        }
      }
      return null;
    };

    if (options?.recoverFromLanding) {
      const leftLanding = await expect
        .poll(() => !isLandingOrSignIn(), {
          timeout: 5000,
          intervals: [250, 500, 1000],
        })
        .toBe(true)
        .then(() => true)
        .catch(() => false);

      if (!leftLanding && isLandingOrSignIn()) {
        await this.page.goto("/app", { waitUntil: "domcontentloaded" });
      }
    }

    await expect
      .poll(
        async () => {
          if (await getVisibleOnboardingCandidate()) {
            return "onboarding";
          }

          const currentPath = new URL(this.page.url()).pathname;
          if (/^\/onboarding\/?$/.test(currentPath)) {
            return "onboarding";
          }

          if (/^\/[^/]+\/dashboard\/?$/.test(currentPath)) {
            const hasDashboardSearch = await this.page
              .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
              .isVisible()
              .catch(() => false);
            return hasDashboardSearch ? "dashboard" : null;
          }

          return null;
        },
        { timeout: 30000 },
      )
      .not.toBeNull();

    const currentPath = new URL(this.page.url()).pathname;
    const visibleOnboardingCandidate = await getVisibleOnboardingCandidate();
    if (/^\/onboarding\/?$/.test(currentPath) || visibleOnboardingCandidate) {
      if (visibleOnboardingCandidate) {
        await expect(visibleOnboardingCandidate).toBeVisible();
      }
      return "onboarding" as const;
    }

    await waitForDashboardReady(this.page);
    return "dashboard" as const;
  }

  async resendVerificationCode() {
    await this.resendCodeButton.click();
  }

  async signOutFromVerification() {
    await this.signOutLink.click();
  }

  // ===================
  // Assertions
  // ===================

  /**
   * Wait for form to be expanded (email/password fields visible)
   * Uses owned auth markers plus visible inputs set by the auth form components.
   */
  async waitForFormExpanded(mode?: "signin" | "signup") {
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());
    await this.expectStableEmailFormExpanded(expectedMode);
  }

  async waitForEmailFormExpanded(timeout = 3000, mode?: "signin" | "signup") {
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());
    const targetState = expectedMode === "signin" ? "signin-expanded" : "signup-expanded";
    return await this.waitForStateReady(
      () => this.getAuthFormState(),
      (state) => state === targetState,
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  async expectEmailFormExpanded(mode?: "signin" | "signup", timeout = 10000) {
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());
    const targetState = expectedMode === "signin" ? "signin-expanded" : "signup-expanded";
    await this.waitForState(
      () => this.getAuthFormState(),
      (state) => state === targetState,
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  private async waitForStableEmailFormExpanded(timeout = 3000, mode?: "signin" | "signup") {
    try {
      await this.expectStableEmailFormExpanded(mode, timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectStableEmailFormExpanded(mode?: "signin" | "signup", timeout = 4000) {
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());
    const targetState = expectedMode === "signin" ? "signin-expanded" : "signup-expanded";
    let stableSince = 0;

    await expect
      .poll(
        async () => {
          const state = await this.getAuthFormState();
          const signInReady =
            expectedMode !== "signin" ||
            (await this.forgotPasswordLink.isVisible().catch(() => false));
          const expandedAndReady = state === targetState && signInReady;

          if (!expandedAndReady) {
            stableSince = 0;
            return state;
          }

          if (!stableSince) {
            stableSince = Date.now();
          }

          return Date.now() - stableSince >= 1000 ? "stable" : "warming";
        },
        {
          timeout,
          intervals: [200, 300, 500],
        },
      )
      .toBe("stable");
  }

  /**
   * Wait for form to be fully ready (formReady state)
   * The form sets a readiness marker after expansion which enables required attributes.
   * This is a best-effort wait - it won't throw if the form doesn't have this attribute
   */
  async waitForFormReady(mode?: "signin" | "signup") {
    await this.waitForAuthFormHydrated();
    const expectedMode = mode ?? (await this.getCurrentAuthRoute());
    await this.expectEmailFormExpanded(expectedMode);

    if (expectedMode === "signin") {
      await expect(this.forgotPasswordLink).toBeVisible();
    }
  }

  private async waitForAuthFormHydrated(timeout = 15000) {
    await expect(this.authFormHydratedMarker).toHaveCount(1, { timeout });
  }

  private async waitForAuthLanding(mode: "signin" | "signup", timeout = 15000) {
    const targetState = mode === "signin" ? "signin-landing" : "signup-landing";
    await this.waitForState(
      () => this.getAuthFormState(),
      (state) => state === targetState,
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  private async waitForAuthLandingReady(mode: "signin" | "signup", timeout = 3000) {
    const targetState = mode === "signin" ? "signin-landing" : "signup-landing";
    return await this.waitForStateReady(
      () => this.getAuthFormState(),
      (state) => state === targetState,
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  private async getCurrentAuthRoute(): Promise<"signin" | "signup"> {
    if (await this.signInHeading.isVisible().catch(() => false)) {
      return "signin";
    }

    if (await this.signUpHeading.isVisible().catch(() => false)) {
      return "signup";
    }

    await expect
      .poll(
        async () => {
          if (await this.signInHeading.isVisible().catch(() => false)) {
            return "signin";
          }

          if (await this.signUpHeading.isVisible().catch(() => false)) {
            return "signup";
          }

          return "pending";
        },
        {
          timeout: 15000,
          intervals: [200, 500, 1000],
        },
      )
      .not.toBe("pending");

    return (await this.signInHeading.isVisible().catch(() => false)) ? "signin" : "signup";
  }

  private async getAuthFormState(): Promise<
    "signin-landing" | "signin-expanded" | "signup-landing" | "signup-expanded" | "pending"
  > {
    const route = await this.getCurrentAuthRoute().catch(() => null);
    if (!route) {
      return "pending";
    }

    const hydrated = (await this.authFormHydratedMarker.count().catch(() => 0)) > 0;
    if (!hydrated) {
      return "pending";
    }

    const buttonText =
      (await this.submitButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
    const expanded = (await this.emailForm.count().catch(() => 0)) > 0;

    if (route === "signin") {
      if (
        expanded &&
        /sign in|signing in/.test(buttonText) &&
        (await this.emailInput.isVisible().catch(() => false))
      ) {
        return "signin-expanded";
      }

      if (!expanded && /continue with email/.test(buttonText)) {
        return "signin-landing";
      }

      return "pending";
    }

    if (
      expanded &&
      /create account|creating account/.test(buttonText) &&
      (await this.emailInput.isVisible().catch(() => false))
    ) {
      return "signup-expanded";
    }

    if (!expanded && /continue with email/.test(buttonText)) {
      return "signup-landing";
    }

    return "pending";
  }

  async waitForForgotPasswordReady(timeout = 3000) {
    return await this.waitForStateReady(
      () => this.getPasswordResetEntryState(),
      (state) => state !== "pending",
      {
        timeout,
        intervals: [250, 500, 1000],
      },
    );
  }

  async expectForgotPasswordReady(timeout = 15000) {
    await expect(this.page).toHaveURL(new RegExp(ROUTES.forgotPassword.path), { timeout });
    await this.waitForState(
      () => this.getPasswordResetEntryState(),
      (state) => state !== "pending",
      {
        timeout,
        intervals: [250, 500, 1000],
      },
    );
  }

  async expectForgotPasswordEntryFormReady(timeout = 15000) {
    await expect(this.page).toHaveURL(new RegExp(ROUTES.forgotPassword.path), { timeout });
    await this.waitForState(
      () => this.getPasswordResetEntryState(),
      (state) => state === "forgot",
      {
        timeout,
        intervals: [250, 500, 1000],
      },
    );
    await expect(this.emailInput).toBeVisible({ timeout });
  }

  async ensureForgotPasswordEntry(): Promise<"forgot" | "check-email" | "code"> {
    if (!new URL(this.page.url()).pathname.startsWith(ROUTES.forgotPassword.build())) {
      await this.page.goto(ROUTES.forgotPassword.build(), { waitUntil: "domcontentloaded" });
    }

    return await this.waitForState(
      () => this.getPasswordResetEntryState(),
      (state) => state !== "pending",
      {
        timeout: 15000,
        intervals: [250, 500, 1000],
      },
    );
  }

  async waitForSignUpVerificationStep(timeout = 3000) {
    return await this.waitForStateReady(
      () => this.getSignUpVerificationFormState(),
      (state) => state === "verify",
      {
        timeout,
        intervals: [250, 500, 1000],
      },
    );
  }

  async expectSignUpVerificationStep(timeout = 15000) {
    await this.expectVerificationFormReady(timeout);
  }

  private async expectVerificationFormReady(timeout = 30000) {
    await this.waitForState(
      () => this.getSignUpVerificationFormState(),
      (state) => state === "verify",
      {
        timeout,
        intervals: [250, 500, 1000],
      },
    );
  }

  async getOAuthErrorSettleState(): Promise<"signin" | "alert" | "toast" | "pending"> {
    if (this.page.url().includes("signin")) {
      return "signin";
    }

    if (await this.authAlert.isVisible().catch(() => false)) {
      return "alert";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "toast";
    }

    return "pending";
  }

  async getSignUpVerificationState(): Promise<"verify" | "toast" | "pending"> {
    if (await this.verifyHeading.isVisible().catch(() => false)) {
      return "verify";
    }

    if (await this.successToast.isVisible().catch(() => false)) {
      return "toast";
    }

    return "pending";
  }

  private async getSignUpVerificationFormState(): Promise<"verify" | "error" | "pending"> {
    if (
      (await this.verifyHeading.isVisible().catch(() => false)) &&
      (await this.verifyCodeInput.isVisible().catch(() => false)) &&
      (await this.verifyEmailButton.isVisible().catch(() => false))
    ) {
      return "verify";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    return "pending";
  }

  private async waitForState<T extends string>(
    getState: () => Promise<T>,
    isReady: (state: T) => boolean,
    options?: {
      timeout?: number;
      intervals?: number[];
    },
  ): Promise<T> {
    let matchedState: T | null = null;

    await expect
      .poll(
        async () => {
          const state = await getState();
          if (isReady(state)) {
            matchedState = state;
            return "ready";
          }

          return "pending";
        },
        {
          timeout: options?.timeout ?? 3000,
          intervals: options?.intervals ?? [200, 500, 1000],
        },
      )
      .toBe("ready");

    if (matchedState === null) {
      throw new Error("Auth state did not settle before timeout");
    }

    return matchedState;
  }

  private async waitForStateReady<T extends string>(
    getState: () => Promise<T>,
    isReady: (state: T) => boolean,
    options?: {
      timeout?: number;
      intervals?: number[];
    },
  ) {
    try {
      await this.waitForState(getState, isReady, options);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForSubmitStateStart(
    getState: () => Promise<"pending" | string>,
    timeout = 3000,
  ) {
    return await this.waitForStateReady(getState, (state) => state !== "pending", {
      timeout,
      intervals: [200, 500, 1000],
    });
  }

  private async waitForSignUpSubmitStart(timeout = 3000) {
    return await this.waitForSubmitStateStart(() => this.getSignUpSubmitState(), timeout);
  }

  private async waitForSignInSubmitStart(timeout = 3000) {
    return await this.waitForSubmitStateStart(() => this.getSignInSubmitState(), timeout);
  }

  private async waitForVerificationSubmitStart(timeout = 3000) {
    return await this.waitForSubmitStateStart(() => this.getVerificationSubmitState(), timeout);
  }

  private async getToastOutcomeState(message: RegExp): Promise<"success" | "error" | "pending"> {
    if (
      await this.getSuccessToast(message)
        .isVisible()
        .catch(() => false)
    ) {
      return "success";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    return "pending";
  }

  private async getVerificationSubmitState(): Promise<
    "submitting" | "redirect" | "success" | "error" | "pending"
  > {
    if (!new URL(this.page.url()).pathname.startsWith(ROUTES.signup.build())) {
      return "redirect";
    }

    if (await this.successToast.isVisible().catch(() => false)) {
      return "success";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    const buttonText =
      (await this.verifyEmailButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
    if (/verifying/.test(buttonText)) {
      return "submitting";
    }

    return "pending";
  }

  private async waitForPasswordResetSubmitStart(timeout = 3000) {
    return await this.waitForSubmitStateStart(() => this.getPasswordResetSubmitState(), timeout);
  }

  private async getPasswordResetSubmitState(): Promise<
    "submitting" | "redirect" | "success" | "error" | "pending"
  > {
    if (!new URL(this.page.url()).pathname.startsWith(ROUTES.forgotPassword.build())) {
      return "redirect";
    }

    if (await this.successToast.isVisible().catch(() => false)) {
      return "success";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    const buttonText =
      (await this.resetPasswordButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
    if (/resetting/.test(buttonText)) {
      return "submitting";
    }

    return "pending";
  }

  private async getSignInSubmitState(): Promise<"submitting" | "redirect" | "error" | "pending"> {
    if (!new URL(this.page.url()).pathname.startsWith(ROUTES.signin.build())) {
      return "redirect";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    const buttonText =
      (await this.signInButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
    if (/signing in/.test(buttonText)) {
      return "submitting";
    }

    return "pending";
  }

  private async getSignUpSubmitState(): Promise<"submitting" | "verify" | "error" | "pending"> {
    if ((await this.getSignUpVerificationFormState()) === "verify") {
      return "verify";
    }

    if (await this.errorToast.isVisible().catch(() => false)) {
      return "error";
    }

    const buttonText =
      (await this.signUpButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
    if (/creating account/.test(buttonText)) {
      return "submitting";
    }

    return "pending";
  }

  async getPasswordResetEntryState(): Promise<"forgot" | "check-email" | "code" | "pending"> {
    if (await this.codeInput.isVisible().catch(() => false)) {
      return "code";
    }

    if (await this.forgotPasswordHeading.isVisible().catch(() => false)) {
      return "forgot";
    }

    if (await this.checkEmailHeading.isVisible().catch(() => false)) {
      return "check-email";
    }

    return "pending";
  }

  async getPasswordResetCodeStepState(): Promise<
    "check-email" | "reset-heading" | "code" | "pending"
  > {
    if (await this.codeInput.isVisible().catch(() => false)) {
      return "code";
    }

    if (await this.resetPasswordHeading.isVisible().catch(() => false)) {
      return "reset-heading";
    }

    if (await this.checkEmailHeading.isVisible().catch(() => false)) {
      return "check-email";
    }

    return "pending";
  }

  private async clickForgotPasswordLink() {
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.forgotPasswordLink).toBeEnabled();

    await this.forgotPasswordLink.click({ timeout: 5000 });
    if (await this.waitForForgotPasswordReady(1000)) {
      return;
    }

    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.forgotPasswordLink).toBeEnabled();
    await this.forgotPasswordLink.click({ timeout: 5000 });
  }

  private async submitPasswordResetRequest(email: string) {
    const state = await this.ensureForgotPasswordEntry();
    if (state === "check-email" || state === "code") {
      return;
    }

    await expect(this.emailInput).toBeVisible({ timeout: 15000 });
    await this.emailInput.fill(email);
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.sendResetCodeButton).toBeEnabled();
    await this.submitForgotPasswordRequest();
  }

  private async waitForPasswordResetCodeStep(timeout = 5000) {
    return await this.waitForStateReady(
      () => this.getPasswordResetCodeStepState(),
      (state) => state === "code",
      {
        timeout,
        intervals: [250, 500, 1000, 2000],
      },
    );
  }

  private async expectPasswordResetCodeStep(timeout = 30000) {
    await this.waitForState(
      () => this.getPasswordResetCodeStepState(),
      (state) => state === "code",
      {
        timeout,
        intervals: [250, 500, 1000, 2000],
      },
    );
    await expect(this.codeInput).toBeVisible({ timeout });
  }

  private async submitForgotPasswordRequest() {
    await expect(this.sendResetCodeButton).toBeVisible();
    await expect(this.sendResetCodeButton).toBeEnabled();
    await this.sendResetCodeButton.click();
  }

  private async retryPasswordResetRequest(email: string) {
    await this.page.goto(ROUTES.forgotPassword.build(), { waitUntil: "domcontentloaded" });
    const state = await this.ensureForgotPasswordEntry();
    if (state === "check-email" || state === "code") {
      await this.expectPasswordResetCodeStep();
      return;
    }

    await this.submitPasswordResetRequest(email);
    await this.expectPasswordResetCodeStep();
  }

  private async attemptSignUp(
    email: string,
    password: string,
    options?: { expectOutcome?: boolean },
  ) {
    if (!(await this.fillSignUpCredentials(email, password))) {
      if (!options?.expectOutcome) {
        return false;
      }

      await this.expectSignUpCredentialsFilled(email, password);
    }

    await this.waitForFormReady("signup");
    await this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON).click();
    if (!(await this.waitForSignUpSubmitStart(3000)) && options?.expectOutcome) {
      await expect(this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON)).toBeVisible();
      await expect(this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON)).toBeEnabled();
      await this.page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON).click();
      const started = await this.waitForSignUpSubmitStart(5000);
      if (!started) {
        throw new Error("Sign-up submission did not start after retry");
      }
    }

    if (options?.expectOutcome) {
      await this.expectVerificationFormReady();
      return true;
    }

    return this.waitForSignUpVerificationStep();
  }

  private async fillSignUpCredentials(email: string, password: string) {
    await this.applySignUpCredentials(email, password);
    if (await this.waitForSignUpCredentialsFilled(email, password, 1000)) {
      return true;
    }

    await this.applySignUpCredentials(email, password);
    return this.waitForSignUpCredentialsFilled(email, password, 1000);
  }

  private async applySignUpCredentials(email: string, password: string) {
    await this.expandEmailForm("signup");
    await expect(this.emailInput).toBeVisible();
    await this.emailInput.fill(email);
    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);
  }

  private async waitForSignUpCredentialsFilled(email: string, password: string, timeout = 3000) {
    return await this.waitForStateReady(
      () => this.getSignUpCredentialsFillState(email, password),
      (state) => state === "filled",
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  private async expectSignUpCredentialsFilled(email: string, password: string, timeout = 10000) {
    await this.waitForState(
      () => this.getSignUpCredentialsFillState(email, password),
      (state) => state === "filled",
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    );
  }

  private async getSignUpCredentialsFillState(
    email: string,
    password: string,
  ): Promise<"filled" | "pending"> {
    if ((await this.getAuthFormState()) !== "signup-expanded") {
      return "pending";
    }

    if (!(await this.emailInput.isVisible().catch(() => false))) {
      return "pending";
    }

    if (!(await this.passwordInput.isVisible().catch(() => false))) {
      return "pending";
    }

    const currentEmail = await this.emailInput.inputValue().catch(() => null);
    if (currentEmail !== email) {
      return "pending";
    }

    const currentPassword = await this.passwordInput.inputValue().catch(() => null);
    if (currentPassword !== password) {
      return "pending";
    }

    return "filled";
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
    await expect(this.codeInput).toBeVisible({ timeout: 30000 });
    await expect(this.codeInput).toBeVisible();
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.resetPasswordButton).toBeVisible();
  }

  async expectVerificationForm() {
    await this.expectVerificationFormReady();
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
