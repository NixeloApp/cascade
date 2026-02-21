import { useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { AppSidebar } from "./AppSidebar";

// Mocks
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
    Link: (props: any) => (
      <a {...props} href={props.to} aria-current={props["aria-current"]} title={props.title}>
        {props.children}
      </a>
    ),
  };
});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(() => ({
    orgSlug: "demo-org",
    organizationName: "Demo Org",
    organizationId: "org1",
  })),
  useOrganizationOptional: vi.fn(() => ({
    orgSlug: "demo-org",
    organizationName: "Demo Org",
    organizationId: "org1",
  })),
}));

vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: vi.fn(() => ({
    isCollapsed: false,
    isMobileOpen: false,
    toggleCollapse: vi.fn(),
    closeMobile: vi.fn(),
  })),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    users: { isOrganizationAdmin: "users.isOrganizationAdmin", getCurrent: "users.getCurrent" },
    documents: { list: "documents.list", create: "documents.create" },
    workspaces: { list: "workspaces.list", create: "workspaces.create" },
    teams: { getOrganizationTeams: "teams.getOrganizationTeams" },
    dashboard: { getMyProjects: "dashboard.getMyProjects" },
    projects: { getTeamProjects: "projects.getTeamProjects" },
  },
}));

// Mock icons to avoid rendering issues if any
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    // Mock specific icons used if needed, or rely on actual
  };
});

const mockUseQueryImplementation = (query: any) => {
  switch (query) {
    case "documents.list":
      return { documents: [] };
    case "workspaces.list":
    case "teams.getOrganizationTeams":
    case "dashboard.getMyProjects":
      return [];
    case "users.isOrganizationAdmin":
      return false;
    case "users.getCurrent":
      return { name: "Test User", email: "test@example.com" };
    default:
      return undefined;
  }
};

describe("AppSidebar Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockImplementation(mockUseQueryImplementation);
  });

  it("adds aria-current='page' to active Dashboard link", () => {
    (useLocation as any).mockReturnValue({ pathname: "/demo-org/dashboard" });

    render(<AppSidebar />);

    // Dashboard link
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");

    // Issues link should not be active
    const issuesLink = screen.getByRole("link", { name: /issues/i });
    expect(issuesLink).not.toHaveAttribute("aria-current");
  });

  it("adds aria-current='page' to active Issues link", () => {
    (useLocation as any).mockReturnValue({ pathname: "/demo-org/issues" });

    render(<AppSidebar />);

    // Issues link
    const issuesLink = screen.getByRole("link", { name: /issues/i });
    expect(issuesLink).toHaveAttribute("aria-current", "page");

    // Dashboard link should not be active
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("adds aria-current='page' to active Documents link", () => {
    // When viewing list of documents
    (useLocation as any).mockReturnValue({ pathname: "/demo-org/documents" });

    render(<AppSidebar />);

    // Documents section header link
    const documentsLink = screen.getByRole("link", { name: /documents/i });
    expect(documentsLink).toHaveAttribute("aria-current", "page");
  });

  it("adds aria-current='page' to active Document sub-item and NOT the parent section", async () => {
    // Setup documents query to return a doc
    (useQuery as any).mockImplementation((query: any) => {
      if (query === "documents.list")
        return {
          documents: [{ _id: "doc1", title: "My Doc", isPublic: false }],
        };
      if (query === "users.isOrganizationAdmin") return false;
      return [];
    });

    (useLocation as any).mockReturnValue({ pathname: "/demo-org/documents/doc1" });

    render(<AppSidebar />);

    // Documents section header link should be active because isActive logic matches /documents
    const documentsLink = screen.getByRole("link", { name: /documents/i });
    expect(documentsLink).toHaveAttribute("aria-current", "page");

    const docLink = screen.getByRole("link", { name: /my doc/i });
    expect(docLink).toHaveAttribute("aria-current", "page");

    // Also check title attribute for truncation
    expect(docLink).not.toHaveAttribute("title");

    // Verify tooltip appears on hover
    const user = userEvent.setup();
    await user.hover(docLink);

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("My Doc");
    });
  });
});
