/**
 * Wait Helpers for E2E Tests
 *
 * Semantic wait functions that replace arbitrary timeouts with
 * meaningful waits for specific conditions.
 */

import { type APIRequestContext, expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import {
  getLocatorCount,
  getLocatorInputValue,
  getOptionalLocatorText,
  isLocatorDisabled,
  isLocatorVisible,
} from "./locator-state";
import { escapeRegExp, ROUTES, routePattern } from "./routes";
import { getToastLocator } from "./toast-locators";

/**
 * Wait timeouts used across tests.
 * These are fallback maximums - prefer element-based waits.
 */
export const WAIT_TIMEOUTS = {
  /** Short wait for animations/transitions (300ms) */
  animation: 300,
  /** Wait for React hydration on cold starts */
  reactHydration: 500,
  /** Wait for form ready state (SignInForm/SignUpForm have 350ms delay) */
  formReady: 400,
  /** Wait for page navigation to settle */
  navigation: 1000,
  /** Wait for async operations (API calls, etc.) */
  asyncOperation: 2000,
  /** Long wait for slow operations */
  slowOperation: 3000,
} as const;

/**
 * Wait for auth form to be ready for submission.
 * Waits for the FORM_READY marker (rendered when the email form is expanded)
 * or falls back to checking visible inputs and enabled submit button.
 */
export async function waitForFormReady(page: Page, timeout = 5000): Promise<boolean> {
  const form = page.getByTestId(TEST_IDS.AUTH.FORM);
  const emailForm = form.getByTestId(TEST_IDS.AUTH.EMAIL_FORM);
  const formReadyMarker = form.getByTestId(TEST_IDS.AUTH.FORM_READY);
  const emailInput = page.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
  const passwordInput = page.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
  const submitButton = page.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);

  await expect
    .poll(
      async () => {
        if (!(await isLocatorVisible(form))) {
          return "pending";
        }

        const formReady = (await getLocatorCount(formReadyMarker)) > 0;
        if (formReady) {
          return "marker-ready";
        }

        const expanded = (await getLocatorCount(emailForm)) > 0;
        const emailVisible = await isLocatorVisible(emailInput);
        const passwordVisible = await isLocatorVisible(passwordInput);
        const submitVisible = await isLocatorVisible(submitButton);
        const submitEnabled = submitVisible && !(await isLocatorDisabled(submitButton, true));

        if (expanded && emailVisible && passwordVisible && submitVisible && submitEnabled) {
          return "fallback-ready";
        }

        return "pending";
      },
      {
        timeout,
        intervals: [100, 200, 500],
      },
    )
    .not.toBe("pending");

  // Check if form is ready via marker OR via fallback conditions
  const formReady = (await getLocatorCount(formReadyMarker)) > 0;
  if (formReady) {
    return true;
  }

  // Re-check fallback conditions if marker not set
  const expanded = (await getLocatorCount(emailForm)) > 0;
  const hydrated = (await getLocatorCount(hydratedMarker)) > 0;
  const emailVisible = await isLocatorVisible(emailInput);
  const passwordVisible = await isLocatorVisible(passwordInput);
  const submitVisible = await isLocatorVisible(submitButton);
  const submitEnabled = submitVisible && !(await isLocatorDisabled(submitButton, true));

  return expanded && hydrated && emailVisible && passwordVisible && submitVisible && submitEnabled;
}

/**
 * Wait for all CSS animations to complete.
 * Use this after clicking elements that trigger CSS transitions.
 */
export async function waitForAnimation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const animations = document.getAnimations().filter((a) => {
      const timing = a.effect?.getComputedTiming();
      // Only wait for finite animations (skip infinite loaders)
      return timing && timing.duration !== Infinity && timing.iterations !== Infinity;
    });
    if (!animations.length) return Promise.resolve();
    return Promise.allSettled(animations.map((a) => a.finished));
  });
}

/**
 * Wait for a dropdown menu to open.
 * Waits for the dropdown to have the expected visible state.
 */
export async function waitForDropdown(page: Page, dropdownSelector: string): Promise<void> {
  const dropdown = page.locator(dropdownSelector);
  await dropdown.waitFor({ state: "visible" });
  // Wait for finite animations to complete (skip infinite ones like loaders)
  await dropdown.evaluate((el) => {
    const finiteAnimations = el.getAnimations().filter((a) => {
      const timing = a.effect?.getComputedTiming();
      return timing && timing.duration !== Infinity && timing.iterations !== Infinity;
    });
    if (!finiteAnimations.length) return Promise.resolve();
    return Promise.all(finiteAnimations.map((a) => a.finished));
  });
}

/**
 * Wait for a modal/dialog to open and be interactive.
 */
export async function waitForModal(page: Page, modalSelector = '[role="dialog"]'): Promise<void> {
  const modal = page.locator(modalSelector);
  await modal.waitFor({ state: "visible" });
  // Wait for finite animations to complete (skip infinite ones like loaders)
  await modal.evaluate((el) => {
    const finiteAnimations = el.getAnimations().filter((a) => {
      const timing = a.effect?.getComputedTiming();
      return timing && timing.duration !== Infinity && timing.iterations !== Infinity;
    });
    if (!finiteAnimations.length) return Promise.resolve();
    return Promise.all(finiteAnimations.map((a) => a.finished));
  });
}

/**
 * Wait for a Radix dialog or alert dialog to open and be visually ready.
 * Unlike older screenshot harness helpers, this fails loudly when the overlay
 * or dialog content never appears.
 */
export async function waitForDialogOpen(page: Page, timeout = 8000): Promise<Locator> {
  const dialog = page.getByRole("dialog").first();
  const alertDialog = page.getByRole("alertdialog").first();
  await expect
    .poll(
      async () => {
        const overlayVisible = await isLocatorVisible(page.getByTestId(TEST_IDS.DIALOG.OVERLAY));
        const dialogVisible = await isLocatorVisible(dialog);
        const alertDialogVisible = await isLocatorVisible(alertDialog);
        return overlayVisible && (dialogVisible || alertDialogVisible);
      },
      {
        timeout,
        intervals: [100, 200, 500],
      },
    )
    .toBe(true);
  const activeDialog = (await isLocatorVisible(alertDialog)) ? alertDialog : dialog;
  await activeDialog.waitFor({ state: "visible", timeout });
  await waitForAnimation(page);
  return activeDialog;
}

/**
 * Wait for all visible loading skeletons to disappear without relying on
 * strict single-element locator semantics.
 */
export async function waitForLoadingSkeletonsToClear(page: Page, timeout = 5000): Promise<void> {
  await expect
    .poll(() => page.getByTestId(TEST_IDS.LOADING.SKELETON).count(), {
      timeout,
      intervals: [100, 200, 500],
    })
    .toBe(0);
}

async function waitForLocatorToHide(locator: Locator, timeout: number): Promise<boolean> {
  try {
    await expect(locator).toBeHidden({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function countVisibleLocators(locator: Locator): Promise<number> {
  const count = await locator.count();
  let visibleCount = 0;
  for (let index = 0; index < count; index += 1) {
    if (await isLocatorVisible(locator.nth(index))) {
      visibleCount += 1;
    }
  }
  return visibleCount;
}

async function getVisibleOpenDialogCount(page: Page): Promise<number> {
  const dialogCount = await countVisibleLocators(page.getByRole("dialog"));
  const alertDialogCount = await countVisibleLocators(page.getByRole("alertdialog"));
  return dialogCount + alertDialogCount;
}

async function waitForDialogsToClear(page: Page, timeout: number): Promise<boolean> {
  try {
    await expect
      .poll(() => getVisibleOpenDialogCount(page), {
        timeout,
        intervals: [100, 200, 500],
      })
      .toBe(0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dismiss a dialog if it is open. Fail if the dialog remains visible after
 * Escape and outside-click fallback dismissal attempts.
 */
export async function dismissIfOpen(page: Page, locator: Locator): Promise<void> {
  if (!(await isLocatorVisible(locator))) {
    return;
  }

  await page.keyboard.press("Escape");

  if (await waitForLocatorToHide(locator, 1000)) {
    return;
  }

  await page.mouse.click(10, 10);

  if (await waitForLocatorToHide(locator, 4000)) {
    return;
  }

  throw new Error("Dialog remained open after Escape and outside-click dismissal attempts");
}

/**
 * Dismiss any open dialogs. This retries Escape first, then an outside click,
 * and fails if visible dialogs remain after the retry budget.
 */
export async function dismissAllDialogs(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const openDialogs = await getVisibleOpenDialogCount(page);
    if (openDialogs === 0) {
      return;
    }

    await page.keyboard.press("Escape");
    if (await waitForDialogsToClear(page, 1500)) {
      return;
    }

    await page.mouse.click(10, 10);
    if (await waitForDialogsToClear(page, 1500)) {
      return;
    }
  }

  const remainingDialogs = await getVisibleOpenDialogCount(page);
  throw new Error(`Failed to dismiss ${remainingDialogs} open dialog(s)`);
}

/**
 * Wait for ALL loading spinners to disappear, not just the first one.
 * A page may have multiple concurrent spinners (sidebar, main content, widgets).
 */
async function waitForAllSpinnersToClear(page: Page, timeout: number): Promise<void> {
  const spinnerLocator = page.getByLabel("Loading").or(page.getByTestId(TEST_IDS.LOADING.SPINNER));
  await expect
    .poll(
      async () => {
        const count = await spinnerLocator.count();
        let visibleCount = 0;
        for (let i = 0; i < count; i++) {
          if (await isLocatorVisible(spinnerLocator.nth(i))) {
            visibleCount++;
          }
        }
        return visibleCount;
      },
      { timeout, intervals: [100, 200, 500] },
    )
    .toBe(0);
}

/**
 * Wait for route/query loading indicators to clear before taking a screenshot.
 * This fails when app-shell loading never settles instead of capturing spinners.
 */
export async function waitForScreenshotReady(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState("domcontentloaded");

  await waitForAllSpinnersToClear(page, timeout);
  await waitForLoadingSkeletonsToClear(page, timeout);

  await waitForAnimation(page);

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

/**
 * Wait for toast notification to appear.
 */
export async function waitForToast(
  page: Page,
  type?: "success" | "error" | "info",
): Promise<string | null> {
  try {
    const toast = getToastLocator(page, type).first();
    await toast.waitFor({ state: "visible" });
    return await toast.textContent();
  } catch {
    return null;
  }
}

/**
 * Wait for an element to be both visible and enabled (clickable).
 */
export async function waitForClickable(
  page: Page,
  selector: string,
  timeout = 5000,
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: "visible", timeout });
    const isDisabled = await element.isDisabled();
    return !isDisabled;
  } catch {
    return false;
  }
}

/**
 * Wait for authenticated dashboard app shell to be interactive.
 * This is the shared readiness contract for dashboard-adjacent specs.
 */
export async function waitForDashboardReady(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const main = page.getByRole("main").last();
        const searchButton = page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON);
        const loadingSpinner = page
          .getByLabel("Loading")
          .or(page.getByTestId(TEST_IDS.LOADING.SPINNER));

        const mainVisible = await isLocatorVisible(main);
        const searchVisible = await isLocatorVisible(searchButton);
        const searchEnabled = searchVisible && !(await isLocatorDisabled(searchButton, true));
        const spinnerVisible = await isLocatorVisible(loadingSpinner);

        if (mainVisible && searchVisible && searchEnabled && !spinnerVisible) {
          return "ready";
        }

        return "pending";
      },
      {
        timeout: 10000,
        intervals: [200, 500, 1000],
      },
    )
    .toBe("ready");

  await expect(page.getByRole("main").last()).toBeVisible();
  await expect(page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)).toBeVisible();
  const loadingSpinner = page.getByLabel("Loading").or(page.getByTestId(TEST_IDS.LOADING.SPINNER));
  await expect(loadingSpinner).not.toBeVisible();
}

type ConvexConnectionInfo =
  | { state: { isWebSocketConnected?: boolean }; hydrated: boolean }
  | { state: "No Client" | "Unavailable"; hydrated?: boolean };

async function getConvexConnectionReadyState(
  page: Page,
  requireHydration: boolean,
): Promise<"connected" | "pending"> {
  const connectionInfo = await getConvexConnectionInfo(page);

  if (requireHydration && connectionInfo.hydrated !== true) {
    return "pending";
  }

  if (
    typeof connectionInfo.state === "object" &&
    connectionInfo.state?.isWebSocketConnected === true
  ) {
    return "connected";
  }

  return "pending";
}

/**
 * Wait for the exposed Convex test client to reach a connected WebSocket state.
 * Optionally also require the React app shell hydration marker.
 */
export async function waitForConvexConnectionReady(
  page: Page,
  options?: { timeout?: number; requireHydration?: boolean },
): Promise<boolean> {
  const timeout = options?.timeout ?? 30000;
  const requireHydration = options?.requireHydration ?? false;

  try {
    await expect
      .poll(() => getConvexConnectionReadyState(page, requireHydration), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .toBe("connected");
    return true;
  } catch {
    return false;
  }
}

export async function getConvexConnectionInfo(page: Page): Promise<ConvexConnectionInfo> {
  try {
    return await page.evaluate(() => {
      const convex = (
        window as Window & {
          __convex_test_client?: { connectionState: () => { isWebSocketConnected: boolean } };
        }
      ).__convex_test_client;

      return convex
        ? {
            state: convex.connectionState(),
            hydrated: document.body.classList.contains("app-hydrated"),
          }
        : {
            state: "No Client" as const,
            hydrated: document.body.classList.contains("app-hydrated"),
          };
    });
  } catch {
    return { state: "Unavailable" as const };
  }
}

/**
 * Ensure an authenticated org dashboard is actually bootstrapped.
 * This owns the shared "/app" vs direct dashboard recovery path used by fixture bootstrap.
 */
export async function ensureAuthenticatedDashboardReady(
  page: Page,
  orgSlug: string,
): Promise<void> {
  const dashboardPath = ROUTES.dashboard.build(orgSlug);
  const escapedDashboardPath = escapeRegExp(dashboardPath);
  const dashboardUrl = new RegExp(`${escapedDashboardPath}(?:\\?.*)?$`);
  const appErrorHeading = page.getByRole("heading", { name: "500" });
  const appErrorDetails = page.locator("details pre");

  const expectAuthenticatedDashboardReady = async (timeout = 15000) => {
    await expect(page).toHaveURL(dashboardUrl, { timeout });
    await page.waitForLoadState("domcontentloaded");

    if (await isLocatorVisible(appErrorHeading)) {
      throw new Error("App error boundary displayed during authenticated dashboard bootstrap");
    }

    await waitForDashboardReady(page);
  };

  const tryAuthenticatedDashboardReady = async (timeout = 10000) => {
    try {
      await expectAuthenticatedDashboardReady(timeout);
      return true;
    } catch {
      return false;
    }
  };

  const recoverAuthenticatedDashboard = async () => {
    const currentUrl = page.url();
    const isOutsideOrgShell =
      currentUrl.endsWith("/") ||
      currentUrl.includes(ROUTES.signin.build()) ||
      !currentUrl.includes(orgSlug);

    await page.goto(isOutsideOrgShell ? dashboardPath : "/app", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("load");

    if (await tryAuthenticatedDashboardReady(5000)) {
      return;
    }

    await page.goto(dashboardPath, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
  };

  if (await tryAuthenticatedDashboardReady()) {
    return;
  }

  await recoverAuthenticatedDashboard();
  try {
    await expectAuthenticatedDashboardReady();
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    const errorDetails = (await getOptionalLocatorText(appErrorDetails))?.trim();
    const suffix = errorDetails ? `: ${errorDetails}` : "";
    throw new Error(
      `Failed to bootstrap authenticated dashboard for ${orgSlug}: ${lastError.message}${suffix}`,
    );
  }
}

/**
 * Wait for project board route and board controls to become interactive.
 */
export async function waitForBoardLoaded(page: Page): Promise<void> {
  await expect(page).toHaveURL(routePattern(ROUTES.projects.board.path));
  const projectBoard = page.getByTestId(TEST_IDS.BOARD.ROOT);
  const projectBoardHeading = page.getByRole("heading", { name: /kanban board|scrum board/i });
  const createIssueButton = page
    .getByTestId(TEST_IDS.ISSUE.CREATE_TRIGGER)
    .or(page.getByRole("button", { name: /add issue/i }))
    .first();

  if ((await projectBoard.count()) > 0) {
    await expect(projectBoard).toBeVisible();
  } else {
    await expect(projectBoardHeading).toBeVisible();
  }

  await expect(createIssueButton).toBeVisible();
  await expect(createIssueButton).toBeEnabled();
}

/**
 * Wait for issue creation completion signal.
 * The primary signals are modal dismissal and the new issue card becoming visible on the board.
 * A success toast is used as a supplemental confirmation, but must tolerate stacked toasts.
 */
export async function waitForIssueCreateSuccess(page: Page, issueTitle?: string): Promise<void> {
  const createIssueModal = page
    .getByRole("dialog")
    .filter({ has: page.getByTestId(TEST_IDS.ISSUE.CREATE_MODAL) });
  await expect(createIssueModal).not.toBeVisible();

  if (issueTitle) {
    const escapedTitle = escapeRegExp(issueTitle);
    await expect(page.getByRole("button", { name: new RegExp(escapedTitle) })).toBeVisible();
  }

  const issueCreatedToast = page
    .getByTestId(TEST_IDS.TOAST.SUCCESS)
    .filter({ hasText: /issue created successfully/i })
    .first();
  await expect(issueCreatedToast).toBeVisible();
}

/**
 * Wait for issue update completion signal.
 * Primary signal is the success toast emitted by issue detail update flows.
 */
export async function waitForIssueUpdateSuccess(page: Page): Promise<void> {
  const issueUpdatedToast = page
    .getByTestId(TEST_IDS.TOAST.SUCCESS)
    .filter({ hasText: /issue updated/i })
    .first();
  await expect(issueUpdatedToast).toBeVisible();
}

/**
 * Wait for project creation completion signal.
 * The modal must close and the success toast must appear.
 */
export async function waitForProjectCreateSuccess(page: Page): Promise<void> {
  const createProjectModal = page
    .getByRole("dialog")
    .filter({ has: page.getByTestId(TEST_IDS.PROJECT.CREATE_MODAL) });
  const projectCreatedToast = page
    .getByTestId(TEST_IDS.TOAST.SUCCESS)
    .filter({ hasText: /project created successfully/i })
    .first();

  await expect(createProjectModal).not.toBeVisible();
  await expect(projectCreatedToast).toBeVisible();
}

type WorkspaceCreationDialogOptions = {
  dialog: Locator;
  nameInput: Locator;
  descriptionInput?: Locator;
  submitButton: Locator;
  createForm?: Locator;
  workspaceName: string;
  workspaceDescription?: string;
  openDialog: () => Promise<void>;
};

export type WorkspaceDialogElements = {
  dialog: Locator;
  nameInput: Locator;
  descriptionInput: Locator;
  submitButton: Locator;
  createForm: Locator;
};

/**
 * Shared selector contract for the create-workspace modal.
 */
export function getWorkspaceDialogElements(page: Page): WorkspaceDialogElements {
  const dialog = page.getByRole("dialog").filter({
    hasText: /create workspace/i,
  });
  return {
    dialog,
    nameInput: dialog.getByLabel(/workspace name/i),
    descriptionInput: dialog.getByLabel(/description/i),
    submitButton: dialog.getByRole("button", { name: /create workspace/i }),
    createForm: page.locator("#create-workspace-form"),
  };
}

export async function dismissWorkspaceDialogIfOpen(page: Page, dialog: Locator): Promise<void> {
  await page.keyboard.press("Escape");

  if (!(await isLocatorVisible(dialog))) {
    return;
  }

  if (await waitForWorkspaceDialogHidden(dialog, 1000)) {
    return;
  }

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
}

/**
 * Deterministically create a workspace through the "Create Workspace" modal dialog.
 * Shared by page objects to avoid duplicated retry/open/fill/submit logic.
 */
export async function createWorkspaceFromDialog(
  options: WorkspaceCreationDialogOptions,
): Promise<void> {
  const {
    dialog,
    nameInput,
    descriptionInput,
    submitButton,
    createForm,
    workspaceName,
    workspaceDescription,
    openDialog,
  } = options;

  await ensureWorkspaceDialogReady({ dialog, nameInput, openDialog });
  await fillWorkspaceDialogField(nameInput, workspaceName, async () => {
    await ensureWorkspaceDialogReady({ dialog, nameInput, openDialog });
  });

  if (workspaceDescription && descriptionInput) {
    await fillWorkspaceDialogField(descriptionInput, workspaceDescription, async () => {
      await ensureWorkspaceDialogReady({ dialog, nameInput, openDialog });
    });
  }

  await submitWorkspaceDialog({
    dialog,
    submitButton,
    createForm,
  });
}

async function ensureWorkspaceDialogReady(options: {
  dialog: Locator;
  nameInput: Locator;
  openDialog: () => Promise<void>;
}) {
  const { dialog, nameInput, openDialog } = options;

  if (await waitForWorkspaceDialogReady(dialog, nameInput, 1000)) {
    return;
  }

  await openDialog();
  await expectWorkspaceDialogReady(dialog, nameInput);
}

async function waitForWorkspaceDialogReady(dialog: Locator, nameInput: Locator, timeout = 3000) {
  try {
    await expectWorkspaceDialogReady(dialog, nameInput, timeout);
    return true;
  } catch {
    return false;
  }
}

async function expectWorkspaceDialogReady(dialog: Locator, nameInput: Locator, timeout = 10000) {
  await expect(dialog).toBeVisible({ timeout });
  await expect(dialog.getByRole("heading", { name: /create workspace/i })).toBeVisible({
    timeout,
  });
  await expect(nameInput).toBeVisible({ timeout });
  await expect(nameInput).toBeEnabled({ timeout });
}

async function fillWorkspaceDialogField(
  input: Locator,
  value: string,
  recover: () => Promise<void>,
) {
  if (await tryFillWorkspaceDialogField(input, value)) {
    return;
  }

  await recover();
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();
  await input.fill(value);
  await expect(input).toHaveValue(value);
}

async function tryFillWorkspaceDialogField(input: Locator, value: string) {
  try {
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await input.fill(value);
  } catch {
    return false;
  }

  const currentValue = await getLocatorInputValue(input);
  return currentValue === value;
}

async function submitWorkspaceDialog(options: {
  dialog: Locator;
  submitButton: Locator;
  createForm?: Locator;
}) {
  const { dialog, submitButton, createForm } = options;

  await tryStartWorkspaceDialogSubmit({ dialog, submitButton, createForm });

  if (await waitForWorkspaceDialogSubmitStart(dialog, submitButton, 5000)) {
    await expect(dialog).not.toBeVisible();
    return;
  }

  await tryStartWorkspaceDialogSubmit({ dialog, submitButton, createForm });
  await expectWorkspaceDialogSubmitStarted(dialog, submitButton);
  await expect(dialog).not.toBeVisible();
}

async function tryStartWorkspaceDialogSubmit(options: {
  dialog: Locator;
  submitButton: Locator;
  createForm?: Locator;
}) {
  const { dialog, submitButton } = options;

  if (!(await isLocatorVisible(dialog))) {
    return;
  }

  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
}

async function waitForWorkspaceDialogSubmitStart(
  dialog: Locator,
  submitButton: Locator,
  timeout = 3000,
) {
  try {
    await expect
      .poll(async () => getWorkspaceDialogSubmitState(dialog, submitButton), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .not.toBe("open");
    return true;
  } catch {
    return false;
  }
}

async function expectWorkspaceDialogSubmitStarted(
  dialog: Locator,
  submitButton: Locator,
  timeout = 10000,
) {
  const started = await waitForWorkspaceDialogSubmitStart(dialog, submitButton, timeout);
  expect(started).toBe(true);
}

async function waitForWorkspaceDialogHidden(dialog: Locator, timeout = 1000) {
  try {
    await dialog.waitFor({ state: "hidden", timeout });
    return true;
  } catch {
    return false;
  }
}

async function getWorkspaceDialogSubmitState(dialog: Locator, submitButton: Locator) {
  if (!(await isLocatorVisible(dialog))) {
    return "closed";
  }

  if (await isLocatorDisabled(submitButton)) {
    return "submitting";
  }

  return "open";
}

/**
 * Wait for OAuth auth endpoint redirect and return parsed contract fields.
 */
export async function waitForOAuthRedirectComplete(
  request: APIRequestContext,
  convexSiteUrl: string,
): Promise<{ state: string; redirectUri: string; redirectUrl: URL }> {
  const response = await request.get(`${convexSiteUrl}/google/auth`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);

  const location = response.headers().location;
  expect(location).toBeTruthy();

  const redirectUrl = new URL(location as string);
  const state = redirectUrl.searchParams.get("state");
  const redirectUri = redirectUrl.searchParams.get("redirect_uri");

  expect(state).toBeTruthy();
  expect(redirectUri).toBeTruthy();

  return { state: state as string, redirectUri: redirectUri as string, redirectUrl };
}
