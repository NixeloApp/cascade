import { describe, expect, it } from "vitest";
import { getCalendarWeekActiveDayScrollTarget } from "./calendar-body-week";

describe("getCalendarWeekActiveDayScrollTarget", () => {
  it("preserves the current vertical scroll while bringing the active day into view", () => {
    expect(getCalendarWeekActiveDayScrollTarget(248, 672)).toEqual({
      left: 208,
      top: 672,
    });
  });

  it("clamps the horizontal target to zero for the first visible day", () => {
    expect(getCalendarWeekActiveDayScrollTarget(20, 384)).toEqual({
      left: 0,
      top: 384,
    });
  });
});
