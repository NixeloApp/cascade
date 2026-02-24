
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";
import React from "react";

describe("Disabled State Styling", () => {
  it("Checkbox: applies disabled styles to label container when disabled", () => {
    const { container } = render(<Checkbox label="Test Checkbox" disabled />);

    // The structure is Flex -> [Checkbox, div.grid -> [label]]
    // We want to find the div.grid that contains the label
    // OR we can just check if the label itself has cursor-not-allowed
    // and if the parent div has opacity-70

    const label = screen.getByText("Test Checkbox");
    expect(label).toHaveClass("cursor-not-allowed");

    const labelContainer = label.parentElement;
    expect(labelContainer).toHaveClass("opacity-70");
    expect(labelContainer).toHaveClass("cursor-not-allowed");
  });

  it("Checkbox: does not apply disabled styles when enabled", () => {
    const { container } = render(<Checkbox label="Test Checkbox" />);

    const label = screen.getByText("Test Checkbox");
    expect(label).not.toHaveClass("cursor-not-allowed");

    const labelContainer = label.parentElement;
    expect(labelContainer).not.toHaveClass("opacity-70");
    expect(labelContainer).not.toHaveClass("cursor-not-allowed");
  });

  it("RadioGroupItem: applies disabled styles to label container when disabled", () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1" label="Test Radio" disabled />
      </RadioGroup>
    );

    const label = screen.getByText("Test Radio");
    expect(label).toHaveClass("cursor-not-allowed");

    const labelContainer = label.parentElement;
    expect(labelContainer).toHaveClass("opacity-70");
    expect(labelContainer).toHaveClass("cursor-not-allowed");
  });

  it("RadioGroupItem: does not apply disabled styles when enabled", () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1" label="Test Radio" />
      </RadioGroup>
    );

    const label = screen.getByText("Test Radio");
    expect(label).not.toHaveClass("cursor-not-allowed");

    const labelContainer = label.parentElement;
    expect(labelContainer).not.toHaveClass("opacity-70");
    expect(labelContainer).not.toHaveClass("cursor-not-allowed");
  });
});
