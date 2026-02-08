import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<Textarea error="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("links error message via aria-describedby", () => {
    const { container } = render(<Textarea error="Invalid input" />);
    const textarea = screen.getByRole("textbox");
    const errorMessage = screen.getByText("Invalid input");

    // The error message should have an ID
    expect(errorMessage.id).toBeTruthy();

    // The textarea should point to that ID
    expect(textarea).toHaveAttribute("aria-describedby", expect.stringContaining(errorMessage.id));
  });

  it("preserves existing aria-describedby", () => {
    render(
      <>
        <span id="helper">Helper text</span>
        <Textarea error="Invalid input" aria-describedby="helper" />
      </>,
    );
    const textarea = screen.getByRole("textbox");
    const errorMessage = screen.getByText("Invalid input");

    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toContain("helper");
    expect(describedBy).toContain(errorMessage.id);
  });

  it("uses provided id for linking", () => {
    render(<Textarea id="my-textarea" error="Invalid input" />);
    const errorMessage = screen.getByText("Invalid input");

    // Should use the provided ID as base
    expect(errorMessage.id).toBe("my-textarea-error");
  });
});
