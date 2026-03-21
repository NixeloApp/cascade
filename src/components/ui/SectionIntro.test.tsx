import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SectionIntro } from "./SectionIntro";

describe("SectionIntro", () => {
  it("renders eyebrow, title, and description content", () => {
    render(
      <SectionIntro
        eyebrow="Overview"
        title="Plan with more context"
        description="Shared intro block for section headers."
      />,
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan with more context" })).toBeInTheDocument();
    expect(screen.getByText("Shared intro block for section headers.")).toBeInTheDocument();
  });

  it("supports centered alignment and title overrides", () => {
    const { container } = render(
      <SectionIntro
        align="center"
        titleVariant="h2"
        title="Centered Intro"
        description="Aligned for hero-style section headers."
      />,
    );

    expect(container.firstChild).toHaveClass("text-center");
    expect(screen.getByRole("heading", { level: 2, name: "Centered Intro" })).toBeInTheDocument();
  });
});
