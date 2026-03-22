import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery, useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { useListNavigation } from "../hooks/useListNavigation";
import { Dashboard } from "./Dashboard";

type IssueFilter = "assigned" | "created" | "all";

interface MockIssue {
  _id: string;
  projectKey: string;
  title: string;
}

interface MockProject {
  _id: string;
  key: string;
  name: string;
}

interface MockMyIssuesListProps {
  myIssues: MockIssue[] | undefined;
  myCreatedIssues: MockIssue[] | undefined;
  displayIssues: MockIssue[] | undefined;
  issueFilter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
}

const mockNavigate = vi.fn();
const mockUseNavigate = vi.mocked(useNavigate);
const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthReady = vi.mocked(useAuthReady);
const mockUseOrganization = vi.mocked(useOrganization);
const mockUseListNavigation = vi.mocked(useListNavigation);

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("./Dashboard/Stickies", () => ({
  Stickies: () => null,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(() => ({
    mutate: vi.fn(),
    canAct: true,
    isAuthLoading: false,
  })),
  useAuthReady: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../hooks/useListNavigation", () => ({
  useListNavigation: vi.fn(),
}));

vi.mock("./Dashboard/FocusZone", () => ({
  FocusZone: ({ task }: { task: { title: string } | null | undefined }) => (
    <div data-testid="focus-zone">{task?.title ?? "no-focus-task"}</div>
  ),
}));

vi.mock("./Dashboard/Greeting", () => ({
  Greeting: ({
    userName,
    completedCount,
  }: {
    userName: string | undefined;
    completedCount: number | undefined;
  }) => <div data-testid="greeting">{`${userName ?? "unknown"}:${completedCount ?? 0}`}</div>,
}));

vi.mock("./Dashboard/QuickStats", () => ({
  QuickStats: ({ stats }: { stats: { completedThisWeek?: number } | undefined }) => (
    <div data-testid="quick-stats">{stats?.completedThisWeek ?? 0}</div>
  ),
}));

vi.mock("./Dashboard/RecentActivity", () => ({
  RecentActivity: ({ activities }: { activities: Array<{ _id: string }> | undefined }) => (
    <div data-testid="recent-activity">{activities?.length ?? 0}</div>
  ),
}));

vi.mock("./Dashboard/WorkspacesList", () => ({
  WorkspacesList: ({ projects }: { projects: MockProject[] | undefined }) => (
    <div data-testid="workspaces-list">{projects?.length ?? 0}</div>
  ),
}));

vi.mock("./Dashboard/MyIssuesList", () => ({
  MyIssuesList: ({
    myIssues,
    myCreatedIssues,
    displayIssues,
    issueFilter,
    onFilterChange,
  }: MockMyIssuesListProps) => (
    <div>
      <div data-testid="my-issues-state">
        {`filter:${issueFilter};display:${displayIssues?.length ?? 0};assigned:${myIssues?.length ?? 0};created:${myCreatedIssues?.length ?? 0}`}
      </div>
      <button type="button" onClick={() => onFilterChange("all")}>
        Show all issues
      </button>
      <button type="button" onClick={() => onFilterChange("created")}>
        Show created issues
      </button>
    </div>
  ),
}));

const assignedIssues: MockIssue[] = [
  { _id: "issue-1", projectKey: "ALPHA", title: "Investigate churn" },
];

const createdIssues: MockIssue[] = [
  { _id: "issue-2", projectKey: "BETA", title: "Write onboarding doc" },
];

const projects: MockProject[] = [{ _id: "project-1", key: "ALPHA", name: "Alpha" }];
const recentActivity = [{ _id: "activity-1" }];
const focusTask = { _id: "issue-focus", title: "Ship the weekly recap", projectKey: "ALPHA" };
const stats = { completedThisWeek: 7 };

interface QueryState {
  userSettings:
    | {
        dashboardLayout?: {
          showStats?: boolean;
          showRecentActivity?: boolean;
          showWorkspaces?: boolean;
        };
      }
    | undefined;
  created: MockIssue[] | undefined;
  workspaceProjects: MockProject[] | undefined;
  activity: Array<{ _id: string }> | undefined;
  dashboardStats: { completedThisWeek?: number } | undefined;
  task: { _id: string; title: string; projectKey: string } | null | undefined;
}

function primeDashboardQueries(
  input: {
    userSettings?: {
      dashboardLayout?: {
        showStats?: boolean;
        showRecentActivity?: boolean;
        showWorkspaces?: boolean;
      };
    };
    created?: MockIssue[] | undefined;
    workspaceProjects?: MockProject[] | undefined;
    activity?: Array<{ _id: string }> | undefined;
    dashboardStats?: { completedThisWeek?: number } | undefined;
    task?: { _id: string; title: string; projectKey: string } | null | undefined;
  } = {},
) {
  const queryState: QueryState = {
    userSettings: input.userSettings,
    created: "created" in input ? input.created : createdIssues,
    workspaceProjects: "workspaceProjects" in input ? input.workspaceProjects : projects,
    activity: "activity" in input ? input.activity : recentActivity,
    dashboardStats: "dashboardStats" in input ? input.dashboardStats : stats,
    task: "task" in input ? input.task : focusTask,
  };
  const orderedResults = [
    { name: "Ada Lovelace" },
    queryState.userSettings,
    queryState.created,
    queryState.workspaceProjects,
    queryState.activity,
    queryState.dashboardStats,
    queryState.task,
  ];
  let queryIndex = 0;

  mockUseAuthenticatedQuery.mockImplementation(() => {
    const nextResult = orderedResults[queryIndex % orderedResults.length];
    queryIndex += 1;
    return nextResult;
  });
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__NIXELO_E2E_DASHBOARD_LOADING__;
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
    mockUseAuthReady.mockReturnValue({
      isAuthenticated: true,
      isAuthLoading: false,
      canAct: true,
    });
    mockUsePaginatedQuery.mockReturnValue({
      results: assignedIssues,
      status: "CanLoadMore",
      loadMore: vi.fn(),
      isLoading: false,
    });
    mockUseListNavigation.mockImplementation(() => ({
      selectedIndex: -1,
      setSelectedIndex: vi.fn(),
      listRef: { current: null },
      getItemProps: (index) => ({
        "data-list-index": index,
        className: "",
        onMouseEnter: vi.fn(),
      }),
    }));
  });

  it("renders the default dashboard layout and wires keyboard navigation callbacks", () => {
    primeDashboardQueries();

    render(<Dashboard />);

    expect(screen.getByTestId("greeting")).toHaveTextContent("Ada Lovelace:7");
    expect(screen.getByTestId("focus-zone")).toHaveTextContent("Ship the weekly recap");
    expect(screen.getByTestId("quick-stats")).toHaveTextContent("7");
    expect(screen.getByTestId("workspaces-list")).toHaveTextContent("1");
    expect(screen.getByTestId("recent-activity")).toHaveTextContent("1");
    expect(screen.getByTestId("my-issues-state")).toHaveTextContent(
      "filter:assigned;display:1;assigned:1;created:1",
    );

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      api.dashboard.getMyIssues,
      {},
      { initialNumItems: 20 },
    );

    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        items: assignedIssues,
        enabled: true,
      }),
    );
    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        items: projects,
        enabled: true,
      }),
    );

    const issueListConfig = mockUseListNavigation.mock.calls[0]?.[0];
    const projectListConfig = mockUseListNavigation.mock.calls[1]?.[0];

    issueListConfig?.onSelect(assignedIssues[0], 0);
    projectListConfig?.onSelect(projects[0], 0);

    expect(mockNavigate).toHaveBeenNthCalledWith(1, {
      to: ROUTES.projects.board.path,
      params: { orgSlug: "acme", key: "ALPHA" },
    });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, {
      to: ROUTES.projects.board.path,
      params: { orgSlug: "acme", key: "ALPHA" },
    });
  });

  it("hides optional panels from saved layout settings and updates issue filters in place", async () => {
    const user = userEvent.setup();

    primeDashboardQueries({
      userSettings: {
        dashboardLayout: {
          showStats: false,
          showRecentActivity: false,
          showWorkspaces: false,
        },
      },
    });

    render(<Dashboard />);

    expect(screen.queryByTestId("quick-stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspaces-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recent-activity")).not.toBeInTheDocument();
    expect(screen.getByTestId("my-issues-state")).toHaveTextContent(
      "filter:assigned;display:1;assigned:1;created:1",
    );

    await user.click(screen.getByRole("button", { name: "Show all issues" }));

    expect(screen.getByTestId("my-issues-state")).toHaveTextContent(
      "filter:all;display:2;assigned:1;created:1",
    );

    await user.click(screen.getByRole("button", { name: "Show created issues" }));

    expect(screen.getByTestId("my-issues-state")).toHaveTextContent(
      "filter:created;display:1;assigned:1;created:1",
    );
  });

  it("skips the paginated query until auth is ready and disables list navigation without data", () => {
    mockUseAuthReady.mockReturnValue({
      isAuthenticated: false,
      isAuthLoading: true,
      canAct: false,
    });
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: vi.fn(),
      isLoading: true,
    });
    primeDashboardQueries({
      created: undefined,
      workspaceProjects: undefined,
      activity: undefined,
      dashboardStats: undefined,
      task: null,
    });

    render(<Dashboard />);

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(api.dashboard.getMyIssues, "skip", {
      initialNumItems: 20,
    });
    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        items: [],
        enabled: false,
      }),
    );
    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        items: [],
        enabled: false,
      }),
    );
  });

  it("forces dashboard loading placeholders when the E2E loading override is enabled", () => {
    window.__NIXELO_E2E_DASHBOARD_LOADING__ = true;
    primeDashboardQueries();

    render(<Dashboard />);

    expect(screen.getByTestId("greeting")).toHaveTextContent("unknown:0");
    expect(screen.getByTestId("focus-zone")).toHaveTextContent("no-focus-task");
    expect(screen.getByTestId("quick-stats")).toHaveTextContent("0");
    expect(screen.getByTestId("workspaces-list")).toHaveTextContent("0");
    expect(screen.getByTestId("recent-activity")).toHaveTextContent("0");
    expect(screen.getByTestId("my-issues-state")).toHaveTextContent(
      "filter:assigned;display:0;assigned:0;created:0",
    );

    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        items: [],
        enabled: false,
      }),
    );
    expect(mockUseListNavigation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        items: [],
        enabled: false,
      }),
    );
  });
});
