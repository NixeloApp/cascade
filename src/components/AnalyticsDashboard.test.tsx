import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MINUTE } from "@convex/lib/timeUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

type MockAnalytics = {
  totalIssues: number;
  unassignedCount: number;
  issuesByStatus: Record<string, number>;
  issuesByType: Record<string, number>;
  issuesByPriority: Record<string, number>;
  issuesByAssignee: Record<string, { count: number; name: string }>;
};

// Mock Convex hooks
const mockAnalytics: MockAnalytics = {
  totalIssues: 25,
  unassignedCount: 5,
  issuesByStatus: {
    todo: 10,
    inprogress: 8,
    review: 4,
    done: 3,
  },
  issuesByType: {
    task: 15,
    bug: 5,
    story: 3,
    epic: 2,
  },
  issuesByPriority: {
    lowest: 2,
    low: 5,
    medium: 10,
    high: 6,
    highest: 2,
  },
  issuesByAssignee: {
    user1: { count: 10, name: "Alice" },
    user2: { count: 8, name: "Bob" },
    user3: { count: 2, name: "Charlie" },
  },
};

const mockVelocity = {
  velocityData: [
    { sprintName: "Sprint 1", sprintId: "1" as Id<"sprints">, points: 20, issuesCompleted: 10 },
    { sprintName: "Sprint 2", sprintId: "2" as Id<"sprints">, points: 25, issuesCompleted: 12 },
    { sprintName: "Sprint 3", sprintId: "3" as Id<"sprints">, points: 22, issuesCompleted: 11 },
  ],
  averageVelocity: 22,
};

const mockActivity = [
  {
    _id: "1" as Id<"issueActivity">,
    issueId: "issue1" as Id<"issues">,
    userId: "user1" as Id<"users">,
    action: "created",
    _creationTime: Date.now() - 5 * MINUTE,
    userName: "Alice",
    userImage: undefined,
    issueKey: "PROJ-1",
    issueTitle: "Test Issue",
  },
  {
    _id: "2" as Id<"issueActivity">,
    issueId: "issue2" as Id<"issues">,
    userId: "user2" as Id<"users">,
    action: "updated",
    field: "status",
    _creationTime: Date.now() - 10 * MINUTE,
    userName: "Bob",
    userImage: undefined,
    issueKey: "PROJ-2",
    issueTitle: "Another Issue",
  },
];

// Create mock function with vi.hoisted so it's available when vi.mock runs
const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: mockUseQuery,
}));

// Helper to identify queries regardless of object identity
function isQuery(queryArg: any, path: string) {
  // Check strict equality
  if (queryArg === api.analytics.getProjectAnalytics && path === "getProjectAnalytics") return true;
  if (queryArg === api.analytics.getTeamVelocity && path === "getTeamVelocity") return true;
  if (queryArg === api.analytics.getRecentActivity && path === "getRecentActivity") return true;

  // Fallback: Check if it's a string path (sometimes used in Convex) or object with matching properties
  try {
    if (typeof queryArg === "string" && queryArg.includes(path)) return true;
    if (typeof queryArg === "function" && queryArg.name === path) return true;
    if (queryArg?._functionName === path) return true;
  } catch (e) {
    // ignore
  }

  return false;
}

// Extracted handler to reduce complexity
const createQueryHandler = (
  analyticsData: MockAnalytics = mockAnalytics,
  velocityData: any = mockVelocity,
  activityData: typeof mockActivity = mockActivity,
) => {
  let callCount = 0;
  return (queryArg: any) => {
    // 1. Try robust matching
    if (
      queryArg === api.analytics.getProjectAnalytics ||
      isQuery(queryArg, "getProjectAnalytics")
    ) {
      return analyticsData;
    }
    if (queryArg === api.analytics.getTeamVelocity || isQuery(queryArg, "getTeamVelocity")) {
      return velocityData;
    }
    if (queryArg === api.analytics.getRecentActivity || isQuery(queryArg, "getRecentActivity")) {
      return activityData;
    }

    // 2. Fallback to order-based matching (modulo to handle re-renders)
    const index = callCount % 3;
    callCount++;

    if (index === 0) return analyticsData;
    if (index === 1) return velocityData;
    if (index === 2) return activityData;

    return null;
  };
};

describe("AnalyticsDashboard", () => {
  function renderDashboard() {
    return render(
      <AnalyticsDashboard
        projectId={"test" as Id<"projects">}
        projectName="Project Atlas"
        projectKey="PROJ"
      />,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockImplementation(createQueryHandler());
  });

  it("should render loading state when data is not available", () => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);

    renderDashboard();

    // Check for skeleton loading states (uses animate-shimmer class)
    const skeletons = document.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render dashboard header", () => {
    renderDashboard();

    expect(screen.getByText("Project Atlas analytics")).toBeInTheDocument();
    expect(
      screen.getByText(/delivery, workload, and ownership signals for proj/i),
    ).toBeInTheDocument();
  });

  it("should display snapshot and key metrics cards", () => {
    renderDashboard();

    expect(screen.getByText("Flow Snapshot")).toBeInTheDocument();
    expect(screen.getByText("22 open issues")).toBeInTheDocument();
    expect(screen.getByText("Ownership")).toBeInTheDocument();
    expect(screen.getByText("80% assigned")).toBeInTheDocument();
    expect(screen.getByText("Sprint Signal")).toBeInTheDocument();
    expect(screen.getByText("22 pts/sprint")).toBeInTheDocument();

    expect(screen.getByText("Total Issues")).toBeInTheDocument();
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);

    expect(screen.getByText("Avg Velocity")).toBeInTheDocument();
    expect(screen.getAllByText("22").length).toBeGreaterThan(0);

    expect(screen.getByText("Completed Sprints")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("should display chart sections", () => {
    renderDashboard();

    expect(screen.getByText("Issues by Status")).toBeInTheDocument();
    expect(screen.getByText("Issues by Type")).toBeInTheDocument();
    expect(screen.getByText("Issues by Priority")).toBeInTheDocument();
    expect(screen.getAllByText(/Team Velocity/i).length).toBeGreaterThan(0);
  });

  it("should display issues by status chart data", () => {
    renderDashboard();

    // Check that status labels are rendered
    expect(screen.getByText("todo")).toBeInTheDocument();
    expect(screen.getByText("inprogress")).toBeInTheDocument();
    expect(screen.getByText("review")).toBeInTheDocument();
    expect(screen.getByText("done")).toBeInTheDocument();

    // Check that counts are rendered (may appear multiple times in charts)
    expect(screen.getAllByText("10").length).toBeGreaterThan(0); // todo count
    expect(screen.getAllByText("8").length).toBeGreaterThan(0); // inprogress count
  });

  it("should display issues by type chart data", () => {
    renderDashboard();

    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Epic")).toBeInTheDocument();
  });

  it("should display issues by priority chart data", () => {
    renderDashboard();

    expect(screen.getByText("Highest")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Lowest")).toBeInTheDocument();
  });

  it("should display team velocity chart with sprint names", () => {
    renderDashboard();

    expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    expect(screen.getByText("Sprint 2")).toBeInTheDocument();
    expect(screen.getByText("Sprint 3")).toBeInTheDocument();

    expect(screen.getAllByText("20").length).toBeGreaterThan(0); // Sprint 1 points
    expect(screen.getAllByText("25").length).toBeGreaterThan(0); // Sprint 2 points
  });

  it("should display issues by assignee when data is available", () => {
    renderDashboard();

    expect(screen.getByText("Issues by Assignee")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie").length).toBeGreaterThan(0);
  });

  it("should display recent activity feed", () => {
    renderDashboard();

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
  });

  it("should highlight unassigned count when greater than 0", () => {
    renderDashboard();

    // Find the unassigned metric card
    const unassignedCard = screen.getByText("Unassigned").closest("div.ring-2");
    expect(unassignedCard).toBeInTheDocument();
    expect(unassignedCard).toHaveClass("ring-status-warning");
  });

  it("should show no completed sprints message when velocity data is empty", () => {
    vi.clearAllMocks();
    mockUseQuery.mockImplementation(
      createQueryHandler(mockAnalytics, { velocityData: [], averageVelocity: 0 }, mockActivity),
    );

    renderDashboard();

    expect(screen.getByText("No sprint history yet")).toBeInTheDocument();
  });

  it("should render explicit empty states when ownership and activity data are absent", () => {
    vi.clearAllMocks();
    mockUseQuery.mockImplementation(
      createQueryHandler(
        {
          ...mockAnalytics,
          issuesByAssignee: {},
        },
        mockVelocity,
        [],
      ),
    );

    renderDashboard();

    expect(screen.getByText("No assigned work yet")).toBeInTheDocument();
    expect(screen.getByText("No recent activity yet")).toBeInTheDocument();
  });
});
