import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCanonicalCaptureNamesForPrefix,
  getCanonicalEmptyCaptureNames,
  getCanonicalPublicCaptureNames,
  getEmptyCaptureNames,
  getEmptyScreenshotTargets,
  getPublicCaptureNames,
  getPublicScreenshotTargets,
  getSelectedEmptyCaptureGroups,
  getSelectedEmptyCaptureGroupsForNames,
  screenshotEmptyStates,
  screenshotPublicPages,
  validateEmptyScreenshotTargets,
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
    expect(getCanonicalCaptureNamesForPrefix("public")).toEqual(canonicalPublicNames);
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

  it("keeps the empty target manifest aligned with canonical screenshot ids", () => {
    const canonicalEmptyNames = SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
      const [prefix, ...rest] = pageId.split("-");
      if (prefix !== "empty" || rest.length === 0) {
        return [];
      }

      return [rest.join("-")];
    });

    expect(getEmptyCaptureNames()).toEqual(canonicalEmptyNames);
    expect(getCanonicalCaptureNamesForPrefix("empty")).toEqual(canonicalEmptyNames);
    expect(getCanonicalEmptyCaptureNames()).toEqual(canonicalEmptyNames);
    expect(getEmptyScreenshotTargets()).toHaveLength(canonicalEmptyNames.length);
    expect(getEmptyCaptureNames("bootstrap")).toEqual(
      canonicalEmptyNames.filter((name) => name !== "my-issues"),
    );
    expect(getEmptyCaptureNames("separate-auth")).toEqual(["my-issues"]);
    expect(() => validateEmptyScreenshotTargets()).not.toThrow();
  });

  it("derives selected empty capture groups from the canonical empty target manifest", () => {
    shouldCaptureAny.mockImplementation(
      (_prefix: string, names: string[]) => names[0] !== "my-issues",
    );

    expect(getSelectedEmptyCaptureGroups()).toEqual([
      {
        group: "bootstrap",
        names: getEmptyCaptureNames("bootstrap"),
      },
    ]);
  });

  it("derives selected empty capture groups from explicit empty capture names", () => {
    expect(getSelectedEmptyCaptureGroupsForNames(["dashboard", "my-issues"])).toEqual([
      {
        group: "bootstrap",
        names: ["dashboard"],
      },
      {
        group: "separate-auth",
        names: ["my-issues"],
      },
    ]);

    expect(getSelectedEmptyCaptureGroupsForNames(["my-issues"])).toEqual([
      {
        group: "separate-auth",
        names: ["my-issues"],
      },
    ]);
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

  it("captures bootstrap empty routes from the canonical empty target manifest", async () => {
    await screenshotEmptyStates({ goto: vi.fn(async () => {}) } as Partial<Page> as Page, "acme");

    expect(shouldCaptureAny).toHaveBeenCalledWith("empty", getEmptyCaptureNames("bootstrap"));
    expect(takeScreenshot).toHaveBeenCalledTimes(getEmptyCaptureNames("bootstrap").length);
    expect(
      takeScreenshot.mock.calls.map(([, prefix, name]) => `${String(prefix)}-${String(name)}`),
    ).toEqual(getEmptyCaptureNames("bootstrap").map((name) => `empty-${name}`));
  });

  it("captures separate-auth empty routes from the same canonical manifest", async () => {
    await screenshotEmptyStates({ goto: vi.fn(async () => {}) } as Partial<Page> as Page, "acme", {
      group: "separate-auth",
    });

    expect(shouldCaptureAny).toHaveBeenCalledWith("empty", getEmptyCaptureNames("separate-auth"));
    expect(takeScreenshot).toHaveBeenCalledTimes(getEmptyCaptureNames("separate-auth").length);
    expect(
      takeScreenshot.mock.calls.map(([, prefix, name]) => `${String(prefix)}-${String(name)}`),
    ).toEqual(getEmptyCaptureNames("separate-auth").map((name) => `empty-${name}`));
  });
});
