import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render as customRender } from "../test/custom-render";
import { ProjectsList } from "./ProjectsList";

// Mock hooks and components
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({
    organizationId: "organization-123",
    orgSlug: "test-organization",
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className} data-testid="project-link">
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

const mockLoadMore = vi.fn();

// Mock usePaginatedQuery with different return values
const mockUsePaginatedQuery = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  usePaginatedQuery: (...args: unknown[]) => mockUsePaginatedQuery(...args),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      getCurrentUserProjects: "projects:getCurrentUserProjects",
    },
  },
}));

describe("ProjectsList", () => {
  const mockOnCreateClick = vi.fn();
  const mockProjects = [
    {
      _id: "p1",
      key: "PROJ-1",
      name: "Project 1",
      description: "Description 1",
      issueCount: 5,
      boardType: "kanban",
    },
    {
      _id: "p2",
      key: "PROJ-2",
      name: "Project 2",
      description: "Description 2",
      issueCount: 0,
      boardType: "scrum",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.__NIXELO_E2E_PROJECTS_LOADING__ = false;
  });

  it("renders loading spinner when loading first page", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);
    expect(screen.getByTestId(TEST_IDS.PROJECT.LOADING_STATE)).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.LOADING.SKELETON).length).toBeGreaterThan(0);
  });

  it("renders empty state when no projects found", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first project to organize work")).toBeInTheDocument();
  });

  it("renders list of projects", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText(/5 issues/)).toBeInTheDocument();
    expect(screen.getByText(/Kanban/)).toBeInTheDocument();

    expect(screen.getByText("Project 2")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText(/0 issues/)).toBeInTheDocument();
    expect(screen.getByText(/Scrum/)).toBeInTheDocument();
  });

  it("renders a workspace overview when only one project exists", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [mockProjects[0]],
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    expect(screen.getByTestId(TEST_IDS.PROJECT.SINGLE_PROJECT_OVERVIEW)).toBeInTheDocument();
    expect(screen.getByText("Primary workspace project")).toBeInTheDocument();
    expect(screen.getByText("Connected surfaces")).toBeInTheDocument();
    expect(screen.getByText("Workspace coverage")).toBeInTheDocument();
    expect(screen.getAllByTestId("project-link").length).toBeGreaterThan(0);
    expect(screen.getByText("When to add another project")).toBeInTheDocument();
  });

  it("calls onCreateClick when create button is clicked", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    const createButton = screen.getByText("+ Create Project");
    fireEvent.click(createButton);

    expect(mockOnCreateClick).toHaveBeenCalledOnce();
  });

  it("shows load more button when more items available", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "CanLoadMore",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    const loadMoreButton = screen.getByText("Load More Projects");
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(mockLoadMore).toHaveBeenCalledWith(20);
  });

  it("renders the multi-project grid when multiple projects are available", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    expect(screen.getByTestId(TEST_IDS.PROJECT.GRID)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.PROJECT.SINGLE_PROJECT_OVERVIEW)).not.toBeInTheDocument();
  });

  it("honors the E2E loading override", () => {
    window.__NIXELO_E2E_PROJECTS_LOADING__ = true;
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList onCreateClick={mockOnCreateClick} />);

    expect(screen.getByTestId(TEST_IDS.PROJECT.LOADING_STATE)).toBeInTheDocument();
    expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
  });
});
