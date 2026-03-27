import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../convex/shared/routes";
import { ensureUserExistsAndSignIn } from "../utils/auth-helpers";
import { waitForDashboardReady, waitForScreenshotReady } from "../utils/wait-helpers";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import { BASE_URL, SCREENSHOT_AUTH_USER } from "./config";
import { waitForSpinnersHidden } from "./readiness";

vi.mock("../utils/auth-helpers", () => ({
  ensureUserExistsAndSignIn: vi.fn(),
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
    expect(ensureUserExistsAndSignIn).not.toHaveBeenCalled();
  });

  it("falls back to sign-in when dashboard warmup fails", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady)
      .mockRejectedValueOnce(new Error("not signed in"))
      .mockResolvedValueOnce();
    vi.mocked(waitForSpinnersHidden).mockResolvedValueOnce();
    vi.mocked(waitForScreenshotReady).mockResolvedValueOnce();
    vi.mocked(ensureUserExistsAndSignIn).mockResolvedValueOnce(true);

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(true);
    expect(ensureUserExistsAndSignIn).toHaveBeenCalledWith(
      page,
      BASE_URL,
      SCREENSHOT_AUTH_USER,
      true,
    );
    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it("returns false when sign-in fallback fails", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    vi.mocked(waitForDashboardReady).mockRejectedValueOnce(new Error("not signed in"));
    vi.mocked(ensureUserExistsAndSignIn).mockResolvedValueOnce(false);

    const result = await ensureAuthenticatedScreenshotPage(page, "acme");

    expect(result).toBe(false);
    expect(page.goto).toHaveBeenCalledTimes(1);
  });
});
