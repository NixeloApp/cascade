import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Import after mocks
import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  describe("Rendering", () => {
    it("should render the headline", () => {
      render(<HeroSection />);

      expect(screen.getByText(/Revolutionize Your Workflow/)).toBeInTheDocument();
      expect(screen.getByText(/Harmonize Your Team/)).toBeInTheDocument();
    });

    it("should render the subheadline", () => {
      render(<HeroSection />);

      expect(screen.getByText(/Experience the future of project management/)).toBeInTheDocument();
    });

    it("should render the tag badge", () => {
      render(<HeroSection />);

      expect(screen.getByText(/Project Management · Time Tracking/)).toBeInTheDocument();
    });
  });

  describe("CTA Buttons", () => {
    it("should render Get Started Free link", () => {
      render(<HeroSection />);

      const getStartedLink = screen.getByRole("link", { name: /Get Started Free/i });
      expect(getStartedLink).toBeInTheDocument();
      expect(getStartedLink).toHaveAttribute("href", "/signup");
    });

    it("should render Watch Demo link with external attributes", () => {
      render(<HeroSection />);

      const demoLink = screen.getByRole("link", { name: /Watch Demo/i });
      expect(demoLink).toBeInTheDocument();
      expect(demoLink).toHaveAttribute("target", "_blank");
      expect(demoLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Structure", () => {
    it("should render as a section element", () => {
      const { container } = render(<HeroSection />);

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });

    it("should have accessible heading structure", () => {
      render(<HeroSection />);

      // The main headline should be rendered as a heading
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });
});
