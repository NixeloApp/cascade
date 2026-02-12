import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders correctly with default props", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders with a label and associates it correctly", () => {
    render(<Checkbox label="Accept Terms" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept Terms" });
    expect(checkbox).toBeInTheDocument();
  });

  it("renders with a description", () => {
    render(<Checkbox label="Accept Terms" description="Please read carefully" />);
    expect(screen.getByText("Please read carefully")).toBeInTheDocument();
  });

  it("associates description via aria-describedby", () => {
    render(<Checkbox label="Accept Terms" description="Please read carefully" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept Terms" });
    const descriptionElement = screen.getByText("Please read carefully");

    // The description element should have an ID
    expect(descriptionElement).toHaveAttribute("id");
    const descriptionId = descriptionElement.getAttribute("id");

    // The checkbox should point to that ID via aria-describedby
    expect(checkbox).toHaveAttribute("aria-describedby", descriptionId);
  });
});
