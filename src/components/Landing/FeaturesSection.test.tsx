import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FeaturesSection } from "./FeaturesSection";

describe("FeaturesSection", () => {
  describe("Rendering", () => {
    it("should render the section headline", () => {
      render(<FeaturesSection />);

      expect(screen.getByText("Stop juggling tools. Start shipping.")).toBeInTheDocument();
    });

    it("should render the section subheadline", () => {
      render(<FeaturesSection />);

      expect(
        screen.getByText("Project management shouldn't feel like a second job."),
      ).toBeInTheDocument();
    });
  });

  describe("Feature Cards", () => {
    it("should render all three feature cards", () => {
      render(<FeaturesSection />);

      expect(screen.getByText("Docs and issues, finally together")).toBeInTheDocument();
      expect(screen.getByText("Edit together, in real-time")).toBeInTheDocument();
      expect(screen.getByText("See everything. Miss nothing.")).toBeInTheDocument();
    });

    it("should render feature descriptions", () => {
      render(<FeaturesSection />);

      expect(screen.getByText(/No more tab-switching between your wiki/)).toBeInTheDocument();
      expect(screen.getByText(/See who's typing, where they are/)).toBeInTheDocument();
      expect(screen.getByText(/One dashboard that actually makes sense/)).toBeInTheDocument();
    });

    it("should render Learn more links for each feature", () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByRole("link", { name: /learn more/i });
      expect(learnMoreLinks).toHaveLength(3);
    });

    it("should have Learn more links pointing to learn-more anchor", () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByRole("link", { name: /learn more/i });
      learnMoreLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "#learn-more");
      });
    });
  });

  describe("Structure", () => {
    it("should render as a section element with features id", () => {
      const { container } = render(<FeaturesSection />);

      const section = container.querySelector("section#features");
      expect(section).toBeInTheDocument();
    });

    it("should have accessible heading structure", () => {
      render(<FeaturesSection />);

      // Main section heading should be h2
      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveTextContent("Stop juggling tools. Start shipping.");

      // Feature card headings should be h3
      const h3s = screen.getAllByRole("heading", { level: 3 });
      expect(h3s).toHaveLength(3);
    });
  });

  describe("Icons", () => {
    it("should render icons for each feature card", () => {
      const { container } = render(<FeaturesSection />);

      // Each feature card should have an SVG icon
      const svgIcons = container.querySelectorAll("svg");
      // 3 feature icons + 3 arrow icons = 6 total
      expect(svgIcons.length).toBeGreaterThanOrEqual(6);
    });
  });
});
