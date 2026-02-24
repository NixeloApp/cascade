import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { NavItem } from "./NavItem";

describe("NavItem", () => {
  describe("Basic Rendering", () => {
    it("should render children", () => {
      render(<NavItem>Dashboard</NavItem>);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should render icon when provided", () => {
      render(<NavItem icon={<span data-testid="icon">icon</span>}>Dashboard</NavItem>);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should hide children when collapsed", () => {
      render(<NavItem collapsed>Dashboard</NavItem>);
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });
  });

  describe("Active State", () => {
    it("should have hover styles when not active", () => {
      const { container } = render(<NavItem>Dashboard</NavItem>);
      expect(container.firstChild).toHaveClass("hover:bg-ui-bg-hover");
      expect(container.firstChild).not.toHaveClass("bg-ui-bg-hover");
    });

    it("should have active styles when active", () => {
      const { container } = render(<NavItem active>Dashboard</NavItem>);
      expect(container.firstChild).toHaveClass("bg-ui-bg-hover");
      expect(container.firstChild).toHaveClass("text-ui-text");
    });

    it("should have aria-current when active", () => {
      const { container } = render(<NavItem active>Dashboard</NavItem>);
      expect(container.firstChild).toHaveAttribute("aria-current", "page");
    });

    it("should not have aria-current when not active", () => {
      const { container } = render(<NavItem>Dashboard</NavItem>);
      expect(container.firstChild).not.toHaveAttribute("aria-current");
    });
  });

  describe("Bordered Variant", () => {
    it("should have border when active and bordered", () => {
      const { container } = render(
        <NavItem active variant="bordered">
          Dashboard
        </NavItem>,
      );
      expect(container.firstChild).toHaveClass("border-l-2");
      expect(container.firstChild).toHaveClass("border-brand");
    });

    it("should not have border when not active", () => {
      const { container } = render(<NavItem variant="bordered">Dashboard</NavItem>);
      expect(container.firstChild).not.toHaveClass("border-l-2");
    });

    it("should remove border when collapsed", () => {
      const { container } = render(
        <NavItem active variant="bordered" collapsed>
          Dashboard
        </NavItem>,
      );
      expect(container.firstChild).toHaveClass("border-l-0");
    });
  });

  describe("Sizes", () => {
    it("should apply small size", () => {
      const { container } = render(<NavItem size="sm">Dashboard</NavItem>);
      expect(container.firstChild).toHaveClass("px-2");
      expect(container.firstChild).toHaveClass("py-1.5");
    });

    it("should apply medium size by default", () => {
      const { container } = render(<NavItem>Dashboard</NavItem>);
      expect(container.firstChild).toHaveClass("px-3");
      expect(container.firstChild).toHaveClass("py-2");
    });
  });
});
