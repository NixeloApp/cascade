import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("applies surface variant styling", () => {
    render(<Input variant="surface" data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input.className).toContain("bg-ui-bg");
    expect(input.className).toContain("border-ui-border");
  });

  it("renders error message", () => {
    render(<Input error="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("links error message via aria-describedby", () => {
    const { container } = render(<Input error="Invalid input" />);
    const input = screen.getByRole("textbox");
    const errorMessage = screen.getByText("Invalid input");

    // The error message should have an ID
    expect(errorMessage.id).not.toBe("");
    expect(typeof errorMessage.id).toBe("string");
    expect(errorMessage.id.length).toBeGreaterThan(0);

    // The input should point to that ID
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining(errorMessage.id));
  });

  it("preserves existing aria-describedby", () => {
    render(
      <>
        <span id="helper">Helper text</span>
        <Input error="Invalid input" aria-describedby="helper" />
      </>,
    );
    const input = screen.getByRole("textbox");
    const errorMessage = screen.getByText("Invalid input");

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain("helper");
    expect(describedBy).toContain(errorMessage.id);
  });

  it("uses provided id for linking", () => {
    render(<Input id="my-input" error="Invalid input" />);
    const errorMessage = screen.getByText("Invalid input");

    // Should use the provided ID as base
    expect(errorMessage.id).toBe("my-input-error");
  });
});
