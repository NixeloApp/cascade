import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { FinalCTASection } from "./FinalCTASection";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("FinalCTASection", () => {
  it("renders the primary call to action and core landing copy", () => {
    render(<FinalCTASection />);

    expect(
      screen.getByText("Built for teams that need one system, not another tab"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Make product work easier to run and easier to trust",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Start free, bring your current workflow in, and let docs, execution, and AI assist/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Get started for free" })).toHaveAttribute(
      "href",
      ROUTES.signup.path,
    );
    expect(screen.getByRole("link", { name: "See the workflow tour" })).toHaveAttribute(
      "href",
      "#product-showcase",
    );
  });

  it("renders both supporting feature cards and their follow-up links", () => {
    render(<FinalCTASection />);

    expect(screen.getByText("Quickstart without churn")).toBeInTheDocument();
    expect(screen.getByText("Ready for serious teams")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Import the basics, keep your team moving, and expand into docs, client views, and time tracking as needed\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Flexible pricing, enterprise controls, and a product model that can handle internal execution plus external-facing updates\./,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Explore the product/i })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: /Review pricing/i })).toHaveAttribute(
      "href",
      "#pricing",
    );
  });
});
