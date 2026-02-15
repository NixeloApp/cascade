import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LoadingOverlay, LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should render sr-only text", () => {
      render(<LoadingSpinner />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not render message when not provided", () => {
      const { container } = render(<LoadingSpinner />);

      const message = container.querySelector("p");
      expect(message).not.toBeInTheDocument();
    });

    it("should render message when provided", () => {
      render(<LoadingSpinner message="Please wait..." />);

      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render with small size", () => {
      render(<LoadingSpinner size="sm" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-4");
      expect(spinner).toHaveClass("w-4");
      expect(spinner).toHaveClass("border-2");
    });

    it("should render with medium size (default)", () => {
      render(<LoadingSpinner size="md" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-8");
      expect(spinner).toHaveClass("w-8");
      expect(spinner).toHaveClass("border-2");
    });

    it("should render with large size", () => {
      render(<LoadingSpinner size="lg" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-12");
      expect(spinner).toHaveClass("w-12");
      expect(spinner).toHaveClass("border-3");
    });

    it("should use medium size when no size prop provided", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-8");
      expect(spinner).toHaveClass("w-8");
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      render(<LoadingSpinner className="custom-class" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("custom-class");
    });

    it("should combine custom className with size classes", () => {
      render(<LoadingSpinner size="sm" className="text-red-500" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-4");
      expect(spinner).toHaveClass("text-red-500");
    });

    it("should have default animation and border classes", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("animate-spin");
      expect(spinner).toHaveClass("rounded-full");
      expect(spinner).toHaveClass("border-ui-text-secondary");
      expect(spinner).toHaveClass("border-t-transparent");
    });

    it("should render with brand variant", () => {
      render(<LoadingSpinner variant="brand" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("border-brand");
      expect(spinner).toHaveClass("border-t-transparent");
    });

    it("should render with inherit variant", () => {
      render(<LoadingSpinner variant="inherit" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("border-current");
      expect(spinner).toHaveClass("border-t-transparent");
    });

    it("should apply pulse animation when animation is pulse", () => {
      render(<LoadingSpinner animation="pulse" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("animate-pulse");
      expect(spinner).not.toHaveClass("animate-spin");
    });

    it("should work without custom className", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Props Combinations", () => {
    it("should work with only size prop", () => {
      render(<LoadingSpinner size="lg" />);

      expect(screen.getByRole("status")).toHaveClass("h-12");
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("should work with only message prop", () => {
      render(<LoadingSpinner message="Loading data..." />);

      expect(screen.getByText("Loading data...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveClass("h-8"); // default md
    });

    it("should work with only className prop", () => {
      render(<LoadingSpinner className="my-custom-class" />);

      expect(screen.getByRole("status")).toHaveClass("my-custom-class");
      expect(screen.getByRole("status")).toHaveClass("h-8"); // default md
    });

    it("should work with all props", () => {
      render(<LoadingSpinner size="sm" className="text-blue-500" message="Processing..." />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-4");
      expect(spinner).toHaveClass("text-blue-500");
      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });
  });

  describe("Message Display", () => {
    it("should render message with correct styling", () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);

      const message = container.querySelector("p");
      expect(message).toHaveClass("text-sm");
      expect(message).toHaveClass("text-ui-text-secondary");
    });

    it("should handle long messages", () => {
      const longMessage = "A".repeat(200);
      render(<LoadingSpinner message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Loading: <>&\"'";
      render(<LoadingSpinner message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("should handle empty string message", () => {
      const { container } = render(<LoadingSpinner message="" />);

      // Empty string is falsy, so no paragraph should render
      const message = container.querySelector("p");
      expect(message).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have role status", () => {
      render(<LoadingSpinner />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should have aria-label", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should have sr-only text for screen readers", () => {
      const { container } = render(<LoadingSpinner />);

      const srOnly = container.querySelector(".sr-only");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent("Loading...");
    });

    it("should maintain accessibility with custom className", () => {
      render(<LoadingSpinner className="custom" />);

      expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
    });
  });

  describe("Container Structure", () => {
    it("should have flex container with correct classes", () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-col");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("justify-center");
      expect(wrapper).toHaveClass("gap-3");
    });

    it("should contain spinner and message in correct order", () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);

      const wrapper = container.firstChild as HTMLElement;
      const children = wrapper.children;

      expect(children[0]).toBe(screen.getByRole("status"));
      expect(children[1]).toHaveTextContent("Loading...");
    });
  });
});

describe("LoadingOverlay", () => {
  describe("Basic Rendering", () => {
    it("should render overlay wrapper", () => {
      const { container } = render(<LoadingOverlay />);

      const overlay = container.querySelector(".absolute");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass("inset-0");
      expect(overlay).toHaveClass("bg-ui-bg/90");
    });

    it("should render LoadingSpinner with large size", () => {
      render(<LoadingOverlay />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("h-12");
      expect(spinner).toHaveClass("w-12");
    });

    it("should render without message when not provided", () => {
      render(<LoadingOverlay />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();

      const { container } = render(<LoadingOverlay />);
      const message = container.querySelector("p");
      expect(message).not.toBeInTheDocument();
    });

    it("should render with message when provided", () => {
      render(<LoadingOverlay message="Loading data..." />);

      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
  });

  describe("Overlay Styling", () => {
    it("should have correct z-index and positioning", () => {
      const { container } = render(<LoadingOverlay />);

      const overlay = container.querySelector(".absolute");
      expect(overlay).toHaveClass("z-10");
      expect(overlay).toHaveClass("rounded-lg");
    });

    it("should center the spinner", () => {
      const { container } = render(<LoadingOverlay />);

      const overlay = container.querySelector(".absolute");
      expect(overlay).toHaveClass("flex");
      expect(overlay).toHaveClass("items-center");
      expect(overlay).toHaveClass("justify-center");
    });
  });

  describe("Props", () => {
    it("should pass message to LoadingSpinner", () => {
      render(<LoadingOverlay message="Please wait..." />);

      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("should handle long messages", () => {
      const longMessage = "B".repeat(150);
      render(<LoadingOverlay message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle empty string message", () => {
      const { container } = render(<LoadingOverlay message="" />);

      const message = container.querySelector("p");
      expect(message).not.toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("should work as overlay with all LoadingSpinner features", () => {
      render(<LoadingOverlay message="Saving changes..." />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Loading");
      expect(screen.getByText("Saving changes...")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument(); // sr-only text
    });
  });
});
