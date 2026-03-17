import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  it("renders the updated headline and supporting copy", () => {
    render(<HeroSection />);

    expect(screen.getByText(/Replace scattered project tools/i)).toBeInTheDocument();
    expect(screen.getByText(/with one sharper workspace/i)).toBeInTheDocument();
    expect(
      screen.getByText(/specs, tasks, client updates, and AI assistance/i),
    ).toBeInTheDocument();
  });

  it("renders primary and secondary hero actions", () => {
    render(<HeroSection />);

    expect(screen.getByRole("link", { name: /Get Started Free/i })).toHaveAttribute(
      "href",
      ROUTES.signup.build(),
    );
    expect(screen.getByRole("link", { name: /See workflow tour/i })).toHaveAttribute(
      "href",
      "#product-showcase",
    );
  });

  it("renders the product showcase preview", () => {
    render(<HeroSection />);

    expect(screen.getByText("Live workspace preview")).toBeInTheDocument();
    expect(screen.getByText("Product control tower")).toBeInTheDocument();
    expect(screen.getByText("AI workspace assistant")).toBeInTheDocument();
  });

  it("renders as a section with an h1", () => {
    const { container } = render(<HeroSection />);

    expect(container.querySelector("section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
