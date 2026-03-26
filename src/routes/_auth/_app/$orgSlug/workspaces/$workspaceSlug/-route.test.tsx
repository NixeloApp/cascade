import type { Id } from "@convex/_generated/dataModel";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { WorkspaceLayout } from "./route";

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);
const mockUseLocation = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    activeOptions: _activeOptions,
    activeProps: _activeProps,
    ...props
  }: {
    to: string;
    children: ReactNode;
    activeOptions?: unknown;
    activeProps?: unknown;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div>Workspace content</div>,
  useLocation: () => mockUseLocation(),
  createFileRoute: () => () => ({
    useParams: () => ({
      workspaceSlug: "platform",
    }),
  }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

describe("WorkspaceLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery.mockReturnValue({
      _id: "workspace-1" as Id<"workspaces">,
      name: "Platform",
      description: "Delivery workspace",
      slug: "platform",
    });

    mockUseLocation.mockReturnValue({
      pathname: "/acme/workspaces/platform",
    });
  });

  it("renders the workspace sections nav inside the shared page-controls shell", () => {
    render(<WorkspaceLayout />);

    expect(screen.getByRole("heading", { level: 2, name: "Platform" })).toBeInTheDocument();
    expect(screen.getByText("Delivery workspace")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspace sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teams" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Workspace content")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Workspace sections" });
    expect(nav.closest(".gap-4")).not.toBeNull();
  });

  it("demotes the workspace shell to a compact context strip for team routes", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/acme/workspaces/platform/teams/delivery/board",
    });

    render(<WorkspaceLayout />);

    expect(screen.queryByRole("heading", { level: 2, name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByText("Delivery workspace")).not.toBeInTheDocument();
    expect(screen.getByText("Workspace sections")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspace sections" })).toBeInTheDocument();
  });
});
