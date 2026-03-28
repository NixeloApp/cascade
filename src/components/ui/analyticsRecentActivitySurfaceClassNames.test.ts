import { describe, expect, it } from "vitest";
import {
  getAnalyticsRecentActivityAvatarClassName,
  getAnalyticsRecentActivityContentClassName,
  getAnalyticsRecentActivityItemClassName,
  getAnalyticsRecentActivityListClassName,
  getAnalyticsRecentActivityMetadataClassName,
  getAnalyticsRecentActivityRailClassName,
} from "./analyticsRecentActivitySurfaceClassNames";

describe("analyticsRecentActivitySurfaceClassNames", () => {
  it("returns the owned analytics recent activity shell classes", () => {
    expect(getAnalyticsRecentActivityListClassName()).toBe("relative");
    expect(getAnalyticsRecentActivityRailClassName()).toBe(
      "absolute left-4 top-4 bottom-4 w-px bg-ui-border",
    );
    expect(getAnalyticsRecentActivityAvatarClassName()).toBe("relative z-10");
    expect(getAnalyticsRecentActivityContentClassName()).toBe("min-w-0");
    expect(getAnalyticsRecentActivityMetadataClassName()).toBe("mt-1.5");
  });

  it("keeps the timeline item on the shared card recipe while owning its padding", () => {
    expect(getAnalyticsRecentActivityItemClassName()).toContain("p-3");
    expect(getAnalyticsRecentActivityItemClassName()).toContain("rounded-lg");
  });
});
