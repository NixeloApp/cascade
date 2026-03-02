import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
  describe("Rendering", () => {
    it("should render dialog with title when open", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(<KeyboardShortcutsHelp open={false} onOpenChange={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render search input with placeholder", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByPlaceholderText("Search shortcuts...")).toBeInTheDocument();
    });

    it("should render shortcut categories", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Create")).toBeInTheDocument();
      expect(screen.getByText("Issue Actions")).toBeInTheDocument();
      expect(screen.getByText("Editor")).toBeInTheDocument();
    });

    it("should render shortcut descriptions", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Open command palette")).toBeInTheDocument();
      expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
      expect(screen.getByText("Create new issue")).toBeInTheDocument();
    });
  });

  describe("Search Filtering", () => {
    it("should filter shortcuts based on search query", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "create");

      // Should show create-related shortcuts
      expect(screen.getByText("Create new issue")).toBeInTheDocument();
      expect(screen.getByText("Create new document")).toBeInTheDocument();
      expect(screen.getByText("Create new project")).toBeInTheDocument();

      // Should not show other shortcuts
      expect(screen.queryByText("Open command palette")).not.toBeInTheDocument();
      expect(screen.queryByText("Bold")).not.toBeInTheDocument();
    });

    it("should show empty state when no shortcuts match", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "xyznonexistent");

      expect(screen.getByText(/No shortcuts found for/)).toBeInTheDocument();
      expect(screen.getByText(/"xyznonexistent"/)).toBeInTheDocument();
    });

    it("should be case insensitive in search", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "BOLD");

      expect(screen.getByText("Bold")).toBeInTheDocument();
    });

    it("should filter out empty categories", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "bold");

      // Only Editor category should remain
      expect(screen.getByText("Editor")).toBeInTheDocument();
      expect(screen.queryByText("General")).not.toBeInTheDocument();
      expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
    });
  });

  describe("Shortcut Types", () => {
    it("should display modifier shortcuts with key badges", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      // Check for modifier shortcut display (Ctrl+K on non-Mac test env)
      // kbd elements should be present for shortcuts
      const kbdElements = document.querySelectorAll("kbd");
      expect(kbdElements.length).toBeGreaterThan(0);
      // Should have Ctrl and K for the command palette shortcut (multiple exist)
      expect(screen.getAllByText("Ctrl").length).toBeGreaterThan(0);
      expect(screen.getAllByText("K").length).toBeGreaterThan(0);
    });

    it("should display single key shortcuts", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      // "?" for show keyboard shortcuts
      expect(screen.getByText("?")).toBeInTheDocument();
      // "/" for focus search
      expect(screen.getByText("/")).toBeInTheDocument();
      // "C" for create issue
      expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("should display key sequences with 'then' separator", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      // Key sequences like "gh" should display as "G then H"
      // Multiple G's may exist, so use getAllByText
      expect(screen.getAllByText("G").length).toBeGreaterThan(0);
      expect(screen.getAllByText("then").length).toBeGreaterThan(0);
      expect(screen.getAllByText("H").length).toBeGreaterThan(0);
    });
  });

  describe("Modal Behavior", () => {
    it("should call onOpenChange when closed", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

      // Press Escape to close
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should clear search when user types and then clears", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");

      // Type in search
      await user.type(searchInput, "create");
      expect(searchInput).toHaveValue("create");

      // Clear the search
      await user.clear(searchInput);
      expect(searchInput).toHaveValue("");

      // All categories should be visible again
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });

    it("should autofocus search input when opened", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      expect(searchInput).toHaveFocus();
    });
  });

  describe("Footer", () => {
    it("should display command palette hint in footer", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText(/to open command palette/)).toBeInTheDocument();
    });
  });
});
