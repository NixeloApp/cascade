import { describe, expect, it } from "vitest";
import {
  getCalendarMonthDesktopEventListClassName,
  getCalendarMonthMobileEventListClassName,
  getCalendarMonthOverflowTriggerClassName,
} from "./calendarMonthSurfaceClassNames";

describe("calendarMonthSurfaceClassNames", () => {
  it("builds the responsive event-list visibility helpers", () => {
    expect(getCalendarMonthMobileEventListClassName()).toContain("md:hidden");
    expect(getCalendarMonthDesktopEventListClassName()).toContain("hidden");
    expect(getCalendarMonthDesktopEventListClassName()).toContain("md:flex");
  });

  it("builds the overflow trigger offset helper", () => {
    expect(getCalendarMonthOverflowTriggerClassName()).toContain("mt-0.5");
  });
});
