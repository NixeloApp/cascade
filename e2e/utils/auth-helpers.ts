/**
 * Auth UI Helpers
 *
 * Shared browser interaction helpers for authentication flows.
 * Used by both global-setup.ts and auth.fixture.ts to avoid duplication.
 */

import { expect, type Page } from "@playwright/test";
import type { ConvexReactClient } from "convex/react";
import type { TestUser } from "../config";
import {
  authFormLocators,
  dashboardLocators,
  onboardingLocators,
  TEST_IDS,
  toastLocators,
  urlPatterns,
} from "../locators";
import { waitForMockOTP } from "./otp-helpers";
import { ROUTES } from "./routes";
import { testUserService } from "./test-user-service";
import {
  getConvexConnectionInfo,
  waitForConvexConnectionReady,
  waitForDashboardReady,
  waitForFormReady,
} from "./wait-helpers";

/**
 * Complete email verification with OTP from Mock Backend
 */
export async function completeEmailVerification(page: Page, email: string): Promise<boolean> {
  console.log(`  📬 Waiting for verification email for ${email}...`);
  try {
    const otp = await waitForMockOTP(email, {
      pollInterval: 500,
    });
    console.log(`  ✓ Retrieved OTP: ${otp}`);

    const locators = authFormLocators(page);
    await locators.verifyCodeInput.waitFor({ state: "visible" });
    await locators.verifyCodeInput.fill(otp);

    await locators.verifyEmailButton.click();
    // Wait for redirect to onboarding or organization dashboard
    await page.waitForURL(urlPatterns.dashboardOrOnboarding);
    return true;
  } catch (verifyError) {
    console.error(`  ❌ Email verification failed for ${email}:`, verifyError);
    return false;
  }
}

async function waitForDashboardShell(page: Page, timeout = 15000): Promise<boolean> {
  try {
    await page.waitForURL(urlPatterns.dashboard, { timeout });
    await waitForDashboardReady(page);
    return true;
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    __convex_test_client?: ConvexReactClient;
  }
}

/**
 * Check if we're on the dashboard
 * Handles both old (/dashboard) and new (/:orgSlug/dashboard) URL patterns
 *
 * This only checks URL pattern. For content verification, use waitForDashboardContent().
 */
export async function isOnDashboard(page: Page): Promise<boolean> {
  const url = page.url();
  return urlPatterns.dashboard.test(url) || url.endsWith("/dashboard");
}

/**
 * Wait for dashboard content to be fully loaded (My Work heading visible)
 * Call this after confirming URL is dashboard to ensure content rendered.
 *
 * @returns true if content loaded, false if timed out
 */
export async function waitForDashboardContent(page: Page, timeout = 15000): Promise<boolean> {
  const locators = dashboardLocators(page);

  try {
    await locators.myWorkHeading.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're on the onboarding page
 */
export async function isOnOnboarding(page: Page): Promise<boolean> {
  if (urlPatterns.onboarding.test(page.url())) {
    return true;
  }
  const locators = onboardingLocators(page);
  if (await locators.welcomeHeading.isVisible().catch(() => false)) {
    return true;
  }
  return false;
}

type SharedAuthRoute = "signin" | "signup";
type SharedAuthFormState =
  | "signin-landing"
  | "signin-expanded"
  | "signup-landing"
  | "signup-expanded"
  | "pending";

async function getCurrentAuthRoute(page: Page): Promise<SharedAuthRoute | null> {
  try {
    const pathname = new URL(page.url()).pathname;
    if (pathname === ROUTES.signin.path) {
      return "signin";
    }
    if (pathname === ROUTES.signup.path) {
      return "signup";
    }
  } catch {}

  const locators = authFormLocators(page);
  if (await locators.signInHeading.isVisible().catch(() => false)) {
    return "signin";
  }
  if (await locators.signUpHeading.isVisible().catch(() => false)) {
    return "signup";
  }

  return null;
}

async function getSharedAuthFormState(page: Page): Promise<SharedAuthFormState> {
  const route = await getCurrentAuthRoute(page);
  if (!route) {
    return "pending";
  }

  const form = page.getByTestId(TEST_IDS.AUTH.FORM);
  if (!(await form.isVisible().catch(() => false))) {
    return "pending";
  }

  const locators = authFormLocators(page);
  const buttonText = (await locators.submitButton.textContent().catch(() => ""))?.trim().toLowerCase() ?? "";
  const expanded = await form.getAttribute("data-expanded").catch(() => null);
  const emailVisible = await locators.emailInput.isVisible().catch(() => false);

  if (route === "signin") {
    if (
      expanded === "true" &&
      /sign in|signing in/.test(buttonText) &&
      emailVisible &&
      (await locators.forgotPasswordLink.isVisible().catch(() => false))
    ) {
      return "signin-expanded";
    }

    if (expanded === "false" && /continue with email/.test(buttonText)) {
      return "signin-landing";
    }

    return "pending";
  }

  if (expanded === "true" && /create account|creating account/.test(buttonText) && emailVisible) {
    return "signup-expanded";
  }

  if (expanded === "false" && /continue with email/.test(buttonText)) {
    return "signup-landing";
  }

  return "pending";
}

async function waitForSharedAuthFormState(
  page: Page,
  expectedState: Exclude<SharedAuthFormState, "pending">,
  timeout: number,
): Promise<boolean> {
  try {
    await expect
      .poll(() => getSharedAuthFormState(page), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .toBe(expectedState);
    return true;
  } catch {
    return false;
  }
}

/**
 * Click the "Continue with email" button and wait for form to expand
 * Waits specifically for the button text to change to "Sign in" or "Create account"
 */
export async function clickContinueWithEmail(page: Page): Promise<boolean> {
  const locators = authFormLocators(page);
  const route = await getCurrentAuthRoute(page);

  if (!route) {
    console.log("❌ Could not determine auth route before expanding email form");
    return false;
  }

  const expandedState = route === "signin" ? "signin-expanded" : "signup-expanded";

  // Check if form is already expanded by looking for the submit button
  if (await waitForSharedAuthFormState(page, expandedState, 1200)) {
    await waitForFormReady(page);
    console.log("✓ Form already expanded");
    return true;
  }

  // Check if continue button exists and is ready
  try {
    await locators.continueWithEmailButton.waitFor({ state: "visible" });
    await expect(locators.continueWithEmailButton).toBeEnabled();
  } catch {
    console.log("❌ Continue button not found");
    return false;
  }

  // Click the button
  await locators.continueWithEmailButton.click();

  if (await waitForSharedAuthFormState(page, expandedState, 2500)) {
    await waitForFormReady(page);
    console.log("✓ Form expanded successfully");
    return true;
  }

  await locators.continueWithEmailButton.waitFor({ state: "visible" }).catch(() => {});
  if (!(await locators.continueWithEmailButton.isVisible().catch(() => false))) {
    console.log("❌ Form did not expand and continue button disappeared");
    return false;
  }

  await expect(locators.continueWithEmailButton).toBeEnabled();
  await locators.continueWithEmailButton.click();

  if (await waitForSharedAuthFormState(page, expandedState, 4000)) {
    await waitForFormReady(page);
    console.log("✓ Form expanded successfully after second attempt");
    return true;
  }

  console.log("❌ Form did not expand after bounded retries");
  return false;
}

async function waitForSignInSurface(page: Page, timeout = 30000): Promise<void> {
  const locators = authFormLocators(page);

  try {
    await expect
      .poll(() => getSharedAuthFormState(page), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .toMatch(/signin-(landing|expanded)/);
    console.log("  ✓ Sign-in page loaded");
    return;
  } catch (error) {
    await page.screenshot({ path: "e2e/.auth/signin-timeout-debug.png" }).catch(() => {});
    const bodyText =
      (await page
        .locator("body")
        .textContent()
        .catch(() => "")) || "";
    const headingVisible = await locators.signInHeading.isVisible().catch(() => false);
    const formVisible = await page
      .getByTestId(TEST_IDS.AUTH.FORM)
      .isVisible()
      .catch(() => false);
    throw new Error(
      [
        `Sign-in surface did not load within ${timeout}ms`,
        `URL: ${page.url()}`,
        `surfaceState: ${await getSharedAuthFormState(page).catch(() => "pending")}`,
        `headingVisible: ${headingVisible}`,
        `formVisible: ${formVisible}`,
        `body: ${bodyText.slice(0, 200)}`,
        `cause: ${String(error).slice(0, 200)}`,
      ].join(" | "),
    );
  }
}

async function ensureSignInPage(page: Page, baseURL: string, timeout = 15000): Promise<void> {
  const isOnSignInRoute = () => {
    try {
      return new URL(page.url()).pathname === ROUTES.signin.path;
    } catch {
      return false;
    }
  };

  if (isOnSignInRoute()) {
    return;
  }

  const signInLink = page.getByRole("link", { name: /^sign in$/i }).first();
  if (await signInLink.isVisible().catch(() => false)) {
    console.log("  ↩️ Recovering sign-in route from public shell...");
    await Promise.allSettled([
      page.waitForURL((url) => new URL(url.toString()).pathname === ROUTES.signin.path, {
        timeout,
      }),
      signInLink.click(),
    ]);
  }

  if (isOnSignInRoute()) {
    return;
  }

  await page.goto(`${baseURL}${ROUTES.signin.path}`, { waitUntil: "domcontentloaded" });
}

async function waitForUiSignInSubmitStart(page: Page, timeout = 5000): Promise<boolean> {
  const locators = authFormLocators(page);

  try {
    await expect
      .poll(
        async () => {
          if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
            return "redirect";
          }

          const submitText = (await locators.signInButton.textContent().catch(() => "")) ?? "";
          if (submitText.toLowerCase().includes("signing in")) {
            return "submitting";
          }

          if (await toastLocators(page).error.first().isVisible().catch(() => false)) {
            return "error";
          }

          return "pending";
        },
        {
          timeout,
          intervals: [200, 500, 1000],
        },
      )
      .not.toBe("pending");
    return true;
  } catch {
    return false;
  }
}

async function waitForConvexWebSocketReady(page: Page, timeout = 30000): Promise<boolean> {
  try {
    if (!(await waitForConvexConnectionReady(page, { timeout }))) {
      throw new Error("Convex WebSocket did not connect in time");
    }
    console.log("  ✓ Convex WebSocket connected");
    return true;
  } catch {
    const connectionInfo = await getConvexConnectionInfo(page);
    console.log(`  ⚠️ Convex WebSocket connection timed out: ${JSON.stringify(connectionInfo)}`);
    return false;
  }
}

async function findVisibleOnboardingSkipControl(page: Page, timeout = 15000) {
  const locators = onboardingLocators(page);
  const skipControls = [locators.skipButton, locators.skipLink, locators.skipText];

  await expect
    .poll(
      async () => {
        for (const control of skipControls) {
          if (await control.isVisible().catch(() => false)) {
            return true;
          }
        }

        return false;
      },
      {
        timeout,
        intervals: [200, 500, 1000],
      },
    )
    .toBe(true)
    .catch(() => {});

  for (const control of skipControls) {
    if (await control.isVisible().catch(() => false)) {
      return control;
    }
  }

  return null;
}

async function skipOnboardingToDashboard(page: Page): Promise<boolean> {
  const skipControl = await findVisibleOnboardingSkipControl(page);
  if (!skipControl) {
    console.log("⚠️ Onboarding skip control did not become visible");
    return false;
  }

  const controlLabel =
    (await skipControl.textContent().catch(() => null))?.trim() || "skip control";
  console.log(`✓ Onboarding skip control ready: ${controlLabel}`);
  await skipControl.click();
  if (await waitForDashboardShell(page, 5000)) {
    console.log("✓ Successfully skipped to dashboard");
    return true;
  }

  await skipControl.click().catch(() => {});
  if (await waitForDashboardShell(page, 15000)) {
    console.log("✓ Successfully skipped to dashboard");
    return true;
  }

  console.log("⚠️ Skip control clicked but dashboard shell did not settle");
  return false;
}

/**
 * Handle being on onboarding or dashboard after authentication
 */
export async function handleOnboardingOrDashboard(
  page: Page,
  autoCompleteOnboarding = true,
): Promise<boolean> {
  // Allow auth redirects to settle to either dashboard or onboarding route.
  await page.waitForURL(urlPatterns.dashboardOrOnboarding, { timeout: 15000 }).catch(() => {});

  if (await isOnDashboard(page)) {
    await waitForDashboardReady(page);
    console.log("✓ Already on dashboard");
    return true;
  }

  if (await isOnOnboarding(page)) {
    if (!autoCompleteOnboarding) {
      console.log("📋 On onboarding - staying here as requested");
      return true;
    }
    console.log("📋 On onboarding - completing...");
    if (await skipOnboardingToDashboard(page)) {
      return true;
    }
    console.log("⚠️ Could not skip onboarding");
  }

  return false;
}

/**
 * Try to sign in with specific user credentials
 */
export async function trySignInUser(
  page: Page,
  baseURL: string,
  user: TestUser,
  autoCompleteOnboarding = true,
): Promise<boolean> {
  const injectAuthTokens = async (token: string, refreshToken?: string): Promise<void> => {
    await page.evaluate(
      ({ token: jwt, refreshToken: refresh, convexUrl }) => {
        // Legacy keys (for ConvexReactClient direct usage)
        localStorage.setItem("convexAuthToken", jwt);
        if (refresh) {
          localStorage.setItem("convexAuthRefreshToken", refresh);
        }

        // @convex-dev/auth keys (namespaced by convex URL)
        if (convexUrl) {
          const namespace = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
          const jwtKey = `__convexAuthJWT_${namespace}`;
          const refreshKey = `__convexAuthRefreshToken_${namespace}`;

          localStorage.setItem(jwtKey, jwt);
          if (refresh) {
            localStorage.setItem(refreshKey, refresh);
          }
        }
      },
      {
        token,
        refreshToken,
        convexUrl: process.env.VITE_CONVEX_URL,
      },
    );
  };

  const tryNavigateToAppGateway = async (): Promise<boolean> => {
    await page.goto(`${baseURL}${ROUTES.app.build()}`, { waitUntil: "load" });

    // Wait to confirm we are logged in - app gateway will redirect to /:orgSlug/dashboard or /onboarding
    await page.waitForURL(urlPatterns.dashboardOrOnboarding, { timeout: 15000 });

    if (await waitForDashboardShell(page, 5000)) {
      console.log("  ✓ Automatically redirected to dashboard");
      return true;
    }
    // For users with incomplete onboarding, landing on /onboarding is success
    if (!autoCompleteOnboarding && urlPatterns.onboarding.test(page.url())) {
      console.log("  ✓ Automatically redirected to onboarding (as expected)");
      return true;
    }
    return false;
  };

  const resolvePostSignInRedirect = async (): Promise<boolean> => {
    try {
      await page.waitForURL(urlPatterns.dashboardOrOnboarding, { timeout: 15000 });
      console.log("  ✓ Redirected to:", page.url());
      return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
    } catch {
      const errorText = await page
        .locator('[role="alert"], .text-red-500, .error')
        .textContent()
        .catch(() => null);
      const toastError = await toastLocators(page)
        .error.textContent()
        .catch(() => null);
      const pageText =
        (await page
          .locator("body")
          .textContent()
          .catch(() => "")) || "";
      const buttonText =
        (await page
          .locator('button[type="submit"]')
          .textContent()
          .catch(() => "")) || "";

      console.log(`  📍 Current URL: ${page.url()}`);
      console.log(`  🔘 Submit button text: "${buttonText}"`);

      if (errorText) {
        console.log("  ❌ Page error:", errorText.slice(0, 200));
        return false;
      }

      if (toastError) {
        console.log("  ❌ Toast error:", toastError.slice(0, 200));
        return false;
      }

      console.log("  ⚠️ Redirect timeout after 15s");
      console.log("  📄 Page content:", pageText.slice(0, 300));

      const stuckOutsideAppShell =
        /\/signin(?:[/?#]|$)/.test(page.url()) || page.url().endsWith("/");
      if (!stuckOutsideAppShell) {
        return false;
      }

      console.log("  🔁 Attempting app-gateway recovery after redirect timeout...");
      try {
        if (await tryNavigateToAppGateway()) {
          return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
        }
      } catch {
        // Continue to fail below if recovery didn't resolve authentication.
      }

      return false;
    }
  };

  try {
    console.log(`  🔐 Attempting sign-in for ${user.email}...`);
    await page.goto(`${baseURL}/signin`, { waitUntil: "load" });

    // Check if already authenticated (redirected to dashboard)
    if (await isOnDashboard(page)) {
      console.log("  ✓ Already on dashboard");
      return true;
    }

    console.log("  📋 Waiting for sign-in page...");
    // The "Welcome back" heading only appears after Convex determines auth state
    // (inside <Unauthenticated> wrapper). Use longer timeout for cold starts.
    // FALLBACK: Also wait for form as backup (more reliable).

    // --- API FAST LOGIN ---
    console.log("  ⚡ Attempting API login...");
    const loginResult = await testUserService.loginTestUserWithRepair(
      user.email,
      user.password,
      autoCompleteOnboarding,
    );

    if (loginResult.repairAttempted) {
      console.log(
        loginResult.repairedAccount
          ? "  ✓ API login repaired stale seeded account state."
          : "  ⚠️ API login attempted seeded-account repair but the follow-up login still failed.",
      );
    }

    if (loginResult.success && loginResult.token) {
      console.log("  ✓ API login successful. Injecting tokens...");
      await injectAuthTokens(loginResult.token, loginResult.refreshToken);

      try {
        if (await tryNavigateToAppGateway()) {
          return true;
        }
      } catch {
        console.log("  ⚠️ API login injection failed to redirect. Falling back to UI login.");
      }
    } else {
      console.log(`  ⚠️ API login failed: ${loginResult.error}. Falling back to UI login.`);
    }

    // --- UI LOGIN FALLBACK ---

    await ensureSignInPage(page, baseURL);
    await waitForSignInSurface(page);

    // Wait for Convex WebSocket to be fully connected before attempting auth
    // On cold starts, the WebSocket needs time to establish connection
    // We exposed window.__convex_test_client in __root.tsx for this purpose
    await waitForConvexWebSocketReady(page);

    const locators = authFormLocators(page);
    if (!(await clickContinueWithEmail(page))) {
      console.log("  ❌ UI login fallback could not expand the email form.");
      return false;
    }

    await waitForFormReady(page);
    await locators.emailInput.fill(user.email);
    await locators.passwordInput.fill(user.password);
    await expect(locators.emailInput).toHaveValue(user.email);
    await expect(locators.passwordInput).toHaveValue(user.password);

    await locators.signInButton.click();
    if (!(await waitForUiSignInSubmitStart(page))) {
      console.log("  ❌ UI login fallback did not reach a submit-start state.");
      return false;
    }

    console.log("  🚀 Form submitted via shared page-level auth contract.");
    return await resolvePostSignInRedirect();
  } catch (error) {
    console.log("  ❌ Sign-in error:", String(error).slice(0, 200));
    return false;
  }
}

async function getSignUpResultState(
  page: Page,
): Promise<"verification" | "redirect" | "error" | "pending"> {
  const locators = authFormLocators(page);

  if (await locators.verifyEmailHeading.isVisible().catch(() => false)) {
    return "verification";
  }

  if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
    return "redirect";
  }

  if (await toastLocators(page).error.first().isVisible().catch(() => false)) {
    return "error";
  }

  return "pending";
}

/**
 * Wait for either verification screen or redirect after signup
 */
export async function waitForSignUpResult(
  page: Page,
): Promise<"verification" | "redirect" | "error" | null> {
  try {
    await expect
      .poll(() => getSignUpResultState(page), {
        timeout: 15000,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");

    const result = await getSignUpResultState(page);
    return result === "pending" ? null : result;
  } catch {
    return null;
  }
}

/**
 * Sign up a user via UI (for testing actual sign-up flow)
 * Uses Mailtrap for email verification
 */
export async function signUpUserViaUI(
  page: Page,
  baseURL: string,
  user: TestUser,
  autoCompleteOnboarding = true,
): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/signup`);

    // Check for onboarding or dashboard patterns (both old and new URL structures)
    if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
      return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
    }

    const locators = authFormLocators(page);
    await locators.signUpHeading.waitFor({ state: "visible" }).catch(() => {});

    if (!(await locators.signUpHeading.isVisible().catch(() => false))) {
      return await isOnDashboard(page);
    }

    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) return false;

    await locators.emailInput.fill(user.email);
    await locators.passwordInput.fill(user.password);
    await waitForFormReady(page);

    await locators.signUpButton.waitFor({ state: "visible" });
    console.log(`  📤 Submitting sign-up form for ${user.email}...`);
    await locators.signUpButton.click();

    const signUpResult = await waitForSignUpResult(page);
    console.log(`  📋 Sign-up result: ${signUpResult || "timeout"}`);

    if (signUpResult === "verification") {
      const emailVerified = await completeEmailVerification(page, user.email);
      if (!emailVerified) return false;
    } else if (signUpResult === "error") {
      const errorText = await toastLocators(page).error.first().textContent().catch(() => "");
      console.log(`  ❌ Sign-up reached error state: ${errorText || "unknown error toast"}`);
      return false;
    } else if (signUpResult === null) {
      console.log(`  📍 Current URL after timeout: ${page.url()}`);
      return false;
    }

    return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
  } catch (error) {
    console.error(`  ❌ Sign-up error for ${user.email}:`, error);
    return false;
  }
}
