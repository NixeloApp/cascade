import { describe, expect, it } from "vitest";
import {
  assertScreenshotHashIsNotLoadingState,
  getKnownLoadingStateHash,
  getScreenshotHash,
} from "../../e2e/utils/screenshot-hash-guards";

describe("screenshot hash guards", () => {
  it("hashes screenshot bytes deterministically", () => {
    const screenshot = Buffer.from("nixelo-screenshot");

    expect(getScreenshotHash(screenshot)).toBe(
      "e10d4c7cba307203b0a63233dca4866748574d57d8c0546b2d69f7d4e3367fdb",
    );
  });

  it("detects known loading-state hashes", () => {
    const match = getKnownLoadingStateHash(
      "4cac3655ab637e444d1838a7321916e816cf8b0d19210aeebbe187879da886f4",
    );

    expect(match?.samplePaths).toContain(
      "docs/design/specs/modals/screenshots/create-issue-desktop-dark.png",
    );
  });

  it("throws when a captured screenshot matches a known bad loading-state hash", () => {
    expect(() =>
      assertScreenshotHashIsNotLoadingState(
        "0137790ee9774f35fa6c8dabca1d12006c8821835417108cd318673e66442f5b",
        "mobile-light dashboard-customize-modal",
      ),
    ).toThrow(/known loading-state screenshot/i);
  });

  it("allows unknown screenshot hashes", () => {
    expect(() =>
      assertScreenshotHashIsNotLoadingState(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "desktop-dark dashboard",
      ),
    ).not.toThrow();
  });
});
