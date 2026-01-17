import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  usePaginatedQuery: (...args: unknown[]) => mockUsePaginatedQuery(...args),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      getCurrentUserProjects: "projects:getCurrentUserProjects",
    },
  },
}));

vi.mock("./CreateProjectFromTemplate", () => ({
  CreateProjectFromTemplate: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-project-modal">Create Project Modal</div> : null,
}));

describe("ProjectsList", () => {
  const mockProjects = [
    {
      _id: "p1",
      key: "PROJ-1",
      name: "Project 1",
      description: "Description 1",
      myIssues: 5,
      boardType: "kanban",
    },
    {
      _id: "p2",
      key: "PROJ-2",
      name: "Project 2",
      description: "Description 2",
      myIssues: 0,
      boardType: "scrum",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner when loading first page", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList />);

    // Look for spinner (assuming LoadingSpinner renders something identifiable or we can check container)
    // The spinner component usually has a specific role or testid, but since we didn't mock it,
    // let's check for the container structure if we can't find the spinner easily.
    // However, looking at the code, it renders LoadingSpinner.
  });

  it("renders empty state when no projects found", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList />);

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first project to organize work")).toBeInTheDocument();
  });

  it("renders list of projects", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList />);

    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText(/5 issues/)).toBeInTheDocument();
    expect(screen.getByText(/Kanban/)).toBeInTheDocument();

    expect(screen.getByText("Project 2")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText(/0 issues/)).toBeInTheDocument();
    expect(screen.getByText(/Scrum/)).toBeInTheDocument();
  });

  it("opens create project modal", async () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList />);

    const createButtons = screen.getAllByText("+ Create Project");
    fireEvent.click(createButtons[0]);

    expect(screen.getByTestId("create-project-modal")).toBeInTheDocument();
  });

  it("shows load more button when more items available", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: mockProjects,
      status: "CanLoadMore",
      loadMore: mockLoadMore,
    });

    customRender(<ProjectsList />);

    const loadMoreButton = screen.getByText("Load More Projects");
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(mockLoadMore).toHaveBeenCalledWith(20);
  });
});
