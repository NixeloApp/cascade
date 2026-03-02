import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { WhyChooseSection } from "./WhyChooseSection";

describe("WhyChooseSection", () => {
  describe("Rendering", () => {
    it("should render the section headline", () => {
      render(<WhyChooseSection />);

      expect(screen.getByText("Teams actually like using it.")).toBeInTheDocument();
    });

    it("should render the section subheadline", () => {
      render(<WhyChooseSection />);

      expect(
        screen.getByText(/No training required. No "change management" needed/),
      ).toBeInTheDocument();
    });
  });

  describe("Stats", () => {
    it("should render all four stat items", () => {
      render(<WhyChooseSection />);

      expect(screen.getByText("Less time in meetings")).toBeInTheDocument();
      expect(screen.getByText("Fewer tools to manage")).toBeInTheDocument();
      expect(screen.getByText("Actually use it daily")).toBeInTheDocument();
      expect(screen.getByText("Would recommend")).toBeInTheDocument();
    });

    it("should render stat values with percentage", () => {
      render(<WhyChooseSection />);

      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText("10%")).toBeInTheDocument();
      // Two items have 95%
      expect(screen.getAllByText("95%")).toHaveLength(2);
    });

    it("should render progress bars for each stat", () => {
      const { container } = render(<WhyChooseSection />);

      // Each stat has a progress bar container with nested divs
      const progressBars = container.querySelectorAll(".h-2.w-full.rounded-full");
      expect(progressBars).toHaveLength(4);
    });
  });

  describe("Structure", () => {
    it("should render as a section element", () => {
      const { container } = render(<WhyChooseSection />);

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });

    it("should have accessible heading structure", () => {
      render(<WhyChooseSection />);

      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveTextContent("Teams actually like using it.");
    });
  });
});
