import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "./Badge";

describe("Badge", () => {
  it("renders children in a span and forwards refs", () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(
      <Badge ref={ref} data-testid="badge">
        Status
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveTextContent("Status");
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("uses the neutral small default contract", () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("bg-ui-bg-soft");
    expect(badge.className).toContain("text-xs");
    expect(badge.className).toContain("rounded");
  });

  it("supports the reduced semantic variant set", () => {
    render(
      <Badge variant="accent" data-testid="badge">
        Accent
      </Badge>,
    );

    expect(screen.getByTestId("badge").className).toContain("bg-accent-subtle");
  });

  it("allows priority and status tones to override the base surface", () => {
    render(
      <>
        <Badge priorityTone="high" data-testid="priority">
          High
        </Badge>
        <Badge statusTone="success" data-testid="status">
          Active
        </Badge>
      </>,
    );

    expect(screen.getByTestId("priority").className).toContain("text-priority-high");
    expect(screen.getByTestId("status").className).toContain("text-status-success-text");
  });

  it("supports md and emphasis sizes", () => {
    render(
      <>
        <Badge size="md" data-testid="md">
          Medium
        </Badge>
        <Badge size="emphasis" data-testid="emphasis">
          Strong
        </Badge>
      </>,
    );

    expect(screen.getByTestId("md").className).toContain("py-1");
    expect(screen.getByTestId("emphasis").className).toContain("font-bold");
  });

  it("supports the pill shape and merges custom class names", () => {
    render(
      <Badge shape="pill" className="custom-class" data-testid="badge">
        Pill
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain("custom-class");
  });

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

  it("returns combined classes for semantic variant combinations", () => {
    const classes = badgeVariants({ variant: "success", size: "md", shape: "pill" });

    expect(classes).toContain("bg-status-success-bg");
    expect(classes).toContain("py-1");
    expect(classes).toContain("rounded-full");
  });
});
