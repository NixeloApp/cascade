import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortcutBadge } from "./ShortcutBadge";

describe("ShortcutBadge", () => {
  it("renders modifier shortcut correctly", () => {
    const item = {
      id: "test",
      description: "Test",
      modifierShortcut: "cmd+k",
    };
    render(<ShortcutBadge item={item} />);

    // In headless/CI (Linux), isMacPlatform() → false, so "cmd" maps to "Ctrl"
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("renders key sequence correctly", () => {
    const item = {
      id: "test",
      description: "Test",
      keySequence: "gh",
    };
    render(<ShortcutBadge item={item} />);

    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("then")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
  });

  it("renders single key correctly", () => {
    const item = {
      id: "test",
      description: "Test",
      singleKey: "?",
    };
    render(<ShortcutBadge item={item} />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
