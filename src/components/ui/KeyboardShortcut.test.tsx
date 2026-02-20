import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcut } from "./KeyboardShortcut";

describe("KeyboardShortcut", () => {
  it("renders text keys correctly with aria-labels", () => {
    render(<KeyboardShortcut shortcut="Ctrl+K" />);

    // Check for "Ctrl" text
    const ctrlKey = screen.getByText("Ctrl");
    expect(ctrlKey).toBeInTheDocument();

    // Check for aria-label "Control"
    expect(ctrlKey.closest("kbd")).toHaveAttribute("aria-label", "Control");

    // Check for "K" text
    const kKey = screen.getByText("K");
    expect(kKey).toBeInTheDocument();
    expect(kKey.closest("kbd")).toHaveAttribute("aria-label", "K");
  });

  it("renders icon keys correctly with aria-labels", () => {
    render(<KeyboardShortcut shortcut="Cmd+Enter" />);

    // Check for "Command" label (icon is hidden)
    // We search by aria-label since the icon is visual only
    const cmdKey = screen.getByLabelText("Command");
    expect(cmdKey).toBeInTheDocument();

    const enterKey = screen.getByLabelText("Enter");
    expect(enterKey).toBeInTheDocument();
  });

  it("renders multiple keys", () => {
    render(<KeyboardShortcut shortcut="A+B" />);
    expect(screen.getByLabelText("A")).toBeInTheDocument();
    expect(screen.getByLabelText("B")).toBeInTheDocument();
  });
});
