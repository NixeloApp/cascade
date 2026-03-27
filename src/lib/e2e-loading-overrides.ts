/**
 * Minimal screenshot/E2E loading overrides that still exist as documented
 * exceptions. These are limited to auth-gated surfaces whose loading states
 * still depend on Convex sync in a way the current Playwright-side blockers
 * cannot reproduce route-locally without stubbing production UI.
 */

export type E2ELoadingOverrideKey = "dashboard" | "issues";

declare global {
  interface Window {
    __NIXELO_E2E_DASHBOARD_LOADING__?: boolean;
    __NIXELO_E2E_ISSUES_LOADING__?: boolean;
  }
}

const E2E_LOADING_OVERRIDE_WINDOW_KEYS: Record<E2ELoadingOverrideKey, keyof Window> = {
  dashboard: "__NIXELO_E2E_DASHBOARD_LOADING__",
  issues: "__NIXELO_E2E_ISSUES_LOADING__",
};

export function isE2ELoadingOverrideEnabled(key: E2ELoadingOverrideKey): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window[E2E_LOADING_OVERRIDE_WINDOW_KEYS[key]] === true;
}
