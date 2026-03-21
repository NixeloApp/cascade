import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { FinalCTASection } from "./FinalCTASection";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe("FinalCTASection", () => {
  it("renders the product-handoff heading and grounded CTA copy", () => {
    render(<FinalCTASection />);

    expect(screen.getByText("What the first operating cycle looks like")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Open one workspace, then let the same system carry the handoff",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The point of signing up is not another promise\. It is being able to bring work in, run a planning cycle, and send a grounded update/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the rollout steps, closing signals, and follow-up links", () => {
    render(<FinalCTASection />);

    expect(screen.getByText("Bring current work into one operating surface")).toBeInTheDocument();
    expect(
      screen.getByText("Run planning, search, and follow-up from the same place"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add governance only when the organization needs it"),
    ).toBeInTheDocument();

    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("First cycle")).toBeInTheDocument();
    expect(screen.getByText("When rollout expands")).toBeInTheDocument();

    expect(screen.getByText("Same workspace core")).toBeInTheDocument();
    expect(screen.getByText("No fake pilot")).toBeInTheDocument();
    expect(screen.getByText("Control when needed")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Get started for free" })).toHaveAttribute(
      "href",
      ROUTES.signup.path,
    );
    expect(screen.getByRole("link", { name: "Review rollout stages" })).toHaveAttribute(
      "href",
      "#pricing",
    );
    expect(screen.getByRole("link", { name: /See the workflow tour/i })).toHaveAttribute(
      "href",
      "#product-showcase",
    );
  });
});
