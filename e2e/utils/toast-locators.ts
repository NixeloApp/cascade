import type { Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";

const ANY_TOAST_TEST_ID = /^toast-(success|error|info)$/;

export function getToastLocator(page: Page, type?: "success" | "error" | "info") {
  if (type === "success") {
    return page.getByTestId(TEST_IDS.TOAST.SUCCESS);
  }
  if (type === "error") {
    return page.getByTestId(TEST_IDS.TOAST.ERROR);
  }
  if (type === "info") {
    return page.getByTestId(TEST_IDS.TOAST.INFO);
  }
  return page.getByTestId(ANY_TOAST_TEST_ID);
}
