import { describe, expect, it } from "vitest";
import {
  getAlertCountBadgeClassName,
  getCalendarDayBadgeClassName,
  getIssueKeyBadgeClassName,
  getMentionInputBadgeClassName,
  getProjectHeaderKeyBadgeClassName,
} from "./badgeSurfaceClassNames";

describe("badgeSurfaceClassNames", () => {
  it("builds the mention-input helper classes", () => {
    const classes = getMentionInputBadgeClassName();

    expect(classes).toContain("font-normal");
    expect(classes).toContain("px-1");
    expect(classes).toContain("text-sm");
  });

  it("builds the fab alert-count helper classes", () => {
    const classes = getAlertCountBadgeClassName("fab");

    expect(classes).toContain("bg-status-error");
    expect(classes).toContain("min-h-6");
    expect(classes).toContain("min-w-6");
  });

  it("builds calendar day classes for the today state", () => {
    const classes = getCalendarDayBadgeClassName("today");

    expect(classes).toContain("h-6");
    expect(classes).toContain("w-6");
    expect(classes).toContain("bg-brand");
  });

  it("builds the issue key and project header key helpers", () => {
    expect(getIssueKeyBadgeClassName()).toContain("font-mono");
    expect(getProjectHeaderKeyBadgeClassName()).toContain("tracking-wider");
  });
});
