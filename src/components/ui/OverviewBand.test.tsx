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

  it("renders wrapper-owned metric test ids without JSX wrappers", () => {
    render(
      <OverviewBand
        title="Time summary"
        description="Metrics reflect the active project and date range."
        metrics={[
          { label: "Logged", value: "3h", testId: "logged-metric" },
          { label: "Entries", value: 12, testId: "entries-metric" },
        ]}
      />,
    );

    expect(screen.getByTestId("logged-metric")).toHaveTextContent("3h");
    expect(screen.getByTestId("entries-metric")).toHaveTextContent("12");
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

  it("supports a compact density for tighter route summaries", () => {
    render(
      <OverviewBand
        eyebrow="Organization footprint"
        title="Structure at a glance"
        description="This organization currently has 1 workspace, 1 team, and 2 projects."
        density="compact"
        metrics={[
          { label: "Workspaces", value: 1 },
          { label: "Teams", value: 1 },
          { label: "Projects", value: 2 },
        ]}
      />,
    );

    expect(screen.getByText("Organization footprint")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Structure at a glance" })).toBeInTheDocument();
    expect(
      screen.getByText("This organization currently has 1 workspace, 1 team, and 2 projects."),
    ).toBeInTheDocument();
    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });
});
