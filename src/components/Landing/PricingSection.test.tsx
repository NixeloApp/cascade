import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { PricingSection } from "./PricingSection";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe("PricingSection", () => {
  it("renders the rollout-grounded pricing heading and continuity framing", () => {
    render(<PricingSection />);

    expect(screen.getByText("Pricing without a workflow reset")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The workspace stays the same. The control surface grows with you.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Start with the connected core, then add more governance, rollout support, and organizational controls/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Same operating model at every stage")).toBeInTheDocument();
    expect(
      screen.getByText("Pricing should explain rollout, not imply a product switch"),
    ).toBeInTheDocument();
  });

  it("renders all plans with product-grounded rollout copy and calls to action", () => {
    render(<PricingSection />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();

    expect(screen.getByText("Self-serve setup")).toBeInTheDocument();
    expect(screen.getByText("Most common rollout path")).toBeInTheDocument();
    expect(screen.getByText("Guided rollout")).toBeInTheDocument();

    expect(
      screen.getByText("Docs, issues, and sprint planning in one workspace"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unlimited users across planning, delivery, and follow-up"),
    ).toBeInTheDocument();
    expect(screen.getByText("SSO / SAML for identity and access control")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Start free/i })).toHaveAttribute(
      "href",
      ROUTES.signup.path,
    );
    expect(screen.getByRole("link", { name: /Plan the rollout/i })).toHaveAttribute(
      "href",
      "#final-cta",
    );
    expect(screen.getByRole("link", { name: /Talk through rollout/i })).toHaveAttribute(
      "href",
      "#final-cta",
    );
  });
});
