import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PricingSection } from "./PricingSection";

describe("PricingSection", () => {
  it("renders section heading and all plan tiers", () => {
    render(<PricingSection />);

    expect(
      screen.getByRole("heading", { name: /Pricing that scales with your team/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });
});
