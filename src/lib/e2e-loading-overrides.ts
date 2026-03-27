/**
 * Minimal screenshot/E2E loading overrides that still exist as documented
 * exceptions. These are limited to auth-gated surfaces whose reviewed loading
 * states cannot yet be reproduced reliably from a cold page load using only
 * Playwright-side network blocking.
 */

export type E2ELoadingOverrideKey =
  | "assistant"
  | "dashboard"
  | "issues"
  | "notifications"
  | "projects";

declare global {
  interface Window {
    __NIXELO_E2E_ASSISTANT_LOADING__?: boolean;
    __NIXELO_E2E_DASHBOARD_LOADING__?: boolean;
    __NIXELO_E2E_ISSUES_LOADING__?: boolean;
    __NIXELO_E2E_NOTIFICATIONS_LOADING__?: boolean;
    __NIXELO_E2E_PROJECTS_LOADING__?: boolean;
  }
}

const E2E_LOADING_OVERRIDE_WINDOW_KEYS: Record<E2ELoadingOverrideKey, keyof Window> = {
  assistant: "__NIXELO_E2E_ASSISTANT_LOADING__",
  dashboard: "__NIXELO_E2E_DASHBOARD_LOADING__",
  issues: "__NIXELO_E2E_ISSUES_LOADING__",
  notifications: "__NIXELO_E2E_NOTIFICATIONS_LOADING__",
  projects: "__NIXELO_E2E_PROJECTS_LOADING__",
};

export function isE2ELoadingOverrideEnabled(key: E2ELoadingOverrideKey): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const windowKey = E2E_LOADING_OVERRIDE_WINDOW_KEYS[key];
  return window[windowKey] === true;
}
