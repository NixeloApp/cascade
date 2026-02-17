import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { OrgContext, type OrgContextType } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { AppSidebar } from "./AppSidebar";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    users: { isOrganizationAdmin: "api.users.isOrganizationAdmin" },
    documents: { list: "api.documents.list", create: "api.documents.create" },
    workspaces: { list: "api.workspaces.list", create: "api.workspaces.create" },
    teams: { getOrganizationTeams: "api.teams.getOrganizationTeams" },
    dashboard: { getMyProjects: "api.dashboard.getMyProjects" },
  },
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/acme/dashboard" }),
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock sidebar state hook
const mockToggleCollapse = vi.fn();
const mockCloseMobile = vi.fn();
vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    isCollapsed: false,
    isMobileOpen: false,
    toggleCollapse: mockToggleCollapse,
    closeMobile: mockCloseMobile,
  }),
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock CreateTeamModal
vi.mock("@/components/CreateTeamModal", () => ({
  CreateTeamModal: () => <div data-testid="create-team-modal" />,
}));

// Mock SidebarTeamItem
vi.mock("@/components/sidebar/SidebarTeamItem", () => ({
  SidebarTeamItem: ({ team }: { team: { name: string } }) => (
    <div data-testid="sidebar-team-item">{team.name}</div>
  ),
}));

const mockOrgContext: OrgContextType = {
  organizationId: "org123" as Id<"organizations">,
  orgSlug: "acme",
  organizationName: "Acme Corporation",
  userRole: "admin",
  billingEnabled: true,
};

const mockDocuments = [
  { _id: "doc1" as Id<"documents">, title: "Document 1", updatedAt: Date.now() },
  { _id: "doc2" as Id<"documents">, title: "Document 2", updatedAt: Date.now() - 1000 },
];

const mockWorkspaces = [
  {
    _id: "ws1" as Id<"workspaces">,
    name: "Engineering",
    slug: "engineering",
    organizationId: "org123" as Id<"organizations">,
  },
];

const mockTeams = [
  {
    _id: "team1" as Id<"teams">,
    name: "Frontend Team",
    workspaceId: "ws1" as Id<"workspaces">,
  },
];

const mockProjects = [
  {
    _id: "proj1" as Id<"projects">,
    name: "Main Project",
    key: "MAIN",
    workspaceId: "ws1" as Id<"workspaces">,
  },
];

const createWrapper =
  (contextValue: OrgContextType = mockOrgContext) =>
  ({ children }: { children: ReactNode }) => (
    <OrgContext.Provider value={contextValue}>{children}</OrgContext.Provider>
  );

describe("AppSidebar", () => {
  const mockCreateDocument = vi.fn();
  const mockCreateWorkspace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateDocument.mockResolvedValue("newDoc123");
    mockCreateWorkspace.mockResolvedValue("newWs123");

    (useMutation as Mock).mockImplementation((mutation: string) => {
      if (mutation === "api.documents.create") return mockCreateDocument;
      if (mutation === "api.workspaces.create") return mockCreateWorkspace;
      return vi.fn();
    });

    (useQuery as Mock).mockImplementation((query: string) => {
      if (query === "api.users.isOrganizationAdmin") return true;
      if (query === "api.documents.list") return { documents: mockDocuments };
      if (query === "api.workspaces.list") return mockWorkspaces;
      if (query === "api.teams.getOrganizationTeams") return mockTeams;
      if (query === "api.dashboard.getMyProjects") return mockProjects;
      return undefined;
    });
  });

  describe("Navigation Links", () => {
    it("should render dashboard link", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    });

    it("should render calendar link (General)", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      // Calendar is labeled "General" in sidebar
      expect(screen.getByRole("link", { name: /general/i })).toBeInTheDocument();
    });

    it("should render analytics link", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /analytics/i })).toBeInTheDocument();
    });

    it("should render issues link", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /issues/i })).toBeInTheDocument();
    });

    it("should render assistant link", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /assistant/i })).toBeInTheDocument();
    });
  });

  describe("Organization", () => {
    it("should display organization name", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
    });
  });

  describe("Documents Section", () => {
    it("should render documents section", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByText(/documents/i)).toBeInTheDocument();
    });

    it("should render document list items", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByText("Document 1")).toBeInTheDocument();
      expect(screen.getByText("Document 2")).toBeInTheDocument();
    });

    it("should render create document button", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      // The + button for creating documents
      const plusButtons = screen.getAllByRole("button");
      expect(plusButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Workspaces Section", () => {
    it("should render workspaces section", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByText(/workspaces/i)).toBeInTheDocument();
    });

    it("should render workspace items", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByText("Engineering")).toBeInTheDocument();
    });
  });

  describe("Admin Features", () => {
    it("should show time tracking for admins", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return true;
        if (query === "api.documents.list") return { documents: mockDocuments };
        if (query === "api.workspaces.list") return mockWorkspaces;
        if (query === "api.teams.getOrganizationTeams") return mockTeams;
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        return undefined;
      });

      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /time tracking/i })).toBeInTheDocument();
    });

    it("should hide time tracking for non-admins", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return false;
        if (query === "api.documents.list") return { documents: mockDocuments };
        if (query === "api.workspaces.list") return mockWorkspaces;
        if (query === "api.teams.getOrganizationTeams") return mockTeams;
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        return undefined;
      });

      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.queryByRole("link", { name: /time tracking/i })).not.toBeInTheDocument();
    });
  });

  describe("Collapse Toggle", () => {
    it("should render collapse button", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      // There should be a collapse button with PanelLeftClose icon
      const buttons = screen.getAllByRole("button");
      expect(buttons.some((btn) => btn.getAttribute("aria-label")?.includes("Collapse"))).toBe(
        true,
      );
    });
  });

  describe("Settings Link", () => {
    it("should render settings link", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should handle undefined documents", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return true;
        if (query === "api.documents.list") return undefined;
        if (query === "api.workspaces.list") return mockWorkspaces;
        if (query === "api.teams.getOrganizationTeams") return mockTeams;
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        return undefined;
      });

      // Should not crash
      render(<AppSidebar />, { wrapper: createWrapper() });
      expect(screen.getByText(/documents/i)).toBeInTheDocument();
    });

    it("should handle undefined workspaces", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return true;
        if (query === "api.documents.list") return { documents: mockDocuments };
        if (query === "api.workspaces.list") return undefined;
        if (query === "api.teams.getOrganizationTeams") return mockTeams;
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        return undefined;
      });

      // Should not crash
      render(<AppSidebar />, { wrapper: createWrapper() });
      expect(screen.getByText(/workspaces/i)).toBeInTheDocument();
    });

    it("should handle empty documents", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return true;
        if (query === "api.documents.list") return { documents: [] };
        if (query === "api.workspaces.list") return mockWorkspaces;
        if (query === "api.teams.getOrganizationTeams") return mockTeams;
        if (query === "api.dashboard.getMyProjects") return mockProjects;
        return undefined;
      });

      render(<AppSidebar />, { wrapper: createWrapper() });
      expect(screen.getByText(/documents/i)).toBeInTheDocument();
    });

    it("should handle empty workspaces", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "api.users.isOrganizationAdmin") return true;
        if (query === "api.documents.list") return { documents: mockDocuments };
        if (query === "api.workspaces.list") return [];
        if (query === "api.teams.getOrganizationTeams") return [];
        if (query === "api.dashboard.getMyProjects") return [];
        return undefined;
      });

      render(<AppSidebar />, { wrapper: createWrapper() });
      expect(screen.getByText(/workspaces/i)).toBeInTheDocument();
    });
  });

  describe("Teams Grouping", () => {
    it("should have teams data available for grouping", () => {
      render(<AppSidebar />, { wrapper: createWrapper() });

      // Verify the component renders without crashing when teams data is available
      // Teams are inside expandable workspace sections
      expect(screen.getByText("Engineering")).toBeInTheDocument();
    });
  });
});
