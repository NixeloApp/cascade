import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

// Mock Convex hooks
const mockAnalytics = {
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
    _creationTime: Date.now() - 1000 * 60 * 5, // 5 mins ago
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
    _creationTime: Date.now() - 1000 * 60 * 10, // 10 mins ago
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
  useQuery: mockUseQuery,
}));

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock - return data for all calls
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockAnalytics;
      if (callCount === 2) return mockVelocity;
      if (callCount === 3) return mockActivity;
      return null;
    });
  });

  it("should render loading state when data is not available", () => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);

    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    // Check for skeleton loading states (uses animate-shimmer class)
    const skeletons = document.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render dashboard header", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Project insights, team velocity/i)).toBeInTheDocument();
  });

  it("should display key metrics cards", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

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
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Issues by Status")).toBeInTheDocument();
    expect(screen.getByText("Issues by Type")).toBeInTheDocument();
    expect(screen.getByText("Issues by Priority")).toBeInTheDocument();
    expect(screen.getAllByText(/Team Velocity/i).length).toBeGreaterThan(0);
  });

  it("should display issues by status chart data", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

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
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Epic")).toBeInTheDocument();
  });

  it("should display issues by priority chart data", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Highest")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Lowest")).toBeInTheDocument();
  });

  it("should display team velocity chart with sprint names", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    expect(screen.getByText("Sprint 2")).toBeInTheDocument();
    expect(screen.getByText("Sprint 3")).toBeInTheDocument();

    expect(screen.getAllByText("20").length).toBeGreaterThan(0); // Sprint 1 points
    expect(screen.getAllByText("25").length).toBeGreaterThan(0); // Sprint 2 points
  });

  it("should display issues by assignee when data is available", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Issues by Assignee")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie").length).toBeGreaterThan(0);
  });

  it("should display recent activity feed", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
  });

  it("should highlight unassigned count when greater than 0", () => {
    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    // Find the unassigned metric card
    const unassignedCard = screen.getByText("Unassigned").closest("div.ring-2");
    expect(unassignedCard).toBeInTheDocument();
    expect(unassignedCard).toHaveClass("ring-status-warning");
  });

  it("should show no completed sprints message when velocity data is empty", () => {
    vi.clearAllMocks();
    // Override for this test with empty velocity data
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockAnalytics;
      if (callCount === 2) return { velocityData: [], averageVelocity: 0 };
      if (callCount === 3) return mockActivity;
      return null;
    });

    render(<AnalyticsDashboard projectId={"test" as Id<"projects">} />);

    expect(screen.getByText("No completed sprints yet")).toBeInTheDocument();
  });
});
