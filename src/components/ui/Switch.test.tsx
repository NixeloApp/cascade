import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders correctly with default props", () => {
    render(<Switch />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("renders with a label and associates it correctly", () => {
    render(<Switch label="Test Label" />);
    const switchElement = screen.getByRole("switch", { name: "Test Label" });
    expect(switchElement).toBeInTheDocument();
  });

  it("renders with a description", () => {
    render(<Switch label="Test Label" description="Test Description" />);
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  // These tests are for the NEW functionality
  it("associates description via aria-describedby", () => {
    render(<Switch label="Test Label" description="Test Description" />);
    const switchElement = screen.getByRole("switch", { name: "Test Label" });
    const descriptionElement = screen.getByText("Test Description");

    expect(descriptionElement).toHaveAttribute("id");
    const descriptionId = descriptionElement.getAttribute("id");
    expect(switchElement).toHaveAttribute("aria-describedby", descriptionId);
  });

  it("accepts ReactNode for label", () => {
    render(<Switch label={<span data-testid="custom-label">Custom Label</span>} />);
    const switchElement = screen.getByRole("switch");
    // Since we pass a node, the accessible name might not be automatically derived by getByRole if it's complex,
    // but the Label component should handle it if it wraps the content.
    // However, if we pass a node to Label, it renders it.
    expect(screen.getByTestId("custom-label")).toBeInTheDocument();
  });

  it("accepts ReactNode for description", () => {
    render(
      <Switch
        label="Test Label"
        description={<span data-testid="custom-desc">Custom Description</span>}
      />,
    );
    const descriptionElement = screen.getByTestId("custom-desc");
    expect(descriptionElement).toBeInTheDocument();

    // Should still have aria-describedby
    const switchElement = screen.getByRole("switch");
    // We need to find the container that has the ID, which should be the parent of our custom desc or the element itself if we passed props?
    // In our implementation plan, we wrap the description in a div with the ID.
    // So the descriptionElement's parent should have the ID.
    const container = descriptionElement.closest("div");
    // Wait, the implementation might put the ID on the wrapper div.

    // Let's verify via the switch's aria-describedby
    const describedBy = switchElement.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: guaranteed by toBeTruthy
    const descriptionContainer = document.getElementById(describedBy!);
    expect(descriptionContainer).toBeInTheDocument();
    expect(descriptionContainer).toContainElement(descriptionElement);
  });
});
