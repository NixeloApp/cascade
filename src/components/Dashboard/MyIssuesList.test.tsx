import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { MyIssuesList } from "./MyIssuesList";

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock organization context
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({ orgSlug: "test-organization" }),
}));

// Mock navigation hook
const mockIssueNavigation = {
  listRef: { current: null },
  getItemProps: (index: number) => ({
    "data-list-index": index,
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
    onMouseEnter: vi.fn(),
  }),
  selectedIndex: -1,
  setSelectedIndex: vi.fn(),
};

describe("MyIssuesList", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockIssues = [
    {
      _id: "1" as Id<"issues">,
      key: "PROJ-123",
      title: "Fix login bug",
      type: "bug",
      priority: "high",
      status: "In Progress",
      projectId: "proj1" as Id<"projects">,
      projectKey: "PROJ",
      projectName: "Project Alpha",
    },
    {
      _id: "2" as Id<"issues">,
      key: "PROJ-124",
      title: "Add dark mode",
      type: "feature",
      priority: "medium",
      status: "To Do",
      projectId: "proj1" as Id<"projects">,
      projectKey: "PROJ",
      projectName: "Project Alpha",
    },
  ];

  const mockCreatedIssues = [
    {
      _id: "3" as Id<"issues">,
      key: "PROJ-125",
      title: "Update documentation",
      type: "task",
      priority: "low",
      status: "Done",
      projectId: "proj2" as Id<"projects">,
      projectKey: "BETA",
      projectName: "Project Beta",
    },
  ];

  const defaultProps = {
    myIssues: mockIssues,
    myCreatedIssues: mockCreatedIssues,
    displayIssues: mockIssues,
    issueFilter: "assigned" as const,
    onFilterChange: vi.fn(),
    issueNavigation: mockIssueNavigation,
  };

  it("should render card header", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Track your active contributions")).toBeInTheDocument();
  });

  it("should render loading skeleton when data is undefined", () => {
    render(
      <MyIssuesList
        {...defaultProps}
        myIssues={undefined}
        myCreatedIssues={undefined}
        displayIssues={undefined}
      />,
    );

    // SkeletonList should be present (check for skeleton structure)
    const skeletons = document.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no assigned issues", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    expect(screen.getByText("Inbox Clear")).toBeInTheDocument();
    expect(screen.getByText("No pending items in your feed.")).toBeInTheDocument();
  });

  it("should render empty state when no created issues", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="created" displayIssues={[]} />);

    expect(screen.getByText("Inbox Clear")).toBeInTheDocument();
    expect(screen.getByText("No pending items in your feed.")).toBeInTheDocument();
  });

  it("should render assigned issues tab with correct count", () => {
    render(<MyIssuesList {...defaultProps} />);

    const tab = screen.getByRole("tab", { name: /Assigned/i });
    expect(tab).toHaveTextContent(`Assigned(${mockIssues.length})`);
  });

  it("should render created issues tab with correct count", () => {
    render(<MyIssuesList {...defaultProps} />);

    const tab = screen.getByRole("tab", { name: /Created/i });
    expect(tab).toHaveTextContent(`Created(${mockCreatedIssues.length})`);
  });

  it("should highlight active tab (assigned)", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="assigned" />);

    const assignedTab = screen.getByRole("tab", { name: /Assigned/i });
    expect(assignedTab).toHaveAttribute("data-state", "active");
  });

  it("should highlight active tab (created)", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="created" />);

    const createdTab = screen.getByRole("tab", { name: /Created/i });
    expect(createdTab).toHaveAttribute("data-state", "active");
  });

  it("should call onFilterChange when switching to assigned tab", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MyIssuesList {...defaultProps} onFilterChange={onFilterChange} issueFilter="created" />,
    );

    const assignedTab = screen.getByRole("tab", { name: /Assigned/i });
    await user.click(assignedTab);

    expect(onFilterChange).toHaveBeenCalledWith("assigned");
  });

  it("should call onFilterChange when switching to created tab", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} onFilterChange={onFilterChange} />);

    const createdTab = screen.getByRole("tab", { name: /Created/i });
    await user.click(createdTab);

    expect(onFilterChange).toHaveBeenCalledWith("created");
  });

  it("should render issue list when issues are present", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText("PROJ-123")).toBeInTheDocument();
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(screen.getByText("PROJ-124")).toBeInTheDocument();
    expect(screen.getByText("Add dark mode")).toBeInTheDocument();
  });

  it("should display issue details (key, type, priority, status)", () => {
    render(<MyIssuesList {...defaultProps} />);

    // Issue key
    expect(screen.getByText("PROJ-123")).toBeInTheDocument();

    // Issue title
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();

    // Priority badge
    expect(screen.getByText("high")).toBeInTheDocument();

    // Status (both issues have statuses)
    expect(screen.getByText("In Progress")).toBeInTheDocument();

    // Project names (both issues from Project Alpha)
    const projectNames = screen.getAllByText("Project Alpha");
    expect(projectNames.length).toBe(2); // Both issues from same project
  });

  it("should navigate to project when clicking an issue", async () => {
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} />);

    const firstIssue = screen.getByText("Fix login bug");
    await user.click(firstIssue);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.projects.board.path,
      params: { orgSlug: "test-organization", key: "PROJ" },
    });
  });

  it("should render View My Workspaces button in empty state", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    expect(screen.getByText("Explore Projects")).toBeInTheDocument();
  });

  it("should navigate to projects when clicking Explore Projects", async () => {
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    const button = screen.getByText("Explore Projects");
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.workspaces.list.path,
      params: { orgSlug: "test-organization" },
    });
  });

  it("should have correct accessibility attributes", () => {
    render(<MyIssuesList {...defaultProps} />);

    // Radix tabs have role="tab" and proper accessibility attributes
    const assignedTab = screen.getByRole("tab", { name: /Assigned/i });
    const createdTab = screen.getByRole("tab", { name: /Created/i });

    expect(assignedTab).toHaveAttribute("type", "button");
    expect(createdTab).toHaveAttribute("type", "button");
  });

  it("should handle zero issues gracefully", () => {
    render(
      <MyIssuesList {...defaultProps} myIssues={[]} myCreatedIssues={[]} displayIssues={[]} />,
    );

    const assignedTab = screen.getByRole("tab", { name: /Assigned/i });
    expect(assignedTab).toHaveTextContent("Assigned(0)");
    const createdTab = screen.getByRole("tab", { name: /Created/i });
    expect(createdTab).toHaveTextContent("Created(0)");
  });
});
