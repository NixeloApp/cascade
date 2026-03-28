import { describe, expect, it } from "vitest";
import {
  getIssuesCalendarContentClassName,
  getIssuesCalendarDayCellClassName,
  getIssuesCalendarDayCellHeightClassName,
  getIssuesCalendarEmptyDayCellClassName,
  getIssuesCalendarGridCardClassName,
  getIssuesCalendarGridViewportClassName,
  getIssuesCalendarIssueContentClassName,
  getIssuesCalendarIssueRowClassName,
  getIssuesCalendarIssueTitleClassName,
  getIssuesCalendarIssueTypeIconClassName,
  getIssuesCalendarMonthLabelClassName,
  getIssuesCalendarNavigationButtonClassName,
  getIssuesCalendarNavigationClassName,
  getIssuesCalendarPriorityLegendDotClassName,
  getIssuesCalendarShellClassName,
  getIssuesCalendarWeekdayHeaderRowClassName,
  getIssuesCalendarWeekdayLabelClassName,
} from "./issuesCalendarSurfaceClassNames";

describe("issuesCalendarSurfaceClassNames", () => {
  it("returns the owned shell and grid classes", () => {
    expect(getIssuesCalendarDayCellHeightClassName()).toBe("min-h-32 md:min-h-24");
    expect(getIssuesCalendarEmptyDayCellClassName()).toBe(
      "min-h-32 md:min-h-24 bg-ui-bg-secondary",
    );
    expect(getIssuesCalendarDayCellClassName()).toBe(
      "group transition-colors min-h-32 md:min-h-24",
    );
    expect(getIssuesCalendarShellClassName()).toBe("overflow-auto");
    expect(getIssuesCalendarContentClassName()).toBe("m-3 sm:m-6");
    expect(getIssuesCalendarGridViewportClassName()).toBe("overflow-x-auto");
    expect(getIssuesCalendarGridCardClassName()).toBe("min-w-160 overflow-hidden");
    expect(getIssuesCalendarWeekdayHeaderRowClassName()).toBe(
      "border-b border-ui-border bg-ui-bg-secondary",
    );
    expect(getIssuesCalendarWeekdayLabelClassName()).toBe("text-center");
  });

  it("returns the owned issue row, navigation, and legend classes", () => {
    expect(getIssuesCalendarIssueRowClassName()).toBe("w-full");
    expect(getIssuesCalendarIssueContentClassName()).toBe("min-w-0");
    expect(getIssuesCalendarIssueTypeIconClassName()).toBe("shrink-0");
    expect(getIssuesCalendarIssueTitleClassName()).toBe("truncate");
    expect(getIssuesCalendarNavigationClassName()).toBe("w-full sm:w-auto sm:justify-start");
    expect(getIssuesCalendarNavigationButtonClassName()).toBe("size-11 sm:size-8");
    expect(getIssuesCalendarMonthLabelClassName()).toBe("w-full text-center sm:min-w-48");
    expect(getIssuesCalendarPriorityLegendDotClassName("highest")).toBe("bg-status-error");
    expect(getIssuesCalendarPriorityLegendDotClassName("high")).toBe("bg-status-warning");
    expect(getIssuesCalendarPriorityLegendDotClassName("medium")).toBe("bg-accent-ring");
    expect(getIssuesCalendarPriorityLegendDotClassName("low")).toBe("bg-brand-ring");
    expect(getIssuesCalendarPriorityLegendDotClassName("lowest")).toBe("bg-ui-text-secondary");
  });
});
