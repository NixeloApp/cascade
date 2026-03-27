import { describe, expect, it } from "vitest";
import {
  E2E_LOADING_OVERRIDES,
  getE2ELoadingOverrideReason,
  getE2ELoadingOverrideWindowKey,
  isE2ELoadingOverrideEnabled,
} from "./e2e-loading-overrides";

describe("e2e-loading-overrides", () => {
  it("keeps the remaining loading overrides centralized with non-empty reasons", () => {
    expect(Object.keys(E2E_LOADING_OVERRIDES)).toEqual(["dashboard", "issues"]);

    for (const key of Object.keys(E2E_LOADING_OVERRIDES) as Array<
      keyof typeof E2E_LOADING_OVERRIDES
    >) {
      expect(getE2ELoadingOverrideReason(key)).not.toHaveLength(0);
      expect(getE2ELoadingOverrideWindowKey(key)).toMatch(/^__NIXELO_E2E_[A-Z_]+__$/);
    }
  });

  it("checks the documented window flag for the requested override key", () => {
    window.__NIXELO_E2E_DASHBOARD_LOADING__ = true;
    window.__NIXELO_E2E_ISSUES_LOADING__ = false;

    expect(isE2ELoadingOverrideEnabled("dashboard")).toBe(true);
    expect(isE2ELoadingOverrideEnabled("issues")).toBe(false);
  });
});
