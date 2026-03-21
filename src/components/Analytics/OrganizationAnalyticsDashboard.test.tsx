import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import {
  OrganizationAnalyticsDashboard,
  type OrganizationAnalyticsData,
} from "./OrganizationAnalyticsDashboard";

const baseAnalytics: OrganizationAnalyticsData = {
  totalIssues: 142,
  completedCount: 68,
  unassignedCount: 12,
  projectCount: 3,
  issuesByType: {
    task: 70,
    bug: 24,
    story: 30,
    epic: 12,
    subtask: 6,
  },
  issuesByPriority: {
    highest: 8,
    high: 30,
    medium: 56,
    low: 34,
    lowest: 14,
  },
  projectBreakdown: [
    { projectId: "p1", name: "Platform", key: "PLAT", issueCount: 61 },
    { projectId: "p2", name: "Growth", key: "GROW", issueCount: 49 },
  ],
  isProjectsTruncated: false,
};

describe("OrganizationAnalyticsDashboard", () => {
  it("renders analytics sections without nested project cards", () => {
    const { container } = render(<OrganizationAnalyticsDashboard analytics={baseAnalytics} />);

    expect(screen.getByRole("heading", { level: 2, name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByText("Issues by Type")).toBeInTheDocument();
    expect(screen.getByText("Issues by Priority")).toBeInTheDocument();
    expect(screen.getByText("Issues by Project (top 10)")).toBeInTheDocument();
    expect(screen.getByText("Project Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getAllByText("GROW")).toHaveLength(2);

    expect(
      container.querySelectorAll(".border-ui-border-secondary\\/70.bg-ui-bg-soft\\/90"),
    ).toHaveLength(2);
  });

  it("shows the truncation notice when project counts are approximate", () => {
    render(
      <OrganizationAnalyticsDashboard
        analytics={{
          ...baseAnalytics,
          isProjectsTruncated: true,
        }}
      />,
    );

    expect(
      screen.getByText("Showing approximate counts. Project data is capped at 100 projects."),
    ).toBeInTheDocument();
  });

  it("omits project sections when there is no project breakdown", () => {
    render(
      <OrganizationAnalyticsDashboard
        analytics={{
          ...baseAnalytics,
          projectBreakdown: [],
        }}
      />,
    );

    expect(screen.queryByText("Issues by Project (top 10)")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Breakdown")).not.toBeInTheDocument();
  });
});
