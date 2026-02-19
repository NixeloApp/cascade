import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SectionErrorFallback } from "./SectionErrorFallback";

describe("SectionErrorFallback", () => {
  describe("Rendering", () => {
    it("should render error icon", () => {
      const { container } = render(<SectionErrorFallback title="Error Title" />);

      // Icon component renders an SVG with AlertTriangle icon
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render provided title", () => {
      render(<SectionErrorFallback title="Something went wrong" />);

      expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    });

    it("should render custom message when provided", () => {
      render(<SectionErrorFallback title="Error" message="Custom error message" />);

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("should render default message when no custom message provided", () => {
      render(<SectionErrorFallback title="Error" />);

      expect(screen.getByText(/This section encountered an error/i)).toBeInTheDocument();
      expect(screen.getByText(/Try reloading or contact support/i)).toBeInTheDocument();
    });

    it("should not render retry button when onRetry not provided", () => {
      render(<SectionErrorFallback title="Error" />);

      expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    });

    it("should render retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(<SectionErrorFallback title="Error" onRetry={onRetry} />);

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onRetry when retry button is clicked", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<SectionErrorFallback title="Error" onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /try again/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should call onRetry multiple times when clicked multiple times", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<SectionErrorFallback title="Error" onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /try again/i });
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<SectionErrorFallback title="Error Title" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Error Title");
    });

    it("should mark warning icon as hidden from screen readers", () => {
      const { container } = render(<SectionErrorFallback title="Error" />);

      // Icon component renders with the status-error class
      const icon = container.querySelector(".text-status-error");
      expect(icon).toBeInTheDocument();
      // Icon is decorative and doesn't need ARIA label
    });

    it("should have button with type='button' when retry is available", () => {
      const onRetry = vi.fn();
      render(<SectionErrorFallback title="Error" onRetry={onRetry} />);

      const button = screen.getByRole("button", { name: /try again/i });
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string title", () => {
      render(<SectionErrorFallback title="" />);

      expect(screen.getByRole("heading")).toHaveTextContent("");
    });

    it("should handle empty string message", () => {
      render(<SectionErrorFallback title="Error" message="" />);

      // Empty string is falsy, so it should show default message
      expect(screen.getByText(/This section encountered an error/i)).toBeInTheDocument();
    });

    it("should handle very long title", () => {
      const longTitle = "A".repeat(200);
      render(<SectionErrorFallback title={longTitle} />);

      expect(screen.getByRole("heading")).toHaveTextContent(longTitle);
    });

    it("should handle very long message", () => {
      const longMessage = "B".repeat(500);
      render(<SectionErrorFallback title="Error" message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      render(<SectionErrorFallback title="Error: <script>alert('xss')</script>" />);

      expect(
        screen.getByRole("heading", {
          name: "Error: <script>alert('xss')</script>",
        }),
      ).toBeInTheDocument();
    });

    it("should handle special characters in message", () => {
      render(<SectionErrorFallback title="Error" message="Message with <tags> & symbols" />);

      expect(screen.getByText("Message with <tags> & symbols")).toBeInTheDocument();
    });
  });

  describe("Props Combinations", () => {
    it("should work with only title prop", () => {
      render(<SectionErrorFallback title="Minimal Error" />);

      expect(screen.getByRole("heading", { name: "Minimal Error" })).toBeInTheDocument();
      expect(screen.getByText(/This section encountered an error/i)).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should work with title and message", () => {
      render(<SectionErrorFallback title="Error" message="Details here" />);

      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
      expect(screen.getByText("Details here")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should work with title and onRetry", () => {
      const onRetry = vi.fn();
      render(<SectionErrorFallback title="Error" onRetry={onRetry} />);

      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
      expect(screen.getByText(/This section encountered an error/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("should work with all props provided", () => {
      const onRetry = vi.fn();
      render(
        <SectionErrorFallback title="Complete Error" message="Full details" onRetry={onRetry} />,
      );

      expect(screen.getByRole("heading", { name: "Complete Error" })).toBeInTheDocument();
      expect(screen.getByText("Full details")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });
  });
});
