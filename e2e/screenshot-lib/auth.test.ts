import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../convex/shared/routes";
import { loginPageUserWithRepair } from "../utils/fixture-auth";
import { waitForDashboardReady, waitForScreenshotReady } from "../utils/wait-helpers";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import { BASE_URL, SCREENSHOT_AUTH_USER } from "./config";
import { waitForSpinnersHidden } from "./readiness";

vi.mock("../utils/fixture-auth", () => ({
  loginPageUserWithRepair: vi.fn(),
}));

vi.mock("../utils/wait-helpers", () => ({
  waitForDashboardReady: vi.fn(),
  waitForScreenshotReady: vi.fn(),
}));

vi.mock("./readiness", () => ({
  waitForSpinnersHidden: vi.fn(),
}));

describe("screenshot auth helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("warms an already-authenticated page without re-signing in", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady).mockResolvedValueOnce();
    vi.mocked(waitForSpinnersHidden).mockResolvedValueOnce();
    vi.mocked(waitForScreenshotReady).mockResolvedValueOnce();

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(true);
    expect(page.goto).toHaveBeenCalledWith(`${BASE_URL}${ROUTES.dashboard.build("acme")}`, {
      waitUntil: "load",
    });
    expect(loginPageUserWithRepair).not.toHaveBeenCalled();
  });

  it("falls back to shared injected-token login when dashboard warmup fails", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady)
      .mockRejectedValueOnce(new Error("not signed in"))
      .mockResolvedValueOnce();
    vi.mocked(waitForSpinnersHidden).mockResolvedValueOnce();
    vi.mocked(waitForScreenshotReady).mockResolvedValueOnce();
    vi.mocked(loginPageUserWithRepair).mockResolvedValueOnce();

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(true);
    expect(loginPageUserWithRepair).toHaveBeenCalledWith(
      page,
      SCREENSHOT_AUTH_USER,
      "screenshot auth fallback",
      true,
    );
    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it("returns false when shared injected-token login fallback fails", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady).mockRejectedValueOnce(new Error("not signed in"));
    vi.mocked(loginPageUserWithRepair).mockRejectedValueOnce(new Error("repair failed"));

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(false);
    expect(page.goto).toHaveBeenCalledTimes(1);
  });

  it("returns false when dashboard warmup still fails after shared login fallback", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady)
      .mockRejectedValueOnce(new Error("not signed in"))
      .mockRejectedValueOnce(new Error("dashboard still not ready"));
    vi.mocked(loginPageUserWithRepair).mockResolvedValueOnce();

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(false);
    expect(loginPageUserWithRepair).toHaveBeenCalledTimes(1);
    expect(page.goto).toHaveBeenCalledTimes(2);
  });
});
