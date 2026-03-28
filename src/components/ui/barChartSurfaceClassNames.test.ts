import { describe, expect, it } from "vitest";
import { getBarChartFillClassName, getBarChartTrackClassName } from "./barChartSurfaceClassNames";

describe("barChartSurfaceClassNames", () => {
  it("returns the shared track chrome", () => {
    expect(getBarChartTrackClassName()).toBe("relative h-6 rounded-full bg-ui-bg-tertiary");
  });

  it("maps semantic tones to the shared fill chrome", () => {
    expect(getBarChartFillClassName("brand")).toContain("bg-brand");
    expect(getBarChartFillClassName("warning")).toContain("bg-status-warning");
    expect(getBarChartFillClassName("accent")).toContain("pr-2");
  });
});
