import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SidebarTeamItem } from "./SidebarTeamItem";

// Mock dependencies
const mockTeam = {
  _id: "team123" as any,
  _creationTime: 1234567890,
  name: "Engineering",
  slug: "engineering",
  description: "The engineering team",
  workspaceId: "workspace123" as any,
};

// Mock convex/react hooks
const mockLoadMore = vi.fn();
const mockResults = [
  { _id: "p1", key: "PROJ-1", name: "Project Alpha" },
  { _id: "p2", key: "PROJ-2", name: "Project Beta" },
];

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(() => ({
    results: mockResults,
    status: "CanLoadMore",
    loadMore: mockLoadMore,
  })),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      getTeamProjects: "api.projects.getTeamProjects",
    },
  },
}));

// Mock Router
const mockUseLocation = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  return {
    Link: ({ to, children, className, "aria-current": ariaCurrent, onClick }: any) => (
      <a href={to} className={className} aria-current={ariaCurrent} onClick={onClick}>
        {children}
      </a>
    ),
    useLocation: () => mockUseLocation(),
  };
});

describe("SidebarTeamItem", () => {
  const defaultProps = {
    team: mockTeam,
    workspaceSlug: "workspace-slug",
    orgSlug: "org-slug",
    isExpanded: true,
    onToggle: vi.fn(),
    onNavClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: "/random-path" });
  });

  it("renders team name link with aria-current='page' when active", () => {
    mockUseLocation.mockReturnValue({ pathname: "/teams/engineering" });
    render(<SidebarTeamItem {...defaultProps} />);

    const teamLink = screen.getByText("Engineering").closest("a");
    expect(teamLink).toHaveAttribute("aria-current", "page");
  });

  it("does not render aria-current on team link when inactive", () => {
    mockUseLocation.mockReturnValue({ pathname: "/teams/other-team" });
    render(<SidebarTeamItem {...defaultProps} />);

    const teamLink = screen.getByText("Engineering").closest("a");
    expect(teamLink).not.toHaveAttribute("aria-current");
  });

  it("renders project link with aria-current='page' when active", () => {
    mockUseLocation.mockReturnValue({ pathname: "/org-slug/projects/PROJ-1" });
    render(<SidebarTeamItem {...defaultProps} />);

    const projectLink = screen.getByText("PROJ-1 - Project Alpha").closest("a");
    expect(projectLink).toHaveAttribute("aria-current", "page");

    const inactiveLink = screen.getByText("PROJ-2 - Project Beta").closest("a");
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });

  it("renders 'Load more' button with accessible label including team name", () => {
    render(<SidebarTeamItem {...defaultProps} />);

    const loadMoreBtn = screen.getByText("Load more...");
    expect(loadMoreBtn).toBeInTheDocument();
    // Check if the button (closest parent button element) has the aria-label
    const buttonElement = loadMoreBtn.closest("button");
    expect(buttonElement).toHaveAttribute("aria-label", "Load more projects for Engineering");
  });
});
