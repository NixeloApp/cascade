import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AIErrorFallback } from "./AIErrorFallback";

describe("AIErrorFallback", () => {
  describe("Rendering", () => {
    it("should render default title and message", () => {
      render(<AIErrorFallback />);

      expect(screen.getByText("AI Assistant Error")).toBeInTheDocument();
      expect(
        screen.getByText("Something went wrong with the AI assistant. Please try again."),
      ).toBeInTheDocument();
    });

    it("should render custom title", () => {
      render(<AIErrorFallback title="Custom Error Title" />);

      expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
    });

    it("should render custom message", () => {
      render(<AIErrorFallback message="Custom error message text" />);

      expect(screen.getByText("Custom error message text")).toBeInTheDocument();
    });

    it("should render warning icon", () => {
      const { container } = render(<AIErrorFallback />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Retry Button", () => {
    it("should render Try Again button when onRetry provided", () => {
      render(<AIErrorFallback onRetry={vi.fn()} />);

      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });

    it("should not render Try Again button when onRetry not provided", () => {
      render(<AIErrorFallback />);

      expect(screen.queryByRole("button", { name: /Try Again/i })).not.toBeInTheDocument();
    });

    it("should call onRetry when Try Again is clicked", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<AIErrorFallback onRetry={onRetry} />);

      await user.click(screen.getByRole("button", { name: /Try Again/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Details", () => {
    it("should not show error details when no error provided", () => {
      render(<AIErrorFallback />);

      expect(screen.queryByText("Error Details")).not.toBeInTheDocument();
    });

    it("should not show error details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      render(<AIErrorFallback error={new Error("Test error")} />);

      expect(screen.queryByText("Error Details")).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
