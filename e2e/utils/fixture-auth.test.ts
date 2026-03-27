import type { BrowserContext, Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TEST_USERS } from "../config";
import {
  loginContextUserWithRepair,
  loginFixtureUserWithRepair,
  loginPageUserWithRepair,
} from "./fixture-auth";
import { testUserService } from "./test-user-service";

describe("fixture auth helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs repair details and injects auth tokens for context login", async () => {
    const context = {
      addInitScript: vi.fn(async () => {}),
    } as BrowserContext;
    const loginSpy = vi.spyOn(testUserService, "loginTestUserWithRepair").mockResolvedValueOnce({
      success: true,
      token: "jwt-token",
      refreshToken: "refresh-token",
      repairAttempted: true,
      repairedAccount: true,
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await loginContextUserWithRepair(context, TEST_USERS.teamLead, "screenshot auth fallback");

    expect(loginSpy).toHaveBeenCalledWith(
      TEST_USERS.teamLead.email,
      TEST_USERS.teamLead.password,
      true,
    );
    expect(context.addInitScript).toHaveBeenCalledWith(expect.any(Function), {
      token: "jwt-token",
      refreshToken: "refresh-token",
      convexUrl: process.env.VITE_CONVEX_URL,
    });
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes(
          `repaired stale seeded account state before screenshot auth fallback`,
        ),
      ),
    ).toBe(true);
  });

  it("uses the page context when logging in through a page", async () => {
    const context = {
      addInitScript: vi.fn(async () => {}),
    } as BrowserContext;
    const page = {
      context: vi.fn(() => context),
    } as Page;
    const loginSpy = vi.spyOn(testUserService, "loginTestUserWithRepair").mockResolvedValueOnce({
      success: true,
      token: "jwt-token",
      refreshToken: "refresh-token",
    });

    await loginPageUserWithRepair(page, TEST_USERS.viewer, "page auth", false);

    expect(page.context).toHaveBeenCalledTimes(1);
    expect(loginSpy).toHaveBeenCalledWith(
      TEST_USERS.viewer.email,
      TEST_USERS.viewer.password,
      false,
    );
    expect(context.addInitScript).toHaveBeenCalledTimes(1);
  });

  it("preserves the fixture bootstrap label through the fixture wrapper", async () => {
    const context = {
      addInitScript: vi.fn(async () => {}),
    } as BrowserContext;
    vi.spyOn(testUserService, "loginTestUserWithRepair").mockResolvedValueOnce({
      success: true,
      token: "jwt-token",
      refreshToken: "refresh-token",
      repairAttempted: true,
      repairedAccount: false,
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await loginFixtureUserWithRepair(context, TEST_USERS.teamLead);

    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes(`attempted seeded-account repair before fixture bootstrap`),
      ),
    ).toBe(true);
    expect(context.addInitScript).toHaveBeenCalledTimes(1);
  });

  it("throws when login succeeds without an auth token", async () => {
    const context = {
      addInitScript: vi.fn(async () => {}),
    } as BrowserContext;
    vi.spyOn(testUserService, "loginTestUserWithRepair").mockResolvedValueOnce({
      success: true,
      error: "missing token",
    });

    await expect(loginContextUserWithRepair(context, TEST_USERS.teamLead)).rejects.toThrow(
      `Failed to authenticate as ${TEST_USERS.teamLead.email}: missing token`,
    );
    expect(context.addInitScript).not.toHaveBeenCalled();
  });
});
