/**
 * Dialog & Modal Helpers for Screenshot Capture
 *
 * Reusable functions for opening, stabilizing, and capturing dialogs/modals.
 * These handle retry logic, animation settling, and dialog cleanup.
 */

import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import {
  dismissAllDialogs,
  waitForAnimation,
  waitForDialogOpen,
  waitForScreenshotReady,
} from "../utils/wait-helpers";
import { SEARCH_SHORTCUT } from "./config";

/** Open the command palette / omnibox and wait for it to be ready. */
export async function openOmnibox(page: Page, trigger: Locator, dialog: Locator): Promise<void> {
  await dismissAllDialogs(page);

  if (await isLocatorVisible(trigger)) {
    await trigger.click();
  } else {
    await page.keyboard.press(SEARCH_SHORTCUT);
  }

  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /search and commands/i }).waitFor({
    state: "visible",
    timeout: 5000,
  });
  await page.getByTestId(TEST_IDS.SEARCH.INPUT).waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
}

/**
 * Open an alert dialog with retry logic.
 * Returns the dialog locator once stable and ready.
 */
export async function openStableAlertDialog(
  page: Page,
  trigger: Locator,
  readyLocator: Locator,
  attempts = 3,
): Promise<Locator> {
  let dialog: Locator = page.getByRole("alertdialog");
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await dismissAllDialogs(page);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      dialog = await waitForDialogOpen(page);
      await readyLocator.waitFor({ state: "visible", timeout: 3000 });
      await waitForAnimation(page);
      await readyLocator.waitFor({ state: "visible", timeout: 1000 });
      return dialog;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await dismissAllDialogs(page);
    }
  }

  throw new Error(`Alert dialog did not remain open: ${lastError?.message ?? "unknown error"}`);
}

/**
 * Open a dialog with retry logic.
 * Returns the dialog locator once stable and ready.
 */
export async function openStableDialog(
  page: Page,
  trigger: Locator,
  dialog: Locator,
  readyLocator: Locator,
  dialogLabel: string,
  attempts = 2,
): Promise<Locator> {
  let lastError: Error | null = null;

  await trigger.waitFor({ state: "visible", timeout: 5000 });

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await dismissAllDialogs(page);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await waitForDialogOpen(page);
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await readyLocator.waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      return dialog;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await dismissAllDialogs(page);
    }
  }

  throw new Error(
    `${dialogLabel} dialog did not become ready: ${lastError?.message ?? "unknown error"}`,
  );
}

/** Get the ready locator for upload dialogs (the Upload button). */
export function getUploadDialogReadyLocator(dialog: Locator): Locator {
  return dialog.getByRole("button", { name: /^upload$/i });
}

export type CreateIssueModalHarness = {
  createIssueModal: Locator;
  issueTitleInput: Locator;
};

/** Wait for the dashboard customization dialog to be fully ready. */
export async function waitForDashboardCustomizeDialogReady(page: Page): Promise<Locator> {
  const dialog = page.getByRole("dialog", { name: /dashboard customization/i });
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("Quick Stats", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("Recent Activity", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("My Workspaces", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
  return dialog;
}

/** Wait for the Create Issue modal to be fully ready for screenshot capture. */
export async function waitForCreateIssueModalScreenshotReady(
  page: Page,
  modalHarness: CreateIssueModalHarness,
): Promise<void> {
  await modalHarness.issueTitleInput.waitFor({ state: "visible", timeout: 5000 });
  await page.getByLabel(/create another/i).waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
}
