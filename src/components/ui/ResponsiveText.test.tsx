import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ResponsiveText } from "./ResponsiveText";

describe("ResponsiveText", () => {
  describe("Rendering", () => {
    it("should render short text in first span", () => {
      render(<ResponsiveText short="W" long="Week" />);

      expect(screen.getByText("W")).toBeInTheDocument();
    });

    it("should render long text in second span", () => {
      render(<ResponsiveText short="W" long="Week" />);

      expect(screen.getByText("Week")).toBeInTheDocument();
    });

    it("should render both short and long text", () => {
      render(<ResponsiveText short="M" long="Month" />);

      expect(screen.getByText("M")).toBeInTheDocument();
      expect(screen.getByText("Month")).toBeInTheDocument();
    });
  });

  describe("Breakpoint Variants", () => {
    it("should apply sm breakpoint classes by default", () => {
      const { container } = render(<ResponsiveText short="W" long="Week" />);

      const shortSpan = container.querySelector(".sm\\:hidden");
      const longSpan = container.querySelector(".hidden.sm\\:inline");

      expect(shortSpan).toBeInTheDocument();
      expect(longSpan).toBeInTheDocument();
    });

    it("should apply md breakpoint classes when specified", () => {
      const { container } = render(<ResponsiveText short="W" long="Week" breakpoint="md" />);

      const shortSpan = container.querySelector(".md\\:hidden");
      const longSpan = container.querySelector(".hidden.md\\:inline");

      expect(shortSpan).toBeInTheDocument();
      expect(longSpan).toBeInTheDocument();
    });

    it("should apply lg breakpoint classes when specified", () => {
      const { container } = render(<ResponsiveText short="W" long="Week" breakpoint="lg" />);

      const shortSpan = container.querySelector(".lg\\:hidden");
      const longSpan = container.querySelector(".hidden.lg\\:inline");

      expect(shortSpan).toBeInTheDocument();
      expect(longSpan).toBeInTheDocument();
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className to wrapper", () => {
      render(<ResponsiveText short="W" long="Week" className="custom-class" />);

      const wrapper = screen.getByText("W").parentElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should forward additional HTML attributes", () => {
      render(<ResponsiveText short="W" long="Week" data-testid="responsive-text" id="my-text" />);

      const wrapper = screen.getByTestId("responsive-text");
      expect(wrapper).toHaveAttribute("id", "my-text");
    });
  });
});
