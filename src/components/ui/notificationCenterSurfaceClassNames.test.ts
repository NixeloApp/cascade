import { describe, expect, it } from "vitest";
import {
  getNotificationCenterBodyClassName,
  getNotificationCenterContentClassName,
  getNotificationCenterEmptyStateClassName,
  getNotificationCenterFilterClassName,
  getNotificationCenterFooterActionClassName,
  getNotificationCenterFooterClassName,
  getNotificationCenterGroupClassName,
  getNotificationCenterGroupHeaderClassName,
  getNotificationCenterGroupListClassName,
  getNotificationCenterHeaderClassName,
  getNotificationCenterPanelClassName,
  getNotificationCenterTriggerClassName,
  getNotificationCenterUnreadBadgeClassName,
} from "./notificationCenterSurfaceClassNames";

describe("notificationCenterSurfaceClassNames", () => {
  it("returns the owned popover panel chrome classes", () => {
    expect(getNotificationCenterBodyClassName()).toBe(
      "min-h-0 flex-1 overflow-y-auto p-0 scrollbar-subtle",
    );
    expect(getNotificationCenterPanelClassName()).toBe(
      "max-h-popover-panel w-full max-w-dialog-mobile sm:w-96",
    );
    expect(getNotificationCenterHeaderClassName()).toBe("sticky top-0 z-10 bg-ui-bg");
    expect(getNotificationCenterFooterActionClassName()).toBe("w-full justify-center gap-2");
    expect(getNotificationCenterFooterClassName(true)).toBe("bg-ui-bg");
    expect(getNotificationCenterFooterClassName(false)).toBeUndefined();
  });

  it("returns the owned trigger, empty state, and group chrome classes", () => {
    expect(getNotificationCenterTriggerClassName()).toContain("relative");
    expect(getNotificationCenterUnreadBadgeClassName()).toContain("absolute");
    expect(getNotificationCenterUnreadBadgeClassName()).toContain("animate-scale-in");
    expect(getNotificationCenterUnreadBadgeClassName()).toContain("bg-status-error");
    expect(getNotificationCenterFilterClassName(true)).toContain("shrink-0");
    expect(getNotificationCenterContentClassName()).toBe("h-full");
    expect(getNotificationCenterEmptyStateClassName()).toBe("min-h-56 px-6 py-10");
    expect(getNotificationCenterGroupClassName()).toBe("animate-fade-in");
    expect(getNotificationCenterGroupHeaderClassName()).toBe(
      "sticky top-0 z-10 border-b border-ui-border-secondary/60 bg-ui-bg px-4 py-2.5",
    );
    expect(getNotificationCenterGroupListClassName()).toBe("divide-y divide-ui-border");
  });
});
