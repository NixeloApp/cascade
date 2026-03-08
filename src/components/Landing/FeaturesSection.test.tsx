import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FeaturesSection } from "./FeaturesSection";

describe("FeaturesSection", () => {
  it("renders the updated section heading and body", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Built for the intelligence age")).toBeInTheDocument();
    expect(screen.getByText(/killing duplicated work/i)).toBeInTheDocument();
  });

  it("renders all three updated feature cards", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Docs and execution stay linked")).toBeInTheDocument();
    expect(screen.getByText("Collaboration with less context loss")).toBeInTheDocument();
    expect(screen.getByText("AI can act on real workspace context")).toBeInTheDocument();
  });

  it("renders learn more links for each card", () => {
    render(<FeaturesSection />);

    const links = screen.getAllByRole("link", { name: /Learn more/i });
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "#learn-more");
    });
  });

  it("renders as a section with the features anchor", () => {
    const { container } = render(<FeaturesSection />);

    expect(container.querySelector("section#features")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Built for the intelligence age",
    );
  });
});
