import { TEST_IDS } from "../src/lib/test-ids";
import { TEST_USERS } from "./config";
import { expect, test } from "./fixtures";
import { getTestEmailAddress } from "./utils/helpers";
import { waitForMockOTP } from "./utils/otp-helpers";
import { ROUTES } from "./utils/routes";

/**
 * Authentication E2E Tests
 *
 * Tests the sign in, sign up, password reset, and email verification flows.
 * Uses Page Object Model for maintainability.
 */

test.describe("Landing Page", () => {
  test("shows landing page for unauthenticated users", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.expectLandingPage();
  });

  test("can navigate to signup from hero CTA", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();
    await landingPage.expectSignUpPage();
  });

  test("can navigate to signup from nav", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickNavGetStarted();
    await landingPage.expectSignUpPage();
  });

  test("can navigate to signin from nav", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickNavLogin();
    await landingPage.expectSignInPage();
  });
});

test.describe("Sign In Page", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoSignIn();
  });

  test("displays sign in form", async ({ authPage }) => {
    await authPage.expectSignInForm();
  });

  test("shows Google sign in option", async ({ authPage }) => {
    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });

  test("has link to forgot password", async ({ authPage }) => {
    await authPage.expandEmailForm();
    await expect(authPage.forgotPasswordLink).toBeVisible();
  });

  test("has link to sign up", async ({ authPage }) => {
    await expect(authPage.signUpLink).toBeVisible();
  });

  test("validates required fields", async ({ authPage }) => {
    await authPage.expandEmailForm();
    await expect(authPage.emailInput).toHaveAttribute("required", "");
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoSignUp();
  });

  test("displays sign up form", async ({ authPage }) => {
    await authPage.expectSignUpForm();
  });

  test("has link to sign in", async ({ authPage }) => {
    await expect(authPage.signInLink).toBeVisible();
  });

  test("validates required fields", async ({ authPage }) => {
    await authPage.expandEmailForm();
    await expect(authPage.emailInput).toHaveAttribute("required", "");
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Password Reset", () => {
  test("can navigate to forgot password from sign in", async ({ authPage }) => {
    await authPage.gotoSignIn();
    await authPage.clickForgotPassword();
    await authPage.expectForgotPasswordForm();
  });

  test("can go directly to forgot password", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await authPage.expectForgotPasswordForm();
  });

  test("can go back to sign in", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await authPage.goBackToSignIn();
    await authPage.expectSignInForm();
  });

  test("forgot password form has email input", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.emailInput).toHaveAttribute("required", "");
  });
});

/**
 * Integration tests - require running backend
 * These test the full sign up and email verification flow
 *
 * NOTE: Uses Mock OTP (direct DB read) instead of Mailtrap
 * to avoid cost/limits and improve speed.
 */
test.describe("Integration", () => {
  test.describe.configure({ mode: "serial" });

  test("sign up flow sends verification email", async ({ authPage }) => {
    const testEmail = getTestEmailAddress("signup-test");
    await authPage.gotoSignUp();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Should show verification form
    await authPage.expectVerificationForm();
  });

  test("can complete email verification", async ({ authPage, page }) => {
    const testEmail = getTestEmailAddress("verify-test");
    await authPage.gotoSignUp();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Wait for verification form
    await authPage.expectVerificationForm();

    // Get OTP from Mock Backend (fast, free, robust)
    const otp = await waitForMockOTP(testEmail);

    // Enter the OTP
    console.log(`[Test] Entering OTP: ${otp}`);
    await authPage.verifyEmail(otp);

    // Wait for success toast indicating verification completed
    // The success toast shows before navigation
    const successToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /verified|success/i });
    const errorToast = page.locator("[data-sonner-toast][data-type='error']");

    // Wait for either success toast or error toast to appear
    const toastResult = await Promise.race([
      successToast.waitFor({ state: "visible", timeout: 10000 }).then(() => "success" as const),
      errorToast.waitFor({ state: "visible", timeout: 10000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    if (toastResult === "error") {
      const errorText = await errorToast.textContent();
      console.log(`[Test] Error toast visible: ${errorText}`);
      throw new Error(`Verification failed with error: ${errorText}`);
    }

    if (toastResult === "timeout") {
      console.log("[Test] No toast appeared within timeout, proceeding to check navigation...");
    } else {
      console.log("[Test] Success toast appeared");
    }

    // Check current URL
    console.log(`[Test] Current URL after verify: ${page.url()}`);

    // If we're on the landing page, it means auth state wasn't ready
    // Navigate to app gateway to trigger proper auth check
    if (page.url().endsWith("/") || page.url().endsWith("localhost:5555")) {
      await page.goto(ROUTES.app.build());
      await page.waitForLoadState("domcontentloaded");
    }

    // Should redirect to dashboard or onboarding
    await expect(
      page
        .getByRole("heading", { name: /welcome to nixelo/i })
        .or(page.getByRole("link", { name: /dashboard/i }))
        .or(page.locator('[data-sidebar="sidebar"]')), // Sidebar indicates we're in the app
    ).toBeVisible();
  });

  test("can sign in with existing user and lands on dashboard", async ({ authPage, page }) => {
    // Use the pre-existing teamLead test user
    const { email, password } = TEST_USERS.teamLead;
    await authPage.gotoSignIn();

    // Sign in with existing user
    await authPage.signIn(email, password);

    // Wait for navigation to complete
    await page.waitForLoadState("domcontentloaded");

    // Should land on dashboard (existing user has completed onboarding)
    await expect(async () => {
      const url = page.url();
      // Should be on dashboard, not landing or auth pages
      expect(url).toMatch(/\/[^/]+\/dashboard/);
    }).toPass();

    // Verify dashboard elements are visible
    await expect(page.getByTestId(TEST_IDS.DASHBOARD.FEED_HEADING)).toBeVisible();
    console.log("[Test] Successfully signed in and landed on dashboard");
  });

  test("password reset flow sends code and allows reset", async ({ authPage, page }) => {
    // Create a fresh user for password reset test
    const testEmail = getTestEmailAddress("reset-test");
    const originalPassword = "OriginalPassword123!";
    const newPassword = "NewPassword456!";

    // First, sign up to create the user
    await authPage.gotoSignUp();
    await authPage.signUp(testEmail, originalPassword);

    // Wait for verification form and complete verification
    await authPage.expectVerificationForm();
    const signupOtp = await waitForMockOTP(testEmail);
    await authPage.verifyEmail(signupOtp);

    // Wait for navigation away from verification
    await page.waitForLoadState("domcontentloaded");
    console.log("[Test] User created and verified");

    // Clear session to test password reset as unauthenticated user
    // (forgot-password page has AuthRedirect which would redirect authenticated users)
    await page.context().clearCookies();

    // Navigate to forgot password page
    await authPage.gotoForgotPassword();
    await authPage.expectForgotPasswordForm();

    // Request password reset
    await authPage.requestPasswordReset(testEmail);

    // Wait for reset code form to appear
    await authPage.expectResetCodeForm();
    console.log("[Test] Reset code form appeared");

    // Get the reset code from backend
    const resetCode = await waitForMockOTP(testEmail);
    console.log(`[Test] Got reset code: ${resetCode}`);

    // Complete password reset
    await authPage.completePasswordReset(resetCode, newPassword);

    // Wait for success indication (toast or redirect to sign in)
    const successToast = page.locator("[data-sonner-toast]").filter({ hasText: /reset|success/i });
    const signInForm = authPage.signInHeading;

    await expect(successToast.or(signInForm)).toBeVisible();
    console.log("[Test] Password reset completed");

    // Verify can sign in with new password
    await authPage.gotoSignIn();
    await authPage.signIn(testEmail, newPassword);

    // Should navigate to dashboard or onboarding
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page
        .getByRole("heading", { name: /welcome to nixelo/i })
        .or(page.locator('[data-sidebar="sidebar"]')),
    ).toBeVisible();
    console.log("[Test] Successfully signed in with new password");
  });
});
