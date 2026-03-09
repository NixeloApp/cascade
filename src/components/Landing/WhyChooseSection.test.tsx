import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { WhyChooseSection } from "./WhyChooseSection";

describe("WhyChooseSection", () => {
  it("renders the new proof-oriented heading and copy", () => {
    render(<WhyChooseSection />);

    expect(
      screen.getByText(/Better product ops usually starts with fewer disconnected surfaces/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/less repeated searching/i)).toBeInTheDocument();
  });

  it("renders all story cards", () => {
    render(<WhyChooseSection />);

    expect(screen.getByText("Product teams stop rebuilding the same context")).toBeInTheDocument();
    expect(
      screen.getByText("Client-facing teams keep updates grounded in real work"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ops leaders get cleaner visibility without heavier process"),
    ).toBeInTheDocument();
  });

  it("renders stat badges for each story card", () => {
    render(<WhyChooseSection />);

    expect(screen.getByText("11h saved weekly")).toBeInTheDocument();
    expect(screen.getByText("2 fewer tools in the loop")).toBeInTheDocument();
    expect(screen.getByText("Faster handoffs")).toBeInTheDocument();
  });

  it("renders as a section with an h2", () => {
    const { container } = render(<WhyChooseSection />);

    expect(container.querySelector("section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
