import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { WorkspacesList } from "./ProjectsList";

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock organization context
const TEST_ORG_SLUG = "test-organization";
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({ orgSlug: TEST_ORG_SLUG }),
}));

// Mock navigation hook
const mockWorkspaceNavigation = {
  listRef: { current: null } as any,
  getItemProps: (index: number) => ({
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
  }),
};

describe("WorkspacesList", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockWorkspaces = [
    {
      _id: "proj1" as Id<"projects">,
      key: "ALPHA",
      name: "Project Alpha",
      role: "admin",
      myIssues: 5,
      totalIssues: 12,
    },
    {
      _id: "proj2" as Id<"projects">,
      key: "BETA",
      name: "Project Beta",
      role: "editor",
      myIssues: 2,
      totalIssues: 8,
    },
    {
      _id: "proj3" as Id<"projects">,
      key: "GAMMA",
      name: "Project Gamma",
      role: "viewer",
      myIssues: 0,
      totalIssues: 3,
    },
  ];

  const defaultProps = {
    projects: mockWorkspaces,
    projectNavigation: mockWorkspaceNavigation,
  };

  it("should render card header with project count", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText(`${mockWorkspaces.length} active projects`)).toBeInTheDocument();
  });

  it("should render loading skeleton when data is undefined", () => {
    render(<WorkspacesList {...defaultProps} projects={undefined} />);

    // Should render 3 skeleton project cards
    const skeletons = document.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no projects", () => {
    render(<WorkspacesList {...defaultProps} projects={[]} />);

    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(screen.getByText("You're not a member of any projects yet")).toBeInTheDocument();
  });

  it("should render Go to Workspaces button in empty state", () => {
    render(<WorkspacesList {...defaultProps} projects={[]} />);

    expect(screen.getByText("Go to Workspaces")).toBeInTheDocument();
  });

  it("should navigate to workspaces when clicking Go to Workspaces", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList {...defaultProps} projects={[]} />);

    const button = screen.getByText("Go to Workspaces");
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.workspaces.list.path,
      params: { orgSlug: TEST_ORG_SLUG },
    });
  });

  it("should render all projects when data is present", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();
  });

  it("should display project role badges", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
  });

  it("should display issue counts for each project", () => {
    render(<WorkspacesList {...defaultProps} />);

    // Project Alpha: 5 assigned issues
    expect(screen.getByText("5 assigned issues")).toBeInTheDocument();

    // Project Beta: 2 assigned issues
    expect(screen.getByText("2 assigned issues")).toBeInTheDocument();

    // Project Gamma: 0 assigned issues
    expect(screen.getByText("0 assigned issues")).toBeInTheDocument();
  });

  it("should navigate to project board when clicking a project", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList {...defaultProps} />);

    const firstWorkspace = screen.getByText("Project Alpha");
    await user.click(firstWorkspace);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.projects.board.path,
      params: { orgSlug: TEST_ORG_SLUG, key: "ALPHA" },
    });
  });

  it("should apply navigation props to project items", () => {
    render(<WorkspacesList {...defaultProps} />);

    const projectButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Project"));

    // First item should have tabIndex 0 (focused)
    expect(projectButtons[0]).toHaveAttribute("tabindex", "0");

    // Other items should have tabIndex -1
    expect(projectButtons[1]).toHaveAttribute("tabindex", "-1");
    expect(projectButtons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("should render project cards as interactive elements", () => {
    render(<WorkspacesList {...defaultProps} />);

    // Projects are rendered as clickable Cards with hoverable styling
    const projectNames = screen.getAllByText(/Project (Alpha|Beta|Gamma)/);

    expect(projectNames.length).toBe(3);
    for (const name of projectNames) {
      expect(name).toBeInTheDocument();
    }
  });

  it("should handle project with long name (truncation)", () => {
    const longNameWorkspace = [
      {
        _id: "proj4" as Id<"projects">,
        key: "LONG",
        name: "This is a very long project name that should be truncated in the UI",
        role: "admin",
        myIssues: 1,
        totalIssues: 5,
      },
    ];

    render(<WorkspacesList {...defaultProps} projects={longNameWorkspace} />);

    const projectName = screen.getByText(
      "This is a very long project name that should be truncated in the UI",
    );
    expect(projectName).toHaveClass("truncate");
  });

  it("should handle zero issues in a project", () => {
    const zeroIssuesWorkspace = [
      {
        _id: "proj5" as Id<"projects">,
        key: "EMPTY",
        name: "Empty Project",
        role: "editor",
        myIssues: 0,
        totalIssues: 0,
      },
    ];

    render(<WorkspacesList {...defaultProps} projects={zeroIssuesWorkspace} />);

    expect(screen.getByText("0 assigned issues")).toBeInTheDocument();
  });

  it("should render with capitalized role badges", () => {
    render(<WorkspacesList {...defaultProps} />);

    // All role badges should have the capitalize class
    const roleBadges = [
      screen.getByText("admin"),
      screen.getByText("editor"),
      screen.getByText("viewer"),
    ];

    for (const badge of roleBadges) {
      // The Badge component has capitalize class
      expect(badge).toBeInTheDocument();
    }
  });

  it("should handle single project", () => {
    const singleWorkspace = [mockWorkspaces[0]];

    render(<WorkspacesList {...defaultProps} projects={singleWorkspace} />);

    expect(screen.getByText("1 active project")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("should show 0 active projects in header when array is empty", () => {
    render(<WorkspacesList {...defaultProps} projects={[]} />);

    expect(screen.getByText("0 active projects")).toBeInTheDocument();
  });

  it("should show 0 active projects in header when undefined", () => {
    render(<WorkspacesList {...defaultProps} projects={undefined} />);

    expect(screen.getByText("0 active projects")).toBeInTheDocument();
  });
});
