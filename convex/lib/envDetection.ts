/**
 * Environment Detection Utilities
 *
 * Consolidated utilities for detecting test/development/E2E environments.
 * Use these instead of duplicating process.env checks throughout the codebase.
 *
 * Environment Variables:
 * - NODE_ENV: "test" | "development" | "production"
 * - IS_TEST_ENV: Set by convex-test framework
 * - CI: Set by CI runners (GitHub Actions, etc.)
 * - E2E_TEST_MODE: Explicitly enables E2E test features
 * - E2E_API_KEY: Required for E2E endpoints in production-like environments
 */

/**
 * Returns true if running in a test environment.
 *
 * Use for:
 * - Relaxing rate limits
 * - Skipping certain validations
 * - Enabling test-only features
 *
 * Checks: NODE_ENV (test/development), IS_TEST_ENV, CI, E2E_TEST_MODE
 */
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development" ||
    !!process.env.IS_TEST_ENV ||
    !!process.env.CI ||
    !!process.env.E2E_TEST_MODE
  );
}

/**
 * Returns true if the environment permits E2E/test operations that touch sensitive data.
 *
 * Use for:
 * - Storing plaintext OTPs for test emails
 * - Enabling E2E-specific functionality
 * - Bypassing certain security checks for test emails
 *
 * This is slightly broader than isTestEnvironment() because it also includes
 * E2E_API_KEY, which allows E2E tests to run against preview/production environments.
 */
export function isE2ESafeEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development" ||
    !!process.env.IS_TEST_ENV ||
    !!process.env.CI ||
    !!process.env.E2E_TEST_MODE ||
    !!process.env.E2E_API_KEY
  );
}

/**
 * Returns true if we should run E2E operations inline (synchronously) rather than scheduled.
 *
 * Use for:
 * - Running password reset inline to avoid scheduler latency in E2E tests
 * - Other operations where scheduler timing causes E2E flakiness
 *
 * This specifically excludes production mode to ensure production always uses
 * async scheduling for security (timing side-channel resistance).
 */
export function shouldRunInlineForE2E(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    (!!process.env.E2E_TEST_MODE || !!process.env.E2E_API_KEY || !!process.env.CI)
  );
}

/**
 * Returns true if test environment fallbacks should be used.
 *
 * Use for:
 * - Fallback IPs when X-Forwarded-For is missing
 * - Other test/dev convenience fallbacks
 *
 * Similar to isTestEnvironment() but explicitly for fallback scenarios.
 */
export function shouldUseFallbacks(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development" ||
    !!process.env.E2E_TEST_MODE ||
    !!process.env.CI
  );
}
