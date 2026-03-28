import { describe, expect, it } from "vitest";
import {
  getProductShowcaseActionIconClassName,
  getProductShowcaseBadgeRowClassName,
  getProductShowcaseBodyClassName,
  getProductShowcaseCardShellClassName,
  getProductShowcaseDescriptionClassName,
  getProductShowcaseGlowClassName,
  getProductShowcaseHeaderContentClassName,
  getProductShowcaseHeaderRailClassName,
  getProductShowcaseHeaderRowClassName,
  getProductShowcaseHeaderSurfaceClassName,
  getProductShowcaseHeadingClassName,
  getProductShowcasePanelClassName,
  getProductShowcaseRootClassName,
  getProductShowcaseTitleClassName,
} from "./productShowcaseSurfaceClassNames";

describe("productShowcaseSurfaceClassNames", () => {
  it("returns the owned landing shell classes", () => {
    expect(getProductShowcaseRootClassName()).toBe("relative mx-auto max-w-6xl");
    expect(getProductShowcaseGlowClassName()).toBe(
      "pointer-events-none absolute inset-x-16 top-8 h-52 bg-landing-accent/14 blur-glow",
    );
    expect(getProductShowcaseCardShellClassName()).toBe("overflow-hidden");
    expect(getProductShowcaseBodyClassName()).toBe(
      "bg-linear-to-b from-ui-bg-soft/82 via-ui-bg-elevated/96 to-ui-bg px-4 py-5 sm:px-6 sm:py-6",
    );
  });

  it("returns the owned showcase chrome classes", () => {
    expect(getProductShowcaseHeaderSurfaceClassName()).toBe("p-0");
    expect(getProductShowcaseHeaderRowClassName()).toBe("w-full");
    expect(getProductShowcaseHeaderContentClassName()).toBe("min-w-0");
    expect(getProductShowcaseHeaderRailClassName()).toBe("hidden shrink-0 lg:flex");
    expect(getProductShowcasePanelClassName()).toBe("h-full");
    expect(getProductShowcaseBadgeRowClassName()).toBe("shrink-0");
    expect(getProductShowcaseHeadingClassName()).toBe("min-w-0");
    expect(getProductShowcaseDescriptionClassName()).toBe("max-w-3xl leading-5");
    expect(getProductShowcaseTitleClassName()).toBe("truncate");
    expect(getProductShowcaseActionIconClassName()).toBe("mt-0.5");
  });
});
