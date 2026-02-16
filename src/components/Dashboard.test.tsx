import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { OrgContext, type OrgContextType } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { Dashboard } from "./Dashboard";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    users: { getCurrent: "api.users.getCurrent" },
    userSettings: { get: "api.userSettings.get" },
    dashboard: {
      getMyIssues: "api.dashboard.getMyIssues",
      getMyCreatedIssues: "api.dashboard.getMyCreatedIssues",
      getMyProjects: "api.dashboard.getMyProjects",
      getMyRecentActivity: "api.dashboard.getMyRecentActivity",
      getMyStats: "api.dashboard.getMyStats",
      getFocusTask: "api.dashboard.getFocusTask",
    },
  },
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock child components to simplify testing
vi.mock("./Dashboard/Greeting", () => ({
  Greeting: ({ userName, completedCount }: { userName?: string; completedCount?: number }) => (
    <div data-testid="greeting">
      Greeting: {userName || "User"} ({completedCount ?? 0} completed)
    </div>
  ),
}));

vi.mock("./Dashboard/FocusZone", () => ({
  FocusZone: ({ task }: { task?: unknown }) => (
    <div data-testid="focus-zone">{task ? "Has task" : "No task"}</div>
  ),
}));

vi.mock("./Dashboard/QuickStats", () => ({
  QuickStats: ({ stats }: { stats?: unknown }) => (
    <div data-testid="quick-stats">{stats ? "Has stats" : "Loading stats"}</div>
  ),
}));

vi.mock("./Dashboard/MyIssuesList", () => ({
  MyIssuesList: ({
    displayIssues,
    issueFilter,
  }: {
    displayIssues?: unknown[];
    issueFilter: string;
  }) => (
    <div data-testid="my-issues-list">
      Filter: {issueFilter}, Issues: {displayIssues?.length ?? 0}
    </div>
  ),
}));

vi.mock("./Dashboard/ProjectsList", () => ({
  WorkspacesList: ({ projects }: { projects?: unknown[] }) => (
    <div data-testid="workspaces-list">Projects: {projects?.length ?? 0}</div>
  ),
}));

vi.mock("./Dashboard/RecentActivity", () => ({
  RecentActivity: ({ activities }: { activities?: unknown[] }) => (
    <div data-testid="recent-activity">Activities: {activities?.length ?? 0}</div>
  ),
}));

const mockOrgContext: OrgContextType = {
  organizationId: "org123" as Id<"organizations">,
  orgSlug: "acme-corp",
  organizationName: "Acme Corporation",
  userRole: "admin",
  billingEnabled: true,
};

const mockUser = {
  _id: "user123" as Id<"users">,
  name: "Test User",
  email: "test@example.com",
};

const mockStats = {
  completedThisWeek: 5,
  totalAssigned: 10,
  overdue: 2,
};

const mockIssues = [
  {
    _id: "issue1" as Id<"issues">,
    title: "Fix bug",
    key: "PROJ-1",
    projectKey: "PROJ",
    status: "in_progress",
  },
];

const mockProjects = [
  {
    _id: "project1" as Id<"projects">,
    name: "Project 1",
    key: "PROJ",
  },
];

const mockActivities = [
  {
    _id: "activity1",
    action: "created",
    createdAt: Date.now(),
  },
];

const createWrapper =
  (contextValue: OrgContextType = mockOrgContext) =>
  ({ children }: { children: ReactNode }) => (
    <OrgContext.Provider value={contextValue}>{children}</OrgContext.Provider>
  );

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup - all queries return data
    (usePaginatedQuery as Mock).mockReturnValue({
      results: mockIssues,
      status: "CanLoadMore",
      loadMore: vi.fn(),
    });

    (useQuery as Mock).mockImplementation((query: string) => {
      if (query === "api.users.getCurrent") return mockUser;
      if (query === "api.userSettings.get") return { dashboardLayout: {} };
      if (query === "api.dashboard.getMyCreatedIssues") return [];
      if (query === "api.dashboard.getMyProjects") return mockProjects;
      if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
      if (query === "api.dashboard.getMyStats") return mockStats;
      if (query === "api.dashboard.getFocusTask") return null;
      return undefined;
    });
  });

  describe("Rendering", () => {
    it("should render greeting component", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("greeting")).toBeInTheDocument();
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

    it("should render focus zone", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("focus-zone")).toBeInTheDocument();
    });

    it("should render quick stats when enabled", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("quick-stats")).toBeInTheDocument();
    });

    it("should render my issues list", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("my-issues-list")).toBeInTheDocument();
    });

    it("should render workspaces list", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("workspaces-list")).toBeInTheDocument();
    });

    it("should render recent activity", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByTestId("recent-activity")).toBeInTheDocument();
    });
  });

  describe("Layout Settings", () => {
    it("should hide stats when showStats is false", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") {
          return { dashboardLayout: { showStats: false } };
        }
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.queryByTestId("quick-stats")).not.toBeInTheDocument();
    });

    it("should hide recent activity when showRecentActivity is false", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") {
          return { dashboardLayout: { showRecentActivity: false } };
        }
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.queryByTestId("recent-activity")).not.toBeInTheDocument();
    });

    it("should hide workspaces when showWorkspaces is false", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") {
          return { dashboardLayout: { showWorkspaces: false } };
        }
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.queryByTestId("workspaces-list")).not.toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("should pass user name to greeting", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

    it("should pass completed count to greeting", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/5 completed/)).toBeInTheDocument();
    });

    it("should display issue count", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Issues: 1/)).toBeInTheDocument();
    });

    it("should display project count", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Projects: 1/)).toBeInTheDocument();
    });

    it("should display activity count", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Activities: 1/)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should handle undefined user gracefully", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return undefined;
        if (query === "api.userSettings.get") return { dashboardLayout: {} };
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      // Should still render, greeting shows "User" as fallback
      expect(screen.getByTestId("greeting")).toBeInTheDocument();
    });

    it("should handle undefined stats gracefully", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") return { dashboardLayout: {} };
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return undefined;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/0 completed/)).toBeInTheDocument();
    });

    it("should handle empty issues array", () => {
      (usePaginatedQuery as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: vi.fn(),
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Issues: 0/)).toBeInTheDocument();
    });

    it("should handle empty projects array", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") return { dashboardLayout: {} };
        if (query === "api.dashboard.getMyProjects") return [];
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Projects: 0/)).toBeInTheDocument();
    });
  });

  describe("Issue Filter", () => {
    it("should start with assigned filter", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(/Filter: assigned/)).toBeInTheDocument();
    });
  });

  describe("Focus Task", () => {
    it("should show no task when focus task is null", () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText("No task")).toBeInTheDocument();
    });

    it("should show task when focus task exists", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.getCurrent") return mockUser;
        if (query === "api.userSettings.get") return { dashboardLayout: {} };
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        if (query === "api.dashboard.getMyRecentActivity") return mockActivities;
        if (query === "api.dashboard.getMyStats") return mockStats;
        if (query === "api.dashboard.getFocusTask") return { title: "Focus task" };
        return undefined;
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText("Has task")).toBeInTheDocument();
    });
  });
});
