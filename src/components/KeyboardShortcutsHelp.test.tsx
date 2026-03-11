import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
  it("renders the dialog and updated omnibox wording", () => {
    render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Open search and commands")).toBeInTheDocument();
  });

  it("filters shortcuts based on search input", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Search shortcuts..."), "create");

    expect(screen.getByText("Create new issue")).toBeInTheDocument();
    expect(screen.queryByText("Open search and commands")).not.toBeInTheDocument();
  });

  it("shows modifier shortcuts with key badges", () => {
    render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

    expect(screen.getAllByText("Ctrl").length).toBeGreaterThan(0);
    expect(screen.getAllByText("K").length).toBeGreaterThan(0);
  });

  it("autofocuses the search field and closes via Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByPlaceholderText("Search shortcuts...");
    expect(input).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders the updated footer hint", () => {
    render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getAllByText("Close").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Esc").length).toBeGreaterThan(0);
  });
});
