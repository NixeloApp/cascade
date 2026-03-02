import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AIAssistantButton } from "./AIAssistantButton";

describe("AIAssistantButton", () => {
  const defaultProps = {
    onClick: vi.fn(),
  };

  describe("Rendering", () => {
    it("should render button with aria-label", () => {
      render(<AIAssistantButton {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Open AI Assistant/i })).toBeInTheDocument();
    });

    it("should render icon", () => {
      const { container } = render(<AIAssistantButton {...defaultProps} />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have title attribute with keyboard shortcut", () => {
      render(<AIAssistantButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", expect.stringContaining("Cmd/Ctrl+Shift+A"));
    });
  });

  describe("Unread Count", () => {
    it("should not show badge when unreadCount is 0", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={0} />);

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("should show badge with unread count", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={3} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should show 9+ when unread count exceeds max", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={15} />);

      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("should update aria-label with unread count", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={5} />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        expect.stringContaining("5 unread"),
      );
    });

    it("should update title with unread count", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={2} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", expect.stringContaining("2 new suggestion"));
    });

    it("should pluralize suggestions correctly for multiple", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={3} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", expect.stringContaining("suggestions"));
    });

    it("should not pluralize suggestion for single", () => {
      render(<AIAssistantButton {...defaultProps} unreadCount={1} />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("title")).toMatch(/1 new suggestion(?!s)/);
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<AIAssistantButton onClick={onClick} />);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(<AIAssistantButton {...defaultProps} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should use custom keyboard shortcut in title", () => {
      render(<AIAssistantButton {...defaultProps} keyboardShortcut="Alt+A" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", expect.stringContaining("Alt+A"));
    });
  });

  describe("Size Variants", () => {
    it("should render with small size", () => {
      render(<AIAssistantButton {...defaultProps} size="sm" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-12", "h-12");
    });

    it("should render with medium size (default)", () => {
      render(<AIAssistantButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-14", "h-14");
    });

    it("should render with large size", () => {
      render(<AIAssistantButton {...defaultProps} size="lg" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-16", "h-16");
    });
  });
});
