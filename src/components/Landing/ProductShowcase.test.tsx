import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ProductShowcase } from "./ProductShowcase";

describe("ProductShowcase", () => {
  it("renders the showcase shell, preview badges, and board columns", () => {
    const { container } = render(<ProductShowcase />);

    expect(container.querySelector("#product-showcase")).toBeInTheDocument();
    expect(screen.getByText("Live workspace preview")).toBeInTheDocument();
    expect(screen.getByText("AI summaries")).toBeInTheDocument();
    expect(screen.getByText("Time tracking")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product control tower" })).toBeInTheDocument();

    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Shipping next")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("POL-142 polish search flows")).toBeInTheDocument();
    expect(screen.getByText("AUTH-07 SSO org mapping")).toBeInTheDocument();
  });

  it("renders the metrics and AI assistant follow-up prompts", () => {
    render(<ProductShowcase />);

    expect(screen.getByText("Active projects")).toBeInTheDocument();
    expect(screen.getByText("AI assists today")).toBeInTheDocument();
    expect(screen.getByText("Time recovered")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("11h")).toBeInTheDocument();

    expect(screen.getByText("AI workspace assistant")).toBeInTheDocument();
    expect(screen.getByText("Understands issues, docs, and context")).toBeInTheDocument();
    expect(
      screen.getByText('"Summarize what changed since the last client review and flag blockers."'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Surface blocker issues tied to missing approvals"),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft release notes from merged documents")).toBeInTheDocument();
  });
});
