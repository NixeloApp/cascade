import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FeatureHighlights } from "./FeatureHighlights";

describe("FeatureHighlights", () => {
  it("renders all onboarding feature cards with their titles and descriptions", () => {
    render(<FeatureHighlights />);

    expect(screen.getByText("Kanban Boards")).toBeInTheDocument();
    expect(screen.getByText("Visualize work with drag-and-drop boards")).toBeInTheDocument();

    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Collaborate on docs in real-time")).toBeInTheDocument();

    expect(screen.getByText("Sprint Planning")).toBeInTheDocument();
    expect(screen.getByText("Plan and track team velocity")).toBeInTheDocument();
  });
});
