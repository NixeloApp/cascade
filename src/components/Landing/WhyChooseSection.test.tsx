import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { WhyChooseSection } from "./WhyChooseSection";

describe("WhyChooseSection", () => {
  it("renders the evidence-oriented heading and copy", () => {
    render(<WhyChooseSection />);

    expect(
      screen.getByText(/The proof is in how work survives every handoff/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/These are not abstract productivity claims/i)).toBeInTheDocument();
  });

  it("renders all product-proof cards", () => {
    render(<WhyChooseSection />);

    expect(screen.getByText("Planning, specs, and release prep stay attached")).toBeInTheDocument();
    expect(
      screen.getByText("Client updates start from live work, not retelling"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Leadership sees an operating pulse instead of admin fog"),
    ).toBeInTheDocument();
  });

  it("renders proof stats and evidence rows for each card", () => {
    render(<WhyChooseSection />);

    expect(screen.getByText("11h")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Faster handoffs")).toBeInTheDocument();
    expect(screen.getByText("Comes from")).toBeInTheDocument();
    expect(screen.getByText("What changes")).toBeInTheDocument();
    expect(screen.getByText("Avoids")).toBeInTheDocument();
  });

  it("renders as a section with an h2", () => {
    const { container } = render(<WhyChooseSection />);

    expect(container.querySelector("section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
