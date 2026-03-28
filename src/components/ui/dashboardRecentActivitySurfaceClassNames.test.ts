import { describe, expect, it } from "vitest";
import {
  getDashboardRecentActivityAvatarShellClassName,
  getDashboardRecentActivityContentClassName,
  getDashboardRecentActivityIssueKeyClassName,
  getDashboardRecentActivityItemClassName,
  getDashboardRecentActivityRailClassName,
  getDashboardRecentActivityScrollAreaClassName,
} from "./dashboardRecentActivitySurfaceClassNames";

describe("dashboardRecentActivitySurfaceClassNames", () => {
  it("returns the owned timeline shell classes", () => {
    expect(getDashboardRecentActivityScrollAreaClassName()).toBe(
      "relative max-h-96 overflow-y-auto pr-2 scrollbar-subtle",
    );
    expect(getDashboardRecentActivityRailClassName()).toBe(
      "absolute bottom-4 left-4 top-4 w-px bg-ui-border/60",
    );
    expect(getDashboardRecentActivityItemClassName()).toBe("relative px-2 py-2");
  });

  it("returns the owned avatar, content, and badge chrome classes", () => {
    expect(getDashboardRecentActivityAvatarShellClassName()).toBe("relative z-10 bg-ui-bg");
    expect(getDashboardRecentActivityContentClassName()).toBe("min-w-0");
    expect(getDashboardRecentActivityIssueKeyClassName()).toContain("w-fit");
    expect(getDashboardRecentActivityIssueKeyClassName()).toContain("font-mono");
  });
});
