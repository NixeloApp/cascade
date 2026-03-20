/**
 * Auth UI Helpers
 *
 * Shared browser interaction helpers for authentication flows.
 * Used by both global-setup.ts and auth.fixture.ts to avoid duplication.
 */

import { expect, type Locator, type Page } from "@playwright/test";
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
import {
  getLocatorCount,
  getLocatorText,
  getOptionalLocatorText,
  isLocatorVisible,
} from "./locator-state";
import { waitForMockOTP } from "./otp-helpers";
import { ROUTES } from "./routes";
import { testUserService } from "./test-user-service";
import {
  getConvexConnectionInfo,
  waitForConvexConnectionReady,
  waitForDashboardReady,
  waitForFormReady,
} from "./wait-helpers";

async function waitForLocatorVisible(locator: Locator, timeout: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return isLocatorVisible(locator);
  }
}

async function captureDebugScreenshot(
  page: Page,
  path: string,
  contextLabel: string,
): Promise<void> {
  try {
    await page.screenshot({ path });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ⚠️ Failed to capture ${contextLabel} debug screenshot: ${message}`);
  }
}

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
    if (!(await waitForEmailVerificationSubmitStart(page))) {
      await expect(locators.verifyEmailButton).toBeVisible();
      await expect(locators.verifyEmailButton).toBeEnabled();
      await locators.verifyEmailButton.click();

      if (!(await waitForEmailVerificationSubmitStart(page, 8000))) {
        console.error(`  ❌ Email verification submit did not start for ${email}`);
        return false;
      }
    }

    const outcome = await waitForEmailVerificationOutcome(page);
    if (outcome === "error") {
      const errorText = await getLocatorText(toastLocators(page).error.first());
      console.error(`  ❌ Email verification reached error state for ${email}: ${errorText}`);
      return false;
    }

    if (!outcome) {
      console.error(`  ❌ Email verification timed out for ${email} at ${page.url()}`);
      return false;
    }

    console.log(`  ✓ Email verification reached ${outcome} state`);
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

type PostAuthDestinationState = "dashboard" | "onboarding" | "pending";

async function getPostAuthDestinationState(page: Page): Promise<PostAuthDestinationState> {
  const dashboard = dashboardLocators(page);
  if (urlPatterns.dashboard.test(page.url()) || (await isLocatorVisible(dashboard.myWorkHeading))) {
    return "dashboard";
  }

  const onboarding = onboardingLocators(page);
  if (
    urlPatterns.onboarding.test(page.url()) ||
    (await isLocatorVisible(onboarding.welcomeHeading))
  ) {
    return "onboarding";
  }

  return "pending";
}

async function waitForPostAuthDestination(
  page: Page,
  timeout = 15000,
): Promise<Exclude<PostAuthDestinationState, "pending"> | null> {
  try {
    await expect
      .poll(() => getPostAuthDestinationState(page), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");

    const state = await getPostAuthDestinationState(page);
    return state === "pending" ? null : state;
  } catch {
    return null;
  }
}

async function getEmailVerificationSubmitState(
  page: Page,
): Promise<"submitting" | "redirect" | "success" | "error" | "pending"> {
  const locators = authFormLocators(page);

  if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
    return "redirect";
  }

  if (await isLocatorVisible(toastLocators(page).success.first())) {
    return "success";
  }

  if (await isLocatorVisible(toastLocators(page).error.first())) {
    return "error";
  }

  const buttonText = (await getLocatorText(locators.verifyEmailButton)).trim().toLowerCase();
  if (/verifying/.test(buttonText)) {
    return "submitting";
  }

  return "pending";
}

async function waitForEmailVerificationSubmitStart(page: Page, timeout = 5000): Promise<boolean> {
  try {
    await expect
      .poll(() => getEmailVerificationSubmitState(page), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");
    return true;
  } catch {
    return false;
  }
}

async function waitForEmailVerificationOutcome(
  page: Page,
  timeout = 15000,
): Promise<"redirect" | "success" | "error" | null> {
  try {
    await expect
      .poll(
        async () => {
          const state = await getEmailVerificationSubmitState(page);
          return state === "submitting" ? "pending" : state;
        },
        {
          timeout,
          intervals: [200, 500, 1000],
        },
      )
      .not.toBe("pending");

    const result = await getEmailVerificationSubmitState(page);
    if (result === "redirect" || result === "success" || result === "error") {
      return result;
    }
    return null;
  } catch {
    return null;
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
  return (
    urlPatterns.dashboard.test(url) || url.endsWith(ROUTES.dashboard.path.replace("/$orgSlug", ""))
  );
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
  if (await isLocatorVisible(locators.welcomeHeading)) {
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
  if (await isLocatorVisible(locators.signInHeading)) {
    return "signin";
  }
  if (await isLocatorVisible(locators.signUpHeading)) {
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
  if (!(await isLocatorVisible(form))) {
    return "pending";
  }

  const locators = authFormLocators(page);
  const hydrated = (await getLocatorCount(locators.formHydrated)) > 0;
  if (!hydrated) {
    return "pending";
  }

  const expanded = (await getLocatorCount(locators.emailForm)) > 0;
  const emailVisible = await isLocatorVisible(locators.emailInput);

  // For landing state, check the "Continue with email" button
  if (!expanded) {
    const continueButtonVisible = await isLocatorVisible(locators.continueWithEmailButton);
    if (continueButtonVisible) {
      return route === "signin" ? "signin-landing" : "signup-landing";
    }
  }

  // For expanded state, check the submit button text
  const submitButtonText = (await getLocatorText(locators.submitButton)).trim().toLowerCase();

  if (route === "signin") {
    if (
      expanded &&
      /sign in|signing in/.test(submitButtonText) &&
      emailVisible &&
      (await isLocatorVisible(locators.forgotPasswordLink))
    ) {
      return "signin-expanded";
    }

    return "pending";
  }

  if (expanded && /create account|creating account/.test(submitButtonText) && emailVisible) {
    return "signup-expanded";
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

  if (!(await waitForLocatorVisible(locators.continueWithEmailButton, 1500))) {
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
    await captureDebugScreenshot(page, "e2e/.auth/signin-timeout-debug.png", "sign-in timeout");
    const bodyText = await getLocatorText(page.locator("body"));
    const headingVisible = await isLocatorVisible(locators.signInHeading);
    const formVisible = await isLocatorVisible(page.getByTestId(TEST_IDS.AUTH.FORM));
    const surfaceState = await getSharedAuthFormState(page);
    throw new Error(
      [
        `Sign-in surface did not load within ${timeout}ms`,
        `URL: ${page.url()}`,
        `surfaceState: ${surfaceState}`,
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

  const waitForSignInRoute = async (waitTimeout: number): Promise<boolean> => {
    try {
      await page.waitForURL((url) => new URL(url.toString()).pathname === ROUTES.signin.path, {
        timeout: waitTimeout,
      });
      return true;
    } catch {
      return false;
    }
  };

  const signInLink = page.getByRole("link", { name: /^sign in$/i }).first();
  if (await isLocatorVisible(signInLink)) {
    console.log("  ↩️ Recovering sign-in route from public shell...");
    await signInLink.click();
    if (await waitForSignInRoute(timeout)) {
      return;
    }
  }

  if (isOnSignInRoute()) {
    return;
  }

  await page.goto(`${baseURL}${ROUTES.signin.path}`, { waitUntil: "domcontentloaded" });
  await waitForSignInRoute(timeout);
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

          const submitText = await getLocatorText(locators.signInButton);
          if (submitText.toLowerCase().includes("signing in")) {
            return "submitting";
          }

          if (await isLocatorVisible(toastLocators(page).error.first())) {
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

type OnboardingSkipControlState = "button" | "link" | "text" | "pending";

async function getOnboardingSkipControlState(page: Page): Promise<OnboardingSkipControlState> {
  const locators = onboardingLocators(page);
  if (await isLocatorVisible(locators.skipButton)) {
    return "button";
  }

  if (await isLocatorVisible(locators.skipLink)) {
    return "link";
  }

  if (await isLocatorVisible(locators.skipText)) {
    return "text";
  }

  return "pending";
}

async function findVisibleOnboardingSkipControl(page: Page, timeout = 15000) {
  const locators = onboardingLocators(page);

  try {
    await expect
      .poll(() => getOnboardingSkipControlState(page), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");
  } catch {
    return null;
  }

  const state = await getOnboardingSkipControlState(page);
  switch (state) {
    case "button":
      return locators.skipButton;
    case "link":
      return locators.skipLink;
    case "text":
      return locators.skipText;
    default:
      return null;
  }
}

async function clickOnboardingSkipControlOnce(page: Page, timeout = 15000): Promise<boolean> {
  const skipControl = await findVisibleOnboardingSkipControl(page, timeout);
  if (!skipControl) {
    return false;
  }

  try {
    await expect(skipControl).toBeVisible();
    await skipControl.click();
    return true;
  } catch {
    return false;
  }
}

async function skipOnboardingToDashboard(page: Page): Promise<boolean> {
  const skipControl = await findVisibleOnboardingSkipControl(page);
  if (!skipControl) {
    console.log("⚠️ Onboarding skip control did not become visible");
    return false;
  }

  const controlLabel = (await getOptionalLocatorText(skipControl))?.trim() || "skip control";
  console.log(`✓ Onboarding skip control ready: ${controlLabel}`);
  await skipControl.click();
  if (await waitForDashboardShell(page, 5000)) {
    console.log("✓ Successfully skipped to dashboard");
    return true;
  }

  if (!(await clickOnboardingSkipControlOnce(page, 5000))) {
    console.log("⚠️ Skip control could not be clicked again after the first attempt");
    return false;
  }

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
  const destination = await waitForPostAuthDestination(page, 15000);
  if (destination === "dashboard") {
    await waitForDashboardReady(page);
    console.log("✓ Already on dashboard");
    return true;
  }

  if (destination === "onboarding") {
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
    const convexUrl = process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      console.log("  ⚠️ VITE_CONVEX_URL not set, token injection may fail");
    }

    await page.evaluate(
      ({ token: jwt, refreshToken: refresh, convexUrl: url }) => {
        // Clear any stale auth tokens first (important after sign-out)
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("convexAuth") || key.includes("__convexAuth"))) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          localStorage.removeItem(key);
        }

        // Legacy keys (for ConvexReactClient direct usage)
        localStorage.setItem("convexAuthToken", jwt);
        if (refresh) {
          localStorage.setItem("convexAuthRefreshToken", refresh);
        }

        // @convex-dev/auth keys (namespaced by convex URL)
        if (url) {
          const namespace = url.replace(/[^a-zA-Z0-9]/g, "");
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
        convexUrl: convexUrl,
      },
    );
  };

  const tryNavigateToAppGateway = async (): Promise<boolean> => {
    await page.goto(`${baseURL}${ROUTES.app.build()}`, { waitUntil: "load" });

    const destination = await waitForPostAuthDestination(page, 15000);
    if (destination === "dashboard") {
      await waitForDashboardReady(page);
      console.log("  ✓ Automatically redirected to dashboard");
      return true;
    }

    if (destination === "onboarding" && !autoCompleteOnboarding) {
      console.log("  ✓ Automatically redirected to onboarding (as expected)");
      return true;
    }

    if (destination === "onboarding") {
      return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
    }

    console.log(
      `  ℹ️ Gateway navigation ended at: ${page.url()} (destination: ${destination ?? "null"})`,
    );
    return false;
  };

  const resolvePostSignInRedirect = async (): Promise<boolean> => {
    try {
      const destination = await waitForPostAuthDestination(page, 15000);
      if (!destination) {
        throw new Error("Post-auth destination did not settle");
      }

      console.log("  ✓ Redirected to:", page.url());
      return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
    } catch {
      const errorText = await getOptionalLocatorText(
        page.locator('[role="alert"], .text-red-500, .error'),
      );
      const toastError = await getOptionalLocatorText(toastLocators(page).error);
      const pageText = await getLocatorText(page.locator("body"));
      const buttonText = await getLocatorText(page.locator('button[type="submit"]'));

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

      // On landing page after sign-in, auth state may not be reflected yet.
      // Reload the page to force Convex client to re-initialize with fresh auth state.
      if (page.url().endsWith("/") || page.url().includes("localhost:5555/$")) {
        console.log("  ↻ Reloading page to refresh auth state...");
        await page.reload({ waitUntil: "domcontentloaded" });

        // Check for "Go to App" link which indicates authenticated state
        const goToAppLink = page.getByRole("link", { name: /go to app/i });
        try {
          await goToAppLink.waitFor({ state: "visible", timeout: 10000 });
          console.log("  ✓ User is authenticated (Go to App visible). Clicking to enter app...");
          await goToAppLink.click();
          const destination = await waitForPostAuthDestination(page, 15000);
          if (destination) {
            return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
          }
        } catch {
          console.log("  ℹ️ Go to App link not visible after reload");
        }
      }

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
        console.log("  ⚠️ API login gateway navigation returned false. Checking current state...");
      } catch (e) {
        console.log(`  ⚠️ API login injection failed to redirect: ${String(e).slice(0, 100)}`);
      }

      // After token injection, check if we're already on an authenticated page
      // This can happen when token injection succeeded but gateway navigation timing failed
      const currentDestination = await getPostAuthDestinationState(page);
      if (currentDestination === "dashboard") {
        console.log("  ✓ Already on dashboard after token injection");
        await waitForDashboardReady(page);
        return true;
      }
      if (currentDestination === "onboarding") {
        console.log("  ✓ Already on onboarding after token injection");
        return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
      }
    } else {
      console.log(`  ⚠️ API login failed: ${loginResult.error}. Falling back to UI login.`);
    }

    // --- UI LOGIN FALLBACK ---

    // Double-check we're not already authenticated before attempting UI login
    if (await isOnDashboard(page)) {
      console.log("  ✓ Already authenticated - on dashboard");
      await waitForDashboardReady(page);
      return true;
    }

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

  if (await isLocatorVisible(locators.verifyEmailHeading)) {
    return "verification";
  }

  if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
    return "redirect";
  }

  if (await isLocatorVisible(toastLocators(page).error.first())) {
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

    if ((await getPostAuthDestinationState(page)) !== "pending") {
      return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
    }

    const locators = authFormLocators(page);
    if (!(await waitForLocatorVisible(locators.signUpHeading, 1500))) {
      return (await getPostAuthDestinationState(page)) === "dashboard";
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
      const errorText = await getLocatorText(toastLocators(page).error.first());
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
