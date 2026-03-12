/**
 * Auth Locators - Shared selectors for authentication flows
 *
 * These locator factories are used by:
 * - AuthPage (Page Object for tests)
 * - auth-helpers (global setup authentication)
 *
 * This eliminates duplication and ensures consistency.
 */

import type { Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";

/**
 * Auth form locators - for sign in/sign up forms
 */
export const authFormLocators = (page: Page) => ({
  // Headings
  signInHeading: page.getByRole("heading", { name: /sign in to nixelo/i }),
  signUpHeading: page.getByRole("heading", { name: /create your account/i }),
  forgotPasswordHeading: page.getByRole("heading", { name: /reset your password/i }),
  verifyEmailHeading: page.getByRole("heading", { name: /check your email/i }),

  // Form elements
  continueWithEmailButton: page.getByRole("button", { name: /continue with email/i }),
  emailInput: page.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT),
  passwordInput: page.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT),
  signInButton: page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON),
  signUpButton: page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON),
  submitButton: page.getByRole("button", { name: /^(sign in|create account)$/i }),

  // Form state
  formReady: page.locator(`[data-testid="${TEST_IDS.AUTH.FORM}"][data-form-ready="true"]`),

  // Links
  forgotPasswordLink: page.getByRole("button", { name: /forgot password/i }),
  signUpLink: page.getByRole("link", { name: /sign up/i }),
  signInLink: page.getByRole("link", { name: /sign in/i }),
  backToSignInLink: page.getByRole("link", { name: /back to sign in/i }),

  // OAuth
  googleSignInButton: page.getByRole("button", { name: /sign in with google/i }),

  // Verification
  verifyCodeInput: page.getByPlaceholder("8-digit code"),
  verifyEmailButton: page.getByRole("button", { name: /verify email/i }),
});

/**
 * Onboarding locators
 */
export const onboardingLocators = (page: Page) => ({
  welcomeHeading: page.getByRole("heading", { name: /welcome to nixelo/i }),
  skipButton: page.getByRole("button", { name: /skip for now/i }),
  skipLink: page.getByRole("link", { name: /skip for now/i }),
  skipText: page.getByText(/skip for now/i),
});

/**
 * Toast/notification locators
 */
export const toastLocators = (page: Page) => ({
  any: page.locator("[data-sonner-toast]"),
  success: page.locator('[data-sonner-toast][data-type="success"]'),
  error: page.locator('[data-sonner-toast][data-type="error"]'),
  info: page.locator('[data-sonner-toast][data-type="info"]'),
});

/**
 * Dashboard locators
 */
export const dashboardLocators = (page: Page) => ({
  myWorkHeading: page.getByRole("heading", { name: /my work/i }),
});

/**
 * URL patterns for navigation checks
 */
export const urlPatterns = {
  dashboard: /\/[^/]+\/dashboard$/,
  onboarding: /\/onboarding/,
  dashboardOrOnboarding: /\/(onboarding|[^/]+\/dashboard)/,
};

export type AuthFormLocators = ReturnType<typeof authFormLocators>;
export type OnboardingLocators = ReturnType<typeof onboardingLocators>;
export type ToastLocators = ReturnType<typeof toastLocators>;
export type DashboardLocators = ReturnType<typeof dashboardLocators>;
