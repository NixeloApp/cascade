import type { Page, TestInfo } from "@playwright/test";

/**
 * Test utility helpers
 */

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

function sanitizeNamespaceSegment(value: string, maxLength: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, maxLength) || "test";
}

export type TestNamespace = {
  id: string;
  name: (label: string) => string;
  projectKey: (prefix: string) => string;
  token: (label: string) => string;
};

/**
 * Build a shared run-scoped namespace for entity names created inside a test.
 * Centralizes the uniqueness pattern so multi-entity specs stop hand-rolling
 * `Date.now()` values with inconsistent prefixes and suffix trimming.
 */
export function createTestNamespace(testInfo: TestInfo): TestNamespace {
  const runStamp = Date.now().toString(36);
  const id = `w${testInfo.parallelIndex}e${testInfo.repeatEachIndex}r${testInfo.retry}${runStamp}`;
  const compactId = id.replace(/[^a-z0-9]/gi, "").toUpperCase();

  return {
    id,
    name: (label: string) => `${label} ${id}`,
    projectKey: (prefix: string) => {
      const normalizedPrefix =
        prefix
          .replace(/[^a-z]/gi, "")
          .toUpperCase()
          .slice(0, 4) || "TST";
      return `${normalizedPrefix}${compactId.slice(-4)}`;
    },
    token: (label: string) => `${sanitizeNamespaceSegment(label, 12)}-${id}`,
  };
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}+${timestamp}-${random}@example.com`;
}

/**
 * Generate a random password meeting requirements
 */
export function generateTestPassword(): string {
  return `Test${Date.now()}!`;
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: { status?: number; body?: unknown },
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: response.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(response.body ?? {}),
    });
  });
}

/**
 * Wait for a specific toast message
 */
export async function waitForToast(page: Page, text: string, timeout = 5000): Promise<void> {
  await page.locator("[data-sonner-toast]").filter({ hasText: text }).waitFor({ timeout });
}

/**
 * Dismiss all toasts
 */
export async function dismissAllToasts(page: Page, maxAttempts = 10): Promise<void> {
  const toasts = page.locator("[data-sonner-toast]");
  let attempts = 0;

  while (attempts < maxAttempts) {
    const count = await toasts.count();
    if (count === 0) break;

    const firstToast = toasts.nth(0);
    await firstToast.click();
    // Wait for toast to disappear after clicking
    await firstToast.waitFor({ state: "hidden" }).catch(() => {});
    attempts++;
  }
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!process.env.CI;
}

/**
 * Screenshot helper with auto-naming
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean },
): Promise<void> {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/[<>:"/\\|?*]/g, "_");
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: options?.fullPage ?? false,
  });
}

/**
 * Log page console messages (for debugging)
 */
export function logConsoleMessages(page: Page): void {
  page.on("console", (_msg) => {});
}

/**
 * Log page errors (for debugging)
 */
export function logPageErrors(page: Page): void {
  page.on("pageerror", (_error) => {});
}
