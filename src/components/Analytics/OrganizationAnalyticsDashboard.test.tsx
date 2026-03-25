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
          totalIssues: 0,
          completedCount: 0,
          unassignedCount: 0,
          projectBreakdown: [],
          issuesByType: {
            task: 0,
            bug: 0,
            story: 0,
            epic: 0,
            subtask: 0,
          },
          issuesByPriority: {
            highest: 0,
            high: 0,
            medium: 0,
            low: 0,
            lowest: 0,
          },
        }}
      />,
    );

    expect(screen.getByText("Issues by Project (top 10)")).toBeInTheDocument();
    expect(screen.getByText("Project Breakdown")).toBeInTheDocument();
    expect(screen.getAllByText("No issue activity for this period")).toHaveLength(4);
  });

  it("shows an explicit no-project empty state when nothing is accessible", () => {
    render(
      <OrganizationAnalyticsDashboard
        analytics={{
          ...baseAnalytics,
          totalIssues: 0,
          completedCount: 0,
          unassignedCount: 0,
          projectCount: 0,
          issuesByType: {
            task: 0,
            bug: 0,
            story: 0,
            epic: 0,
            subtask: 0,
          },
          issuesByPriority: {
            highest: 0,
            high: 0,
            medium: 0,
            low: 0,
            lowest: 0,
          },
          projectBreakdown: [],
        }}
      />,
    );

    expect(screen.getAllByText("No projects available")).toHaveLength(4);
    expect(
      screen.getAllByText("Join or create a project to populate organization-level analytics."),
    ).toHaveLength(4);
  });
});
