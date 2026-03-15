import { describe, expect, it } from "vitest";
import { render } from "@/test/custom-render";
import { CircuitFlowLines } from "./CircuitFlowLines";

describe("CircuitFlowLines", () => {
  it("renders a decorative SVG with aria-hidden", () => {
    const { container } = render(<CircuitFlowLines />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("has pointer-events-none for non-interactivity", () => {
    const { container } = render(<CircuitFlowLines />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("pointer-events-none");
  });
});
