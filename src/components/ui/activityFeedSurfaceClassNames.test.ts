import { describe, expect, it } from "vitest";
import {
  getActivityFeedActionColorClassName,
  getActivityFeedContainerClassName,
  getActivityFeedContentClassName,
  getActivityFeedDetailClassName,
  getActivityFeedEmptyStateClassName,
  getActivityFeedEntryClassName,
  getActivityFeedIconCenterClassName,
  getActivityFeedIconShellClassName,
  getActivityFeedIssueLinkClassName,
  getActivityFeedMessageClassName,
  getActivityFeedRailClassName,
  getActivityFeedTimestampClassName,
} from "./activityFeedSurfaceClassNames";

describe("activityFeedSurfaceClassNames", () => {
  it("returns the owned timeline shell classes", () => {
    expect(getActivityFeedEmptyStateClassName()).toBe("max-w-full");
    expect(getActivityFeedContainerClassName()).toBe("relative");
    expect(getActivityFeedRailClassName()).toBe("absolute bottom-6 left-3 top-6 w-px bg-ui-border");
    expect(getActivityFeedEntryClassName()).toBe("relative");
  });

  it("returns the owned icon and content chrome classes", () => {
    expect(getActivityFeedIconShellClassName(true)).toBe("relative z-10 size-5 shrink-0");
    expect(getActivityFeedIconShellClassName(false)).toBe("relative z-10 size-6 shrink-0");
    expect(getActivityFeedIconCenterClassName()).toBe("h-full");
    expect(getActivityFeedContentClassName()).toBe("min-w-0");
    expect(getActivityFeedMessageClassName()).toBe("m-0");
    expect(getActivityFeedDetailClassName()).toBe("mt-1 truncate text-ui-text-secondary");
    expect(getActivityFeedTimestampClassName()).toBe("shrink-0 text-ui-text-tertiary");
  });

  it("returns owned action and issue-key styling classes", () => {
    expect(getActivityFeedActionColorClassName("created")).toBe("text-status-success");
    expect(getActivityFeedActionColorClassName("commented")).toBe("text-accent");
    expect(getActivityFeedActionColorClassName("unknown")).toBe("text-ui-text-secondary");
    expect(getActivityFeedIssueLinkClassName()).toContain("ml-1");
    expect(getActivityFeedIssueLinkClassName()).toContain("font-mono");
    expect(getActivityFeedIssueLinkClassName()).toContain("text-brand");
  });
});
