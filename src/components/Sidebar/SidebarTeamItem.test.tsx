import type { Doc, Id } from "@convex/_generated/dataModel";
import { useLocation } from "@tanstack/react-router";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { MouseEvent, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SidebarTeamItem } from "./SidebarTeamItem";

interface MockLinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  href?: string;
  "aria-current"?: "page";
  "aria-label"?: string;
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, onClick, href, ...props }: MockLinkProps) => (
    <a
      className={className}
      href={href ?? "#"}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
  useLocation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      getTeamProjects: "projects.getTeamProjects",
    },
  },
}));

const mockUseLocation = vi.mocked(useLocation);
const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);

function createLocation(pathname: string): ReturnType<typeof useLocation> {
  return {
    pathname,
    href: pathname,
    publicHref: pathname,
    search: {},
    searchStr: "",
    state: {
      __TSR_index: 0,
      __TSR_key: "test-key",
      key: "test-key",
    },
    hash: "",
    maskedLocation: undefined,
    unmaskOnReload: false,
    external: false,
  };
}

const team: Doc<"teams"> = {
  _id: "team_1" as Id<"teams">,
  _creationTime: 0,
  organizationId: "org_1" as Id<"organizations">,
  workspaceId: "workspace_1" as Id<"workspaces">,
  name: "Frontend",
  slug: "frontend",
  description: "Frontend team",
  icon: "layout",
  leadId: "user_2" as Id<"users">,
  isPrivate: false,
  settings: {
    defaultIssueType: "feature",
    cycleLength: 14,
    cycleDayOfWeek: 1,
    defaultEstimate: 3,
  },
  createdBy: "user_1" as Id<"users">,
  updatedAt: 0,
};

const defaultProps = {
  team,
  workspaceSlug: "engineering",
  orgSlug: "acme",
  isExpanded: false,
  onToggle: vi.fn(),
  onNavClick: vi.fn(),
};

describe("SidebarTeamItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue(createLocation("/acme/workspaces/engineering/board"));
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });
  });

  it("marks only the exact team route branch as active and toggles expansion", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onNavClick = vi.fn();
    mockUseLocation.mockReturnValue(createLocation("/acme/workspaces/engineering/board"));

    const { rerender } = render(
      <SidebarTeamItem {...defaultProps} onToggle={onToggle} onNavClick={onNavClick} />,
    );

    await user.click(screen.getByRole("button", { name: "Expand Frontend" }));
    expect(onToggle).toHaveBeenCalledWith("frontend");

    mockUseLocation.mockReturnValue(createLocation("/acme/workspaces/engineering/teams/frontend"));
    rerender(<SidebarTeamItem {...defaultProps} onToggle={onToggle} onNavClick={onNavClick} />);

    const teamLink = screen.getByRole("link", { name: "Frontend" });
    expect(teamLink).toHaveAttribute("aria-current", "page");

    await user.click(teamLink);
    expect(onNavClick).toHaveBeenCalledTimes(1);

    mockUseLocation.mockReturnValue(
      createLocation("/acme/workspaces/engineering/teams/frontend-platform"),
    );

    rerender(<SidebarTeamItem {...defaultProps} />);

    expect(screen.getByRole("link", { name: "Frontend" })).not.toHaveAttribute("aria-current");
  });

  it("auto-expands the active team route and reveals its projects", () => {
    mockUseLocation.mockReturnValue(createLocation("/acme/workspaces/engineering/teams/frontend"));
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "project_1",
          key: "FE",
          name: "Frontend Platform",
        },
      ],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });

    render(<SidebarTeamItem {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Collapse Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FE - Frontend Platform" })).toBeInTheDocument();
  });

  it("shows a loading state for expanded team projects before the first page resolves", () => {
    mockUseLocation.mockReturnValue(createLocation("/acme/workspaces/engineering/teams/frontend"));
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: vi.fn(),
      isLoading: true,
    });

    render(<SidebarTeamItem {...defaultProps} isExpanded />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      "projects.getTeamProjects",
      { teamId: "team_1" },
      { initialNumItems: 10 },
    );
  });

  it("shows an empty state when an expanded team has no projects", () => {
    render(<SidebarTeamItem {...defaultProps} isExpanded />);

    expect(screen.getByText("No projects")).toBeInTheDocument();
  });

  it("renders team projects, marks the active project, and loads more", async () => {
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    const loadMore = vi.fn();
    mockUseLocation.mockReturnValue(createLocation("/acme/projects/FE/board"));
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "project_1",
          key: "FE",
          name: "Frontend Platform",
        },
        {
          _id: "project_2",
          key: "UI",
          name: "Design System",
        },
      ],
      status: "CanLoadMore",
      loadMore,
      isLoading: false,
    });

    render(<SidebarTeamItem {...defaultProps} isExpanded onNavClick={onNavClick} />);

    const activeProjectLink = screen.getByRole("link", { name: "FE - Frontend Platform" });
    expect(activeProjectLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "UI - Design System" })).toBeInTheDocument();

    await user.click(activeProjectLink);
    expect(onNavClick).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Load more..." }));
    expect(loadMore).toHaveBeenCalledWith(10);
  });
});
