import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LoadingOverlay, LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<LoadingSpinner />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      // No redundant aria-label on the container
      expect(status).not.toHaveAttribute("aria-label");
    });

    it("should render sr-only text when no message provided", () => {
      render(<LoadingSpinner />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toHaveClass("sr-only");
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

    it("should NOT render sr-only text when message provided", () => {
      render(<LoadingSpinner message="Please wait..." />);

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render with small size", () => {
      const { container } = render(<LoadingSpinner size="sm" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-4");
      expect(visualSpinner).toHaveClass("w-4");
      expect(visualSpinner).toHaveClass("border-2");
    });

    it("should render with medium size (default)", () => {
      const { container } = render(<LoadingSpinner size="md" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-8");
      expect(visualSpinner).toHaveClass("w-8");
      expect(visualSpinner).toHaveClass("border-2");
    });

    it("should render with large size", () => {
      const { container } = render(<LoadingSpinner size="lg" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-12");
      expect(visualSpinner).toHaveClass("w-12");
      expect(visualSpinner).toHaveClass("border-3");
    });

    it("should use medium size when no size prop provided", () => {
      const { container } = render(<LoadingSpinner />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-8");
      expect(visualSpinner).toHaveClass("w-8");
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className to the visual spinner", () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("custom-class");
    });

    it("should combine custom className with size classes", () => {
      const { container } = render(<LoadingSpinner size="sm" className="text-red-500" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-4");
      expect(visualSpinner).toHaveClass("text-red-500");
    });

    it("should have default animation and border classes", () => {
      const { container } = render(<LoadingSpinner />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("animate-spin");
      expect(visualSpinner).toHaveClass("rounded-full");
      expect(visualSpinner).toHaveClass("border-ui-text-secondary");
      expect(visualSpinner).toHaveClass("border-t-transparent");
    });

    it("should render with brand variant", () => {
      const { container } = render(<LoadingSpinner variant="brand" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("border-brand");
      expect(visualSpinner).toHaveClass("border-t-transparent");
    });

    it("should apply pulse animation when animation is pulse", () => {
      const { container } = render(<LoadingSpinner animation="pulse" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("animate-pulse");
      expect(visualSpinner).not.toHaveClass("animate-spin");
    });
  });

  describe("Props Combinations", () => {
    it("should work with only size prop", () => {
      const { container } = render(<LoadingSpinner size="lg" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-12");
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("should work with only message prop", () => {
      const { container } = render(<LoadingSpinner message="Loading data..." />);

      expect(screen.getByText("Loading data...")).toBeInTheDocument();

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-8"); // default md
    });

    it("should work with only className prop", () => {
      const { container } = render(<LoadingSpinner className="my-custom-class" />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("my-custom-class");
      expect(visualSpinner).toHaveClass("h-8"); // default md
    });
  });

  describe("Message Display", () => {
    it("should render message with correct styling", () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);

      const message = container.querySelector("p");
      expect(message).toHaveClass("text-sm");
      expect(message).toHaveClass("text-ui-text-secondary");
    });
  });

  describe("Accessibility", () => {
    it("should have role status on container", () => {
      render(<LoadingSpinner />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass("flex");
    });

    it("should NOT have redundant aria-label", () => {
      render(<LoadingSpinner />);

      // The container should not have aria-label "Loading" because we rely on text content
      const status = screen.getByRole("status");
      expect(status).not.toHaveAttribute("aria-label", "Loading");
    });

    it("should hide visual spinner from accessibility tree", () => {
      const { container } = render(<LoadingSpinner />);

      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toBeInTheDocument();
    });

    it("should have sr-only text for screen readers when no message", () => {
      const { container } = render(<LoadingSpinner />);

      const srOnly = container.querySelector(".sr-only");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent("Loading...");
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
      const { container } = render(<LoadingOverlay />);

      // Check visual spinner inside overlay
      const visualSpinner = container.querySelector('[aria-hidden="true"]');
      expect(visualSpinner).toHaveClass("h-12");
      expect(visualSpinner).toHaveClass("w-12");
    });
  });

  describe("Integration", () => {
    it("should work as overlay with all LoadingSpinner features", () => {
      render(<LoadingOverlay message="Saving changes..." />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(screen.getByText("Saving changes...")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument(); // sr-only text absent because message is present
    });
  });
});
