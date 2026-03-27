/**
 * Minimal screenshot/E2E loading overrides that still exist as documented
 * exceptions. These are limited to auth-gated surfaces whose loading states
 * still depend on Convex sync in a way the current Playwright-side blockers
 * cannot reproduce route-locally without stubbing production UI.
 */

export const E2E_LOADING_OVERRIDES = {
  dashboard: {
    reason:
      "Dashboard loading still depends on multiple auth-gated Convex subscriptions plus app-shell chrome, and the current Playwright-side blockers cannot freeze only the body without collapsing the reviewed shell state.",
    windowKey: "__NIXELO_E2E_DASHBOARD_LOADING__",
  },
  issues: {
    reason:
      "Issues loading still depends on Convex paginated-query state, and transport blocking alone does not reliably keep the route in LoadingFirstPage once the authenticated shell has mounted.",
    windowKey: "__NIXELO_E2E_ISSUES_LOADING__",
  },
} as const;

export type E2ELoadingOverrideKey = keyof typeof E2E_LOADING_OVERRIDES;
export type E2ELoadingOverrideWindowKey =
  (typeof E2E_LOADING_OVERRIDES)[E2ELoadingOverrideKey]["windowKey"];

declare global {
  interface Window {
    __NIXELO_E2E_DASHBOARD_LOADING__?: boolean;
    __NIXELO_E2E_ISSUES_LOADING__?: boolean;
  }
}

export function getE2ELoadingOverrideWindowKey(
  key: E2ELoadingOverrideKey,
): E2ELoadingOverrideWindowKey {
  return E2E_LOADING_OVERRIDES[key].windowKey;
}

export function getE2ELoadingOverrideReason(key: E2ELoadingOverrideKey): string {
  return E2E_LOADING_OVERRIDES[key].reason;
}

export function isE2ELoadingOverrideEnabled(key: E2ELoadingOverrideKey): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window[getE2ELoadingOverrideWindowKey(key)] === true;
}
