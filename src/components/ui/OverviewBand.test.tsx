import { describe, expect, it } from "vitest";
import { render, screen, within } from "@/test/custom-render";
import { OverviewBand } from "./OverviewBand";

describe("OverviewBand", () => {
  it("renders the heading copy, metrics, and aside content", () => {
    render(
      <OverviewBand
        eyebrow="Organization structure"
        title="3 workspaces, 5 teams, and 11 projects are active."
        description="Use this view to confirm where new work belongs before you add it."
        metrics={[
          { label: "Workspaces", value: 3, detail: "Current grouping" },
          { label: "Teams", value: 5, detail: "Across all workspaces" },
          { label: "Projects", value: 11, detail: "Active delivery scope" },
        ]}
        aside={<div>Scope note</div>}
      />,
    );

    expect(screen.getByText("Organization structure")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "3 workspaces, 5 teams, and 11 projects are active." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Use this view to confirm where new work belongs before you add it."),
    ).toBeInTheDocument();
    expect(screen.getByText("Scope note")).toBeInTheDocument();

    const workspaceMetric = screen.getByText("Workspaces").closest("article");
    expect(workspaceMetric).not.toBeNull();
    const workspaceMetricElement = workspaceMetric as HTMLElement;
    expect(within(workspaceMetricElement).getByText("3")).toBeInTheDocument();
    expect(within(workspaceMetricElement).getByText("Current grouping")).toBeInTheDocument();
  });

  it("renders without eyebrow or aside when they are omitted", () => {
    render(
      <OverviewBand
        title="Time summary"
        description="Metrics reflect the active project and date range."
        metrics={[{ label: "Logged", value: "3h" }]}
      />,
    );

    expect(screen.queryByText("Organization structure")).not.toBeInTheDocument();
    expect(screen.queryByText("Scope note")).not.toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
    expect(screen.getByText("3h")).toBeInTheDocument();
  });
});
