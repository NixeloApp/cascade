import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "./Badge";

describe("Badge", () => {
  describe("rendering", () => {
    it("renders children text", () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText("Test Badge")).toBeInTheDocument();
    });

    it("renders as span element", () => {
      render(<Badge data-testid="badge">Content</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge.tagName).toBe("SPAN");
    });

    it("forwards ref correctly", () => {
      const ref = { current: null as HTMLSpanElement | null };
      render(<Badge ref={ref}>With Ref</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe("variants", () => {
    it("applies default variant (neutral)", () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-ui-bg-soft");
    });

    it("applies primary variant", () => {
      render(
        <Badge variant="primary" data-testid="badge">
          Primary
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-brand-subtle");
    });

    it("applies success variant", () => {
      render(
        <Badge variant="success" data-testid="badge">
          Success
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-status-success-bg");
    });

    it("applies error variant", () => {
      render(
        <Badge variant="error" data-testid="badge">
          Error
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-status-error-bg");
    });

    it("applies warning variant", () => {
      render(
        <Badge variant="warning" data-testid="badge">
          Warning
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-status-warning-bg");
    });

    it("applies secondary variant", () => {
      render(
        <Badge variant="secondary" data-testid="badge">
          Secondary
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("bg-ui-bg-soft");
    });
  });

  describe("sizes", () => {
    it("applies default size (sm)", () => {
      render(<Badge data-testid="badge">Small</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("text-xs");
      expect(badge.className).toContain("px-2");
    });

    it("applies md size", () => {
      render(
        <Badge size="md" data-testid="badge">
          Medium
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("py-1");
    });
  });

  describe("shapes", () => {
    it("applies default shape (rounded)", () => {
      render(<Badge data-testid="badge">Rounded</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("rounded");
      expect(badge.className).not.toContain("rounded-full");
    });

    it("applies pill shape", () => {
      render(
        <Badge shape="pill" data-testid="badge">
          Pill
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("rounded-full");
    });
  });

  describe("custom className", () => {
    it("merges custom className", () => {
      render(
        <Badge className="custom-class" data-testid="badge">
          Custom
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.className).toContain("custom-class");
      expect(badge.className).toContain("inline-flex"); // Default class still present
    });
  });

  describe("additional props", () => {
    it("passes through HTML attributes", () => {
      render(
        <Badge data-testid="badge" id="my-badge" title="Badge title">
          Attrs
        </Badge>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.id).toBe("my-badge");
      expect(badge.title).toBe("Badge title");
    });
  });

  describe("badgeVariants", () => {
    it("returns correct classes for variant combinations", () => {
      const classes = badgeVariants({ variant: "success", size: "md", shape: "pill" });
      expect(classes).toContain("bg-status-success-bg");
      expect(classes).toContain("py-1");
      expect(classes).toContain("rounded-full");
    });

    it("returns default classes when no options provided", () => {
      const classes = badgeVariants();
      expect(classes).toContain("bg-ui-bg-soft");
      expect(classes).toContain("rounded");
    });
  });
});
