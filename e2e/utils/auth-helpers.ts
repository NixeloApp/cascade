/**
 * Auth UI Helpers
 *
 * Shared browser interaction helpers for authentication flows.
 * Used by both global-setup.ts and auth.fixture.ts to avoid duplication.
 */

import type { Page } from "@playwright/test";
import type { ConvexReactClient } from "convex/react";
import type { TestUser } from "../config";
import {
  authFormLocators,
  dashboardLocators,
  onboardingLocators,
  toastLocators,
  urlPatterns,
} from "../locators";
import { waitForMockOTP } from "./otp-helpers";
import { ROUTES } from "./routes";
import { testUserService } from "./test-user-service";
import { waitForFormReady } from "./wait-helpers";

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

/**
 * Click the "Continue with email" button and wait for form to expand
 * Waits specifically for the button text to change to "Sign in" or "Create account"
 */
export async function clickContinueWithEmail(page: Page): Promise<boolean> {
  const locators = authFormLocators(page);

  // Check if form is already expanded by looking for the submit button
  const signInVisible = await locators.signInButton.isVisible().catch(() => false);
  const createAccountVisible = await locators.signUpButton.isVisible().catch(() => false);

  if (signInVisible || createAccountVisible) {
    console.log("✓ Form already expanded (submit button visible)");
    return true;
  }

  // Check if continue button exists and is ready
  try {
    await locators.continueWithEmailButton.waitFor({ state: "visible" });
  } catch {
    console.log("❌ Continue button not found");
    return false;
  }

  // Click the button
  await locators.continueWithEmailButton.click();

  // Wait for form to expand
  try {
    await Promise.race([
      locators.signInButton.waitFor({ state: "visible" }),
      locators.signUpButton.waitFor({ state: "visible" }),
    ]);
    // Wait for form to be ready (SignInForm/SignUpForm have 350ms delay before formReady=true)
    await waitForFormReady(page);
    console.log("✓ Form expanded successfully");
    return true;
  } catch {
    console.log("❌ Form did not expand after click");
    return false;
  }
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
    console.log("✓ Already on dashboard");
    return true;
  }

  if (await isOnOnboarding(page)) {
    if (!autoCompleteOnboarding) {
      console.log("📋 On onboarding - staying here as requested");
      return true;
    }
    console.log("📋 On onboarding - completing...");

    const locators = onboardingLocators(page);

    try {
      // Wait up to 15 seconds for the skip button to appear (queries need to load)
      await locators.skipButton.waitFor({ state: "visible" });
      console.log("✓ Skip button found, clicking...");
      await locators.skipButton.click();

      // Wait for navigation to dashboard
      await page.waitForURL(urlPatterns.dashboard);

      if (await isOnDashboard(page)) {
        console.log("✓ Successfully skipped to dashboard");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Skip button not found after waiting:", String(error).slice(0, 100));
    }

    // Fallback: try other selectors
    const fallbackSelectors = [locators.skipLink, locators.skipText];

    for (const skipElement of fallbackSelectors) {
      try {
        if (await skipElement.isVisible().catch(() => false)) {
          await skipElement.click();
          await page.waitForURL(urlPatterns.dashboard).catch(() => {});
          if (await isOnDashboard(page)) {
            return true;
          }
          break;
        }
      } catch {
        // Continue to next selector
      }
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

    if (await isOnDashboard(page)) {
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
    let loginResult = await testUserService.loginTestUser(user.email, user.password);

    // Repair known transient auth state drift for seeded users, then retry once.
    if (!loginResult.success && loginResult.error?.includes("InvalidAccountId")) {
      console.log("  ⚠️ API login returned InvalidAccountId. Attempting account repair...");
      const repairResult = await testUserService.createTestUser(
        user.email,
        user.password,
        autoCompleteOnboarding,
      );
      if (repairResult.success || repairResult.existing) {
        loginResult = await testUserService.loginTestUser(user.email, user.password);
      }
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

    const locators = authFormLocators(page);

    // DIAGNOSTIC: Log page state while waiting
    const startTime = Date.now();
    let lastLog = startTime;
    const diagnosticInterval = setInterval(async () => {
      const now = Date.now();
      if (now - lastLog > 5000) {
        // Log every 5 seconds
        const headingVisible = await locators.signInHeading.isVisible().catch(() => false);
        const formVisible = await page
          .locator("form")
          .isVisible()
          .catch(() => false);
        const elapsed = Math.floor((now - startTime) / 1000);
        console.log(`  ⏱️ Waiting ${elapsed}s - heading:${headingVisible}, form:${formVisible}`);
        lastLog = now;
      }
    }, 1000);

    try {
      // Wait for EITHER heading OR form (whichever appears first)
      await Promise.race([
        locators.signInHeading.waitFor({ state: "visible" }),
        page.locator("form").waitFor({ state: "visible" }),
      ]);
      clearInterval(diagnosticInterval);
      console.log("  ✓ Sign-in page loaded");
    } catch (error) {
      clearInterval(diagnosticInterval);
      // Take screenshot for debugging
      await page.screenshot({ path: "e2e/.auth/signin-timeout-debug.png" });
      const bodyText =
        (await page
          .locator("body")
          .textContent()
          .catch(() => "")) || "";
      console.log("  ❌ Sign-in page did not load within 30s. Body text:", bodyText.slice(0, 200));
      throw error;
    }

    // Wait for Convex WebSocket to be fully connected before attempting auth
    // On cold starts, the WebSocket needs time to establish connection
    // We exposed window.__convex_test_client in __root.tsx for this purpose
    await page
      .waitForFunction(
        () => {
          const convex = window.__convex_test_client;
          if (!convex) {
            console.log("    ⚠️ window.__convex_test_client is missing!");
            // Check if we can find the script tag or env var in DOM
            return false;
          }
          // Check connection state
          const state = convex.connectionState();
          if (!state.isWebSocketConnected) {
            // Log occasionally to browser console (visible in headed mode or trace)
            console.log(`    ⏳ AuthHelper: Waiting for WS. State: ${JSON.stringify(state)}.`);
          }
          return state.isWebSocketConnected;
        },
        undefined,
        {}, // Wait up to 30s for connection
      )
      .catch(() => {
        console.log("  ⚠️ Convex WebSocket connection timed out, attempting anyway");
        // Getting the config from the page for diagnosis
        page
          .evaluate(() => {
            const convex = window.__convex_test_client;
            return convex ? { state: convex.connectionState() } : "No Client";
          })
          .then((info) => console.log("  🔍 Debug Info:", JSON.stringify(info)));
      });

    // Use evaluate to interact with the form directly
    const submitResult = await page.evaluate(
      async ({ email, password }) => {
        // Helper to wait for condition with timeout
        const waitFor = (condition: () => boolean, timeout = 5000): Promise<boolean> => {
          return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
              if (condition()) {
                resolve(true);
              } else if (Date.now() - start > timeout) {
                resolve(false);
              } else {
                requestAnimationFrame(check);
              }
            };
            check();
          });
        };

        // Find or click "Continue with email" button to expand form
        const buttons = Array.from(document.querySelectorAll("button"));
        const continueBtn = buttons.find((b) => b.textContent?.includes("Continue with email"));
        if (continueBtn) {
          continueBtn.click();
        }

        // Wait for form to be ready (data-form-ready="true")
        const formReady = await waitFor(() => {
          const form = document.querySelector('form[data-form-ready="true"]');
          return form !== null;
        });

        if (!formReady) {
          return { success: false, error: "Form did not become ready" };
        }

        // Find and fill email input
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

        if (!(emailInput && passwordInput)) {
          return { success: false, error: "Inputs not found" };
        }

        // Set values using native value setter to trigger React
        const nativeEmailSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        const nativePasswordSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;

        if (nativeEmailSetter && nativePasswordSetter) {
          nativeEmailSetter.call(emailInput, email);
          emailInput.dispatchEvent(new Event("input", { bubbles: true }));

          nativePasswordSetter.call(passwordInput, password);
          passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Verify values were set
        if (emailInput.value !== email || passwordInput.value !== password) {
          return {
            success: false,
            error: `Values not set correctly. Email: ${emailInput.value}, Password length: ${passwordInput.value.length}`,
          };
        }

        // Find and click submit button
        const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (!submitBtn) {
          return { success: false, error: "Submit button not found" };
        }

        submitBtn.click();

        // Wait for button to show "Signing in..." to confirm form is processing
        const isSubmitting = await waitFor(() => {
          return submitBtn.textContent?.includes("Signing in") ?? false;
        }, 3000);

        return {
          success: true,
          isSubmitting,
          buttonText: submitBtn.textContent,
        };
      },
      { email: user.email, password: user.password },
    );

    if (!submitResult.success) {
      console.log(`  ❌ Form submission failed: ${submitResult.error}`);
      return false;
    }
    console.log(
      `  🚀 Form submitted (submitting state: ${submitResult.isSubmitting}, button: "${submitResult.buttonText}")`,
    );

    try {
      // Wait for redirect - handles both old (/dashboard) and new (/:orgSlug/dashboard) patterns
      await page.waitForURL(urlPatterns.dashboardOrOnboarding);
      console.log("  ✓ Redirected to:", page.url());
    } catch {
      // Timeout or error - check for specific failures
      const errorText = await page
        .locator('[role="alert"], .text-red-500, .error')
        .textContent()
        .catch(() => null);
      const toastError = await toastLocators(page)
        .error.textContent()
        .catch(() => null);

      // Get full page text for debugging
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
      } else if (toastError) {
        console.log("  ❌ Toast error:", toastError.slice(0, 200));
      } else {
        console.log("  ⚠️ Redirect timeout after 90s");
        console.log("  📄 Page content:", pageText.slice(0, 300));

        // Recovery path: app shell can land on "/" or remain at "/signin" before token hydration settles.
        if (/\/signin(?:[/?#]|$)/.test(page.url()) || page.url().endsWith("/")) {
          console.log("  🔁 Attempting app-gateway recovery after redirect timeout...");
          try {
            if (await tryNavigateToAppGateway()) {
              return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
            }
          } catch {
            // Continue to fail below if recovery didn't resolve authentication.
          }
        }
      }

      return false; // Let global-setup retry handle this
    }

    return await handleOnboardingOrDashboard(page, autoCompleteOnboarding);
  } catch (error) {
    console.log("  ❌ Sign-in error:", String(error).slice(0, 200));
    return false;
  }
}

/**
 * Wait for either verification screen or redirect after signup
 */
export async function waitForSignUpResult(page: Page): Promise<"verification" | "redirect" | null> {
  const locators = authFormLocators(page);

  // Use Promise.race with proper waitFor patterns instead of polling
  try {
    await Promise.race([
      locators.verifyEmailHeading
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => "verification"),
      page.waitForURL(urlPatterns.dashboardOrOnboarding, { timeout: 15000 }).then(() => "redirect"),
    ]);

    // Check which one succeeded
    if (await locators.verifyEmailHeading.isVisible().catch(() => false)) {
      return "verification";
    }
    if (urlPatterns.dashboardOrOnboarding.test(page.url())) {
      return "redirect";
    }
  } catch {
    // Both timed out
  }
  return null;
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
