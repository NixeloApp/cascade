import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCanonicalPublicCaptureNames,
  getPublicCaptureNames,
  getPublicScreenshotTargets,
  screenshotPublicPages,
  validatePublicScreenshotTargets,
} from "./public-pages";
import { SCREENSHOT_PAGE_IDS } from "./targets";

const { getCurrentConfigUnsubscribeToken, shouldCaptureAny, takeScreenshot } = vi.hoisted(() => ({
  getCurrentConfigUnsubscribeToken: vi.fn(() => "unsubscribe-token"),
  shouldCaptureAny: vi.fn(() => true),
  takeScreenshot: vi.fn(async () => {}),
}));

vi.mock("./capture", () => ({
  getCurrentConfigUnsubscribeToken,
  shouldCaptureAny,
  takeScreenshot,
}));

describe("public screenshot targets", () => {
  afterEach(() => {
    takeScreenshot.mockClear();
    shouldCaptureAny.mockClear();
    getCurrentConfigUnsubscribeToken.mockClear();
    shouldCaptureAny.mockReturnValue(true);
    getCurrentConfigUnsubscribeToken.mockReturnValue("unsubscribe-token");
  });

  it("keeps the public target manifest aligned with canonical screenshot ids", () => {
    const canonicalPublicNames = SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
      const [prefix, ...rest] = pageId.split("-");
      if (prefix !== "public" || rest.length === 0) {
        return [];
      }

      return [rest.join("-")];
    });

    expect(getPublicCaptureNames()).toEqual(canonicalPublicNames);
    expect(getPublicCaptureNames("seeded")).toEqual([
      "invite",
      "unsubscribe",
      "portal",
      "portal-project",
    ]);
    expect(getPublicCaptureNames("seedless")).toEqual(
      canonicalPublicNames.filter((name) => !getPublicCaptureNames("seeded").includes(name)),
    );
    expect(getCanonicalPublicCaptureNames()).toEqual(canonicalPublicNames);
    expect(getPublicScreenshotTargets("all")).toHaveLength(canonicalPublicNames.length);
    expect(() => validatePublicScreenshotTargets()).not.toThrow();
  });

  it("captures only seedless public routes in seedless mode", async () => {
    await screenshotPublicPages(
      { goto: vi.fn(async () => {}) } as Partial<Page> as Page,
      undefined,
      {
        group: "seedless",
      },
    );

    expect(shouldCaptureAny).toHaveBeenCalledWith("public", getPublicCaptureNames("seedless"));
    expect(takeScreenshot).toHaveBeenCalledTimes(getPublicCaptureNames("seedless").length);
    expect(
      takeScreenshot.mock.calls.map(([, prefix, name]) => `${String(prefix)}-${String(name)}`),
    ).toEqual(getPublicCaptureNames("seedless").map((name) => `public-${name}`));
  });

  it("captures only seeded public routes that have the required seeded tokens", async () => {
    await screenshotPublicPages(
      { goto: vi.fn(async () => {}) } as Partial<Page> as Page,
      {
        inviteToken: "invite-token",
        portalProjectId: "project-1",
        portalToken: "portal-token",
        unsubscribeTokens: ["unsubscribe-token"],
      },
      { group: "seeded" },
    );

    expect(shouldCaptureAny).toHaveBeenCalledWith("public", getPublicCaptureNames("seeded"));
    expect(takeScreenshot).toHaveBeenCalledTimes(getPublicCaptureNames("seeded").length);
    expect(
      takeScreenshot.mock.calls.map(([, prefix, name]) => `${String(prefix)}-${String(name)}`),
    ).toEqual(getPublicCaptureNames("seeded").map((name) => `public-${name}`));
    expect(getCurrentConfigUnsubscribeToken).toHaveBeenCalledTimes(1);
  });

  it("skips seeded public routes whose required tokens are missing", async () => {
    getCurrentConfigUnsubscribeToken.mockReturnValueOnce(undefined);

    await screenshotPublicPages(
      { goto: vi.fn(async () => {}) } as Partial<Page> as Page,
      {
        inviteToken: "invite-token",
        portalProjectId: undefined,
        portalToken: undefined,
        unsubscribeTokens: [],
      },
      { group: "seeded" },
    );

    expect(
      takeScreenshot.mock.calls.map(([, prefix, name]) => `${String(prefix)}-${String(name)}`),
    ).toEqual(["public-invite"]);
    expect(getCurrentConfigUnsubscribeToken).toHaveBeenCalledTimes(1);
  });
});
