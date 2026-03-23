import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { CardSection } from "./CardSection";

describe("CardSection", () => {
  it("renders the default inset shell", () => {
    render(<CardSection>Default content</CardSection>);

    const panel = screen.getByText("Default content");
    expect(panel).toHaveClass("border", "border-ui-border-secondary/70", "bg-ui-bg-soft/90", "p-3");
  });

  it("renders the compact inset shell", () => {
    render(<CardSection size="compact">Compact content</CardSection>);

    const panel = screen.getByText("Compact content");
    expect(panel).toHaveClass("border", "border-ui-border-secondary/70", "bg-ui-bg-soft/90");
    expect(panel).toHaveClass("px-3", "py-2");
  });
});
