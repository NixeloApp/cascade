import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SegmentedControl, SegmentedControlItem } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("supports the stacked mobile layout for full-width controls", () => {
    render(
      <SegmentedControl
        aria-label="Mode"
        defaultValue="duration"
        layout="stackOnMobile"
        width="fill"
        data-testid="root"
      >
        <SegmentedControlItem value="duration">Duration</SegmentedControlItem>
        <SegmentedControlItem value="timeRange">Time Range</SegmentedControlItem>
      </SegmentedControl>,
    );

    const root = screen.getByTestId("root");
    expect(root.className).toContain("flex-col");
    expect(root.className).toContain("sm:flex-row");
    expect(root.className).toContain("w-full");
  });

  it("inherits icon spacing on items from the parent control", () => {
    render(
      <SegmentedControl aria-label="View" defaultValue="list" iconSpacing data-testid="root">
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="board">Board</SegmentedControlItem>
      </SegmentedControl>,
    );

    const listItem = screen.getByRole("radio", { name: "List" });
    expect(listItem.className).toContain("gap-2");
  });
});
