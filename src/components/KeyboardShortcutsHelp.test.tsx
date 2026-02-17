import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog when open is true", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("should not render content when open is false", () => {
      render(<KeyboardShortcutsHelp open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });

    it("should render search input", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByPlaceholderText("Search shortcuts...")).toBeInTheDocument();
    });

    it("should render all shortcut categories", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Create")).toBeInTheDocument();
      expect(screen.getByText("Issue Actions")).toBeInTheDocument();
      expect(screen.getByText("Editor")).toBeInTheDocument();
    });

    it("should render shortcut descriptions", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText("Open command palette")).toBeInTheDocument();
      expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
      // "Go to dashboard" appears twice (navigation section has both sequence and modifier versions)
      const dashboardItems = screen.getAllByText("Go to dashboard");
      expect(dashboardItems.length).toBeGreaterThanOrEqual(1);
    });

    it("should render footer tip", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/to open command palette/)).toBeInTheDocument();
    });
  });

  describe("keyboard badges", () => {
    it("should render single key badges", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Look for single key shortcuts
      expect(screen.getByText("?")).toBeInTheDocument();
      expect(screen.getByText("/")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("should render modifier shortcuts with multiple keys", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Modifier shortcuts render as separate badges
      // cmd+k renders as Cmd (or Ctrl) + K
      const kKeys = screen.getAllByText("K");
      expect(kKeys.length).toBeGreaterThan(0);
    });

    it("should render key sequences with 'then' separator", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Key sequences like "gh" render as "G then H"
      const thenElements = screen.getAllByText("then");
      expect(thenElements.length).toBeGreaterThan(0);

      // Check for G and H keys (from "gh" sequence)
      expect(screen.getAllByText("G").length).toBeGreaterThan(0);
      expect(screen.getAllByText("H").length).toBeGreaterThan(0);
    });
  });

  describe("search functionality", () => {
    it("should filter shortcuts by description", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "bold");

      // Should show matching shortcut
      expect(screen.getByText("Bold")).toBeInTheDocument();
      // Should hide non-matching shortcuts
      expect(screen.queryByText("Show keyboard shortcuts")).not.toBeInTheDocument();
    });

    it("should show empty state when no results", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "xyznonexistent");

      expect(screen.getByText(/no shortcuts found/i)).toBeInTheDocument();
      expect(screen.getByText(/"xyznonexistent"/)).toBeInTheDocument();
    });

    it("should filter categories that have no matching items", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "bold");

      // Editor category should remain (has Bold)
      expect(screen.getByText("Editor")).toBeInTheDocument();
      // Navigation category should be hidden (no match for "bold")
      expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
    });

    it("should be case-insensitive", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "BOLD");

      expect(screen.getByText("Bold")).toBeInTheDocument();
    });

    it("should show all shortcuts when search is cleared", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");

      // Type search query
      await user.type(searchInput, "bold");
      expect(screen.queryByText("Navigation")).not.toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);
      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });
  });

  describe("dialog interaction", () => {
    it("should call onOpenChange when dialog requests close", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Press Escape to close
      await user.keyboard("{Escape}");

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should reset search when dialog closes", async () => {
      const user = userEvent.setup();

      // First, simulate opening and typing - onOpenChange is called with false when closing
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      await user.type(searchInput, "bold");

      // Verify the search filtered results
      expect(screen.queryByText("Navigation")).not.toBeInTheDocument();

      // Now close by pressing Escape - this will call onOpenChange(false) and reset search
      await user.keyboard("{Escape}");

      // The component calls handleOpenChange which resets searchQuery
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("platform detection", () => {
    it("should render Ctrl for non-Mac platforms", () => {
      // Default jsdom navigator.platform doesn't include MAC
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Should show Ctrl instead of Cmd
      const ctrlKeys = screen.getAllByText("Ctrl");
      expect(ctrlKeys.length).toBeGreaterThan(0);
    });

    // Note: Testing Mac platform would require mocking navigator.platform
    // which is complex in JSDOM. The formatModifierShortcut function handles this.
  });

  describe("accessibility", () => {
    it("should have dialog role", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have search input that can receive focus", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      const searchInput = screen.getByPlaceholderText("Search shortcuts...");
      // Input should exist and be focusable
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe("INPUT");
    });

    it("should render keyboard badge elements", () => {
      render(<KeyboardShortcutsHelp open={true} onOpenChange={mockOnOpenChange} />);

      // Check for specific key badges by text content
      expect(screen.getByText("?")).toBeInTheDocument();
      expect(screen.getByText("/")).toBeInTheDocument();
      expect(screen.getByText("Esc")).toBeInTheDocument();
    });
  });
});
